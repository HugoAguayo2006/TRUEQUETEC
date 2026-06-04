import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import SessionLocal, get_db
from app.models import ConversationModel, ItemModel, MessageModel, SwipeModel, UserModel
from app.schemas import (
    ChatItem,
    ChatPartner,
    ConversationResponse,
    ItemCreate,
    ItemResponse,
    MessageCreate,
    MessageResponse,
    SwipeRequest,
    UserCreate,
    UserResponse,
)

router = APIRouter()

DEMO_USER_ID = "demo-user"
DEMO_PARTNER_ID = "marcus-user"
DEMO_ITEM_ID = "demo-leica-m6"
DEMO_CONVERSATION_ID = "demo-conversation-leica"


class ChatConnectionManager:
    def __init__(self):
        # Guarda las conexiones WebSocket abiertas por conversacion.
        # Ejemplo: {"conversation-id": [socketA, socketB]}
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, conversation_id: str, websocket: WebSocket):
        # Acepta el WebSocket y lo registra en la conversacion correspondiente.
        await websocket.accept()
        self.active_connections.setdefault(conversation_id, []).append(websocket)

    def disconnect(self, conversation_id: str, websocket: WebSocket):
        # Cuando el usuario cierra el chat, quitamos su WebSocket de la lista.
        connections = self.active_connections.get(conversation_id, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections and conversation_id in self.active_connections:
            del self.active_connections[conversation_id]

    async def broadcast(self, conversation_id: str, message: dict):
        # Envia el mensaje a todos los navegadores conectados al mismo chat.
        stale_connections = []
        for connection in self.active_connections.get(conversation_id, []):
            try:
                await connection.send_json(message)
            except RuntimeError:
                stale_connections.append(connection)

        for connection in stale_connections:
            self.disconnect(conversation_id, connection)


manager = ChatConnectionManager()


def ensure_demo_chat_data(db: Session):
    # Crea datos iniciales para poder probar el chat sin login real todavia.
    user = db.query(UserModel).filter(UserModel.id == DEMO_USER_ID).first()
    if not user:
        user = UserModel(id=DEMO_USER_ID, username="Tu", rating=5.0)
        db.add(user)

    partner = db.query(UserModel).filter(UserModel.id == DEMO_PARTNER_ID).first()
    if not partner:
        partner = UserModel(id=DEMO_PARTNER_ID, username="Marcus J.", rating=4.8)
        db.add(partner)

    item = db.query(ItemModel).filter(ItemModel.id == DEMO_ITEM_ID).first()
    if not item:
        item = ItemModel(
            id=DEMO_ITEM_ID,
            owner_id=DEMO_PARTNER_ID,
            title="Camara Leica M6",
            estimated_value=180,
        )
        db.add(item)

    conversation = db.query(ConversationModel).filter(ConversationModel.id == DEMO_CONVERSATION_ID).first()
    if not conversation:
        conversation = ConversationModel(
            id=DEMO_CONVERSATION_ID,
            user_a_id=DEMO_USER_ID,
            user_b_id=DEMO_PARTNER_ID,
            item_id=DEMO_ITEM_ID,
        )
        db.add(conversation)

    db.commit()

    existing_message = db.query(MessageModel).filter(MessageModel.conversation_id == DEMO_CONVERSATION_ID).first()
    if not existing_message:
        starter_messages = [
            MessageModel(
                conversation_id=DEMO_CONVERSATION_ID,
                sender_id=DEMO_PARTNER_ID,
                sender_name="Marcus J.",
                content="Hola, vi tu articulo y me interesa hacer trueque por la camara.",
            ),
            MessageModel(
                conversation_id=DEMO_CONVERSATION_ID,
                sender_id=DEMO_USER_ID,
                sender_name="Tu",
                content="Suena bien. Que articulos quieres ofrecer?",
            ),
            MessageModel(
                conversation_id=DEMO_CONVERSATION_ID,
                sender_id=DEMO_PARTNER_ID,
                sender_name="Marcus J.",
                content="Tengo una Polaroid Now y una tornamesa vintage en muy buen estado.",
            ),
        ]
        db.add_all(starter_messages)
        conversation.updated_at = datetime.utcnow()
        db.commit()


def serialize_message(message: MessageModel) -> MessageResponse:
    # Convierte un modelo de SQLAlchemy en el JSON definido por MessageResponse.
    return MessageResponse.model_validate(message)


def serialize_conversation(conversation: ConversationModel, current_user_id: str, db: Session) -> ConversationResponse:
    # Determina quien es "el otro usuario" para mostrarlo como partner en el frontend.
    partner = conversation.user_b if conversation.user_a_id == current_user_id else conversation.user_a

    # Busca el ultimo mensaje para mostrarlo como preview en la bandeja.
    last_message = (
        db.query(MessageModel)
        .filter(MessageModel.conversation_id == conversation.id)
        .order_by(MessageModel.created_at.desc())
        .first()
    )

    return ConversationResponse(
        id=conversation.id,
        partner=ChatPartner(
            id=partner.id,
            username=partner.username,
            rating=partner.rating,
        ),
        item=ChatItem(
            id=conversation.item.id,
            title=conversation.item.title,
            estimated_value=conversation.item.estimated_value,
        ),
        last_message=serialize_message(last_message) if last_message else None,
        unread=0,
        online=conversation.id in manager.active_connections,
        updated_at=conversation.updated_at,
    )

@router.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = UserModel(username=user.username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/items/", response_model=ItemResponse)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    db_item = ItemModel(owner_id=item.owner_id, title=item.title, estimated_value=item.estimated_value)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/swipes/")
def swipe_item(swipe: SwipeRequest, db: Session = Depends(get_db)):
    db_swipe = SwipeModel(swiper_id=swipe.swiper_id, item_id=swipe.item_id, direction=swipe.direction)
    db.add(db_swipe)
    db.commit()
    
    if swipe.direction == "dislike":
        return {"match": False, "message": "Dislike tracked successfully."}
        
    target_item = db.query(ItemModel).filter(ItemModel.id == swipe.item_id).first()
    if not target_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    receiver_id = target_item.owner_id
    
    mutual_swipe = db.query(SwipeModel).join(ItemModel, SwipeModel.item_id == ItemModel.id).\
        filter(
            SwipeModel.swiper_id == receiver_id,
            SwipeModel.direction == "like",
            ItemModel.owner_id == swipe.swiper_id
        ).first()
        
    if mutual_swipe:
        return {"match": True, "message": "It's a Match! Both users like each other's items."} 
    return {"match": False, "message": "Swipe tracked. Waiting for a match."}

@router.get("/chat/conversations/", response_model=list[ConversationResponse])
def get_conversations(user_id: str = DEMO_USER_ID, db: Session = Depends(get_db)):
    # Endpoint REST: devuelve todas las conversaciones donde participa el usuario.
    ensure_demo_chat_data(db)
    conversations = (
        db.query(ConversationModel)
        .filter(
            (ConversationModel.user_a_id == user_id)
            | (ConversationModel.user_b_id == user_id)
        )
        .order_by(ConversationModel.updated_at.desc())
        .all()
    )
    return [serialize_conversation(conversation, user_id, db) for conversation in conversations]

@router.get("/chat/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
def get_messages(conversation_id: str, db: Session = Depends(get_db)):
    # Endpoint REST: carga el historial completo cuando se abre una conversacion.
    ensure_demo_chat_data(db)
    conversation = db.query(ConversationModel).filter(ConversationModel.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return (
        db.query(MessageModel)
        .filter(MessageModel.conversation_id == conversation_id)
        .order_by(MessageModel.created_at.asc())
        .all()
    )

@router.post("/chat/conversations/{conversation_id}/messages", response_model=MessageResponse)
def create_message(conversation_id: str, message: MessageCreate, db: Session = Depends(get_db)):
    # Endpoint REST de respaldo: guarda un mensaje aunque el WebSocket no este abierto.
    ensure_demo_chat_data(db)
    conversation = db.query(ConversationModel).filter(ConversationModel.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db_message = MessageModel(
        conversation_id=conversation_id,
        sender_id=message.sender_id,
        sender_name=message.sender_name,
        content=message.content.strip(),
    )
    if not db_message.content:
        raise HTTPException(status_code=400, detail="Message content is required")

    conversation.updated_at = datetime.utcnow()
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@router.websocket("/ws/chat/{conversation_id}")
async def chat_websocket(websocket: WebSocket, conversation_id: str):
    # Endpoint WebSocket: mantiene abierta la conexion para recibir y enviar mensajes en vivo.
    await manager.connect(conversation_id, websocket)

    # En WebSocket abrimos la sesion manualmente porque la conexion vive mas que una request REST.
    db = SessionLocal()
    try:
        ensure_demo_chat_data(db)
        while True:
            # Espera un JSON enviado por el frontend con sender_id, sender_name y content.
            raw_payload = await websocket.receive_text()
            payload = json.loads(raw_payload)
            content = str(payload.get("content", "")).strip()
            sender_id = str(payload.get("sender_id", DEMO_USER_ID))
            sender_name = str(payload.get("sender_name", "Tu"))

            if not content:
                continue

            conversation = db.query(ConversationModel).filter(ConversationModel.id == conversation_id).first()
            if not conversation:
                await websocket.send_json({"type": "error", "message": "Conversation not found"})
                continue

            db_message = MessageModel(
                conversation_id=conversation_id,
                sender_id=sender_id,
                sender_name=sender_name,
                content=content,
            )
            conversation.updated_at = datetime.utcnow()
            db.add(db_message)
            db.commit()
            db.refresh(db_message)

            # Convierte el mensaje guardado a JSON y lo manda a todos los clientes del chat.
            message_payload = serialize_message(db_message).model_dump(mode="json")
            await manager.broadcast(conversation_id, {"type": "message", "message": message_payload})
    except WebSocketDisconnect:
        # Si el usuario cierra la pestana o sale del chat, limpiamos su conexion.
        manager.disconnect(conversation_id, websocket)
    finally:
        # Cerramos la sesion de base de datos cuando termina el WebSocket.
        db.close()
