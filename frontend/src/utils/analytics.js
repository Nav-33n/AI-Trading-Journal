const decidedResults = new Set(["WIN", "LOSS", "BREAKEVEN"]);

function calculateWinRate(wins, losses, breakeven = 0) {
  const decided = wins + losses + breakeven;

  if (!decided) {
    return 0;
  }

  return Number(((wins / decided) * 100).toFixed(2));
}

function groupByField(trades, field, fallbackLabel) {
  return trades.reduce((groups, trade) => {
    const key = trade[field] || fallbackLabel;
    const existing = groups.get(key) || {
      name: key,
      total: 0,
      wins: 0,
      losses: 0,
      breakeven: 0,
      pending: 0,
      win_rate: 0,
    };

    existing.total += 1;

    if (trade.result === "WIN") {
      existing.wins += 1;
    } else if (trade.result === "LOSS") {
      existing.losses += 1;
    } else if (trade.result === "BREAKEVEN") {
      existing.breakeven += 1;
    } else {
      existing.pending += 1;
    }

    existing.win_rate = calculateWinRate(
      existing.wins,
      existing.losses,
      existing.breakeven,
    );
    groups.set(key, existing);
    return groups;
  }, new Map());
}

export function getTopGroups(
  trades,
  field,
  fallbackLabel = "Not specified",
  limit = 5,
) {
  return [...groupByField(trades, field, fallbackLabel).values()]
    .sort((first, second) => {
      if (second.win_rate === first.win_rate) {
        return second.total - first.total;
      }

      return second.win_rate - first.win_rate;
    })
    .slice(0, limit);
}

export function getResultDistribution(summary) {
  const total = Math.max(summary.total_trades, 1);

  return [
    {
      label: "Wins",
      value: summary.wins,
      percent: (summary.wins / total) * 100,
      className: "distribution-win",
    },
    {
      label: "Losses",
      value: summary.losses,
      percent: (summary.losses / total) * 100,
      className: "distribution-loss",
    },
    {
      label: "Breakeven",
      value: summary.breakeven,
      percent: (summary.breakeven / total) * 100,
      className: "distribution-breakeven",
    },
    {
      label: "Pending",
      value: summary.pending,
      percent: (summary.pending / total) * 100,
      className: "distribution-pending",
    },
  ];
}

export function getRecentOutcomeTrend(trades, limit = 10) {
  return trades
    .filter((trade) => decidedResults.has(trade.result))
    .slice(0, limit)
    .reverse()
    .map((trade, index) => ({
      id: trade.id,
      label: `T${index + 1}`,
      result: trade.result,
      symbol: trade.symbol,
      value: trade.result === "WIN" ? 1 : trade.result === "LOSS" ? -1 : 0,
    }));
}

export function getAverageRiskReward(trades) {
  const values = trades
    .map((trade) => trade.risk_reward_ratio)
    .filter((value) => value !== null && value !== undefined);

  if (!values.length) {
    return null;
  }

  return Number(
    (values.reduce((total, value) => total + value, 0) / values.length).toFixed(
      2,
    ),
  );
}
