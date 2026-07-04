from datetime import datetime

from pydantic import BaseModel, Field

from app.models import TradeDirection, TradeResult, TradeStatus


class TradeBase(BaseModel):
    symbol: str = Field(..., examples=["XAUUSD"])
    direction: TradeDirection
    entry_price: float
    stop_loss: float
    take_profit: float
    lot_size: float | None = None
    risk_percent: float | None = None
    session: str | None = Field(default=None, examples=["London"])
    setup: str | None = Field(default=None, examples=["Breakout retest"])
    emotion: str | None = Field(default=None, examples=["Calm"])
    notes: str | None = None
    status: TradeStatus = TradeStatus.PLANNED
    result: TradeResult = TradeResult.PENDING


class TradeCreate(TradeBase):
    pass


class TradeUpdate(BaseModel):
    symbol: str | None = None
    direction: TradeDirection | None = None
    entry_price: float | None = None
    stop_loss: float | None = None
    take_profit: float | None = None
    lot_size: float | None = None
    risk_percent: float | None = None
    session: str | None = None
    setup: str | None = None
    emotion: str | None = None
    notes: str | None = None
    status: TradeStatus | None = None
    result: TradeResult | None = None


class TradeOut(TradeBase):
    id: int
    created_at: datetime
    risk_reward_ratio: float | None = None
    memory_saved: bool = False

    model_config = {"from_attributes": True}


class MemoryRecallRequest(BaseModel):
    symbol: str
    direction: TradeDirection | None = None
    setup: str | None = None
    session: str | None = None
    notes: str | None = None


class MemoryRecallOut(BaseModel):
    query: str
    matches: list[str]


class MemoryStatusOut(BaseModel):
    cognee_enabled: bool
    dataset_name: str
    session_id: str


class MemoryForgetDatasetRequest(BaseModel):
    confirm_dataset_name: str = Field(
        ...,
        examples=["trading_journal_memory"],
    )


class MemoryActionOut(BaseModel):
    success: bool
    action: str
    dataset_name: str
    message: str
    raw_result: str | None = None


class AICoachRequest(BaseModel):
    trade: TradeCreate
    question: str | None = Field(
        default=None,
        examples=["Should I take this trade based on my past similar trades?"],
    )


class AICoachResponse(BaseModel):
    query: str
    recalled_memories: list[str]
    coach_review: str


class SymbolPerformanceOut(BaseModel):
    symbol: str
    total_trades: int
    wins: int
    losses: int
    win_rate: float


class DashboardSummaryOut(BaseModel):
    total_trades: int
    open_trades: int
    closed_trades: int
    planned_trades: int
    wins: int
    losses: int
    breakeven: int
    pending: int
    win_rate: float
    average_risk_reward: float | None
    symbol_performance: list[SymbolPerformanceOut]
    recent_trades: list[TradeOut]


class HealthOut(BaseModel):
    status: str
    app: str
