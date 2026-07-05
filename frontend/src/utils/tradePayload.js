function numberOrNull(value) {
  if (value === "") {
    return null;
  }

  return Number(value);
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function getLocalDateInputValue(date = new Date()) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

function getLocalTimeInputValue(date = new Date()) {
  return [padDatePart(date.getHours()), padDatePart(date.getMinutes())].join(
    ":",
  );
}

function getDateTimeParts(value) {
  if (!value) {
    return {
      trade_date: "",
      trade_time: "",
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      trade_date: "",
      trade_time: "",
    };
  }

  return {
    trade_date: getLocalDateInputValue(date),
    trade_time: getLocalTimeInputValue(date),
  };
}

function buildCreatedAtValue(tradeDate, tradeTime) {
  if (!tradeDate && !tradeTime) {
    return null;
  }

  const date = tradeDate || getLocalDateInputValue();
  const time = tradeTime || "00:00";

  return `${date}T${time}:00`;
}

export function buildTradePayload(trade) {
  const { trade_date, trade_time, ...tradeValues } = trade;
  const createdAt = buildCreatedAtValue(trade_date, trade_time);
  const payload = {
    ...tradeValues,
    entry_price: Number(trade.entry_price),
    stop_loss: Number(trade.stop_loss),
    take_profit: Number(trade.take_profit),
    lot_size: numberOrNull(trade.lot_size),
    risk_percent: numberOrNull(trade.risk_percent),
  };

  if (createdAt) {
    payload.created_at = createdAt;
  }

  return payload;
}

export function tradeToFormState(trade) {
  const dateTimeParts = getDateTimeParts(trade.created_at);

  return {
    symbol: trade.symbol || "XAUUSD",
    direction: trade.direction || "BUY",
    ...dateTimeParts,
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
