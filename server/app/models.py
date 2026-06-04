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


class Item(SQLModel, table=True):
    __tablename__: str = "items"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    owner_id: Optional[str] = Field(default=None, foreign_key="users.id")
    title: str = Field(nullable=False)
    estimated_value: float = Field(default=0.0, nullable=False)


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
