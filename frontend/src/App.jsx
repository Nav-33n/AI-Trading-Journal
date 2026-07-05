import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import {
  API_BASE_URL,
  createInitialSaveTrade,
  emptySummary,
  fallbackInstruments,
  initialCoachTrade,
  navItems,
} from "./data/appConfig";
import { AddTradePage } from "./pages/AddTradePage";
import { AICoachPage } from "./pages/AICoachPage";
import { CogneeMemoryPage } from "./pages/CogneeMemoryPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PerformancePage } from "./pages/PerformancePage";
import { TradeDetailPage } from "./pages/TradeDetailPage";
import { TradeHistoryPage } from "./pages/TradeHistoryPage";
import {
  deleteTradeRequest,
  fetchDashboardSummary,
  fetchInstruments,
  fetchTradeByIdRequest,
  fetchTrades,
  forgetMemoryRequest,
  improveMemoryRequest,
  previewTradeRiskRequest,
  requestAICoachReview,
  saveTradeRequest,
  seedDemoTradesRequest,
} from "./services/api";
import {
  getAverageRiskReward,
  getRecentOutcomeTrend,
  getResultDistribution,
  getTopGroups,
} from "./utils/analytics";
import { buildTradePayload, tradeToFormState } from "./utils/tradePayload";

const defaultTradeFilters = {
  symbol: "ALL",
  status: "ALL",
  result: "ALL",
};

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [summary, setSummary] = useState(emptySummary);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [saveTrade, setSaveTrade] = useState(() => createInitialSaveTrade());
  const [editingTradeId, setEditingTradeId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [savedTrade, setSavedTrade] = useState(null);
  const [seedStatus, setSeedStatus] = useState("idle");
  const [seedError, setSeedError] = useState("");
  const [seedResult, setSeedResult] = useState(null);
  const [allTrades, setAllTrades] = useState([]);
  const [tradeHistoryStatus, setTradeHistoryStatus] = useState("idle");
  const [tradeFilters, setTradeFilters] = useState(defaultTradeFilters);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [tradeActionStatus, setTradeActionStatus] = useState("idle");
  const [tradeActionError, setTradeActionError] = useState("");
  const [riskCapital, setRiskCapital] = useState("10000");
  const [riskPreviewStatus, setRiskPreviewStatus] = useState("idle");
  const [riskPreviewError, setRiskPreviewError] = useState("");
  const [riskPreview, setRiskPreview] = useState(null);
  const [instruments, setInstruments] = useState(fallbackInstruments);
  const [memoryActionStatus, setMemoryActionStatus] = useState("idle");
  const [memoryActionError, setMemoryActionError] = useState("");
  const [memoryActionResult, setMemoryActionResult] = useState(null);
  const [forgetConfirmation, setForgetConfirmation] = useState("");
  const [coachTrade, setCoachTrade] = useState(initialCoachTrade);
  const [coachQuestion, setCoachQuestion] = useState(
    "Should I take this trade based on my past similar trades?",
  );
  const [coachStatus, setCoachStatus] = useState("idle");
  const [coachError, setCoachError] = useState("");
  const [coachResult, setCoachResult] = useState(null);

  async function loadDashboard() {
    setStatus("loading");
    setError("");

    try {
      const data = await fetchDashboardSummary();
      setSummary({ ...emptySummary, ...data });
      setStatus("ready");
    } catch (requestError) {
      setStatus("error");
      setError(requestError.message);
    }
  }

  async function loadInstruments() {
    try {
      const data = await fetchInstruments();
      setInstruments(data.length ? data : fallbackInstruments);
    } catch {
      setInstruments(fallbackInstruments);
    }
  }

  async function loadTradeHistory() {
    setTradeHistoryStatus("loading");

    try {
      const data = await fetchTrades();
      setAllTrades(data);
      setTradeHistoryStatus("ready");
    } catch (requestError) {
      setTradeHistoryStatus("error");
      setTradeActionError(requestError.message);
    }
  }

  async function refreshTradingData() {
    await Promise.all([loadDashboard(), loadTradeHistory()]);
  }

  async function seedDemoTrades() {
    if (allTrades.length) {
      const shouldSeed = window.confirm(
        "This will add another set of demo trades. Continue?",
      );

      if (!shouldSeed) {
        return;
      }
    }

    setSeedStatus("loading");
    setSeedError("");
    setSeedResult(null);

    try {
      const data = await seedDemoTradesRequest();
      setSeedResult(data);
      setSeedStatus("ready");
      await refreshTradingData();
    } catch (requestError) {
      setSeedStatus("error");
      setSeedError(requestError.message);
    }
  }

  useEffect(() => {
    // Initial app hydration should run once when the dashboard mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshTradingData();
    loadInstruments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateCoachTrade(field, value) {
    setCoachTrade((currentTrade) => ({
      ...currentTrade,
      [field]: value,
    }));
  }

  function updateSaveTrade(field, value) {
    setSaveTrade((currentTrade) => ({
      ...currentTrade,
      [field]: value,
    }));
  }

  function updateTradeFilter(field, value) {
    setTradeFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  }

  function resetSaveForm() {
    setEditingTradeId(null);
    setSaveTrade(createInitialSaveTrade());
    setSaveStatus("idle");
    setSaveError("");
    setSavedTrade(null);
    setRiskPreview(null);
    setRiskPreviewStatus("idle");
    setRiskPreviewError("");
  }

  async function submitSaveTrade(event) {
    event.preventDefault();
    setSaveStatus("loading");
    setSaveError("");
    setSavedTrade(null);

    try {
      const data = await saveTradeRequest(
        buildTradePayload(saveTrade),
        editingTradeId,
      );
      setSavedTrade(data);
      setSaveStatus("ready");
      setSelectedTrade(data);
      await refreshTradingData();
    } catch (requestError) {
      setSaveStatus("error");
      setSaveError(requestError.message);
    }
  }

  async function viewTrade(tradeId) {
    setTradeActionStatus("loading");
    setTradeActionError("");

    try {
      const data = await fetchTradeByIdRequest(tradeId);
      setSelectedTrade(data);
      setTradeActionStatus("ready");
      setActivePage("trade-detail");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setTradeActionStatus("error");
      setTradeActionError(requestError.message);
    }
  }

  async function startEditTrade(tradeId) {
    setTradeActionStatus("loading");
    setTradeActionError("");

    try {
      const data = await fetchTradeByIdRequest(tradeId);
      setSelectedTrade(data);
      setEditingTradeId(tradeId);
      setSaveTrade(tradeToFormState(data));
      setSavedTrade(null);
      setSaveError("");
      setSaveStatus("idle");
      setTradeActionStatus("ready");
      setActivePage("add");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setTradeActionStatus("error");
      setTradeActionError(requestError.message);
    }
  }

  async function deleteTrade(tradeId) {
    const shouldDelete = window.confirm(
      `Delete trade #${tradeId}? This removes it from SQLite.`,
    );

    if (!shouldDelete) {
      return;
    }

    setTradeActionStatus("loading");
    setTradeActionError("");

    try {
      await deleteTradeRequest(tradeId);

      if (selectedTrade?.id === tradeId) {
        setSelectedTrade(null);

        if (activePage === "trade-detail") {
          setActivePage("history");
        }
      }

      if (editingTradeId === tradeId) {
        resetSaveForm();
      }

      setTradeActionStatus("ready");
      await refreshTradingData();
    } catch (requestError) {
      setTradeActionStatus("error");
      setTradeActionError(requestError.message);
    }
  }

  function askCoachFromTrade(trade) {
    setCoachTrade(tradeToFormState(trade));
    setCoachQuestion(
      "Review this saved trade using my recalled Cognee memories.",
    );
    setCoachResult(null);
    setCoachError("");
    setCoachStatus("idle");
    setActivePage("coach");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function runRiskPreview() {
    setRiskPreviewStatus("loading");
    setRiskPreviewError("");
    setRiskPreview(null);

    try {
      const data = await previewTradeRiskRequest({
        symbol: saveTrade.symbol,
        direction: saveTrade.direction,
        entry_price: Number(saveTrade.entry_price),
        stop_loss: Number(saveTrade.stop_loss),
        take_profit: Number(saveTrade.take_profit),
        capital: Number(riskCapital),
        risk_percent: Number(saveTrade.risk_percent),
      });
      setRiskPreview(data);
      setRiskPreviewStatus("ready");
    } catch (requestError) {
      setRiskPreviewStatus("error");
      setRiskPreviewError(requestError.message);
    }
  }

  async function runMemoryImprove() {
    setMemoryActionStatus("loading");
    setMemoryActionError("");
    setMemoryActionResult(null);

    try {
      const data = await improveMemoryRequest();
      setMemoryActionResult(data);
      setMemoryActionStatus("ready");
    } catch (requestError) {
      setMemoryActionStatus("error");
      setMemoryActionError(requestError.message);
    }
  }

  async function runMemoryForget() {
    setMemoryActionStatus("loading");
    setMemoryActionError("");
    setMemoryActionResult(null);

    try {
      const data = await forgetMemoryRequest(forgetConfirmation);
      setMemoryActionResult(data);
      setMemoryActionStatus("ready");
    } catch (requestError) {
      setMemoryActionStatus("error");
      setMemoryActionError(requestError.message);
    }
  }

  async function submitCoachReview(event) {
    event.preventDefault();
    setCoachStatus("loading");
    setCoachError("");
    setCoachResult(null);

    const payload = {
      trade: buildTradePayload(coachTrade),
      question: coachQuestion,
    };

    try {
      const data = await requestAICoachReview(payload);
      setCoachResult(data);
      setCoachStatus("ready");
    } catch (requestError) {
      setCoachStatus("error");
      setCoachError(requestError.message);
    }
  }

  const bestSymbol = useMemo(() => {
    if (!summary.symbol_performance.length) {
      return null;
    }

    return [...summary.symbol_performance].sort(
      (first, second) => second.win_rate - first.win_rate,
    )[0];
  }, [summary.symbol_performance]);

  const historySymbols = useMemo(
    () => [...new Set(allTrades.map((trade) => trade.symbol))].sort(),
    [allTrades],
  );

  const filteredTrades = useMemo(
    () =>
      allTrades.filter((trade) => {
        const symbolMatches =
          tradeFilters.symbol === "ALL" || trade.symbol === tradeFilters.symbol;
        const statusMatches =
          tradeFilters.status === "ALL" || trade.status === tradeFilters.status;
        const resultMatches =
          tradeFilters.result === "ALL" || trade.result === tradeFilters.result;

        return symbolMatches && statusMatches && resultMatches;
      }),
    [allTrades, tradeFilters],
  );

  const activeNavItem =
    activePage === "trade-detail"
      ? {
          label: "Trade Detail",
          description: "Full journal context for a saved trade",
        }
      : navItems.find((item) => item.id === activePage) || navItems[0];
  const winRateDegrees = Math.min(summary.win_rate, 100) * 3.6;
  const chartSymbols = summary.symbol_performance.slice(0, 6);
  const maxSymbolTrades = Math.max(
    ...chartSymbols.map((symbol) => symbol.total_trades),
    1,
  );
  const recentPreviewTrades = allTrades.slice(0, 5);
  const setupPerformance = useMemo(
    () => getTopGroups(allTrades, "setup", "No setup"),
    [allTrades],
  );
  const emotionPerformance = useMemo(
    () => getTopGroups(allTrades, "emotion", "No emotion"),
    [allTrades],
  );
  const resultDistribution = useMemo(
    () => getResultDistribution(summary),
    [summary],
  );
  const recentOutcomeTrend = useMemo(
    () => getRecentOutcomeTrend(allTrades),
    [allTrades],
  );
  const averageRiskReward = useMemo(
    () => getAverageRiskReward(allTrades),
    [allTrades],
  );

  return (
    <div className="app-frame">
      <Sidebar
        activePage={activePage}
        navItems={navItems}
        onNavigate={setActivePage}
        onRefresh={refreshTradingData}
      />

      <main className="app-shell">
        <header className="top-bar">
          <div>
            <p className="eyebrow">AI Trading Journal</p>
            <h1>{activeNavItem.label}</h1>
            <p>{activeNavItem.description}</p>
          </div>
          <button type="button" onClick={refreshTradingData}>
            Refresh
          </button>
        </header>

        {status === "error" ? (
          <section className="notice error">
            <strong>Backend not reachable</strong>
            <p>{error}</p>
            <p>Make sure FastAPI is running on {API_BASE_URL}.</p>
          </section>
        ) : null}

        {status === "loading" ? (
          <section className="notice">
            <strong>Loading dashboard...</strong>
            <p>Fetching trade stats from your backend.</p>
          </section>
        ) : null}

        {activePage === "dashboard" ? (
          <DashboardPage
            summary={summary}
            bestSymbol={bestSymbol}
            winRateDegrees={winRateDegrees}
            chartSymbols={chartSymbols}
            maxSymbolTrades={maxSymbolTrades}
            recentPreviewTrades={recentPreviewTrades}
            resultDistribution={resultDistribution}
            recentOutcomeTrend={recentOutcomeTrend}
            onNavigate={setActivePage}
            onViewTrade={viewTrade}
            onSeedDemoTrades={seedDemoTrades}
            seedStatus={seedStatus}
            seedError={seedError}
            seedResult={seedResult}
          />
        ) : null}

        {activePage === "add" ? (
          <AddTradePage
            editingTradeId={editingTradeId}
            saveTrade={saveTrade}
            instruments={instruments}
            updateSaveTrade={updateSaveTrade}
            submitSaveTrade={submitSaveTrade}
            riskCapital={riskCapital}
            setRiskCapital={setRiskCapital}
            runRiskPreview={runRiskPreview}
            riskPreviewStatus={riskPreviewStatus}
            riskPreviewError={riskPreviewError}
            riskPreview={riskPreview}
            saveStatus={saveStatus}
            saveError={saveError}
            savedTrade={savedTrade}
            resetSaveForm={resetSaveForm}
          />
        ) : null}

        {activePage === "cognee" ? (
          <CogneeMemoryPage
            runMemoryImprove={runMemoryImprove}
            runMemoryForget={runMemoryForget}
            memoryActionStatus={memoryActionStatus}
            memoryActionError={memoryActionError}
            memoryActionResult={memoryActionResult}
            forgetConfirmation={forgetConfirmation}
            setForgetConfirmation={setForgetConfirmation}
          />
        ) : null}

        {activePage === "coach" ? (
          <AICoachPage
            coachTrade={coachTrade}
            updateCoachTrade={updateCoachTrade}
            instruments={instruments}
            submitCoachReview={submitCoachReview}
            coachQuestion={coachQuestion}
            setCoachQuestion={setCoachQuestion}
            coachStatus={coachStatus}
            coachError={coachError}
            coachResult={coachResult}
          />
        ) : null}

        {activePage === "performance" ? (
          <PerformancePage
            summary={summary}
            allTrades={allTrades}
            setupPerformance={setupPerformance}
            emotionPerformance={emotionPerformance}
            resultDistribution={resultDistribution}
            recentOutcomeTrend={recentOutcomeTrend}
            averageRiskReward={averageRiskReward}
          />
        ) : null}

        {activePage === "history" ? (
          <TradeHistoryPage
            filteredTrades={filteredTrades}
            allTrades={allTrades}
            tradeFilters={tradeFilters}
            updateTradeFilter={updateTradeFilter}
            historySymbols={historySymbols}
            clearTradeFilters={() => setTradeFilters(defaultTradeFilters)}
            tradeActionStatus={tradeActionStatus}
            tradeActionError={tradeActionError}
            tradeHistoryStatus={tradeHistoryStatus}
            viewTrade={viewTrade}
            startEditTrade={startEditTrade}
            deleteTrade={deleteTrade}
          />
        ) : null}

        {activePage === "trade-detail" ? (
          <TradeDetailPage
            selectedTrade={selectedTrade}
            tradeActionStatus={tradeActionStatus}
            tradeActionError={tradeActionError}
            onBack={() => setActivePage("history")}
            onEdit={startEditTrade}
            onDelete={deleteTrade}
            onAskCoach={askCoachFromTrade}
          />
        ) : null}
      </main>
    </div>
  );
}

export default App;
