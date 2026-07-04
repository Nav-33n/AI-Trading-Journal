from fastapi import APIRouter, HTTPException, status

from app.config import settings
from app.schemas import (
    MemoryActionOut,
    MemoryForgetDatasetRequest,
    MemoryRecallOut,
    MemoryRecallRequest,
    MemoryStatusOut,
)
from app.services.memory_service import (
    build_recall_query,
    forget_memory_dataset,
    improve_memory,
    recall_similar_trades,
)

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


@router.post("/improve", response_model=MemoryActionOut)
async def improve_memory_route():
    success, message, raw_result = await improve_memory()

    return {
        "success": success,
        "action": "improve",
        "dataset_name": settings.cognee_dataset_name,
        "message": message,
        "raw_result": raw_result,
    }


@router.post("/forget", response_model=MemoryActionOut)
async def forget_memory_route(payload: MemoryForgetDatasetRequest):
    if payload.confirm_dataset_name != settings.cognee_dataset_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Dataset confirmation does not match. "
                f"Type '{settings.cognee_dataset_name}' to forget this memory dataset."
            ),
        )

    success, message, raw_result = await forget_memory_dataset()

    return {
        "success": success,
        "action": "forget",
        "dataset_name": settings.cognee_dataset_name,
        "message": message,
        "raw_result": raw_result,
    }
