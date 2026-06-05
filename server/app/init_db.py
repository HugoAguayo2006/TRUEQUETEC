from app.database import engine
from sqlmodel import SQLModel
from sqlalchemy import text

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        result = await conn.execute(text("PRAGMA table_info(items)"))
        item_columns = {row[1] for row in result.fetchall()}
        if "is_available" not in item_columns:
            await conn.execute(text("ALTER TABLE items ADD COLUMN is_available BOOLEAN NOT NULL DEFAULT 1"))

        result = await conn.execute(text("PRAGMA table_info(users)"))
        user_columns = {row[1] for row in result.fetchall()}
        if "password_hash" not in user_columns:
            await conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR NOT NULL DEFAULT ''"))
