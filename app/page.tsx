"use client";

import { useState, useEffect } from "react";
import TabNav from "@/components/TabNav";
import BtcPriceIndicator from "@/components/BtcPriceIndicator";
import OverviewTab from "@/components/OverviewTab";
import CompanyTab from "@/components/CompanyTab";
import AIInsightsTab from "@/components/AIInsightsTab";
import ReportTab from "@/components/ReportTab";
import { loadHistory, loadHoldings } from "@/lib/data";
import { COMPANY_TICKERS } from "@/lib/constants";
import { HistoryEntry, HoldingsData } from "@/lib/types";

const TABS = [
  { id: "overview", label: "Overview" },
  ...COMPANY_TICKERS.map((t) => ({ id: t, label: t })),
  { id: "ai", label: "AI Insights" },
  { id: "report", label: "Report" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("overview");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [holdings, setHoldings] = useState<HoldingsData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadHistory(), loadHoldings()]).then(([h, ho]) => {
      setHistory(h);
      setHoldings(ho);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary text-lg">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-xl font-bold text-text-primary">
          DAT.co mNAV Monitor
        </h1>
        <BtcPriceIndicator />
      </header>

      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === "overview" && (
          <OverviewTab history={history} holdings={holdings} />
        )}
        {activeTab === "ai" && <AIInsightsTab history={history} />}
        {activeTab === "report" && <ReportTab />}
        {COMPANY_TICKERS.includes(activeTab as (typeof COMPANY_TICKERS)[number]) && (
          <CompanyTab
            ticker={activeTab}
            history={history}
            holdings={holdings}
          />
        )}
      </main>
    </div>
  );
}
