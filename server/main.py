from contextlib import asynccontextmanager
from pathlib import Path
import sys
import os

SERVER_DIR = Path(__file__).resolve().parent
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from fastapi import FastAPI
from app.database import engine
from app.routers.user import user_router
from app.routers.item import item_router
from app.routers.swap import swap_router
from app.routers.pricing import pricing_router
from scalar_fastapi import get_scalar_api_reference
from fastapi.middleware.cors import CORSMiddleware
from app.init_db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(user_router)
app.include_router(item_router)
app.include_router(swap_router)
app.include_router(pricing_router)

frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,https://truequetec.vercel.app",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", include_in_schema=False)
def healthcheck():
    return {"status": "ok", "service": "truquetec-api"}

@app.get("/scalar", include_in_schema=True)
def get_docs_scalar():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title="Scalar API"
    )
