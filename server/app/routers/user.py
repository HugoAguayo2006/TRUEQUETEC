from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.database import AsyncSession, get_db
from app.models import User, Item
from app.schemas import UserCreate, UserRead, UserResponse, UserUpdate
from app.database import get_db
from sqlmodel import select, delete

user_router = APIRouter(prefix="/users", tags=["Users"])

@user_router.get("/", response_model=List[UserResponse], summary="Get all users")
async def get_all_users(session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(User))
    return result.scalars().all()

@user_router.get("/{user_id}", response_model=UserResponse, summary="Get the user by id")
async def get_user(user_id: uuid.UUID, session: AsyncSession = Depends(get_db)):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@user_router.post("/", response_model=User, status_code=201, summary="Create a new user")
async def create_user(data: UserCreate, session: Session = Depends(get_db)):
    user = User(**data.model_dump())
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

@user_router.patch("/{user_id}", response_model=UserRead, summary="Update user by id")
async def update_user(user_id: uuid.UUID, data=UserUpdate, session: AsyncSession = Depends(get_db)):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_data = data.model_dump(exclude_unset=True)
    for key, value in user_data.items():
        setattr(user, key, value)

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

@user_router.delete("/{user_id}", status_code=204, summary="Delete user by id")
async def delete_user(user_id: uuid.UUID, session: AsyncSession = Depends(get_db)):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await session.execute(delete(Item).where(Item.owner_id == user_id))
    await session.delete(user)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)




