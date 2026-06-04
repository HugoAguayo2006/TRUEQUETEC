import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text
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

class ConversationModel(Base):
    __tablename__ = "conversations"

    # Una conversacion representa un chat entre dos usuarios por un articulo.
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_a_id = Column(String, ForeignKey("users.id"), nullable=False)
    user_b_id = Column(String, ForeignKey("users.id"), nullable=False)
    item_id = Column(String, ForeignKey("items.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user_a = relationship("UserModel", foreign_keys=[user_a_id])
    user_b = relationship("UserModel", foreign_keys=[user_b_id])
    item = relationship("ItemModel")

class MessageModel(Base):
    __tablename__ = "messages"

    # Cada registro es un mensaje persistido dentro de una conversacion.
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    sender_name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("ConversationModel")
    sender = relationship("UserModel")
