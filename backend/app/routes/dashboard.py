from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Trade, TradeResult, TradeStatus
from app.schemas import DashboardSummaryOut, SymbolPerformanceOut, TradeOut
from app.services.risk_service import calculate_risk_reward

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def to_trade_out(trade: Trade) -> TradeOut:
    data = TradeOut.model_validate(trade)
    data.risk_reward_ratio = calculate_risk_reward(
        trade.entry_price,
        trade.stop_loss,
        trade.take_profit,
    )
    return data


def calculate_win_rate(wins: int, losses: int, breakeven: int) -> float:
    decided_trades = wins + losses + breakeven

    if decided_trades == 0:
        return 0.0

    return round((wins / decided_trades) * 100, 2)


@router.get("/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(db: Session = Depends(get_db)):
    trades = db.query(Trade).order_by(Trade.created_at.desc()).all()

    wins = sum(1 for trade in trades if trade.result == TradeResult.WIN.value)
    losses = sum(1 for trade in trades if trade.result == TradeResult.LOSS.value)
    breakeven = sum(1 for trade in trades if trade.result == TradeResult.BREAKEVEN.value)
    pending = sum(1 for trade in trades if trade.result == TradeResult.PENDING.value)

    risk_reward_values = [
        risk_reward
        for trade in trades
        if (risk_reward := calculate_risk_reward(
            trade.entry_price,
            trade.stop_loss,
            trade.take_profit,
        ))
        is not None
    ]

    symbol_performance: list[SymbolPerformanceOut] = []
    symbols = sorted({trade.symbol for trade in trades})

    for symbol in symbols:
        symbol_trades = [trade for trade in trades if trade.symbol == symbol]
        symbol_wins = sum(
            1 for trade in symbol_trades if trade.result == TradeResult.WIN.value
        )
        symbol_losses = sum(
            1 for trade in symbol_trades if trade.result == TradeResult.LOSS.value
        )
        symbol_breakeven = sum(
            1 for trade in symbol_trades if trade.result == TradeResult.BREAKEVEN.value
        )

        symbol_performance.append(
            SymbolPerformanceOut(
                symbol=symbol,
                total_trades=len(symbol_trades),
                wins=symbol_wins,
                losses=symbol_losses,
                win_rate=calculate_win_rate(
                    symbol_wins,
                    symbol_losses,
                    symbol_breakeven,
                ),
            )
        )

    return DashboardSummaryOut(
        total_trades=len(trades),
        open_trades=sum(1 for trade in trades if trade.status == TradeStatus.OPEN.value),
        closed_trades=sum(
            1 for trade in trades if trade.status == TradeStatus.CLOSED.value
        ),
        planned_trades=sum(
            1 for trade in trades if trade.status == TradeStatus.PLANNED.value
        ),
        wins=wins,
        losses=losses,
        breakeven=breakeven,
        pending=pending,
        win_rate=calculate_win_rate(wins, losses, breakeven),
        average_risk_reward=round(sum(risk_reward_values) / len(risk_reward_values), 2)
        if risk_reward_values
        else None,
        symbol_performance=symbol_performance,
        recent_trades=[to_trade_out(trade) for trade in trades[:5]],
    )
