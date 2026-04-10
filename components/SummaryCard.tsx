"use client";

import { COMPANY_COLORS } from "@/lib/constants";
import { HoldingsEntry, CompanyDayData } from "@/lib/types";

interface SummaryCardProps {
  ticker: string;
  holdings: HoldingsEntry;
  latest: CompanyDayData;
  previous: CompanyDayData | null;
  onClick: () => void;
}

export default function SummaryCard({
  ticker,
  holdings,
  latest,
  previous,
  onClick,
}: SummaryCardProps) {
  const change = previous
    ? ((latest.mnav - previous.mnav) / previous.mnav) * 100
    : 0;
  const isPositive = latest.mnav >= 1;
  const color = COMPANY_COLORS[ticker] || "#64ffda";

  return (
    <button
      onClick={onClick}
      className="bg-bg-card hover:bg-bg-card-hover rounded-xl p-4 text-left transition-colors border border-border"
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-bold"
          style={{ color }}
        >
          {ticker}
        </span>
        <span className="text-text-secondary text-xs">{holdings.name}</span>
      </div>
      <div className="flex items-end justify-between">
        <span
          className={`text-2xl font-mono font-bold ${
            isPositive ? "text-accent-positive" : "text-accent-negative"
          }`}
        >
          {latest.mnav.toFixed(2)}
        </span>
        <span
          className={`text-sm font-mono ${
            change >= 0 ? "text-accent-positive" : "text-accent-negative"
          }`}
        >
          {change >= 0 ? "+" : ""}
          {change.toFixed(1)}%
        </span>
      </div>
    </button>
  );
}
