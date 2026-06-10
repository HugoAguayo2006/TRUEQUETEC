from datetime import datetime
from sqlmodel import SQLModel

class UserCreate(SQLModel):
    username: str
    email: str
    bio: str
    password: str

class UserRead(SQLModel):
    id: str
    username: str
    email: str
    rating: float

class UserLogin(SQLModel):
    email: str
    password: str

class UserUpdate(SQLModel):
    username: str | None = None
    rating: str | None = None
    email: str | None = None
    bio: str | None = None
    password: str | None = None

class UserResponse(SQLModel):
    id: str
    username: str
    email: str
    bio: str
    rating: float
    role: str = "user"
    class Config: from_attributes = True

class ItemCreate(SQLModel):
    owner_id: str
    title: str
    estimated_value: float
    image_url: str
    is_available: bool = True

class ItemRead(SQLModel):
    id: str
    owner_id: str
    title: str
    estimated_value: float

class ItemUpdate(SQLModel):
    owner_id: str | None = None
    title: str | None = None
    estimated_value: float | None = None
    image_url: str | None = None
    is_available: bool | None = None

class ItemResponse(SQLModel):
    id: str
    owner_id: str
    title: str
    estimated_value: float
    image_url: str
    is_available: bool = True
    class Config: from_attributes = True

class SwipeRequest(SQLModel):
    swiper_id: str
    item_id: str
    direction: str # "like" or "dislike"

class SwapCreate(SQLModel):
    requester_id: str
    wanted_item_id: str

class SwapOfferUpdate(SQLModel):
    offered_item_ids: list[str]

class SwapStatusUpdate(SQLModel):
    status: str

class MessageCreate(SQLModel):
    sender_id: str
    body: str

class MessageResponse(SQLModel):
    id: str
    swap_id: str
    sender_id: str
    body: str
    created_at: datetime

class SwapRatingCreate(SQLModel):
    rater_id: str
    rating: int
    note: str | None = ""

class SwapRatingResponse(SQLModel):
    id: str
    swap_id: str
    rater_id: str
    rated_user_id: str
    rating: int
    note: str
    created_at: datetime
    rated_user: UserResponse

class SwapRatingDetailResponse(SwapRatingResponse):
    rater: UserResponse

class SwapResponse(SQLModel):
    id: str
    requester_id: str
    owner_id: str
    wanted_item: ItemResponse
    offered_items: list[ItemResponse]
    status: str
    created_at: datetime
    updated_at: datetime
    partner: UserResponse
    last_message: MessageResponse | None = None
