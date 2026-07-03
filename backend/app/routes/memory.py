from fastapi import APIRouter

from app.config import settings
from app.schemas import MemoryRecallOut, MemoryRecallRequest, MemoryStatusOut
from app.services.memory_service import build_recall_query, recall_similar_trades

router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("/status", response_model=MemoryStatusOut)
def memory_status():
    return {
        "cognee_enabled": settings.cognee_enabled,
        "dataset_name": settings.cognee_dataset_name,
        "session_id": settings.cognee_session_id,
    }


@router.post("/recall", response_model=MemoryRecallOut)
async def recall_memory(payload: MemoryRecallRequest):
    matches = await recall_similar_trades(payload)
    return {
        "query": build_recall_query(payload),
        "matches": matches,
    }
