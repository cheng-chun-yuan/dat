"use client";

import SummaryCard from "./SummaryCard";
import MnavChart from "./MnavChart";
import ComparisonChart from "./ComparisonChart";
import CorrelationChart from "./CorrelationChart";
import { COMPANY_TICKERS } from "@/lib/constants";
import { HistoryEntry, HoldingsData } from "@/lib/types";

interface OverviewTabProps {
  history: HistoryEntry[];
  holdings: HoldingsData;
  onTabChange?: (id: string) => void;
}

export default function OverviewTab({ history, holdings, onTabChange }: OverviewTabProps) {
  const latest = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {COMPANY_TICKERS.map((ticker) => {
          if (!latest?.companies[ticker] || !holdings[ticker]) return null;
          return (
            <SummaryCard
              key={ticker}
              ticker={ticker}
              holdings={holdings[ticker]}
              latest={latest.companies[ticker]}
              previous={previous?.companies[ticker] || null}
              onClick={() => onTabChange?.(ticker)}
            />
          );
        })}
      </div>

      {/* mNAV Time Series */}
      <div>
        <h3 className="text-text-primary font-semibold mb-3">
          mNAV Over Time (All Companies)
        </h3>
        <MnavChart history={history} tickers={[...COMPANY_TICKERS]} />
      </div>

      {/* Comparison Bar Chart */}
      <ComparisonChart history={history} tickers={[...COMPANY_TICKERS]} />

      {/* BTC vs mNAV Correlation */}
      <CorrelationChart history={history} />
    </div>
  );
}
