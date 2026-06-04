from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status, Header
from sqlalchemy.orm import Session
from app.database import AsyncSession, get_db
from app.models import  Item
from app.schemas import  ItemCreate, ItemRead, ItemResponse, ItemUpdate
from app.database import get_db
from sqlmodel import select

item_router = APIRouter(prefix="/items", tags=["Items"])

@item_router.get("/", response_model=List[ItemResponse], summary="Get all items")
async def get_items(owner_id: Optional[uuid.UUID] = None, session: AsyncSession = Depends(get_db)):
    if owner_id:
        statement = select(Item).where(Item.owner_id == owner_id)
    else:
        statement = select(Item)
    result = await session.execute(statement)
    return result.scalars().all()


@item_router.get("/{item_id}", response_model=ItemResponse, summary="Get item by id")
async def get_user(item_id: uuid.UUID, session: AsyncSession = Depends(get_db)):
    item = await session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@item_router.post("/", response_model=ItemResponse, status_code=201, summary="Create a new item explicitly bound to the logged-in user")
async def create_item(
    data: ItemCreate, 
    session: AsyncSession = Depends(get_db), 
    x_user_id: Optional[str] = Header(None)
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header missing. You must be logged in to list items.")

    # Convert the string header to a clean native UUID matching your DB layout
    try:
        user_uuid = uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID layout format.")
    item_data = data.model_dump()
    item_data["owner_id"] = user_uuid 

    item = Item(**item_data)
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



