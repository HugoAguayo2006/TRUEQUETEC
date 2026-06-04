from typing import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

load_dotenv()
DATABASE_URL = "sqlite+aiosqlite:///swap.db"

engine = create_async_engine(DATABASE_URL)
AsyncSession = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession,None]:
    async with AsyncSession() as session:
        yield session
