export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const MEMORY_DATASET_NAME = "trading_journal_memory";

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function getCurrentTradeDateTime() {
  const now = new Date();

  return {
    trade_date: [
      now.getFullYear(),
      padDatePart(now.getMonth() + 1),
      padDatePart(now.getDate()),
    ].join("-"),
    trade_time: [
      padDatePart(now.getHours()),
      padDatePart(now.getMinutes()),
    ].join(":"),
  };
}

export const emptySummary = {
  total_trades: 0,
  open_trades: 0,
  closed_trades: 0,
  planned_trades: 0,
  wins: 0,
  losses: 0,
  breakeven: 0,
  pending: 0,
  win_rate: 0,
  average_risk_reward: null,
  symbol_performance: [],
  recent_trades: [],
};

export const initialCoachTrade = {
  symbol: "XAUUSD",
  direction: "BUY",
  entry_price: "2350",
  stop_loss: "2345",
  take_profit: "2365",
  lot_size: "0.2",
  risk_percent: "1",
  session: "London",
  setup: "Breakout retest",
  emotion: "Calm",
  notes: "Entered after confirmation candle",
  status: "OPEN",
  result: "PENDING",
};

export const initialSaveTrade = {
  ...initialCoachTrade,
  ...getCurrentTradeDateTime(),
  notes: "Saved from frontend trade form",
};

export function createInitialSaveTrade() {
  return {
    ...initialCoachTrade,
    ...getCurrentTradeDateTime(),
    notes: "Saved from frontend trade form",
  };
}

export const fallbackInstruments = [
  {
    symbol: "XAUUSD",
    label: "Gold / US Dollar",
  },
  {
    symbol: "USOIL",
    label: "US Crude Oil",
  },
];

export const coachReviewSections = [
  ["memory_match", "Memory Match"],
  ["risk_check", "Risk Check"],
  ["setup_quality", "Setup Quality"],
  ["coaching_advice", "Coaching Advice"],
  ["one_rule", "One Rule"],
];

export const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "D",
    description: "Performance overview and demo setup",
  },
  {
    id: "add",
    label: "Add Trade",
    icon: "+",
    description: "Journal a trade and preview risk",
  },
  {
    id: "history",
    label: "Trade History",
    icon: "H",
    description: "Filter, view, edit, and delete trades",
  },
  {
    id: "coach",
    label: "AI Coach",
    icon: "A",
    description: "Ask for memory-aware trade feedback",
  },
  {
    id: "performance",
    label: "Performance",
    icon: "P",
    description: "Symbol and result analytics",
  },
  {
    id: "cognee",
    label: "Cognee Memory",
    icon: "C",
    description: "Recall, improve, and forget memory",
  },
];
