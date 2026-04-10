"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries, IChartApi } from "lightweight-charts";
import { HistoryEntry } from "@/lib/types";
import { COMPANY_COLORS } from "@/lib/constants";

interface MnavChartProps {
  history: HistoryEntry[];
  tickers: string[];
  height?: number;
}

export default function MnavChart({
  history,
  tickers,
  height = 400,
}: MnavChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { color: "#1a1f2e" },
        textColor: "#8892b0",
      },
      grid: {
        vertLines: { color: "#2a2f3e" },
        horzLines: { color: "#2a2f3e" },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: "#2a2f3e",
      },
      timeScale: {
        borderColor: "#2a2f3e",
        timeVisible: false,
      },
    });

    chartRef.current = chart;

    for (const ticker of tickers) {
      const color = COMPANY_COLORS[ticker] || "#ffffff";
      const series = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        title: ticker,
      });

      const data = history
        .filter((entry) => entry.companies[ticker])
        .map((entry) => ({
          time: entry.date,
          value: entry.companies[ticker].mnav,
        }));

      series.setData(data);
    }

    // Add mNAV = 1 reference line
    const refSeries = chart.addSeries(LineSeries, {
      color: "#8892b0",
      lineWidth: 1,
      lineStyle: 2, // dashed
      title: "mNAV = 1",
      crosshairMarkerVisible: false,
    });

    refSeries.setData(
      history.map((entry) => ({
        time: entry.date,
        value: 1,
      }))
    );

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [history, tickers, height]);

  return (
    <div className="bg-bg-card rounded-xl p-4 border border-border">
      <div ref={containerRef} />
    </div>
  );
}
