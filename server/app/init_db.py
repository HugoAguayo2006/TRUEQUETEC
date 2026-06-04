from app.database import engine
from sqlmodel import SQLModel

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
