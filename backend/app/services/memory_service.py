import os

from app.config import settings
from app.models import Trade
from app.schemas import MemoryRecallRequest


def trade_to_memory_text(trade: Trade) -> str:
    return (
        f"Trading journal memory. "
        f"Trade ID: {trade.id}. "
        f"Symbol: {trade.symbol}. "
        f"Direction: {trade.direction}. "
        f"Entry price: {trade.entry_price}. "
        f"Stop loss: {trade.stop_loss}. "
        f"Take profit: {trade.take_profit}. "
        f"Lot size: {trade.lot_size if trade.lot_size is not None else 'not specified'}. "
        f"Risk percent: {trade.risk_percent if trade.risk_percent is not None else 'not specified'}. "
        f"Session: {trade.session or 'not specified'}. "
        f"Setup: {trade.setup or 'not specified'}. "
        f"Emotion: {trade.emotion or 'not specified'}. "
        f"Status: {trade.status}. "
        f"Result: {trade.result}. "
        f"Notes: {trade.notes or 'none'}."
    )


def build_recall_query(payload: MemoryRecallRequest) -> str:
    parts = [
        "Find similar trading journal memories",
        f"symbol: {payload.symbol}",
    ]

    if payload.direction:
        parts.append(f"direction: {payload.direction.value}")

    if payload.setup:
        parts.append(f"setup: {payload.setup}")

    if payload.session:
        parts.append(f"session: {payload.session}")

    if payload.notes:
        parts.append(f"context: {payload.notes}")

    return ". ".join(parts)


async def remember_trade(trade: Trade) -> bool:
    if not settings.cognee_enabled:
        print("[COGNEE_DISABLED] trade was saved to database only")
        return False

    try:
        import cognee

        await cognee.remember(
            trade_to_memory_text(trade),
            dataset_name=settings.cognee_dataset_name,
            self_improvement=False,
)

        return True

    except Exception as exc:
        print(f"[COGNEE_REMEMBER_ERROR] {exc}")
        return False


async def recall_similar_trades(payload: MemoryRecallRequest) -> list[str]:
    query = build_recall_query(payload)

    if not settings.cognee_enabled:
        print("[COGNEE_DISABLED] recall skipped")
        return []

    try:
        import cognee

        results = await cognee.recall(
            query,
            datasets=[settings.cognee_dataset_name],
)

        return [str(result) for result in results]

    except Exception as exc:
        print(f"[COGNEE_RECALL_ERROR] {exc}")
        return [f"Cognee recall failed: {exc}"]
