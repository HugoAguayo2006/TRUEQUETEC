import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class UserModel(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False)
    rating = Column(Float, default=5.0)

class ItemModel(Base):
    __tablename__ = "items"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    estimated_value = Column(Float, nullable=False)

class SwipeModel(Base):
    __tablename__ = "swipes"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    swiper_id = Column(String, ForeignKey("users.id"), nullable=False)
    item_id = Column(String, ForeignKey("items.id"), nullable=False)
    direction = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

