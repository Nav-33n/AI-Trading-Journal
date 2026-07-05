import { MEMORY_DATASET_NAME } from "../data/appConfig";

const lifecycleItems = [
  {
    step: "01",
    title: "Remember",
    trigger: "Add Trade page",
    endpoint: "POST /trades",
    description:
      "Every saved trade is converted into a structured trading memory with symbol, setup, session, risk, emotion, result, and notes.",
    proof: "Trade response shows whether Cognee memory was saved.",
  },
  {
    step: "02",
    title: "Recall",
    trigger: "AI Coach page",
    endpoint: "POST /trades/ai-coach",
    description:
      "Before the coach gives feedback, the backend asks Cognee for similar past trades so the answer is based on trader history.",
    proof: "AI Coach response includes recalled memories.",
  },
  {
    step: "03",
    title: "Improve",
    trigger: "Cognee Memory page",
    endpoint: "POST /memory/improve",
    description:
      "The app can memify stored sessions into stronger long-term knowledge so recall becomes more useful over time.",
    proof: "Improve result confirms the dataset action.",
  },
  {
    step: "04",
    title: "Forget",
    trigger: "Cognee Memory page",
    endpoint: "POST /memory/forget",
    description:
      "When testing with demo data, the memory dataset can be cleared without deleting the SQLite trade journal.",
    proof: "Forget requires dataset confirmation for safety.",
  },
];

const memoryFlow = [
  "Trade saved",
  "Cognee remembers",
  "Similar trades recalled",
  "AI coach responds",
];

export function CogneeMemoryPage({
  runMemoryImprove,
  runMemoryForget,
  memoryActionStatus,
  memoryActionError,
  memoryActionResult,
  forgetConfirmation,
  setForgetConfirmation,
}) {
  return (
    <>
      <section className="panel memory-hero-panel">
        <div className="memory-hero-grid">
          <div>
            <p className="eyebrow">Cognee Integration</p>
            <h2>Memory is the core of the trading assistant.</h2>
            <p>
              This page shows how the app uses Cognee across the complete memory
              lifecycle. Trades are stored as memories, recalled for AI
              coaching, improved into long-term context, and safely forgotten
              during testing.
            </p>
          </div>

          <div className="memory-dataset-card">
            <span>Active Dataset</span>
            <strong>{MEMORY_DATASET_NAME}</strong>
            <p>Used by remember, recall, improve, and forget endpoints.</p>
          </div>
        </div>

        <div className="memory-flow">
          {memoryFlow.map((item, index) => (
            <div className="memory-flow-step" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel memory-lifecycle-panel">
        <div className="panel-heading">
          <div>
            <h2>Cognee Lifecycle</h2>
            <p>Where each lifecycle action appears inside the application.</p>
          </div>
        </div>

        <div className="lifecycle-grid">
          {lifecycleItems.map((item) => (
            <article className="lifecycle-card" key={item.title}>
              <div className="lifecycle-card-top">
                <span>{item.step}</span>
                <strong>{item.title}</strong>
              </div>
              <p>{item.description}</p>
              <dl>
                <div>
                  <dt>Trigger</dt>
                  <dd>{item.trigger}</dd>
                </div>
                <div>
                  <dt>Endpoint</dt>
                  <dd>{item.endpoint}</dd>
                </div>
                <div>
                  <dt>Proof</dt>
                  <dd>{item.proof}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="panel memory-proof-panel">
        <div className="panel-heading">
          <div>
            <h2>Demo Path For Judges</h2>
            <p>Use this sequence during the final presentation.</p>
          </div>
        </div>

        <div className="memory-proof-grid">
          <article>
            <span>1</span>
            <strong>Add a trade</strong>
            <p>
              Show that saving the trade writes to SQLite and returns
              memory_saved.
            </p>
          </article>
          <article>
            <span>2</span>
            <strong>Ask AI Coach</strong>
            <p>Ask about a similar setup and show recalled Cognee memories.</p>
          </article>
          <article>
            <span>3</span>
            <strong>Improve memory</strong>
            <p>
              Run improve to show Cognee turning recent session data into
              stronger context.
            </p>
          </article>
          <article>
            <span>4</span>
            <strong>Forget safely</strong>
            <p>
              Confirm the dataset name and clear only memory data when demo
              testing is done.
            </p>
          </article>
        </div>
      </section>

      <section className="panel memory-controls-panel">
        <div className="panel-heading">
          <div>
            <h2>Memory Controls</h2>
            <p>
              Run Cognee improve or reset the memory dataset for clean demos.
            </p>
          </div>
        </div>

        <div className="memory-controls-grid">
          <div className="memory-action-card">
            <strong>Improve / Memify</strong>
            <p>
              Enrich the current Cognee dataset so future recall can retrieve
              better trading context for the AI Coach.
            </p>
            <button
              type="button"
              onClick={runMemoryImprove}
              disabled={memoryActionStatus === "loading"}
            >
              {memoryActionStatus === "loading"
                ? "Running..."
                : "Improve Memory"}
            </button>
          </div>

          <div className="memory-action-card danger-card">
            <strong>Forget Dataset</strong>
            <p>
              Deletes Cognee memory only. Your trades remain saved, so the
              journal history is not removed.
            </p>
            <label>
              Type {MEMORY_DATASET_NAME} to confirm
              <input
                value={forgetConfirmation}
                onChange={(event) => setForgetConfirmation(event.target.value)}
                placeholder={MEMORY_DATASET_NAME}
              />
            </label>
            <button
              type="button"
              className="danger-button"
              onClick={runMemoryForget}
              disabled={
                memoryActionStatus === "loading" ||
                forgetConfirmation !== MEMORY_DATASET_NAME
              }
            >
              Forget Memory Dataset
            </button>
          </div>
        </div>

        {memoryActionStatus === "error" ? (
          <p className="inline-error memory-action-message">
            {memoryActionError}
          </p>
        ) : null}

        {memoryActionResult ? (
          <div className="memory-action-result">
            <strong>
              {memoryActionResult.action} | {memoryActionResult.dataset_name}
            </strong>
            <p>{memoryActionResult.message}</p>
            {memoryActionResult.raw_result ? (
              <code>{memoryActionResult.raw_result}</code>
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  );
}
