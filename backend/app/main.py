from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routes import dashboard, health, memory, trades

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Trading Journal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(trades.router)
app.include_router(memory.router)
app.include_router(dashboard.router)
