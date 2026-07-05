import { API_BASE_URL } from "../data/appConfig";

async function parseJsonResponse(response, fallbackMessage) {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const detail = errorBody?.detail || fallbackMessage;

    throw new Error(Array.isArray(detail) ? detail[0]?.msg : detail);
  }

  return response.json();
}

export async function fetchDashboardSummary() {
  const response = await fetch(`${API_BASE_URL}/dashboard/summary`);
  return parseJsonResponse(
    response,
    `Dashboard request failed with ${response.status}`,
  );
}

export async function fetchInstruments() {
  const response = await fetch(`${API_BASE_URL}/trades/instruments`);
  return parseJsonResponse(
    response,
    `Instrument request failed with ${response.status}`,
  );
}

export async function fetchTrades() {
  const response = await fetch(`${API_BASE_URL}/trades`);
  return parseJsonResponse(
    response,
    `Trade history request failed with ${response.status}`,
  );
}

export async function seedDemoTradesRequest() {
  const response = await fetch(`${API_BASE_URL}/trades/demo-seed`, {
    method: "POST",
  });

  return parseJsonResponse(
    response,
    `Demo seed failed with ${response.status}`,
  );
}

export async function saveTradeRequest(payload, tradeId = null) {
  const isEditing = tradeId !== null;
  const response = await fetch(
    `${API_BASE_URL}/trades${isEditing ? `/${tradeId}` : ""}`,
    {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  return parseJsonResponse(
    response,
    `Trade save failed with ${response.status}`,
  );
}

export async function fetchTradeByIdRequest(tradeId) {
  const response = await fetch(`${API_BASE_URL}/trades/${tradeId}`);
  return parseJsonResponse(
    response,
    `Get trade failed with ${response.status}`,
  );
}

export async function deleteTradeRequest(tradeId) {
  const response = await fetch(`${API_BASE_URL}/trades/${tradeId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.detail || `Delete trade failed with ${response.status}`,
    );
  }
}

export async function previewTradeRiskRequest(payload) {
  const response = await fetch(`${API_BASE_URL}/trades/risk-preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(
    response,
    `Risk preview failed with ${response.status}`,
  );
}

export async function improveMemoryRequest() {
  const response = await fetch(`${API_BASE_URL}/memory/improve`, {
    method: "POST",
  });

  return parseJsonResponse(response, `Improve failed with ${response.status}`);
}

export async function forgetMemoryRequest(confirmDatasetName) {
  const response = await fetch(`${API_BASE_URL}/memory/forget`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      confirm_dataset_name: confirmDatasetName,
    }),
  });

  return parseJsonResponse(response, `Forget failed with ${response.status}`);
}

export async function requestAICoachReview(payload) {
  const response = await fetch(`${API_BASE_URL}/trades/ai-coach`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(
    response,
    `AI coach request failed with ${response.status}`,
  );
}
