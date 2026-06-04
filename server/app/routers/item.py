from typing import List, Optional
import uuid

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Response, status, Header
from sqlalchemy.orm import Session
from app.database import AsyncSession, get_db
from app.models import  Item
from app.schemas import  ItemCreate, ItemRead, ItemResponse, ItemUpdate
from app.database import get_db
from sqlmodel import select
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
import os

load_dotenv()
item_router = APIRouter(prefix="/items", tags=["Items"])

cloudinary.config( 
    cloud_name = "dnm3itd3g", 
    api_key = os.getenv("CLOUDINARY_API_KEY"), 
    api_secret = os.getenv("CLOUDINARY_API_SECRET"),
)

@item_router.post("/upload-image", summary="Upload an image")
async def upload_item_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided must be an image type.")
        
    try:
        upload_result = cloudinary.uploader.upload(file.file)
        secure_url = upload_result.get("secure_url")
        
        if not secure_url:
            raise HTTPException(status_code=500, detail="Failed to retrieve URL from Cloudinary.")
        return {"image_url": secure_url}        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload error: {str(e)}")


@item_router.get("/", response_model=List[ItemResponse], summary="Get all items")
async def get_items(owner_id: Optional[str] = None, session: AsyncSession = Depends(get_db)):
    if owner_id:
        print(owner_id)
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

@item_router.post("/", response_model=ItemResponse, status_code=201, summary="Create a new item")
async def create_item(
    data: ItemCreate, session: AsyncSession = Depends(get_db)): 
    item_data = data.model_dump()
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



