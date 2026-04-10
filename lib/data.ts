import { HistoryEntry, HoldingsData } from "./types";

let historyCache: HistoryEntry[] | null = null;
let holdingsCache: HoldingsData | null = null;

export async function loadHistory(): Promise<HistoryEntry[]> {
  if (historyCache) return historyCache;

  try {
    // Try real API first
    const res = await fetch("/api/history?days=90");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        historyCache = data;
        return data;
      }
    }
  } catch {
    // Fall through to static fallback
  }

  // Fallback to static JSON
  const res = await fetch("/data/history.json");
  historyCache = await res.json();
  return historyCache!;
}

export async function loadHoldings(): Promise<HoldingsData> {
  if (holdingsCache) return holdingsCache;

  try {
    const res = await fetch("/api/fetch-data");
    if (res.ok) {
      const data = await res.json();
      if (data.holdings) {
        holdingsCache = data.holdings;
        return data.holdings;
      }
    }
  } catch {
    // Fall through to static fallback
  }

  const res = await fetch("/data/holdings.json");
  holdingsCache = await res.json();
  return holdingsCache!;
}

export async function fetchBtcPrice(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );
    const data = await res.json();
    return data.bitcoin.usd;
  } catch {
    return null;
  }
}

export function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}
