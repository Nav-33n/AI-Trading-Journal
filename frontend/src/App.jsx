import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const emptySummary = {
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

const initialCoachTrade = {
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

const initialSaveTrade = {
  ...initialCoachTrade,
  notes: "Saved from frontend trade form",
};

const MEMORY_DATASET_NAME = "trading_journal_memory";

const fallbackInstruments = [
  {
    symbol: "XAUUSD",
    label: "Gold / US Dollar",
  },
  {
    symbol: "USOIL",
    label: "US Crude Oil",
  },
];

const coachReviewSections = [
  ["memory_match", "Memory Match"],
  ["risk_check", "Risk Check"],
  ["setup_quality", "Setup Quality"],
  ["coaching_advice", "Coaching Advice"],
  ["one_rule", "One Rule"],
];

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${formatNumber(value)}%`;
}

function formatRatio(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `1:${formatNumber(value)}`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatCard({ label, value, detail }) {
  return (
    <section className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      {detail ? <span>{detail}</span> : null}
    </section>
  );
}

function ResultPill({ value }) {
  const className = `result-pill result-${String(value).toLowerCase()}`;

  return <span className={className}>{value}</span>;
}

function numberOrNull(value) {
  if (value === "") {
    return null;
  }

  return Number(value);
}

function buildTradePayload(trade) {
  return {
    ...trade,
    entry_price: Number(trade.entry_price),
    stop_loss: Number(trade.stop_loss),
    take_profit: Number(trade.take_profit),
    lot_size: numberOrNull(trade.lot_size),
    risk_percent: numberOrNull(trade.risk_percent),
  };
}

function tradeToFormState(trade) {
  return {
    symbol: trade.symbol || "XAUUSD",
    direction: trade.direction || "BUY",
    entry_price: String(trade.entry_price ?? ""),
    stop_loss: String(trade.stop_loss ?? ""),
    take_profit: String(trade.take_profit ?? ""),
    lot_size: String(trade.lot_size ?? ""),
    risk_percent: String(trade.risk_percent ?? ""),
    session: trade.session || "",
    setup: trade.setup || "",
    emotion: trade.emotion || "",
    notes: trade.notes || "",
    status: trade.status || "PLANNED",
    result: trade.result || "PENDING",
  };
}

function App() {
  const [summary, setSummary] = useState(emptySummary);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [saveTrade, setSaveTrade] = useState(initialSaveTrade);
  const [editingTradeId, setEditingTradeId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [savedTrade, setSavedTrade] = useState(null);
  const [allTrades, setAllTrades] = useState([]);
  const [tradeHistoryStatus, setTradeHistoryStatus] = useState("idle");
  const [tradeFilters, setTradeFilters] = useState({
    symbol: "ALL",
    status: "ALL",
    result: "ALL",
  });
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [tradeActionStatus, setTradeActionStatus] = useState("idle");
  const [tradeActionError, setTradeActionError] = useState("");
  const [riskCapital, setRiskCapital] = useState("10000");
  const [riskPreviewStatus, setRiskPreviewStatus] = useState("idle");
  const [riskPreviewError, setRiskPreviewError] = useState("");
  const [riskPreview, setRiskPreview] = useState(null);
  const [instruments, setInstruments] = useState(fallbackInstruments);
  const [memoryActionStatus, setMemoryActionStatus] = useState("idle");
  const [memoryActionError, setMemoryActionError] = useState("");
  const [memoryActionResult, setMemoryActionResult] = useState(null);
  const [forgetConfirmation, setForgetConfirmation] = useState("");
  const [coachTrade, setCoachTrade] = useState(initialCoachTrade);
  const [coachQuestion, setCoachQuestion] = useState(
    "Should I take this trade based on my past similar trades?",
  );
  const [coachStatus, setCoachStatus] = useState("idle");
  const [coachError, setCoachError] = useState("");
  const [coachResult, setCoachResult] = useState(null);

  async function loadDashboard() {
    setStatus("loading");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/summary`);

      if (!response.ok) {
        throw new Error(`Dashboard request failed with ${response.status}`);
      }

      const data = await response.json();
      setSummary({ ...emptySummary, ...data });
      setStatus("ready");
    } catch (requestError) {
      setStatus("error");
      setError(requestError.message);
    }
  }

  async function loadInstruments() {
    try {
      const response = await fetch(`${API_BASE_URL}/trades/instruments`);

      if (!response.ok) {
        throw new Error(`Instrument request failed with ${response.status}`);
      }

      const data = await response.json();
      setInstruments(data.length ? data : fallbackInstruments);
    } catch {
      setInstruments(fallbackInstruments);
    }
  }

  async function loadTradeHistory() {
    setTradeHistoryStatus("loading");

    try {
      const response = await fetch(`${API_BASE_URL}/trades`);

      if (!response.ok) {
        throw new Error(`Trade history request failed with ${response.status}`);
      }

      const data = await response.json();
      setAllTrades(data);
      setTradeHistoryStatus("ready");
    } catch (requestError) {
      setTradeHistoryStatus("error");
      setTradeActionError(requestError.message);
    }
  }

  async function refreshTradingData() {
    await Promise.all([loadDashboard(), loadTradeHistory()]);
  }

  useEffect(() => {
    refreshTradingData();
    loadInstruments();
  }, []);

  function updateCoachTrade(field, value) {
    setCoachTrade((currentTrade) => ({
      ...currentTrade,
      [field]: value,
    }));
  }

  function updateSaveTrade(field, value) {
    setSaveTrade((currentTrade) => ({
      ...currentTrade,
      [field]: value,
    }));
  }

  function updateTradeFilter(field, value) {
    setTradeFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  }

  function resetSaveForm() {
    setEditingTradeId(null);
    setSaveTrade(initialSaveTrade);
    setSaveStatus("idle");
    setSaveError("");
    setSavedTrade(null);
    setRiskPreview(null);
    setRiskPreviewStatus("idle");
    setRiskPreviewError("");
  }

  async function submitSaveTrade(event) {
    event.preventDefault();
    setSaveStatus("loading");
    setSaveError("");
    setSavedTrade(null);

    try {
      const isEditing = editingTradeId !== null;
      const response = await fetch(
        `${API_BASE_URL}/trades${isEditing ? `/${editingTradeId}` : ""}`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildTradePayload(saveTrade)),
        },
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const detail =
          errorBody?.detail || `Trade save failed with ${response.status}`;
        throw new Error(Array.isArray(detail) ? detail[0]?.msg : detail);
      }

      const data = await response.json();
      setSavedTrade(data);
      setSaveStatus("ready");
      setSelectedTrade(data);
      await refreshTradingData();
    } catch (requestError) {
      setSaveStatus("error");
      setSaveError(requestError.message);
    }
  }

  async function fetchTradeById(tradeId) {
    const response = await fetch(`${API_BASE_URL}/trades/${tradeId}`);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(
        errorBody?.detail || `Get trade failed with ${response.status}`,
      );
    }

    return response.json();
  }

  async function viewTrade(tradeId) {
    setTradeActionStatus("loading");
    setTradeActionError("");

    try {
      const data = await fetchTradeById(tradeId);
      setSelectedTrade(data);
      setTradeActionStatus("ready");
    } catch (requestError) {
      setTradeActionStatus("error");
      setTradeActionError(requestError.message);
    }
  }

  async function startEditTrade(tradeId) {
    setTradeActionStatus("loading");
    setTradeActionError("");

    try {
      const data = await fetchTradeById(tradeId);
      setSelectedTrade(data);
      setEditingTradeId(tradeId);
      setSaveTrade(tradeToFormState(data));
      setSavedTrade(null);
      setSaveError("");
      setSaveStatus("idle");
      setTradeActionStatus("ready");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setTradeActionStatus("error");
      setTradeActionError(requestError.message);
    }
  }

  async function deleteTrade(tradeId) {
    const shouldDelete = window.confirm(
      `Delete trade #${tradeId}? This removes it from SQLite.`,
    );

    if (!shouldDelete) {
      return;
    }

    setTradeActionStatus("loading");
    setTradeActionError("");

    try {
      const response = await fetch(`${API_BASE_URL}/trades/${tradeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.detail || `Delete trade failed with ${response.status}`,
        );
      }

      if (selectedTrade?.id === tradeId) {
        setSelectedTrade(null);
      }

      if (editingTradeId === tradeId) {
        resetSaveForm();
      }

      setTradeActionStatus("ready");
      await refreshTradingData();
    } catch (requestError) {
      setTradeActionStatus("error");
      setTradeActionError(requestError.message);
    }
  }

  async function runRiskPreview() {
    setRiskPreviewStatus("loading");
    setRiskPreviewError("");
    setRiskPreview(null);

    try {
      const response = await fetch(`${API_BASE_URL}/trades/risk-preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: saveTrade.symbol,
          direction: saveTrade.direction,
          entry_price: Number(saveTrade.entry_price),
          stop_loss: Number(saveTrade.stop_loss),
          take_profit: Number(saveTrade.take_profit),
          capital: Number(riskCapital),
          risk_percent: Number(saveTrade.risk_percent),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const detail =
          errorBody?.detail || `Risk preview failed with ${response.status}`;
        throw new Error(Array.isArray(detail) ? detail[0]?.msg : detail);
      }

      const data = await response.json();
      setRiskPreview(data);
      setRiskPreviewStatus("ready");
    } catch (requestError) {
      setRiskPreviewStatus("error");
      setRiskPreviewError(requestError.message);
    }
  }

  async function runMemoryImprove() {
    setMemoryActionStatus("loading");
    setMemoryActionError("");
    setMemoryActionResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/memory/improve`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.detail || `Improve failed with ${response.status}`,
        );
      }

      const data = await response.json();
      setMemoryActionResult(data);
      setMemoryActionStatus("ready");
    } catch (requestError) {
      setMemoryActionStatus("error");
      setMemoryActionError(requestError.message);
    }
  }

  async function runMemoryForget() {
    setMemoryActionStatus("loading");
    setMemoryActionError("");
    setMemoryActionResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/memory/forget`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirm_dataset_name: forgetConfirmation,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.detail || `Forget failed with ${response.status}`,
        );
      }

      const data = await response.json();
      setMemoryActionResult(data);
      setMemoryActionStatus("ready");
    } catch (requestError) {
      setMemoryActionStatus("error");
      setMemoryActionError(requestError.message);
    }
  }

  async function submitCoachReview(event) {
    event.preventDefault();
    setCoachStatus("loading");
    setCoachError("");
    setCoachResult(null);

    const payload = {
      trade: buildTradePayload(coachTrade),
      question: coachQuestion,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/trades/ai-coach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const detail =
          errorBody?.detail ||
          `AI coach request failed with ${response.status}`;
        throw new Error(Array.isArray(detail) ? detail[0]?.msg : detail);
      }

      const data = await response.json();
      setCoachResult(data);
      setCoachStatus("ready");
    } catch (requestError) {
      setCoachStatus("error");
      setCoachError(requestError.message);
    }
  }

  const bestSymbol = useMemo(() => {
    if (!summary.symbol_performance.length) {
      return null;
    }

    return [...summary.symbol_performance].sort(
      (first, second) => second.win_rate - first.win_rate,
    )[0];
  }, [summary.symbol_performance]);

  const historySymbols = useMemo(
    () => [...new Set(allTrades.map((trade) => trade.symbol))].sort(),
    [allTrades],
  );

  const filteredTrades = useMemo(
    () =>
      allTrades.filter((trade) => {
        const symbolMatches =
          tradeFilters.symbol === "ALL" || trade.symbol === tradeFilters.symbol;
        const statusMatches =
          tradeFilters.status === "ALL" || trade.status === tradeFilters.status;
        const resultMatches =
          tradeFilters.result === "ALL" || trade.result === tradeFilters.result;

        return symbolMatches && statusMatches && resultMatches;
      }),
    [allTrades, tradeFilters],
  );

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">AI Trading Journal</p>
          <h1>Performance Dashboard</h1>
        </div>
        <button type="button" onClick={refreshTradingData}>
          Refresh
        </button>
      </header>

      {status === "error" ? (
        <section className="notice error">
          <strong>Backend not reachable</strong>
          <p>{error}</p>
          <p>Make sure FastAPI is running on {API_BASE_URL}.</p>
        </section>
      ) : null}

      {status === "loading" ? (
        <section className="notice">
          <strong>Loading dashboard...</strong>
          <p>Fetching trade stats from your backend.</p>
        </section>
      ) : null}

      <section className="stats-grid" aria-label="Trading performance summary">
        <StatCard
          label="Total Trades"
          value={summary.total_trades}
          detail={`${summary.open_trades} open, ${summary.closed_trades} closed`}
        />
        <StatCard
          label="Win Rate"
          value={formatPercent(summary.win_rate)}
          detail={`${summary.wins} wins, ${summary.losses} losses`}
        />
        <StatCard
          label="Average RR"
          value={formatRatio(summary.average_risk_reward)}
          detail="Across saved trades"
        />
        <StatCard
          label="Best Symbol"
          value={bestSymbol?.symbol || "-"}
          detail={
            bestSymbol
              ? `${formatPercent(bestSymbol.win_rate)} win rate`
              : "No trades yet"
          }
        />
      </section>

      <section className="panel trade-save-panel">
        <div className="panel-heading">
          <div>
            <h2>
              {editingTradeId ? `Edit Trade #${editingTradeId}` : "Save Trade"}
            </h2>
            <p>
              {editingTradeId
                ? "Update this trade and refresh its Cognee memory."
                : "Save a trade into the database and Cognee memory."}
            </p>
          </div>
          <span>{editingTradeId ? "PATCH /trades/{id}" : "POST /trades"}</span>
        </div>

        <form className="coach-form" onSubmit={submitSaveTrade}>
          <div className="form-grid">
            <label>
              Symbol
              <select
                value={saveTrade.symbol}
                onChange={(event) =>
                  updateSaveTrade("symbol", event.target.value)
                }
              >
                {instruments.map((instrument) => (
                  <option key={instrument.symbol} value={instrument.symbol}>
                    {instrument.symbol} - {instrument.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Direction
              <select
                value={saveTrade.direction}
                onChange={(event) =>
                  updateSaveTrade("direction", event.target.value)
                }
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </label>

            <label>
              Entry
              <input
                type="number"
                value={saveTrade.entry_price}
                onChange={(event) =>
                  updateSaveTrade("entry_price", event.target.value)
                }
              />
            </label>

            <label>
              Stop Loss
              <input
                type="number"
                value={saveTrade.stop_loss}
                onChange={(event) =>
                  updateSaveTrade("stop_loss", event.target.value)
                }
              />
            </label>

            <label>
              Take Profit
              <input
                type="number"
                value={saveTrade.take_profit}
                onChange={(event) =>
                  updateSaveTrade("take_profit", event.target.value)
                }
              />
            </label>

            <label>
              Lot Size
              <input
                type="number"
                value={saveTrade.lot_size}
                onChange={(event) =>
                  updateSaveTrade("lot_size", event.target.value)
                }
              />
            </label>

            <label>
              Risk %
              <input
                type="number"
                value={saveTrade.risk_percent}
                onChange={(event) =>
                  updateSaveTrade("risk_percent", event.target.value)
                }
              />
            </label>

            <label>
              Session
              <input
                value={saveTrade.session}
                onChange={(event) =>
                  updateSaveTrade("session", event.target.value)
                }
              />
            </label>

            <label>
              Setup
              <input
                value={saveTrade.setup}
                onChange={(event) =>
                  updateSaveTrade("setup", event.target.value)
                }
              />
            </label>

            <label>
              Emotion
              <input
                value={saveTrade.emotion}
                onChange={(event) =>
                  updateSaveTrade("emotion", event.target.value)
                }
              />
            </label>

            <label>
              Status
              <select
                value={saveTrade.status}
                onChange={(event) =>
                  updateSaveTrade("status", event.target.value)
                }
              >
                <option value="PLANNED">PLANNED</option>
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </label>

            <label>
              Result
              <select
                value={saveTrade.result}
                onChange={(event) =>
                  updateSaveTrade("result", event.target.value)
                }
              >
                <option value="PENDING">PENDING</option>
                <option value="WIN">WIN</option>
                <option value="LOSS">LOSS</option>
                <option value="BREAKEVEN">BREAKEVEN</option>
              </select>
            </label>
          </div>

          <label>
            Notes
            <textarea
              rows="3"
              value={saveTrade.notes}
              onChange={(event) => updateSaveTrade("notes", event.target.value)}
            />
          </label>

          <div className="risk-preview-panel">
            <div className="risk-preview-controls">
              <label>
                Account Capital
                <input
                  type="number"
                  value={riskCapital}
                  onChange={(event) => setRiskCapital(event.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={runRiskPreview}
                disabled={riskPreviewStatus === "loading"}
              >
                {riskPreviewStatus === "loading"
                  ? "Calculating..."
                  : "Preview Risk"}
              </button>
            </div>

            {riskPreviewStatus === "error" ? (
              <p className="inline-error">{riskPreviewError}</p>
            ) : null}

            {riskPreview ? (
              <div className="risk-preview-grid">
                <StatCard
                  label="Risk Amount"
                  value={`$${formatNumber(riskPreview.risk_amount)}`}
                />
                <StatCard
                  label="Suggested Lot"
                  value={formatNumber(riskPreview.suggested_lot_size)}
                  detail={`${riskPreview.symbol} | contract ${formatNumber(riskPreview.contract_size)}`}
                />
                <StatCard
                  label="Risk Per Lot"
                  value={`$${formatNumber(riskPreview.risk_per_lot)}`}
                />
                <StatCard
                  label="RR Ratio"
                  value={formatRatio(riskPreview.risk_reward_ratio)}
                />
              </div>
            ) : null}

            {riskPreview?.warnings?.length ? (
              <ul className="risk-warning-list">
                {riskPreview.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saveStatus === "loading"}>
              {saveStatus === "loading"
                ? "Saving..."
                : editingTradeId
                  ? "Update Trade"
                  : "Save Trade"}
            </button>

            {editingTradeId ? (
              <button
                type="button"
                className="secondary-button"
                onClick={resetSaveForm}
              >
                Cancel Edit
              </button>
            ) : null}

            {saveStatus === "error" ? (
              <p className="inline-error">{saveError}</p>
            ) : null}

            {savedTrade ? (
              <p className="inline-success">
                Trade #{savedTrade.id} {editingTradeId ? "updated" : "saved"}.
                Cognee memory saved: {savedTrade.memory_saved ? "yes" : "no"}.
              </p>
            ) : null}
          </div>
        </form>
      </section>

      <section className="panel memory-controls-panel">
        <div className="panel-heading">
          <div>
            <h2>Memory Controls</h2>
            <p>
              Run Cognee improve or reset the memory dataset for clean testing.
            </p>
          </div>
          <span>POST /memory/improve | POST /memory/forget</span>
        </div>

        <div className="memory-controls-grid">
          <div className="memory-action-card">
            <strong>Improve / Memify</strong>
            <p>
              Enrich the current Cognee dataset so future recall can retrieve
              better trading context.
            </p>
            <button
              type="button"
              onClick={runMemoryImprove}
              disabled={memoryActionStatus === "loading"}
            >
              {memoryActionStatus === "loading"
                ? "Running..."
                : "Improve Memory"}
            </button>
          </div>

          <div className="memory-action-card danger-card">
            <strong>Forget Dataset</strong>
            <p>
              Deletes Cognee memory dataset only. Your SQLite trades remain
              saved.
            </p>
            <label>
              Type {MEMORY_DATASET_NAME} to confirm
              <input
                value={forgetConfirmation}
                onChange={(event) => setForgetConfirmation(event.target.value)}
                placeholder={MEMORY_DATASET_NAME}
              />
            </label>
            <button
              type="button"
              className="danger-button"
              onClick={runMemoryForget}
              disabled={
                memoryActionStatus === "loading" ||
                forgetConfirmation !== MEMORY_DATASET_NAME
              }
            >
              Forget Memory Dataset
            </button>
          </div>
        </div>

        {memoryActionStatus === "error" ? (
          <p className="inline-error memory-action-message">
            {memoryActionError}
          </p>
        ) : null}

        {memoryActionResult ? (
          <div className="memory-action-result">
            <strong>
              {memoryActionResult.action} | {memoryActionResult.dataset_name}
            </strong>
            <p>{memoryActionResult.message}</p>
            {memoryActionResult.raw_result ? (
              <code>{memoryActionResult.raw_result}</code>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="panel coach-panel">
        <div className="panel-heading">
          <div>
            <h2>Memory AI Coach</h2>
            <p>Review a planned trade using Cognee recall and your AI model.</p>
          </div>
          <span>POST /trades/ai-coach</span>
        </div>

        <div className="coach-grid">
          <form className="coach-form" onSubmit={submitCoachReview}>
            <div className="form-grid">
              <label>
                Symbol
                <select
                  value={coachTrade.symbol}
                  onChange={(event) =>
                    updateCoachTrade("symbol", event.target.value)
                  }
                >
                  {instruments.map((instrument) => (
                    <option key={instrument.symbol} value={instrument.symbol}>
                      {instrument.symbol} - {instrument.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Direction
                <select
                  value={coachTrade.direction}
                  onChange={(event) =>
                    updateCoachTrade("direction", event.target.value)
                  }
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </label>

              <label>
                Entry
                <input
                  type="number"
                  value={coachTrade.entry_price}
                  onChange={(event) =>
                    updateCoachTrade("entry_price", event.target.value)
                  }
                />
              </label>

              <label>
                Stop Loss
                <input
                  type="number"
                  value={coachTrade.stop_loss}
                  onChange={(event) =>
                    updateCoachTrade("stop_loss", event.target.value)
                  }
                />
              </label>

              <label>
                Take Profit
                <input
                  type="number"
                  value={coachTrade.take_profit}
                  onChange={(event) =>
                    updateCoachTrade("take_profit", event.target.value)
                  }
                />
              </label>

              <label>
                Lot Size
                <input
                  type="number"
                  value={coachTrade.lot_size}
                  onChange={(event) =>
                    updateCoachTrade("lot_size", event.target.value)
                  }
                />
              </label>

              <label>
                Risk %
                <input
                  type="number"
                  value={coachTrade.risk_percent}
                  onChange={(event) =>
                    updateCoachTrade("risk_percent", event.target.value)
                  }
                />
              </label>

              <label>
                Session
                <input
                  value={coachTrade.session}
                  onChange={(event) =>
                    updateCoachTrade("session", event.target.value)
                  }
                />
              </label>

              <label>
                Setup
                <input
                  value={coachTrade.setup}
                  onChange={(event) =>
                    updateCoachTrade("setup", event.target.value)
                  }
                />
              </label>

              <label>
                Emotion
                <input
                  value={coachTrade.emotion}
                  onChange={(event) =>
                    updateCoachTrade("emotion", event.target.value)
                  }
                />
              </label>

              <label>
                Status
                <select
                  value={coachTrade.status}
                  onChange={(event) =>
                    updateCoachTrade("status", event.target.value)
                  }
                >
                  <option value="PLANNED">PLANNED</option>
                  <option value="OPEN">OPEN</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </label>

              <label>
                Result
                <select
                  value={coachTrade.result}
                  onChange={(event) =>
                    updateCoachTrade("result", event.target.value)
                  }
                >
                  <option value="PENDING">PENDING</option>
                  <option value="WIN">WIN</option>
                  <option value="LOSS">LOSS</option>
                  <option value="BREAKEVEN">BREAKEVEN</option>
                </select>
              </label>
            </div>

            <label>
              Notes
              <textarea
                rows="3"
                value={coachTrade.notes}
                onChange={(event) =>
                  updateCoachTrade("notes", event.target.value)
                }
              />
            </label>

            <label>
              Question for coach
              <textarea
                rows="3"
                value={coachQuestion}
                onChange={(event) => setCoachQuestion(event.target.value)}
              />
            </label>

            <button type="submit" disabled={coachStatus === "loading"}>
              {coachStatus === "loading" ? "Reviewing..." : "Ask AI Coach"}
            </button>
          </form>

          <div className="coach-result">
            {coachStatus === "idle" ? (
              <p className="empty-text">
                Submit the sample trade to see recalled Cognee memories and AI
                feedback.
              </p>
            ) : null}

            {coachStatus === "error" ? (
              <section className="notice error">
                <strong>AI coach failed</strong>
                <p>{coachError}</p>
              </section>
            ) : null}

            {coachResult ? (
              <>
                <div className="coach-query">
                  <strong>Recall query</strong>
                  <p>{coachResult.query}</p>
                </div>

                <div className="memory-list">
                  <strong>Recalled memories</strong>
                  {coachResult.recalled_memories.length ? (
                    <ul>
                      {coachResult.recalled_memories.map((memory, index) => (
                        <li key={`${memory}-${index}`}>{memory}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No similar memories found.</p>
                  )}
                </div>

                <div className="coach-review">
                  <strong>Coach review</strong>
                  {coachResult.structured_review ? (
                    <div className="coach-review-grid">
                      {coachReviewSections.map(([key, label]) => (
                        <article className="coach-review-card" key={key}>
                          <span>{label}</span>
                          <p>{coachResult.structured_review[key] || "-"}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p>{coachResult.coach_review}</p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Symbol Performance</h2>
            <span>{summary.symbol_performance.length} symbols</span>
          </div>

          {summary.symbol_performance.length ? (
            <div className="symbol-list">
              {summary.symbol_performance.map((symbol) => (
                <article className="symbol-row" key={symbol.symbol}>
                  <div>
                    <strong>{symbol.symbol}</strong>
                    <p>
                      {symbol.total_trades} trades | {symbol.wins} wins |{" "}
                      {symbol.losses} losses
                    </p>
                  </div>
                  <div className="win-rate">
                    <span>{formatPercent(symbol.win_rate)}</span>
                    <div className="bar">
                      <div
                        style={{ width: `${Math.min(symbol.win_rate, 100)}%` }}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-text">
              No symbol data yet. Add a trade from the API first.
            </p>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Result Breakdown</h2>
            <span>{summary.pending} pending</span>
          </div>

          <div className="breakdown-grid">
            <StatCard label="Wins" value={summary.wins} />
            <StatCard label="Losses" value={summary.losses} />
            <StatCard label="Breakeven" value={summary.breakeven} />
            <StatCard label="Planned" value={summary.planned_trades} />
          </div>
        </section>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Trade History</h2>
            <p>Review, filter, edit, and delete every saved trade.</p>
          </div>
          <span>
            {filteredTrades.length} of {allTrades.length} trades | GET / PATCH /
            DELETE
          </span>
        </div>

        <div className="history-controls">
          <label>
            Symbol
            <select
              value={tradeFilters.symbol}
              onChange={(event) =>
                updateTradeFilter("symbol", event.target.value)
              }
            >
              <option value="ALL">All symbols</option>
              {historySymbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select
              value={tradeFilters.status}
              onChange={(event) =>
                updateTradeFilter("status", event.target.value)
              }
            >
              <option value="ALL">All statuses</option>
              <option value="PLANNED">PLANNED</option>
              <option value="OPEN">OPEN</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </label>

          <label>
            Result
            <select
              value={tradeFilters.result}
              onChange={(event) =>
                updateTradeFilter("result", event.target.value)
              }
            >
              <option value="ALL">All results</option>
              <option value="PENDING">PENDING</option>
              <option value="WIN">WIN</option>
              <option value="LOSS">LOSS</option>
              <option value="BREAKEVEN">BREAKEVEN</option>
            </select>
          </label>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              setTradeFilters({ symbol: "ALL", status: "ALL", result: "ALL" })
            }
          >
            Clear Filters
          </button>
        </div>

        {tradeActionStatus === "error" || tradeHistoryStatus === "error" ? (
          <p className="inline-error trade-action-message">
            {tradeActionError}
          </p>
        ) : null}

        {tradeHistoryStatus === "loading" ? (
          <p className="empty-text">Loading trade history...</p>
        ) : null}

        {filteredTrades.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Symbol</th>
                  <th>Direction</th>
                  <th>Entry</th>
                  <th>SL</th>
                  <th>TP</th>
                  <th>RR</th>
                  <th>Session</th>
                  <th>Setup</th>
                  <th>Status</th>
                  <th>Result</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => (
                  <tr key={trade.id}>
                    <td>{formatDateTime(trade.created_at)}</td>
                    <td>{trade.symbol}</td>
                    <td>{trade.direction}</td>
                    <td>{formatNumber(trade.entry_price)}</td>
                    <td>{formatNumber(trade.stop_loss)}</td>
                    <td>{formatNumber(trade.take_profit)}</td>
                    <td>{formatRatio(trade.risk_reward_ratio)}</td>
                    <td>{trade.session || "-"}</td>
                    <td>{trade.setup || "-"}</td>
                    <td>{trade.status}</td>
                    <td>
                      <ResultPill value={trade.result} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="small-button secondary-button"
                          onClick={() => viewTrade(trade.id)}
                          disabled={tradeActionStatus === "loading"}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="small-button secondary-button"
                          onClick={() => startEditTrade(trade.id)}
                          disabled={tradeActionStatus === "loading"}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="small-button danger-button"
                          onClick={() => deleteTrade(trade.id)}
                          disabled={tradeActionStatus === "loading"}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-text">
            {allTrades.length
              ? "No trades match the selected filters."
              : "No trades saved yet."}
          </p>
        )}

        {selectedTrade ? (
          <section className="trade-detail-panel">
            <div className="panel-heading">
              <div>
                <h2>Trade #{selectedTrade.id} Details</h2>
                <p>
                  {selectedTrade.symbol} {selectedTrade.direction} |{" "}
                  {selectedTrade.session || "No session"} |{" "}
                  {selectedTrade.setup || "No setup"}
                </p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedTrade(null)}
              >
                Close
              </button>
            </div>

            <div className="trade-detail-grid">
              <StatCard
                label="Entry"
                value={formatNumber(selectedTrade.entry_price)}
              />
              <StatCard
                label="Stop Loss"
                value={formatNumber(selectedTrade.stop_loss)}
              />
              <StatCard
                label="Take Profit"
                value={formatNumber(selectedTrade.take_profit)}
              />
              <StatCard
                label="RR Ratio"
                value={formatRatio(selectedTrade.risk_reward_ratio)}
              />
              <StatCard
                label="Lot Size"
                value={formatNumber(selectedTrade.lot_size)}
              />
              <StatCard
                label="Risk %"
                value={formatPercent(selectedTrade.risk_percent)}
              />
              <StatCard label="Status" value={selectedTrade.status} />
              <StatCard label="Result" value={selectedTrade.result} />
            </div>

            <div className="trade-detail-notes">
              <strong>Emotion</strong>
              <p>{selectedTrade.emotion || "-"}</p>
              <strong>Notes</strong>
              <p>{selectedTrade.notes || "-"}</p>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

export default App;
