# AI Trading Journal

AI Trading Journal is a FastAPI + React hackathon project that uses Cognee as
the memory layer for a trading journal coach.

The main demo flow is:

1. Save a trade.
2. Store that trade in SQLite.
3. Remember the trade in Cognee memory.
4. Recall similar past trades.
5. Ask the AI coach for feedback.
6. Improve/memify memory.
7. Forget/reset memory when test data needs cleanup.

## Tech Stack

- Backend: Python, FastAPI, SQLAlchemy, SQLite
- Memory: Cognee
- AI coach: OpenAI-compatible chat API, currently configured for Groq
- Cognee LLM: Gemini via Google AI Studio
- Cognee embeddings: FastEmbed
- Frontend: React + Vite

## Backend Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Open API docs:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

Open app:

```text
http://localhost:5173
```

If the backend URL changes, create `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Environment Keys

Create `backend/.env` from `backend/.env.example`.

Required for AI Coach:

```env
GROQ_API_KEY=your_groq_key_here
```

Required for Cognee with Gemini:

```env
LLM_API_KEY=your_google_ai_studio_key_here
```

Recommended Cognee settings:

```env
COGNEE_DATASET_NAME=trading_journal_memory
ENABLE_BACKEND_ACCESS_CONTROL=false
EMBEDDING_PROVIDER=fastembed
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIMENSIONS=384
```

Do not commit `.env`.

## Main API Endpoints

### Health

```text
GET /health
```

### Trades

```text
POST /trades
GET /trades
GET /trades/{trade_id}
PATCH /trades/{trade_id}
DELETE /trades/{trade_id}
```

`POST /trades` saves the trade in SQLite and sends it to Cognee memory.

Sample body:

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

### AI Coach

```text
POST /trades/ai-coach
```

This endpoint recalls similar Cognee memories and asks the AI model to review
the current trade.

### Dashboard

```text
GET /dashboard/summary
```

Returns total trades, win rate, result breakdown, symbol performance, average
risk/reward, and recent trades.

### Cognee Memory Lifecycle

```text
POST /memory/recall
POST /memory/improve
POST /memory/forget
GET /memory/status
```

Lifecycle mapping for the hackathon:

| Cognee Step      | Project Feature                                            |
| ---------------- | ---------------------------------------------------------- |
| Remember         | `POST /trades` saves trade memory                          |
| Recall           | `POST /memory/recall` and AI Coach retrieve similar trades |
| Improve / Memify | `POST /memory/improve` enriches memory                     |
| Forget           | `POST /memory/forget` resets the Cognee memory dataset     |

Forget requires this confirmation body:

```json
{
  "confirm_dataset_name": "trading_journal_memory"
}
```

It deletes Cognee memory only. It does not delete SQLite trade records.

## Demo Checklist

1. Start backend.
2. Start frontend.
3. Save one or more trades from the frontend.
4. Confirm dashboard numbers update.
5. Ask AI Coach for feedback.
6. Run Improve Memory.
7. Use Recall or AI Coach again.
8. Use Forget Dataset only when you want to reset Cognee test memory.
