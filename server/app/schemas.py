from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    username: str

class UserResponse(BaseModel):
    id: str
    username: str
    rating: float
    class Config: from_attributes = True

class ItemCreate(BaseModel):
    owner_id: str
    title: str
    estimated_value: float

class ItemResponse(BaseModel):
    id: str
    owner_id: str
    title: str
    estimated_value: float
    class Config: from_attributes = True

class SwipeRequest(BaseModel):
    swiper_id: str
    item_id: str
    direction: str # "like" or "dislike"

class ChatPartner(BaseModel):
    # Datos del otro usuario que se muestran en la bandeja del chat.
    id: str
    username: str
    rating: float

class ChatItem(BaseModel):
    # Datos del articulo que da contexto a la conversacion.
    id: str
    title: str
    estimated_value: float

class MessageCreate(BaseModel):
    # Formato del JSON que el frontend manda cuando crea un mensaje.
    sender_id: str
    sender_name: str
    content: str

class MessageResponse(BaseModel):
    # Formato del JSON que el backend devuelve para pintar un mensaje.
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    content: str
    created_at: datetime
    class Config: from_attributes = True

class ConversationResponse(BaseModel):
    # Formato del JSON que alimenta la lista de conversaciones del frontend.
    id: str
    partner: ChatPartner
    item: ChatItem
    last_message: Optional[MessageResponse] = None
    unread: int = 0
    online: bool = False
    updated_at: datetime
