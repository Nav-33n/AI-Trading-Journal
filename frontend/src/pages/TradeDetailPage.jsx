import { ResultPill } from "../components/ResultPill";
import { StatCard } from "../components/StatCard";
import {
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRatio,
} from "../utils/formatters";

function DetailItem({ label, value }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </article>
  );
}

export function TradeDetailPage({
  selectedTrade,
  tradeActionStatus,
  tradeActionError,
  onBack,
  onEdit,
  onDelete,
  onAskCoach,
}) {
  if (tradeActionStatus === "loading") {
    return (
      <section className="panel trade-detail-page">
        <p className="empty-text">Loading trade details...</p>
      </section>
    );
  }

  if (!selectedTrade) {
    return (
      <section className="panel trade-detail-page empty-detail-page">
        <div>
          <h2>No trade selected</h2>
          <p>
            Open Trade History and choose a saved trade to view its full journal
            details.
          </p>
        </div>
        <button type="button" onClick={onBack}>
          Open Trade History
        </button>
      </section>
    );
  }

  return (
    <>
      {tradeActionStatus === "error" ? (
        <p className="inline-error trade-action-message">{tradeActionError}</p>
      ) : null}

      <section className="panel trade-detail-hero">
        <div className="trade-detail-title">
          <button
            type="button"
            className="secondary-button small-button"
            onClick={onBack}
          >
            Back
          </button>
          <div>
            <p className="eyebrow">Trade #{selectedTrade.id}</p>
            <h2>
              {selectedTrade.symbol} {selectedTrade.direction}
            </h2>
            <p>
              {formatDateTime(selectedTrade.created_at)} |{" "}
              {selectedTrade.session || "No session"} |{" "}
              {selectedTrade.setup || "No setup"}
            </p>
          </div>
        </div>

        <div className="trade-detail-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onAskCoach(selectedTrade)}
          >
            Ask AI Coach
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onEdit(selectedTrade.id)}
          >
            Edit Trade
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={() => onDelete(selectedTrade.id)}
          >
            Delete
          </button>
        </div>
      </section>

      <section className="trade-detail-layout">
        <div className="trade-detail-main">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Price Plan</h2>
                <p>Entry, invalidation, target, and risk/reward.</p>
              </div>
              <ResultPill value={selectedTrade.result} />
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
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Journal Notes</h2>
                <p>
                  The trading reason and emotional state saved with this trade.
                </p>
              </div>
              <span>Cognee memory source</span>
            </div>

            <div className="trade-notes-block">
              <DetailItem label="Setup" value={selectedTrade.setup} />
              <DetailItem label="Emotion" value={selectedTrade.emotion} />
              <DetailItem label="Notes" value={selectedTrade.notes} />
            </div>
          </section>
        </div>

        <aside className="trade-detail-side">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Trade State</h2>
                <p>Current execution and result labels.</p>
              </div>
            </div>

            <div className="side-detail-list">
              <DetailItem label="Status" value={selectedTrade.status} />
              <DetailItem label="Result" value={selectedTrade.result} />
              <DetailItem label="Session" value={selectedTrade.session} />
              <DetailItem label="Direction" value={selectedTrade.direction} />
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Position Risk</h2>
                <p>Risk details stored with the journal entry.</p>
              </div>
            </div>

            <div className="side-detail-list">
              <DetailItem
                label="Lot Size"
                value={formatNumber(selectedTrade.lot_size)}
              />
              <DetailItem
                label="Risk Percent"
                value={formatPercent(selectedTrade.risk_percent)}
              />
              <DetailItem label="Cognee Use" value="Available for recall" />
            </div>
          </section>
        </aside>
      </section>
    </>
  );
}
