import { coachReviewSections } from '../data/appConfig'

export function AICoachPage({
  coachTrade,
  updateCoachTrade,
  instruments,
  submitCoachReview,
  coachQuestion,
  setCoachQuestion,
  coachStatus,
  coachError,
  coachResult,
}) {
  return (
    <section className="panel coach-panel">
      <div className="panel-heading">
        <div>
          <h2>Memory AI Coach</h2>
          <p>Review a planned trade using Cognee recall and your AI model.</p>
        </div>
        <span>POST /trades/ai-coach</span>
      </div>

      <div className="coach-grid">
        <form className="coach-form" onSubmit={submitCoachReview}>
          <div className="form-grid">
            <label>
              Symbol
              <select
                value={coachTrade.symbol}
                onChange={(event) => updateCoachTrade('symbol', event.target.value)}
              >
                {instruments.map((instrument) => (
                  <option key={instrument.symbol} value={instrument.symbol}>
                    {instrument.symbol} - {instrument.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Direction
              <select
                value={coachTrade.direction}
                onChange={(event) => updateCoachTrade('direction', event.target.value)}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </label>

            <label>
              Entry
              <input
                type="number"
                value={coachTrade.entry_price}
                onChange={(event) => updateCoachTrade('entry_price', event.target.value)}
              />
            </label>

            <label>
              Stop Loss
              <input
                type="number"
                value={coachTrade.stop_loss}
                onChange={(event) => updateCoachTrade('stop_loss', event.target.value)}
              />
            </label>

            <label>
              Take Profit
              <input
                type="number"
                value={coachTrade.take_profit}
                onChange={(event) => updateCoachTrade('take_profit', event.target.value)}
              />
            </label>

            <label>
              Lot Size
              <input
                type="number"
                value={coachTrade.lot_size}
                onChange={(event) => updateCoachTrade('lot_size', event.target.value)}
              />
            </label>

            <label>
              Risk %
              <input
                type="number"
                value={coachTrade.risk_percent}
                onChange={(event) => updateCoachTrade('risk_percent', event.target.value)}
              />
            </label>

            <label>
              Session
              <input
                value={coachTrade.session}
                onChange={(event) => updateCoachTrade('session', event.target.value)}
              />
            </label>

            <label>
              Setup
              <input
                value={coachTrade.setup}
                onChange={(event) => updateCoachTrade('setup', event.target.value)}
              />
            </label>

            <label>
              Emotion
              <input
                value={coachTrade.emotion}
                onChange={(event) => updateCoachTrade('emotion', event.target.value)}
              />
            </label>

            <label>
              Status
              <select
                value={coachTrade.status}
                onChange={(event) => updateCoachTrade('status', event.target.value)}
              >
                <option value="PLANNED">PLANNED</option>
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </label>

            <label>
              Result
              <select
                value={coachTrade.result}
                onChange={(event) => updateCoachTrade('result', event.target.value)}
              >
                <option value="PENDING">PENDING</option>
                <option value="WIN">WIN</option>
                <option value="LOSS">LOSS</option>
                <option value="BREAKEVEN">BREAKEVEN</option>
              </select>
            </label>
          </div>

          <label>
            Notes
            <textarea
              rows="3"
              value={coachTrade.notes}
              onChange={(event) => updateCoachTrade('notes', event.target.value)}
            />
          </label>

          <label>
            Question for coach
            <textarea
              rows="3"
              value={coachQuestion}
              onChange={(event) => setCoachQuestion(event.target.value)}
            />
          </label>

          <button type="submit" disabled={coachStatus === 'loading'}>
            {coachStatus === 'loading' ? 'Reviewing...' : 'Ask AI Coach'}
          </button>
        </form>

        <div className="coach-result">
          {coachStatus === 'idle' ? (
            <p className="empty-text">
              Submit the sample trade to see recalled Cognee memories and AI feedback.
            </p>
          ) : null}

          {coachStatus === 'error' ? (
            <section className="notice error">
              <strong>AI coach failed</strong>
              <p>{coachError}</p>
            </section>
          ) : null}

          {coachResult ? (
            <>
              <div className="coach-query">
                <strong>Recall query</strong>
                <p>{coachResult.query}</p>
              </div>

              <div className="memory-list">
                <strong>Recalled memories</strong>
                {coachResult.recalled_memories.length ? (
                  <ul>
                    {coachResult.recalled_memories.map((memory, index) => (
                      <li key={`${memory}-${index}`}>{memory}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No similar memories found.</p>
                )}
              </div>

              <div className="coach-review">
                <strong>Coach review</strong>
                {coachResult.structured_review ? (
                  <div className="coach-review-grid">
                    {coachReviewSections.map(([key, label]) => (
                      <article className="coach-review-card" key={key}>
                        <span>{label}</span>
                        <p>{coachResult.structured_review[key] || '-'}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p>{coachResult.coach_review}</p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}
