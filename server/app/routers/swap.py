import json
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, WebSocket, WebSocketDisconnect, status
from app.database import AsyncSession, get_db
from app.models import Item, Message, Swap, SwapRating, User
from app.schemas import (
    MessageCreate,
    MessageResponse,
    SwapRatingCreate,
    SwapRatingDetailResponse,
    SwapRatingResponse,
    SwapCreate,
    SwapOfferUpdate,
    SwapResponse,
    SwapStatusUpdate,
)
from sqlmodel import select

swap_router = APIRouter(prefix="/swaps", tags=["Trueques"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        connections = self.active_connections.get(user_id, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections and user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, payload: dict):
        for connection in self.active_connections.get(user_id, []):
            await connection.send_json(payload)

    async def send_to_swap_users(self, swap: Swap, payload: dict):
        await self.send_to_user(swap.requester_id, payload)
        if swap.owner_id != swap.requester_id:
            await self.send_to_user(swap.owner_id, payload)


manager = ConnectionManager()


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _parse_item_ids(raw: str) -> list[str]:
    try:
        data = json.loads(raw or "[]")
    except json.JSONDecodeError:
        return []
    return [str(item_id) for item_id in data if item_id]


async def _transfer_swap_items(swap: Swap, session: AsyncSession):
    wanted_item = await session.get(Item, swap.wanted_item_id)
    if not wanted_item:
        raise HTTPException(status_code=404, detail="Artículo solicitado no encontrado")

    wanted_item.owner_id = swap.requester_id
    wanted_item.is_available = False
    session.add(wanted_item)

    for item_id in _parse_item_ids(swap.offered_item_ids):
        offered_item = await session.get(Item, item_id)
        if not offered_item:
            raise HTTPException(status_code=404, detail=f"Artículo ofrecido {item_id} no encontrado")
        offered_item.owner_id = swap.owner_id
        offered_item.is_available = False
        session.add(offered_item)


async def _get_swap_response(
    swap: Swap,
    session: AsyncSession,
    viewer_id: Optional[str] = None,
) -> SwapResponse:
    wanted_item = await session.get(Item, swap.wanted_item_id)
    if not wanted_item:
        raise HTTPException(status_code=404, detail="Artículo solicitado no encontrado")

    offered_items = []
    for item_id in _parse_item_ids(swap.offered_item_ids):
        item = await session.get(Item, item_id)
        if item:
            offered_items.append(item)

    partner_id = swap.owner_id
    if viewer_id == swap.owner_id:
        partner_id = swap.requester_id
    partner = await session.get(User, partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Usuario del trueque no encontrado")

    result = await session.execute(
        select(Message)
        .where(Message.swap_id == swap.id)
        .order_by(Message.created_at.desc())
        .limit(1)
    )
    last_message = result.scalars().first()

    return SwapResponse(
        id=swap.id,
        requester_id=swap.requester_id,
        owner_id=swap.owner_id,
        wanted_item=wanted_item,
        offered_items=offered_items,
        status=swap.status,
        created_at=swap.created_at,
        updated_at=swap.updated_at,
        partner=partner,
        last_message=last_message,
    )


@swap_router.websocket("/ws/{user_id}")
async def swaps_websocket(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)


@swap_router.get("/", response_model=List[SwapResponse], summary="Obtener trueques de un usuario")
async def get_swaps(user_id: str, session: AsyncSession = Depends(get_db)):
    statement = (
        select(Swap)
        .where((Swap.requester_id == user_id) | (Swap.owner_id == user_id))
        .order_by(Swap.updated_at.desc())
    )
    result = await session.execute(statement)
    swaps = result.scalars().all()
    return [await _get_swap_response(swap, session, user_id) for swap in swaps]


@swap_router.post("/", response_model=SwapResponse, status_code=201, summary="Crear una solicitud de trueque")
async def create_swap(data: SwapCreate, session: AsyncSession = Depends(get_db)):
    wanted_item = await session.get(Item, data.wanted_item_id)
    if not wanted_item:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    if not wanted_item.is_available:
        raise HTTPException(status_code=400, detail="Este artículo ya no está disponible")
    if wanted_item.owner_id == data.requester_id:
        raise HTTPException(status_code=400, detail="No puedes solicitar tu propio artículo")

    statement = select(Swap).where(
        Swap.requester_id == data.requester_id,
        Swap.wanted_item_id == data.wanted_item_id,
        Swap.status.in_(["pending", "awaiting", "accepted", "offer-received", "countered"]),
    )
    existing_result = await session.execute(statement)
    existing = existing_result.scalars().first()
    if existing:
        return await _get_swap_response(existing, session, data.requester_id)

    swap = Swap(
        requester_id=data.requester_id,
        owner_id=wanted_item.owner_id or "",
        wanted_item_id=data.wanted_item_id,
    )
    session.add(swap)
    await session.commit()
    await session.refresh(swap)

    payload = {"type": "swap_created", "swap_id": swap.id}
    await manager.send_to_swap_users(swap, payload)
    return await _get_swap_response(swap, session, data.requester_id)


@swap_router.patch("/{swap_id}/offer", response_model=SwapResponse, summary="Agregar artículos ofrecidos a un trueque")
async def update_swap_offer(
    swap_id: str,
    data: SwapOfferUpdate,
    session: AsyncSession = Depends(get_db),
):
    swap = await session.get(Swap, swap_id)
    if not swap:
        raise HTTPException(status_code=404, detail="Trueque no encontrado")

    for item_id in data.offered_item_ids:
        item = await session.get(Item, item_id)
        if not item:
            raise HTTPException(status_code=404, detail=f"Artículo {item_id} no encontrado")
        if item.owner_id != swap.requester_id:
            raise HTTPException(status_code=400, detail="Los artículos ofrecidos deben pertenecer a quien solicita el trueque")
        if not item.is_available:
            raise HTTPException(status_code=400, detail="Los artículos ofrecidos deben estar disponibles")

    swap.offered_item_ids = json.dumps(data.offered_item_ids)
    swap.status = "awaiting"
    swap.updated_at = utc_now()
    session.add(swap)
    await session.commit()
    await session.refresh(swap)

    await manager.send_to_swap_users(swap, {"type": "swap_updated", "swap_id": swap.id})
    return await _get_swap_response(swap, session, swap.requester_id)


@swap_router.patch("/{swap_id}/status", response_model=SwapResponse, summary="Actualizar estado del trueque")
async def update_swap_status(
    swap_id: str,
    data: SwapStatusUpdate,
    session: AsyncSession = Depends(get_db),
):
    allowed_statuses = {"pending", "awaiting", "accepted", "countered", "completed", "declined"}
    if data.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Estado de trueque no válido")

    swap = await session.get(Swap, swap_id)
    if not swap:
        raise HTTPException(status_code=404, detail="Trueque no encontrado")

    if data.status == "accepted":
        if swap.status != "awaiting":
            raise HTTPException(status_code=400, detail="Solo se pueden aceptar trueques con una oferta")
        if not _parse_item_ids(swap.offered_item_ids):
            raise HTTPException(status_code=400, detail="No puedes aceptar un trueque sin artículos ofrecidos")
        await _transfer_swap_items(swap, session)

    if data.status == "completed" and swap.status != "accepted":
        raise HTTPException(status_code=400, detail="Solo los trueques aceptados se pueden confirmar como recibidos")

    swap.status = data.status
    swap.updated_at = utc_now()
    session.add(swap)
    await session.commit()
    await session.refresh(swap)

    await manager.send_to_swap_users(swap, {"type": "swap_updated", "swap_id": swap.id})
    return await _get_swap_response(swap, session)


@swap_router.get("/{swap_id}/messages", response_model=List[MessageResponse], summary="Obtener mensajes del trueque")
async def get_messages(swap_id: str, session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Message)
        .where(Message.swap_id == swap_id)
        .order_by(Message.created_at)
    )
    return result.scalars().all()


@swap_router.post("/{swap_id}/messages", response_model=MessageResponse, status_code=201, summary="Enviar mensaje del trueque")
async def create_message(
    swap_id: str,
    data: MessageCreate,
    session: AsyncSession = Depends(get_db),
):
    swap = await session.get(Swap, swap_id)
    if not swap:
        raise HTTPException(status_code=404, detail="Trueque no encontrado")
    if data.sender_id not in {swap.requester_id, swap.owner_id}:
        raise HTTPException(status_code=403, detail="El remitente no forma parte de este trueque")
    if not data.body.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")

    message = Message(swap_id=swap_id, sender_id=data.sender_id, body=data.body.strip())
    swap.updated_at = utc_now()
    session.add(message)
    session.add(swap)
    await session.commit()
    await session.refresh(message)

    await manager.send_to_swap_users(
        swap,
        {
            "type": "message_created",
            "swap_id": swap.id,
            "message": {
                "id": message.id,
                "swap_id": message.swap_id,
                "sender_id": message.sender_id,
                "body": message.body,
                "created_at": message.created_at.isoformat(),
            },
        },
    )
    return message


async def _recalculate_user_rating(user_id: str, session: AsyncSession) -> User:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario calificado no encontrado")

    result = await session.execute(
        select(SwapRating).where(SwapRating.rated_user_id == user_id)
    )
    ratings = result.scalars().all()
    if ratings:
        user.rating = round(sum(rating.rating for rating in ratings) / len(ratings), 2)
    else:
        user.rating = 5.0

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def _require_admin(request: Request, session: AsyncSession) -> User:
    current_user_id = request.headers.get("X-User-Id")
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Falta usuario actual")

    current_user = await session.get(User, current_user_id)
    if current_user is None or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden administrar reseñas")

    return current_user


async def _rating_detail(rating: SwapRating, session: AsyncSession) -> SwapRatingDetailResponse:
    rated_user = await session.get(User, rating.rated_user_id)
    rater = await session.get(User, rating.rater_id)
    if not rated_user or not rater:
        raise HTTPException(status_code=404, detail="Usuario de la reseña no encontrado")

    return SwapRatingDetailResponse(
        id=rating.id,
        swap_id=rating.swap_id,
        rater_id=rating.rater_id,
        rated_user_id=rating.rated_user_id,
        rating=rating.rating,
        note=rating.note or "",
        created_at=rating.created_at,
        rated_user=rated_user,
        rater=rater,
    )


@swap_router.get("/ratings", response_model=List[SwapRatingDetailResponse], summary="Obtener todas las reseñas")
async def get_all_ratings(request: Request, session: AsyncSession = Depends(get_db)):
    await _require_admin(request, session)
    result = await session.execute(select(SwapRating).order_by(SwapRating.created_at.desc()))
    ratings = result.scalars().all()
    return [await _rating_detail(rating, session) for rating in ratings]


@swap_router.get("/ratings/received/{user_id}", response_model=List[SwapRatingDetailResponse], summary="Obtener reseñas recibidas por usuario")
async def get_received_ratings(user_id: str, session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(SwapRating)
        .where(SwapRating.rated_user_id == user_id)
        .order_by(SwapRating.created_at.desc())
    )
    ratings = result.scalars().all()
    return [await _rating_detail(rating, session) for rating in ratings]


@swap_router.delete("/ratings/{rating_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Borrar una reseña")
async def delete_rating(
    rating_id: str,
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    await _require_admin(request, session)
    rating = await session.get(SwapRating, rating_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")

    rated_user_id = rating.rated_user_id
    await session.delete(rating)
    await session.commit()
    await _recalculate_user_rating(rated_user_id, session)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@swap_router.post("/{swap_id}/ratings", response_model=SwapRatingResponse, status_code=201, summary="Calificar un trueque completado")
async def rate_swap(
    swap_id: str,
    data: SwapRatingCreate,
    session: AsyncSession = Depends(get_db),
):
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="La calificación debe estar entre 1 y 5")

    swap = await session.get(Swap, swap_id)
    if not swap:
        raise HTTPException(status_code=404, detail="Trueque no encontrado")
    if swap.status != "completed":
        raise HTTPException(status_code=400, detail="Solo se pueden calificar trueques completados")
    if data.rater_id not in {swap.requester_id, swap.owner_id}:
        raise HTTPException(status_code=403, detail="Quien califica no forma parte de este trueque")

    rated_user_id = swap.owner_id if data.rater_id == swap.requester_id else swap.requester_id
    existing_result = await session.execute(
        select(SwapRating).where(
            SwapRating.swap_id == swap_id,
            SwapRating.rater_id == data.rater_id,
        )
    )
    existing_rating = existing_result.scalars().first()
    if existing_rating:
        raise HTTPException(status_code=400, detail="Ya calificaste este trueque")

    swap_rating = SwapRating(
        swap_id=swap_id,
        rater_id=data.rater_id,
        rated_user_id=rated_user_id,
        rating=data.rating,
        note=data.note or "",
    )
    session.add(swap_rating)
    await session.commit()
    await session.refresh(swap_rating)

    rated_user = await _recalculate_user_rating(rated_user_id, session)
    await manager.send_to_swap_users(
        swap,
        {
            "type": "swap_rated",
            "swap_id": swap.id,
            "rated_user_id": rated_user_id,
            "rating": rated_user.rating,
        },
    )

    return SwapRatingResponse(
        id=swap_rating.id,
        swap_id=swap_rating.swap_id,
        rater_id=swap_rating.rater_id,
        rated_user_id=swap_rating.rated_user_id,
        rating=swap_rating.rating,
        note=swap_rating.note or "",
        created_at=swap_rating.created_at,
        rated_user=rated_user,
    )
