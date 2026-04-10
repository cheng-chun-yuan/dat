"use client";

import MnavChart from "./MnavChart";
import { HistoryEntry, HoldingsData } from "@/lib/types";
import { COMPANY_COLORS } from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/data";

interface CompanyTabProps {
  ticker: string;
  history: HistoryEntry[];
  holdings: HoldingsData;
}

export default function CompanyTab({
  ticker,
  history,
  holdings,
}: CompanyTabProps) {
  const company = holdings[ticker];
  const latest = history[history.length - 1]?.companies[ticker];
  const color = COMPANY_COLORS[ticker] || "#64ffda";

  if (!company || !latest) {
    return <div className="text-text-secondary">No data available.</div>;
  }

  // Calculate metrics
  const mnavValues = history
    .filter((e) => e.companies[ticker])
    .map((e) => e.companies[ticker].mnav);

  const current = latest.mnav;
  const allTimeHigh = Math.max(...mnavValues);
  const allTimeLow = Math.min(...mnavValues);

  const last7 = mnavValues.slice(-7);
  const last30 = mnavValues.slice(-30);
  const change7d =
    last7.length > 1
      ? ((last7[last7.length - 1] - last7[0]) / last7[0]) * 100
      : 0;
  const change30d =
    last30.length > 1
      ? ((last30[last30.length - 1] - last30[0]) / last30[0]) * 100
      : 0;

  const btcValue =
    latest.btc_holdings * history[history.length - 1].btc_price;

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="bg-bg-card rounded-xl p-6 border border-border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color }}>
              {company.name}
            </h2>
            <p className="text-text-secondary text-sm mt-1">
              {company.sector} &middot; {company.description}
            </p>
          </div>
          <span
            className={`text-3xl font-mono font-bold ${
              current >= 1 ? "text-accent-positive" : "text-accent-negative"
            }`}
          >
            {current.toFixed(4)}
          </span>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <div className="text-text-secondary text-xs">Stock Price</div>
            <div className="text-text-primary font-mono font-semibold">
              ${latest.stock_price.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-xs">Market Cap</div>
            <div className="text-text-primary font-mono font-semibold">
              {formatCurrency(latest.market_cap)}
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-xs">BTC Holdings</div>
            <div className="text-text-primary font-mono font-semibold">
              {formatNumber(latest.btc_holdings)} BTC
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-xs">BTC Value</div>
            <div className="text-text-primary font-mono font-semibold">
              {formatCurrency(btcValue)}
            </div>
          </div>
        </div>
      </div>

      {/* mNAV Chart */}
      <div>
        <h3 className="text-text-primary font-semibold mb-3">
          {ticker} mNAV History
        </h3>
        <MnavChart history={history} tickers={[ticker]} height={350} />
      </div>

      {/* Metrics Table */}
      <div className="bg-bg-card rounded-xl p-6 border border-border">
        <h3 className="text-text-primary font-semibold mb-4">Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-text-secondary text-xs mb-1">
              Current mNAV
            </div>
            <div
              className={`text-xl font-mono font-bold ${
                current >= 1 ? "text-accent-positive" : "text-accent-negative"
              }`}
            >
              {current.toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-xs mb-1">7D Change</div>
            <div
              className={`text-xl font-mono font-bold ${
                change7d >= 0
                  ? "text-accent-positive"
                  : "text-accent-negative"
              }`}
            >
              {change7d >= 0 ? "+" : ""}
              {change7d.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-xs mb-1">30D Change</div>
            <div
              className={`text-xl font-mono font-bold ${
                change30d >= 0
                  ? "text-accent-positive"
                  : "text-accent-negative"
              }`}
            >
              {change30d >= 0 ? "+" : ""}
              {change30d.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-xs mb-1">
              All-Time Range
            </div>
            <div className="text-xl font-mono font-bold text-text-primary">
              {allTimeLow.toFixed(2)} - {allTimeHigh.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
