from app.database import engine
import app.models  # noqa: F401 - register SQLModel tables before create_all
from sqlmodel import SQLModel
from sqlalchemy import inspect, text
import hashlib
import os

PASSWORD_ITERATIONS = 210_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

        item_columns = await conn.run_sync(
            lambda sync_conn: {column["name"] for column in inspect(sync_conn).get_columns("items")}
        )
        if "is_available" not in item_columns:
            default_value = "1" if conn.dialect.name == "sqlite" else "true"
            await conn.execute(
                text(f"ALTER TABLE items ADD COLUMN is_available BOOLEAN NOT NULL DEFAULT {default_value}")
            )

        user_columns = await conn.run_sync(
            lambda sync_conn: {column["name"] for column in inspect(sync_conn).get_columns("users")}
        )
        if "password_hash" not in user_columns:
            await conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR NOT NULL DEFAULT ''"))
        if "role" not in user_columns:
            await conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR NOT NULL DEFAULT 'user'"))

        admin_email = "admin@truquetec.com"
        result = await conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": admin_email})
        existing_admin = result.fetchone()
        if existing_admin is None:
            await conn.execute(
                text(
                    """
                    INSERT INTO users (id, username, rating, email, bio, password_hash, role)
                    VALUES (:id, :username, :rating, :email, :bio, :password_hash, :role)
                    """
                ),
                {
                    "id": "admin-user",
                    "username": "Admin TruequeTec",
                    "rating": 5.0,
                    "email": admin_email,
                    "bio": "Panel de administracion",
                    "password_hash": hash_password("Admin123"),
                    "role": "admin",
                },
            )
        else:
            await conn.execute(
                text("UPDATE users SET role = 'admin' WHERE email = :email"),
                {"email": admin_email},
            )
