from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Trade
from app.schemas import (
    AICoachRequest,
    AICoachResponse,
    DemoSeedOut,
    InstrumentSpecOut,
    RiskPreviewOut,
    RiskPreviewRequest,
    TradeCreate,
    TradeOut,
    TradeUpdate,
)
from app.services.ai_coach_service import generate_memory_coach_review
from app.services.memory_service import remember_trade
from app.services.risk_service import (
    calculate_risk_reward,
    calculate_trade_risk_preview,
    list_instrument_specs,
)

router = APIRouter(prefix="/trades", tags=["trades"])

DEMO_TRADES = [
    {
        "symbol": "XAUUSD",
        "direction": "BUY",
        "entry_price": 2350.0,
        "stop_loss": 2345.0,
        "take_profit": 2365.0,
        "lot_size": 0.2,
        "risk_percent": 1.0,
        "session": "London",
        "setup": "Breakout retest",
        "emotion": "Calm",
        "notes": "Demo seed: waited for confirmation candle and followed the plan.",
        "status": "CLOSED",
        "result": "WIN",
    },
    {
        "symbol": "XAUUSD",
        "direction": "BUY",
        "entry_price": 2348.0,
        "stop_loss": 2344.0,
        "take_profit": 2360.0,
        "lot_size": 0.25,
        "risk_percent": 1.0,
        "session": "London",
        "setup": "Breakout retest",
        "emotion": "Fearful",
        "notes": "Demo seed: exited early after minor pullback and missed full target.",
        "status": "CLOSED",
        "result": "LOSS",
    },
    {
        "symbol": "XAUUSD",
        "direction": "SELL",
        "entry_price": 2368.0,
        "stop_loss": 2374.0,
        "take_profit": 2350.0,
        "lot_size": 0.18,
        "risk_percent": 1.0,
        "session": "New York",
        "setup": "Resistance rejection",
        "emotion": "Overconfident",
        "notes": "Demo seed: entered before candle close and ignored strong bullish momentum.",
        "status": "CLOSED",
        "result": "LOSS",
    },
    {
        "symbol": "USOIL",
        "direction": "BUY",
        "entry_price": 80.0,
        "stop_loss": 79.2,
        "take_profit": 82.4,
        "lot_size": 0.12,
        "risk_percent": 1.0,
        "session": "New York",
        "setup": "Pullback continuation",
        "emotion": "Patient",
        "notes": "Demo seed: waited for pullback into support and held until target.",
        "status": "CLOSED",
        "result": "WIN",
    },
    {
        "symbol": "EURUSD",
        "direction": "SELL",
        "entry_price": 1.084,
        "stop_loss": 1.087,
        "take_profit": 1.078,
        "lot_size": 0.3,
        "risk_percent": 0.75,
        "session": "London",
        "setup": "Trend continuation",
        "emotion": "Calm",
        "notes": "Demo seed: clean continuation setup but closed at breakeven before news.",
        "status": "CLOSED",
        "result": "BREAKEVEN",
    },
    {
        "symbol": "XAUUSD",
        "direction": "BUY",
        "entry_price": 2355.0,
        "stop_loss": 2350.0,
        "take_profit": 2370.0,
        "lot_size": 0.2,
        "risk_percent": 1.0,
        "session": "London",
        "setup": "Breakout retest",
        "emotion": "Calm",
        "notes": "Demo seed: planned trade idea for AI Coach recall testing.",
        "status": "PLANNED",
        "result": "PENDING",
    },
]


def to_trade_out(trade: Trade, memory_saved: bool = False) -> TradeOut:
    data = TradeOut.model_validate(trade)
    data.risk_reward_ratio = calculate_risk_reward(
        trade.entry_price,
        trade.stop_loss,
        trade.take_profit,
    )
    data.memory_saved = memory_saved
    return data


@router.post("", response_model=TradeOut, status_code=status.HTTP_201_CREATED)
async def create_trade(payload: TradeCreate, db: Session = Depends(get_db)):
    trade = Trade(**payload.model_dump(exclude_none=True))
    db.add(trade)
    db.commit()
    db.refresh(trade)

    memory_saved = await remember_trade(trade)

    return to_trade_out(trade, memory_saved=memory_saved)


@router.get("", response_model=list[TradeOut])
def list_trades(db: Session = Depends(get_db)):
    trades = db.query(Trade).order_by(Trade.created_at.desc()).all()
    return [to_trade_out(trade) for trade in trades]


@router.get("/instruments", response_model=list[InstrumentSpecOut])
def get_instruments():
    return list_instrument_specs()


@router.post("/demo-seed", response_model=DemoSeedOut, status_code=status.HTTP_201_CREATED)
async def seed_demo_trades(db: Session = Depends(get_db)):
    created_trades: list[TradeOut] = []
    memory_saved_count = 0

    for demo_trade in DEMO_TRADES:
        trade = Trade(**demo_trade)
        db.add(trade)
        db.commit()
        db.refresh(trade)

        memory_saved = await remember_trade(trade)

        if memory_saved:
            memory_saved_count += 1

        created_trades.append(to_trade_out(trade, memory_saved=memory_saved))

    return DemoSeedOut(
        created_count=len(created_trades),
        memory_saved_count=memory_saved_count,
        trades=created_trades,
    )


@router.post("/risk-preview", response_model=RiskPreviewOut)
def preview_trade_risk(payload: RiskPreviewRequest):
    return calculate_trade_risk_preview(
        symbol=payload.symbol,
        direction=payload.direction.value,
        entry_price=payload.entry_price,
        stop_loss=payload.stop_loss,
        take_profit=payload.take_profit,
        capital=payload.capital,
        risk_percent=payload.risk_percent,
    )


@router.post("/ai-coach", response_model=AICoachResponse)
async def create_ai_coach_review(payload: AICoachRequest):
    try:
        return await generate_memory_coach_review(payload)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI coach review failed: {error}",
        )


@router.get("/{trade_id}", response_model=TradeOut)
def get_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.get(Trade, trade_id)

    if trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")

    return to_trade_out(trade)


@router.patch("/{trade_id}", response_model=TradeOut)
async def update_trade(trade_id: int, payload: TradeUpdate, db: Session = Depends(get_db)):
    trade = db.get(Trade, trade_id)

    if trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")

    update_data = payload.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(trade, key, value)

    db.commit()
    db.refresh(trade)

    memory_saved = await remember_trade(trade)

    return to_trade_out(trade, memory_saved=memory_saved)


@router.delete("/{trade_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.get(Trade, trade_id)

    if trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")

    db.delete(trade)
    db.commit()

    return None
