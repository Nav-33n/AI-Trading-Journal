from fastapi import APIRouter

from app.config import settings
from app.schemas import HealthOut

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut)
def health_check():
    return {"status": "ok", "app": settings.app_name}
