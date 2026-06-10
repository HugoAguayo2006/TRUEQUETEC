from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request, Response, status
from app.database import AsyncSession, get_db
from app.models import  Item, Swipe, Swap, User
from app.schemas import  ItemCreate, ItemResponse, ItemUpdate
from sqlmodel import select
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
import json
import os

load_dotenv()
item_router = APIRouter(prefix="/items", tags=["Artículos"])

cloudinary.config( 
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
    api_key = os.getenv("CLOUDINARY_API_KEY"), 
    api_secret = os.getenv("CLOUDINARY_API_SECRET"),
)


def _parse_item_ids(raw_item_ids: str) -> List[str]:
    try:
        item_ids = json.loads(raw_item_ids or "[]")
    except json.JSONDecodeError:
        return []
    if not isinstance(item_ids, list):
        return []
    return [str(item_id) for item_id in item_ids if item_id]


async def _item_has_activity(item_id: str, session: AsyncSession) -> bool:
    swipe_result = await session.execute(select(Swipe).where(Swipe.item_id == item_id))
    if swipe_result.scalars().first():
        return True

    wanted_swap_result = await session.execute(select(Swap).where(Swap.wanted_item_id == item_id))
    if wanted_swap_result.scalars().first():
        return True

    swaps_result = await session.execute(select(Swap))
    return any(
        item_id in _parse_item_ids(swap.offered_item_ids)
        for swap in swaps_result.scalars().all()
    )

@item_router.post("/upload-image", summary="Subir una imagen")
async def upload_item_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen.")
        
    try:
        upload_result = cloudinary.uploader.upload(file.file)
        secure_url = upload_result.get("secure_url")
        
        if not secure_url:
            raise HTTPException(status_code=500, detail="No se pudo obtener la URL de Cloudinary.")
        return {"image_url": secure_url}        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir a Cloudinary: {str(e)}")


@item_router.get("/", response_model=List[ItemResponse], summary="Obtener todos los artículos")
async def get_items(request: Request,
     skip: Optional[str] = None,
     owner_id: Optional[str] = None,
     available_only: bool = False,
     all_items: bool = False,
     session: AsyncSession = Depends(get_db)):
    if all_items:
        current_user_id = request.headers.get("X-User-Id")
        current_user = await session.get(User, current_user_id) if current_user_id else None
        if current_user is None or current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Solo administradores pueden ver todas las publicaciones")
        statement = select(Item).where(Item.owner_id != None)
    elif skip:
        statement = select(Item).where(Item.owner_id != skip, Item.is_available == True)
    elif owner_id:
        statement = select(Item).where(Item.owner_id == owner_id)
        if available_only:
            statement = statement.where(Item.is_available == True)
    else:
        statement = select(Item).where(Item.is_available == True)
    result = await session.execute(statement)
    return result.scalars().all()

@item_router.get("/{item_id}", response_model=ItemResponse, summary="Obtener artículo por id")
async def get_item(item_id: str, session: AsyncSession = Depends(get_db)):
    item = await session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    return item

@item_router.post("/", response_model=ItemResponse, status_code=201, summary="Crear un artículo")
async def create_item(
    data: ItemCreate, session: AsyncSession = Depends(get_db)): 
    item_data = data.model_dump()
    item = Item(**item_data)
    session.add(item)
    await session.commit()      
    await session.refresh(item)
    return item

@item_router.patch("/{item_id}", response_model=ItemResponse, summary="Actualizar artículo por id")
async def update_item(item_id: str, data: ItemUpdate, session: AsyncSession = Depends(get_db)):
    item = await session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")

    item_data = data.model_dump(exclude_unset=True)
    owner_id = item_data.pop("owner_id", None)
    if owner_id and item.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Solo puedes actualizar tus propias publicaciones")

    for key, value in item_data.items():
        setattr(item, key, value)

    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item


@item_router.delete("/{item_id}", status_code=204, summary="Eliminar artículo por id")
async def delete_item(
    item_id: str,
    request: Request,
    owner_id: Optional[str] = None,
    session: AsyncSession = Depends(get_db)
):
    item = await session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")

    current_user_id = request.headers.get("X-User-Id")
    current_user = await session.get(User, current_user_id) if current_user_id else None
    is_admin = current_user is not None and current_user.role == "admin"
    is_owner = owner_id is not None and item.owner_id == owner_id

    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="Solo puedes eliminar tus propias publicaciones")

    if await _item_has_activity(item_id, session):
        item.owner_id = None
        item.is_available = False
        session.add(item)
        await session.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    await session.delete(item)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
