from fastapi import FastAPI
from app.database import engine, Base
from app.routers import router
from scalar_fastapi import get_scalar_api_reference
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Simple swap")
app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/scalar", include_in_schema=False)
def get_docs_scalar():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title="Scalar API"
    )


