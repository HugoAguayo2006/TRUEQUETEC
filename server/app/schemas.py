from pydantic import BaseModel
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
