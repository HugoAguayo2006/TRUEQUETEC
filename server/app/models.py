import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel

class User(SQLModel, table=True):
    __tablename__: str = "users"
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    username: str = Field(unique=True, nullable=False)
    rating: float = Field(default=5.0)
    email: str = Field(unique=True, nullable=True, default="")
    bio: str = Field(nullable=True, default="")
    password_hash: str = Field(default="", nullable=False)
    role: str = Field(default="user", nullable=False)


class Item(SQLModel, table=True):
    __tablename__: str = "items"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    owner_id: Optional[str] = Field(default=None, foreign_key="users.id")
    title: str = Field(nullable=False)
    estimated_value: float = Field(default=0.0, nullable=False)
    image_url: str = Field(default="", nullable=True)
    is_available: bool = Field(default=True, nullable=False)


class Swipe(SQLModel, table=True):
    __tablename__: str = "swipes"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    owner_id: str = Field(foreign_key="users.id", nullable=False)
    swiper_id: str = Field(foreign_key="users.id", nullable=False)
    item_id: str = Field(foreign_key="items.id", nullable=False)
    direction: str = Field(nullable=False)
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class Swap(SQLModel, table=True):
    __tablename__: str = "swaps"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    requester_id: str = Field(foreign_key="users.id", nullable=False)
    owner_id: str = Field(foreign_key="users.id", nullable=False)
    wanted_item_id: str = Field(foreign_key="items.id", nullable=False)
    offered_item_ids: str = Field(default="[]", nullable=False)
    status: str = Field(default="pending", nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class Message(SQLModel, table=True):
    __tablename__: str = "messages"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    swap_id: str = Field(foreign_key="swaps.id", nullable=False)
    sender_id: str = Field(foreign_key="users.id", nullable=False)
    body: str = Field(nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class SwapRating(SQLModel, table=True):
    __tablename__: str = "swap_ratings"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    swap_id: str = Field(foreign_key="swaps.id", nullable=False)
    rater_id: str = Field(foreign_key="users.id", nullable=False)
    rated_user_id: str = Field(foreign_key="users.id", nullable=False)
    rating: int = Field(nullable=False)
    note: str = Field(default="", nullable=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
