import { ResultPill } from "../components/ResultPill";
import { StatCard } from "../components/StatCard";
import { formatPercent, formatRatio } from "../utils/formatters";

export function DashboardPage({
  summary,
  bestSymbol,
  winRateDegrees,
  chartSymbols,
  maxSymbolTrades,
  recentPreviewTrades,
  resultDistribution,
  recentOutcomeTrend,
  onNavigate,
  onViewTrade,
  onSeedDemoTrades,
  seedStatus,
  seedError,
  seedResult,
}) {
  return (
    <>
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

      <section className="dashboard-grid">
        <article className="panel metric-panel">
          <div className="panel-heading">
            <h2>Win Ratio</h2>
            <span>Live summary</span>
          </div>
          <div className="win-ring-layout">
            <div
              className="progress-ring"
              style={{ "--progress": `${winRateDegrees}deg` }}
            >
              <strong>{formatPercent(summary.win_rate)}</strong>
            </div>
            <div className="ring-stats">
              <span>Winning trades</span>
              <strong>{summary.wins}</strong>
              <span>Losing trades</span>
              <strong>{summary.losses}</strong>
            </div>
          </div>
        </article>

        <article className="panel metric-panel">
          <div className="panel-heading">
            <h2>Symbol Activity</h2>
            <span>Top symbols</span>
          </div>
          {chartSymbols.length ? (
            <div className="mini-bars">
              {chartSymbols.map((symbol) => (
                <div className="mini-bar-group" key={symbol.symbol}>
                  <div className="mini-bar-track">
                    <span
                      className="mini-bar-fill"
                      style={{
                        height: `${(symbol.total_trades / maxSymbolTrades) * 100}%`,
                      }}
                    />
                  </div>
                  <strong>{symbol.symbol}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">Seed or save trades to see activity.</p>
          )}
        </article>

        <article className="panel metric-panel">
          <div className="panel-heading">
            <h2>Outcome Trend</h2>
            <button
              type="button"
              className="secondary-button small-button"
              onClick={() => onNavigate("history")}
            >
              View all
            </button>
          </div>
          {recentOutcomeTrend.length ? (
            <div className="outcome-trend">
              {recentOutcomeTrend.map((item) => (
                <button
                  type="button"
                  className={`trend-dot trend-${item.result.toLowerCase()}`}
                  key={item.id}
                  onClick={() => {
                    onNavigate("history");
                    onViewTrade(item.id);
                  }}
                  title={`${item.symbol} ${item.result}`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="empty-text">Close demo trades to see a trend.</p>
          )}

          <div className="distribution-card">
            <strong>Result distribution</strong>
            <div className="distribution-track">
              {resultDistribution.map((item) => (
                <span
                  key={item.label}
                  className={item.className}
                  style={{ width: `${item.percent}%` }}
                  title={`${item.label}: ${item.value}`}
                />
              ))}
            </div>
            <div className="distribution-legend">
              {resultDistribution.map((item) => (
                <span key={item.label}>
                  {item.label}: {item.value}
                </span>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="panel recent-preview-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent Trades</h2>
            <p>Latest saved trades from your journal.</p>
          </div>
          <button
            type="button"
            className="secondary-button small-button"
            onClick={() => onNavigate("history")}
          >
            Open history
          </button>
        </div>
        <div className="recent-list recent-list-grid">
          {recentPreviewTrades.length ? (
            recentPreviewTrades.map((trade) => (
              <button
                type="button"
                className="recent-trade-row"
                key={trade.id}
                onClick={() => {
                  onNavigate("history");
                  onViewTrade(trade.id);
                }}
              >
                <span>{trade.symbol}</span>
                <strong>{trade.direction}</strong>
                <ResultPill value={trade.result} />
              </button>
            ))
          ) : (
            <p className="empty-text">No trades yet.</p>
          )}
        </div>
      </section>

      {/* <section className="panel demo-seed-panel">
        <div className="panel-heading">
          <div>
            <h2>Demo Setup</h2>
            <p>
              Add realistic sample trades so Cognee recall and AI Coach have
              memories to use.
            </p>
          </div>
        </div>

        <div className="demo-seed-content">
          <div>
            <strong>Seeded trades include:</strong>
            <p>
              XAUUSD breakout retests, USOIL continuation, EURUSD trend
              continuation, mixed emotions, and mixed results.
            </p>
          </div>

          <button
            type="button"
            onClick={onSeedDemoTrades}
            disabled={seedStatus === "loading"}
          >
            {seedStatus === "loading" ? "Seeding..." : "Seed Demo Trades"}
          </button>
        </div>

        {seedStatus === "error" ? (
          <p className="inline-error">{seedError}</p>
        ) : null}

        {seedResult ? (
          <p className="inline-success">
            Created {seedResult.created_count} demo trades. Cognee remembered{" "}
            {seedResult.memory_saved_count}.
          </p>
        ) : null}
      </section> */}
    </>
  );
}
