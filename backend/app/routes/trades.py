from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Trade
from app.schemas import TradeCreate, TradeOut, TradeUpdate
from app.services.memory_service import remember_trade
from app.services.risk_service import calculate_risk_reward
from app.schemas import AICoachRequest, AICoachResponse, TradeCreate, TradeOut, TradeUpdate
from app.services.ai_coach_service import generate_memory_coach_review
router = APIRouter(prefix="/trades", tags=["trades"])


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
    trade = Trade(**payload.model_dump())
    db.add(trade)
    db.commit()
    db.refresh(trade)

    memory_saved = await remember_trade(trade)

    return to_trade_out(trade, memory_saved=memory_saved)


@router.get("", response_model=list[TradeOut])
def list_trades(db: Session = Depends(get_db)):
    trades = db.query(Trade).order_by(Trade.created_at.desc()).all()
    return [to_trade_out(trade) for trade in trades]

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
