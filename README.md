# AI Trading Journal

AI Trading Journal is a FastAPI + React hackathon project that uses Cognee as
the memory layer for a personal trading coach. Traders can save trades, review
risk, recall similar past setups, and ask an AI coach for feedback grounded in
their own journal history.

## Why This Project

Most trading journals only store data. This project turns the journal into a
memory-based assistant:

1. The trader saves a trade.
2. The backend stores the trade in SQLite.
3. Cognee remembers the trade as long-term memory.
4. Similar trades can be recalled later.
5. The AI coach uses recalled memory to give personalized feedback.
6. Cognee improve/memify can enrich the memory graph.
7. Cognee forget can reset memory during testing or cleanup.

## Core Features

- Trade entry form with symbol, direction, entry, stop loss, take profit, risk,
  session, setup, emotion, notes, status, and result.
- Risk preview with suggested lot size, risk amount, risk/reward ratio, and
  instrument warnings.
- Instrument dropdown for common symbols including XAUUSD, USOIL, and major
  forex pairs.
- Dashboard summary with win rate, average risk/reward, result breakdown, and
  symbol performance.
- Full trade history table with filters for symbol, status, and result.
- View, edit, update, and delete saved trades from the frontend.
- Cognee memory recall for similar historical trades.
- AI Coach endpoint that combines Cognee recall with an OpenAI-compatible chat
  model.
- Cognee improve/memify and forget controls for the memory lifecycle.

## Tech Stack

| Layer             | Technology                                            |
| ----------------- | ----------------------------------------------------- |
| Backend           | Python, FastAPI, SQLAlchemy                           |
| Database          | SQLite                                                |
| Memory            | Cognee                                                |
| Cognee LLM        | Gemini through Google AI Studio                       |
| Cognee Embeddings | FastEmbed                                             |
| AI Coach          | OpenAI-compatible API, configured for Groq by default |
| Frontend          | React + Vite                                          |

## Cognee Memory Lifecycle

| Cognee Step      | Project Feature                                            |
| ---------------- | ---------------------------------------------------------- |
| Remember         | `POST /trades` saves each trade to Cognee memory           |
| Recall           | `POST /memory/recall` and AI Coach retrieve similar trades |
| Improve / Memify | `POST /memory/improve` enriches memory from saved sessions |
| Forget           | `POST /memory/forget` resets the Cognee memory dataset     |

## Backend Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Open the API docs:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

Open the app:

```text
http://localhost:5173
```

If the backend URL changes, create `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Main API Endpoints

### Health

```text
GET /health
```

### Trades

```text
POST /trades
GET /trades
GET /trades/instruments
GET /trades/{trade_id}
PATCH /trades/{trade_id}
DELETE /trades/{trade_id}
POST /trades/risk-preview
POST /trades/ai-coach
```

`POST /trades` saves the trade in SQLite and sends it to Cognee memory.

Sample trade body:

```json
{
  "symbol": "XAUUSD",
  "direction": "BUY",
  "entry_price": 2350,
  "stop_loss": 2345,
  "take_profit": 2365,
  "lot_size": 0.2,
  "risk_percent": 1,
  "session": "London",
  "setup": "Breakout retest",
  "emotion": "Calm",
  "notes": "Entered after confirmation candle",
  "status": "OPEN",
  "result": "PENDING"
}
```

### Dashboard

```text
GET /dashboard/summary
```

Returns total trades, open/closed/planned counts, win rate, average
risk/reward, result breakdown, symbol performance, and recent trades.

### Cognee Memory

```text
GET /memory/status
POST /memory/recall
POST /memory/improve
POST /memory/forget
```

Sample recall body:

```json
{
  "symbol": "XAUUSD",
  "direction": "BUY",
  "setup": "Breakout retest",
  "session": "London",
  "notes": "Find similar trades from my memory"
}
```

Forget confirmation body:

```json
{
  "confirm_dataset_name": "trading_journal_memory"
}
```

Forget deletes Cognee memory only. It does not delete SQLite trade records.

## Demo Flow

1. Start the backend and frontend.
2. Add several demo trades from the Save Trade form.
3. Show the dashboard updating automatically.
4. Open Trade History and filter by symbol or result.
5. View and edit one saved trade.
6. Ask Memory AI Coach for feedback on a planned trade.
7. Show recalled Cognee memories in the AI Coach response.
8. Run Improve Memory.
9. Optionally use Forget Dataset to reset Cognee memory for testing.

## Suggested Demo Trades

Use a few repeated setups so recall has something useful to find:

- XAUUSD BUY, London session, breakout retest, calm, win.
- XAUUSD BUY, London session, breakout retest, fearful exit, loss.
- XAUUSD SELL, New York session, resistance rejection, overconfident, loss.
- USOIL BUY, New York session, pullback continuation, calm, win.
- EURUSD SELL, London session, trend continuation, patient, breakeven.

## AI Usage Disclosure

AI assistants were used during planning, debugging, code generation, and README
drafting. The project implementation, integration decisions, testing, and final
submission remain the responsibility of the project author.
