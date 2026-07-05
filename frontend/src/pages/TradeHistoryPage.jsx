import { ResultPill } from "../components/ResultPill";
import { formatDateTime, formatNumber, formatRatio } from "../utils/formatters";

export function TradeHistoryPage({
  filteredTrades,
  allTrades,
  tradeFilters,
  updateTradeFilter,
  historySymbols,
  clearTradeFilters,
  tradeActionStatus,
  tradeActionError,
  tradeHistoryStatus,
  viewTrade,
  startEditTrade,
  deleteTrade,
}) {
  return (
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
          onClick={clearTradeFilters}
        >
          Clear Filters
        </button>
      </div>

      {tradeActionStatus === "error" || tradeHistoryStatus === "error" ? (
        <p className="inline-error trade-action-message">{tradeActionError}</p>
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
    </section>
  );
}
