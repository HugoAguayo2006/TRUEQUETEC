from contextlib import asynccontextmanager

from fastapi import FastAPI
from app.database import engine
from app.routers.user import user_router
from app.routers.item import item_router
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

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:5173"],
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/scalar", include_in_schema=True)
def get_docs_scalar():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title="Scalar API"
    )


