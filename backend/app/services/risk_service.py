def calculate_risk_reward(entry_price: float, stop_loss: float, take_profit: float) -> float | None:
    risk = abs(entry_price - stop_loss)
    reward = abs(take_profit - entry_price)

    if risk == 0:
        return None

    return round(reward / risk, 2)
