import uuid
from sqlmodel import SQLModel

class UserCreate(SQLModel):
    username: str
    email: str
    bio: str

class UserRead(SQLModel):
    id: uuid.UUID
    username: str
    email: str
    rating: float

class UserUpdate(SQLModel):
    username: str | None = None
    rating: str | None = None
    email: str | None = None
    bio: str | None = None

class UserResponse(SQLModel):
    id: str
    username: str
    email: str
    bio: str
    rating: float
    class Config: from_attributes = True

class ItemCreate(SQLModel):
    owner_id: str
    title: str
    estimated_value: float
    image_url: str

class ItemRead(SQLModel):
    id: uuid.UUID
    owner_id: str
    title: str
    estimated_value: float

class ItemUpdate(SQLModel):
    title: str
    estimated_value: float
    image_url: str

class ItemResponse(SQLModel):
    id: str
    owner_id: str
    title: str
    estimated_value: float
    image_url: str
    class Config: from_attributes = True

class SwipeRequest(SQLModel):
    swiper_id: str
    item_id: str
    direction: str # "like" or "dislike"
