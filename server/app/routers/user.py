from typing import List
import hashlib
import hmac
import os

from fastapi import APIRouter, Depends, HTTPException, Response, status
from app.database import AsyncSession, get_db
from app.models import User, Item
from app.schemas import UserCreate, UserLogin, UserRead, UserResponse, UserUpdate
from app.database import get_db
from sqlmodel import select, delete

user_router = APIRouter(prefix="/users", tags=["Usuarios"])

PASSWORD_ITERATIONS = 210_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations),
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False

@user_router.get("/", response_model=List[UserResponse], summary="Obtener todos los usuarios")
async def get_all_users(session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(User))
    return result.scalars().all()

@user_router.post("/", response_model=UserResponse, status_code=201, summary="Crear un usuario")
async def create_user(data: UserCreate, session: AsyncSession = Depends(get_db)):
    user_data = data.model_dump()
    password = user_data.pop("password")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

    existing_result = await session.execute(
        select(User).where((User.email == user_data["email"]) | (User.username == user_data["username"]))
    )
    if existing_result.scalars().first():
        raise HTTPException(status_code=400, detail="Este usuario ya tiene cuenta")

    user = User(**user_data, password_hash=hash_password(password))
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

@user_router.post("/login", response_model=UserResponse, summary="Iniciar sesión con correo y contraseña")
async def login_user(data: UserLogin, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(User).where(User.email == data.email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    if not user.password_hash:
        user.password_hash = hash_password(data.password)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    return user

@user_router.get("/{user_id}", response_model=UserResponse, summary="Obtener usuario por id")
async def get_user(user_id: str, session: AsyncSession = Depends(get_db)):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@user_router.patch("/{user_id}", response_model=UserRead, summary="Actualizar usuario por id")
async def update_user(user_id: str, data: UserUpdate, session: AsyncSession = Depends(get_db)):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user_data = data.model_dump(exclude_unset=True)
    password = user_data.pop("password", None)
    if password is not None:
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
        user.password_hash = hash_password(password)

    for key, value in user_data.items():
        setattr(user, key, value)

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

@user_router.delete("/{user_id}", status_code=204, summary="Eliminar usuario por id")
async def delete_user(user_id: str, session: AsyncSession = Depends(get_db)):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    await session.execute(delete(Item).where(Item.owner_id == user_id))
    await session.delete(user)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
