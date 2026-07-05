import { StatCard } from "../components/StatCard";
import { formatNumber, formatPercent, formatRatio } from "../utils/formatters";

function RankingList({ items, emptyText }) {
  if (!items.length) {
    return <p className="empty-text">{emptyText}</p>;
  }

  return (
    <div className="ranking-list">
      {items.map((item) => (
        <article className="ranking-row" key={item.name}>
          <div>
            <strong>{item.name}</strong>
            <p>
              {item.total} trades | {item.wins} wins | {item.losses} losses
            </p>
          </div>
          <div className="ranking-meter">
            <span>{formatPercent(item.win_rate)}</span>
            <div className="bar">
              <div style={{ width: `${Math.min(item.win_rate, 100)}%` }} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function PerformancePage({
  summary,
  allTrades,
  setupPerformance,
  emotionPerformance,
  resultDistribution,
  recentOutcomeTrend,
  averageRiskReward,
}) {
  const decidedTrades = summary.wins + summary.losses + summary.breakeven;
  const pendingRatio = summary.total_trades
    ? Number(((summary.pending / summary.total_trades) * 100).toFixed(2))
    : 0;

  return (
    <div className="performance-page">
      <section className="stats-grid" aria-label="Performance summary">
        <StatCard
          label="Total Trades"
          value={summary.total_trades}
          detail={`${decidedTrades} decided`}
        />
        <StatCard
          label="Win Rate"
          value={formatPercent(summary.win_rate)}
          detail="Wins / decided trades"
        />
        <StatCard
          label="Average RR"
          value={formatRatio(averageRiskReward)}
          detail="Across saved trades"
        />
        <StatCard
          label="Pending Ratio"
          value={formatPercent(pendingRatio)}
          detail={`${summary.pending} pending trades`}
        />
      </section>

      <section className="performance-grid">
        <section className="panel performance-wide-card">
          <div className="panel-heading">
            <div>
              <h2>Symbol Performance</h2>
              <p>Win rate and trade count by instrument.</p>
            </div>
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
            <div>
              <h2>Result Mix</h2>
              <p>Current journal outcome distribution.</p>
            </div>
          </div>

          <div className="distribution-card large-distribution">
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

            <div className="result-mix-grid">
              {resultDistribution.map((item) => (
                <article key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{formatPercent(item.percent)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section className="performance-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Best Setups</h2>
              <p>Ranked by win rate and sample size.</p>
            </div>
          </div>
          <RankingList
            items={setupPerformance}
            emptyText="No setup data yet."
          />
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Emotion Impact</h2>
              <p>How emotional state relates to results.</p>
            </div>
          </div>
          <RankingList
            items={emotionPerformance}
            emptyText="No emotion data yet."
          />
        </section>
      </section>

      <section className="panel performance-trend-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent Outcome Trend</h2>
            <p>
              Last {formatNumber(recentOutcomeTrend.length)} decided trades.
            </p>
          </div>
          <span>{allTrades.length} total records</span>
        </div>

        {recentOutcomeTrend.length ? (
          <div className="trend-strip">
            {recentOutcomeTrend.map((item) => (
              <div
                className={`trend-column trend-${item.result.toLowerCase()}`}
                key={item.id}
              >
                <span>{item.symbol}</span>
                <strong>{item.result}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-text">Close a few trades to see outcome trend.</p>
        )}
      </section>
    </div>
  );
}
