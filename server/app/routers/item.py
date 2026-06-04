from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.database import AsyncSession, get_db
from app.models import  Item
from app.schemas import  ItemCreate, ItemRead, ItemResponse, ItemUpdate
from app.database import get_db
from sqlmodel import select

item_router = APIRouter(prefix="/items", tags=["Items"])

@item_router.get("/", response_model=List[ItemResponse], summary="Get all items")
async def get_all_users(session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(Item))
    return result.scalars().all()


@item_router.get("/{item_id}", response_model=ItemResponse, summary="Get item by id")
async def get_user(item_id: uuid.UUID, session: AsyncSession = Depends(get_db)):
    item = await session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@item_router.post("/", response_model=ItemResponse, status_code=201, summary="Create a new item")
async def create_user(data: ItemCreate, session: Session = Depends(get_db)):
    item = Item(**data.model_dump())
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item

@item_router.patch("/{item_id}", response_model=ItemRead, summary="Update item by id")
async def update_user(item_id: uuid.UUID, data=ItemUpdate, session: AsyncSession = Depends(get_db)):
    item = await session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="User not found")
    user_data = data.model_dump(exclude_unset=True)
    for key, value in user_data.items():
        setattr(item, key, value)

    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item


@item_router.delete("/{user_id}", status_code=204, summary="Delete item by id")
async def delete_user(item_id: uuid.UUID, session: AsyncSession = Depends(get_db)):
    item = await session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="User not found")

    await session.delete(item)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)



