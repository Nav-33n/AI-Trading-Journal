import { StatCard } from "../components/StatCard";
import { formatNumber, formatRatio } from "../utils/formatters";

export function AddTradePage({
  editingTradeId,
  saveTrade,
  instruments,
  updateSaveTrade,
  submitSaveTrade,
  riskCapital,
  setRiskCapital,
  runRiskPreview,
  riskPreviewStatus,
  riskPreviewError,
  riskPreview,
  saveStatus,
  saveError,
  savedTrade,
  resetSaveForm,
}) {
  return (
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
            Trade Date
            <input
              type="date"
              value={saveTrade.trade_date}
              onChange={(event) =>
                updateSaveTrade("trade_date", event.target.value)
              }
            />
          </label>

          <label>
            Trade Time
            <input
              type="time"
              value={saveTrade.trade_time}
              onChange={(event) =>
                updateSaveTrade("trade_time", event.target.value)
              }
            />
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
              onChange={(event) => updateSaveTrade("setup", event.target.value)}
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
  );
}
