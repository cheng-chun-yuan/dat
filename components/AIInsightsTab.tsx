"use client";

import { useState } from "react";
import { HistoryEntry } from "@/lib/types";

interface AIInsightsTabProps {
  history: HistoryEntry[];
}

export default function AIInsightsTab({ history }: AIInsightsTabProps) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const generateSummary = async () => {
    setLoading(true);
    setError("");
    setSummary("");

    const recentData = history.slice(-30);

    try {
      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recentData }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate summary");
      } else {
        setSummary(data.summary);
      }
    } catch {
      setError("Failed to connect to the AI service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              AI-Generated Insights
            </h2>
            <p className="text-text-secondary text-sm mt-1">
              Powered by OpenAI GPT-4o-mini — analyzes the last 30 trading days
              of mNAV data
            </p>
          </div>
          <button
            onClick={generateSummary}
            disabled={loading}
            className="px-6 py-2.5 bg-accent-positive/15 text-accent-positive rounded-lg font-medium hover:bg-accent-positive/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Analysis"}
          </button>
        </div>

        {error && (
          <div className="bg-accent-negative/10 border border-accent-negative/30 rounded-lg p-4 text-accent-negative text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-text-secondary py-8">
            <div className="w-5 h-5 border-2 border-accent-positive/30 border-t-accent-positive rounded-full animate-spin" />
            Analyzing mNAV trends across all companies...
          </div>
        )}

        {summary && (
          <div className="mt-4 prose prose-invert max-w-none">
            <div className="bg-bg-primary rounded-lg p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-accent-warning text-lg">&#x1f916;</span>
                <span className="text-accent-warning font-semibold text-sm">
                  AI Analysis
                </span>
              </div>
              <div className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
                {summary}
              </div>
            </div>
          </div>
        )}

        {!summary && !loading && !error && (
          <div className="text-center py-12 text-text-secondary">
            <p className="text-lg mb-2">No analysis generated yet</p>
            <p className="text-sm">
              Click &quot;Generate Analysis&quot; to get AI-powered insights
              about current mNAV trends
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
