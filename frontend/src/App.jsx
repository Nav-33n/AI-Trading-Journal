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

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value) {
  return `${formatNumber(value)}%`;
}

function formatRatio(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `1:${formatNumber(value)}`;
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

function App() {
  const [summary, setSummary] = useState(emptySummary);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [saveTrade, setSaveTrade] = useState(initialSaveTrade);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [savedTrade, setSavedTrade] = useState(null);
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

  useEffect(() => {
    loadDashboard();
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

  async function submitSaveTrade(event) {
    event.preventDefault();
    setSaveStatus("loading");
    setSaveError("");
    setSavedTrade(null);

    try {
      const response = await fetch(`${API_BASE_URL}/trades`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildTradePayload(saveTrade)),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const detail =
          errorBody?.detail || `Save trade failed with ${response.status}`;
        throw new Error(Array.isArray(detail) ? detail[0]?.msg : detail);
      }

      const data = await response.json();
      setSavedTrade(data);
      setSaveStatus("ready");
      await loadDashboard();
    } catch (requestError) {
      setSaveStatus("error");
      setSaveError(requestError.message);
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

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">AI Trading Journal</p>
          <h1>Performance Dashboard</h1>
        </div>
        <button type="button" onClick={loadDashboard}>
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
            <h2>Save Trade</h2>
            <p>Save a trade into the database and Cognee memory.</p>
          </div>
          <span>POST /trades</span>
        </div>

        <form className="coach-form" onSubmit={submitSaveTrade}>
          <div className="form-grid">
            <label>
              Symbol
              <input
                value={saveTrade.symbol}
                onChange={(event) =>
                  updateSaveTrade("symbol", event.target.value)
                }
              />
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

          <div className="form-actions">
            <button type="submit" disabled={saveStatus === "loading"}>
              {saveStatus === "loading" ? "Saving..." : "Save Trade"}
            </button>

            {saveStatus === "error" ? (
              <p className="inline-error">{saveError}</p>
            ) : null}

            {savedTrade ? (
              <p className="inline-success">
                Trade #{savedTrade.id} saved. Cognee memory saved:{" "}
                {savedTrade.memory_saved ? "yes" : "no"}.
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
                <input
                  value={coachTrade.symbol}
                  onChange={(event) =>
                    updateCoachTrade("symbol", event.target.value)
                  }
                />
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
                  <p>{coachResult.coach_review}</p>
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
          <h2>Recent Trades</h2>
          <span>Latest 5</span>
        </div>

        {summary.recent_trades.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Direction</th>
                  <th>Entry</th>
                  <th>SL</th>
                  <th>TP</th>
                  <th>RR</th>
                  <th>Session</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent_trades.map((trade) => (
                  <tr key={trade.id}>
                    <td>{trade.symbol}</td>
                    <td>{trade.direction}</td>
                    <td>{formatNumber(trade.entry_price)}</td>
                    <td>{formatNumber(trade.stop_loss)}</td>
                    <td>{formatNumber(trade.take_profit)}</td>
                    <td>{formatRatio(trade.risk_reward_ratio)}</td>
                    <td>{trade.session || "-"}</td>
                    <td>
                      <ResultPill value={trade.result} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-text">No recent trades yet.</p>
        )}
      </section>
    </main>
  );
}

export default App;
