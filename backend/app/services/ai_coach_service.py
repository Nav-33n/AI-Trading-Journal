import json
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


def empty_structured_review() -> dict[str, str]:
    return {
        "memory_match": "",
        "risk_check": "",
        "setup_quality": "",
        "coaching_advice": "",
        "one_rule": "",
    }


def parse_structured_review(content: str) -> dict[str, str]:
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        review = empty_structured_review()
        review["coaching_advice"] = content
        review["one_rule"] = "Wait for a clean setup and follow your risk plan."
        return review

    review = empty_structured_review()

    for key in review:
        value = parsed.get(key, "")
        review[key] = str(value).strip()

    return review


def structured_review_to_text(review: dict[str, str]) -> str:
    return (
        f"1. Memory Match\n{review['memory_match']}\n\n"
        f"2. Risk Check\n{review['risk_check']}\n\n"
        f"3. Setup Quality\n{review['setup_quality']}\n\n"
        f"4. Coaching Advice\n{review['coaching_advice']}\n\n"
        f"5. One Rule To Follow\n{review['one_rule']}"
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
        "Return only valid JSON. Do not wrap it in markdown. Use this exact shape:\n"
        "{\n"
        '  "memory_match": "How this trade compares with recalled memories.",\n'
        '  "risk_check": "Risk/reward and invalidation feedback.",\n'
        '  "setup_quality": "Quality of setup, session, emotion, and execution.",\n'
        '  "coaching_advice": "Practical coaching advice for this trade.",\n'
        '  "one_rule": "One clear rule the trader should follow."\n'
        "}"
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

    content = response.choices[0].message.content or ""
    structured_review = parse_structured_review(content)

    return {
        "query": recall_query,
        "recalled_memories": recalled_memories,
        "coach_review": structured_review_to_text(structured_review),
        "structured_review": structured_review,
    }
