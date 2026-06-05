import json
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from app.database import AsyncSession, get_db
from app.models import Item, Message, Swap, SwapRating, User
from app.schemas import (
    MessageCreate,
    MessageResponse,
    SwapRatingCreate,
    SwapRatingResponse,
    SwapCreate,
    SwapOfferUpdate,
    SwapResponse,
    SwapStatusUpdate,
)
from sqlmodel import select

swap_router = APIRouter(prefix="/swaps", tags=["Swaps"])


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


def _parse_item_ids(raw: str) -> list[str]:
    try:
        data = json.loads(raw or "[]")
    except json.JSONDecodeError:
        return []
    return [str(item_id) for item_id in data if item_id]


async def _transfer_swap_items(swap: Swap, session: AsyncSession):
    wanted_item = await session.get(Item, swap.wanted_item_id)
    if not wanted_item:
        raise HTTPException(status_code=404, detail="Wanted item not found")

    wanted_item.owner_id = swap.requester_id
    wanted_item.is_available = False
    session.add(wanted_item)

    for item_id in _parse_item_ids(swap.offered_item_ids):
        offered_item = await session.get(Item, item_id)
        if not offered_item:
            raise HTTPException(status_code=404, detail=f"Offered item {item_id} not found")
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
        raise HTTPException(status_code=404, detail="Wanted item not found")

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
        raise HTTPException(status_code=404, detail="Swap partner not found")

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


@swap_router.get("/", response_model=List[SwapResponse], summary="Get swaps for a user")
async def get_swaps(user_id: str, session: AsyncSession = Depends(get_db)):
    statement = (
        select(Swap)
        .where((Swap.requester_id == user_id) | (Swap.owner_id == user_id))
        .order_by(Swap.updated_at.desc())
    )
    result = await session.execute(statement)
    swaps = result.scalars().all()
    return [await _get_swap_response(swap, session, user_id) for swap in swaps]


@swap_router.post("/", response_model=SwapResponse, status_code=201, summary="Create a swap request")
async def create_swap(data: SwapCreate, session: AsyncSession = Depends(get_db)):
    wanted_item = await session.get(Item, data.wanted_item_id)
    if not wanted_item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not wanted_item.is_available:
        raise HTTPException(status_code=400, detail="This item is no longer available")
    if wanted_item.owner_id == data.requester_id:
        raise HTTPException(status_code=400, detail="You cannot request your own item")

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


@swap_router.patch("/{swap_id}/offer", response_model=SwapResponse, summary="Attach offered items to a swap")
async def update_swap_offer(
    swap_id: str,
    data: SwapOfferUpdate,
    session: AsyncSession = Depends(get_db),
):
    swap = await session.get(Swap, swap_id)
    if not swap:
        raise HTTPException(status_code=404, detail="Swap not found")

    for item_id in data.offered_item_ids:
        item = await session.get(Item, item_id)
        if not item:
            raise HTTPException(status_code=404, detail=f"Item {item_id} not found")
        if item.owner_id != swap.requester_id:
            raise HTTPException(status_code=400, detail="Offered items must belong to the requester")
        if not item.is_available:
            raise HTTPException(status_code=400, detail="Offered items must be available")

    swap.offered_item_ids = json.dumps(data.offered_item_ids)
    swap.status = "awaiting"
    swap.updated_at = datetime.now(timezone.utc)
    session.add(swap)
    await session.commit()
    await session.refresh(swap)

    await manager.send_to_swap_users(swap, {"type": "swap_updated", "swap_id": swap.id})
    return await _get_swap_response(swap, session, swap.requester_id)


@swap_router.patch("/{swap_id}/status", response_model=SwapResponse, summary="Update swap status")
async def update_swap_status(
    swap_id: str,
    data: SwapStatusUpdate,
    session: AsyncSession = Depends(get_db),
):
    allowed_statuses = {"pending", "awaiting", "accepted", "countered", "completed", "declined"}
    if data.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid swap status")

    swap = await session.get(Swap, swap_id)
    if not swap:
        raise HTTPException(status_code=404, detail="Swap not found")

    if data.status == "accepted":
        if swap.status != "awaiting":
            raise HTTPException(status_code=400, detail="Only swaps with an offer can be accepted")
        if not _parse_item_ids(swap.offered_item_ids):
            raise HTTPException(status_code=400, detail="Cannot accept a swap without offered items")
        await _transfer_swap_items(swap, session)

    if data.status == "completed" and swap.status != "accepted":
        raise HTTPException(status_code=400, detail="Only accepted swaps can be confirmed as received")

    swap.status = data.status
    swap.updated_at = datetime.now(timezone.utc)
    session.add(swap)
    await session.commit()
    await session.refresh(swap)

    await manager.send_to_swap_users(swap, {"type": "swap_updated", "swap_id": swap.id})
    return await _get_swap_response(swap, session)


@swap_router.get("/{swap_id}/messages", response_model=List[MessageResponse], summary="Get swap messages")
async def get_messages(swap_id: str, session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(Message)
        .where(Message.swap_id == swap_id)
        .order_by(Message.created_at)
    )
    return result.scalars().all()


@swap_router.post("/{swap_id}/messages", response_model=MessageResponse, status_code=201, summary="Send a swap message")
async def create_message(
    swap_id: str,
    data: MessageCreate,
    session: AsyncSession = Depends(get_db),
):
    swap = await session.get(Swap, swap_id)
    if not swap:
        raise HTTPException(status_code=404, detail="Swap not found")
    if data.sender_id not in {swap.requester_id, swap.owner_id}:
        raise HTTPException(status_code=403, detail="Sender is not part of this swap")
    if not data.body.strip():
        raise HTTPException(status_code=400, detail="Message body cannot be empty")

    message = Message(swap_id=swap_id, sender_id=data.sender_id, body=data.body.strip())
    swap.updated_at = datetime.now(timezone.utc)
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
        raise HTTPException(status_code=404, detail="Rated user not found")

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


@swap_router.post("/{swap_id}/ratings", response_model=SwapRatingResponse, status_code=201, summary="Rate a completed swap")
async def rate_swap(
    swap_id: str,
    data: SwapRatingCreate,
    session: AsyncSession = Depends(get_db),
):
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    swap = await session.get(Swap, swap_id)
    if not swap:
        raise HTTPException(status_code=404, detail="Swap not found")
    if swap.status != "completed":
        raise HTTPException(status_code=400, detail="Only completed swaps can be rated")
    if data.rater_id not in {swap.requester_id, swap.owner_id}:
        raise HTTPException(status_code=403, detail="Rater is not part of this swap")

    rated_user_id = swap.owner_id if data.rater_id == swap.requester_id else swap.requester_id
    existing_result = await session.execute(
        select(SwapRating).where(
            SwapRating.swap_id == swap_id,
            SwapRating.rater_id == data.rater_id,
        )
    )
    existing_rating = existing_result.scalars().first()
    if existing_rating:
        raise HTTPException(status_code=400, detail="You already rated this swap")

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
