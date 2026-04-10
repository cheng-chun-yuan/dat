"use client";

import { useRef, useEffect } from "react";
import {
  Chart,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { COMPANY_COLORS } from "@/lib/constants";
import { HistoryEntry } from "@/lib/types";

Chart.register(
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

interface ComparisonChartProps {
  history: HistoryEntry[];
  tickers: string[];
}

export default function ComparisonChart({
  history,
  tickers,
}: ComparisonChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const latest = history[history.length - 1];
    if (!latest) return;

    const labels = tickers.filter((t) => latest.companies[t]);
    const values = labels.map((t) => latest.companies[t].mnav);
    const colors = labels.map((t) => COMPANY_COLORS[t] || "#ffffff");

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Current mNAV",
            data: values,
            backgroundColor: colors.map((c) => c + "80"),
            borderColor: colors,
            borderWidth: 2,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1a1f2e",
            titleColor: "#e6f1ff",
            bodyColor: "#8892b0",
            borderColor: "#2a2f3e",
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: { color: "#8892b0" },
            grid: { color: "#2a2f3e" },
          },
          y: {
            ticks: { color: "#8892b0" },
            grid: { color: "#2a2f3e" },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [history, tickers]);

  return (
    <div className="bg-bg-card rounded-xl p-4 border border-border">
      <h3 className="text-text-primary font-semibold mb-4">
        Current mNAV Comparison
      </h3>
      <div style={{ height: 300 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
