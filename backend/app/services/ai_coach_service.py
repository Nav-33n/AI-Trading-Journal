import os

from openai import OpenAI

from app.config import settings
from app.schemas import AICoachRequest, MemoryRecallRequest, TradeCreate
from app.services.memory_service import build_recall_query, recall_similar_trades


def get_ai_api_key() -> str:
    return settings.ai_api_key or os.getenv("GROQ_API_KEY", "")


def build_trade_context(trade: TradeCreate) -> str:
    return (
        f"Symbol: {trade.symbol}\n"
        f"Direction: {trade.direction.value}\n"
        f"Entry: {trade.entry_price}\n"
        f"Stop loss: {trade.stop_loss}\n"
        f"Take profit: {trade.take_profit}\n"
        f"Lot size: {trade.lot_size if trade.lot_size is not None else 'not provided'}\n"
        f"Risk percent: {trade.risk_percent if trade.risk_percent is not None else 'not provided'}\n"
        f"Session: {trade.session or 'not provided'}\n"
        f"Setup: {trade.setup or 'not provided'}\n"
        f"Emotion: {trade.emotion or 'not provided'}\n"
        f"Status: {trade.status.value}\n"
        f"Result: {trade.result.value}\n"
        f"Notes: {trade.notes or 'none'}"
    )


def build_memory_request(payload: AICoachRequest) -> MemoryRecallRequest:
    trade = payload.trade
    return MemoryRecallRequest(
        symbol=trade.symbol,
        direction=trade.direction,
        setup=trade.setup,
        session=trade.session,
        notes=payload.question or trade.notes,
    )


async def generate_memory_coach_review(payload: AICoachRequest) -> dict:
    memory_request = build_memory_request(payload)
    recall_query = build_recall_query(memory_request)
    recalled_memories = await recall_similar_trades(memory_request)

    api_key = get_ai_api_key()
    if not api_key:
        raise ValueError("AI API key is not configured.")

    client = OpenAI(
        api_key=api_key,
        base_url=settings.ai_base_url,
        timeout=settings.ai_timeout_seconds,
    )

    memories_text = "\n".join(
        f"- {memory}" for memory in recalled_memories
    ) or "- No similar memories found."

    question = payload.question or "Review this trade using my past similar trades."

    prompt = (
        "You are a trading journal coach. Use the current trade and recalled memory "
        "to give practical, concise feedback. Do not give financial guarantees.\n\n"
        f"Current trade:\n{build_trade_context(payload.trade)}\n\n"
        f"Recalled memory:\n{memories_text}\n\n"
        f"Trader question: {question}\n\n"
        "Return feedback with these headings:\n"
        "1. Memory Match\n"
        "2. Risk Check\n"
        "3. Setup Quality\n"
        "4. Coaching Advice\n"
        "5. One Rule To Follow"
    )

    response = client.chat.completions.create(
        model=settings.ai_model,
        messages=[
            {
                "role": "system",
                "content": "You are a strict but supportive trading journal tutor.",
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=settings.ai_max_output_tokens,
        temperature=0.3,
    )

    return {
        "query": recall_query,
        "recalled_memories": recalled_memories,
        "coach_review": response.choices[0].message.content or "",
    }