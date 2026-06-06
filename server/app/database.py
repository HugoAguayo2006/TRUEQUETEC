import os
from typing import AsyncGenerator
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

load_dotenv()


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    if not url.startswith("postgresql+asyncpg://"):
        return url

    parsed = urlsplit(url)
    query = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if key not in {"sslmode", "channel_binding"}
    ]
    return urlunsplit(parsed._replace(query=urlencode(query)))


def database_connect_args(url: str) -> dict[str, bool]:
    if url.startswith("postgresql+asyncpg://"):
        return {"ssl": True}
    return {}


DATABASE_URL = normalize_database_url(
    os.getenv("DATABASE_URL", "sqlite+aiosqlite:///swap.db")
)

engine = create_async_engine(
    DATABASE_URL,
    connect_args=database_connect_args(DATABASE_URL),
    pool_pre_ping=True,
)
AsyncSession = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession,None]:
    async with AsyncSession() as session:
        yield session
