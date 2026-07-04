def calculate_risk_reward(entry_price: float, stop_loss: float, take_profit: float) -> float | None:
    risk = abs(entry_price - stop_loss)
    reward = abs(take_profit - entry_price)

    if risk == 0:
        return None

    return round(reward / risk, 2)


INSTRUMENT_SPECS = {
    "XAUUSD": {
        "label": "Gold / US Dollar",
        "asset_type": "COMMODITY",
        "contract_size": 100.0,
        "pip_size": 0.01,
        "min_lot": 0.01,
        "lot_step": 0.01,
        "quote_currency": "USD",
        "requires_usd_conversion": False,
    },
    "USOIL": {
        "label": "US Crude Oil",
        "asset_type": "COMMODITY",
        "contract_size": 1000.0,
        "pip_size": 0.01,
        "min_lot": 0.01,
        "lot_step": 0.01,
        "quote_currency": "USD",
        "requires_usd_conversion": False,
    },
    "EURUSD": {
        "label": "Euro / US Dollar",
        "asset_type": "FOREX",
        "contract_size": 100000.0,
        "pip_size": 0.0001,
        "min_lot": 0.01,
        "lot_step": 0.01,
        "quote_currency": "USD",
        "requires_usd_conversion": False,
    },
    "GBPUSD": {
        "label": "British Pound / US Dollar",
        "asset_type": "FOREX",
        "contract_size": 100000.0,
        "pip_size": 0.0001,
        "min_lot": 0.01,
        "lot_step": 0.01,
        "quote_currency": "USD",
        "requires_usd_conversion": False,
    },
    "AUDUSD": {
        "label": "Australian Dollar / US Dollar",
        "asset_type": "FOREX",
        "contract_size": 100000.0,
        "pip_size": 0.0001,
        "min_lot": 0.01,
        "lot_step": 0.01,
        "quote_currency": "USD",
        "requires_usd_conversion": False,
    },
    "NZDUSD": {
        "label": "New Zealand Dollar / US Dollar",
        "asset_type": "FOREX",
        "contract_size": 100000.0,
        "pip_size": 0.0001,
        "min_lot": 0.01,
        "lot_step": 0.01,
        "quote_currency": "USD",
        "requires_usd_conversion": False,
    },
    "USDJPY": {
        "label": "US Dollar / Japanese Yen",
        "asset_type": "FOREX",
        "contract_size": 100000.0,
        "pip_size": 0.01,
        "min_lot": 0.01,
        "lot_step": 0.01,
        "quote_currency": "JPY",
        "requires_usd_conversion": True,
    },
    "USDCHF": {
        "label": "US Dollar / Swiss Franc",
        "asset_type": "FOREX",
        "contract_size": 100000.0,
        "pip_size": 0.0001,
        "min_lot": 0.01,
        "lot_step": 0.01,
        "quote_currency": "CHF",
        "requires_usd_conversion": True,
    },
    "USDCAD": {
        "label": "US Dollar / Canadian Dollar",
        "asset_type": "FOREX",
        "contract_size": 100000.0,
        "pip_size": 0.0001,
        "min_lot": 0.01,
        "lot_step": 0.01,
        "quote_currency": "CAD",
        "requires_usd_conversion": True,
    },
    "EURJPY": {
        "label": "Euro / Japanese Yen",
        "asset_type": "FOREX",
        "contract_size": 100000.0,
        "pip_size": 0.01,
        "min_lot": 0.01,
        "lot_step": 0.01,
        "quote_currency": "JPY",
        "requires_usd_conversion": True,
    },
}


def list_instrument_specs() -> list[dict]:
    return [
        {
            "symbol": symbol,
            **spec,
        }
        for symbol, spec in sorted(INSTRUMENT_SPECS.items())
    ]


def round_to_lot_step(value: float, lot_step: float) -> float:
    if lot_step <= 0:
        return round(value, 2)

    return round(round(value / lot_step) * lot_step, 2)


def calculate_trade_risk_preview(
    symbol: str,
    direction: str,
    entry_price: float,
    stop_loss: float,
    take_profit: float,
    capital: float,
    risk_percent: float,
) -> dict:
    symbol_key = symbol.upper()
    spec = INSTRUMENT_SPECS.get(symbol_key)
    warnings: list[str] = []

    if spec is None:
        spec = {
            "label": symbol_key,
            "asset_type": "UNKNOWN",
            "contract_size": 1.0,
            "pip_size": 0.01,
            "min_lot": 0.01,
            "lot_step": 0.01,
            "quote_currency": "USD",
            "requires_usd_conversion": False,
        }
        warnings.append(
            f"No instrument specification found for {symbol_key}. Using contract size 1."
        )

    if spec["requires_usd_conversion"]:
        warnings.append(
            f"{symbol_key} is quoted in {spec['quote_currency']}. "
            "Risk preview is approximate until USD conversion is configured."
        )

    stop_distance = abs(entry_price - stop_loss)
    target_distance = abs(take_profit - entry_price)
    risk_reward_ratio = calculate_risk_reward(entry_price, stop_loss, take_profit)
    risk_amount = capital * (risk_percent / 100)
    risk_per_lot = stop_distance * spec["contract_size"]
    raw_lot_size = risk_amount / risk_per_lot if risk_per_lot else 0
    suggested_lot_size = max(
        spec["min_lot"],
        round_to_lot_step(raw_lot_size, spec["lot_step"]),
    )

    if stop_distance == 0:
        warnings.append("Stop loss cannot be equal to entry price.")

    if direction == "BUY":
        if stop_loss >= entry_price:
            warnings.append("For a BUY trade, stop loss should be below entry.")
        if take_profit <= entry_price:
            warnings.append("For a BUY trade, take profit should be above entry.")

    if direction == "SELL":
        if stop_loss <= entry_price:
            warnings.append("For a SELL trade, stop loss should be above entry.")
        if take_profit >= entry_price:
            warnings.append("For a SELL trade, take profit should be below entry.")

    return {
        "symbol": symbol_key,
        "asset_type": spec["asset_type"],
        "contract_size": spec["contract_size"],
        "pip_size": spec["pip_size"],
        "min_lot": spec["min_lot"],
        "lot_step": spec["lot_step"],
        "quote_currency": spec["quote_currency"],
        "requires_usd_conversion": spec["requires_usd_conversion"],
        "capital": round(capital, 2),
        "risk_percent": round(risk_percent, 2),
        "risk_amount": round(risk_amount, 2),
        "stop_distance": round(stop_distance, 5),
        "target_distance": round(target_distance, 5),
        "risk_reward_ratio": risk_reward_ratio,
        "risk_per_lot": round(risk_per_lot, 2),
        "suggested_lot_size": suggested_lot_size,
        "warnings": warnings,
    }
