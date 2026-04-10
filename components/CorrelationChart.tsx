"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries, IChartApi } from "lightweight-charts";
import { HistoryEntry } from "@/lib/types";
import { COMPANY_TICKERS } from "@/lib/constants";

interface CorrelationChartProps {
  history: HistoryEntry[];
}

export default function CorrelationChart({ history }: CorrelationChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height: 350,
      layout: {
        background: { color: "#1a1f2e" },
        textColor: "#8892b0",
      },
      grid: {
        vertLines: { color: "#2a2f3e" },
        horzLines: { color: "#2a2f3e" },
      },
      rightPriceScale: {
        borderColor: "#2a2f3e",
        visible: true,
      },
      leftPriceScale: {
        borderColor: "#2a2f3e",
        visible: true,
      },
      timeScale: {
        borderColor: "#2a2f3e",
        timeVisible: false,
      },
    });

    chartRef.current = chart;

    // BTC Price on left axis
    const btcSeries = chart.addSeries(LineSeries, {
      color: "#f7931a",
      lineWidth: 2,
      title: "BTC Price ($)",
      priceScaleId: "left",
    });

    btcSeries.setData(
      history.map((entry) => ({
        time: entry.date,
        value: entry.btc_price,
      }))
    );

    // Average mNAV on right axis
    const avgSeries = chart.addSeries(LineSeries, {
      color: "#64ffda",
      lineWidth: 2,
      title: "Avg mNAV",
      priceScaleId: "right",
    });

    avgSeries.setData(
      history.map((entry) => {
        const mnavs = COMPANY_TICKERS
          .filter((t) => entry.companies[t])
          .map((t) => entry.companies[t].mnav);
        const avg = mnavs.length > 0 ? mnavs.reduce((a, b) => a + b, 0) / mnavs.length : 0;
        return { time: entry.date, value: Math.round(avg * 10000) / 10000 };
      })
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
  }, [history]);

  return (
    <div className="bg-bg-card rounded-xl p-4 border border-border">
      <h3 className="text-text-primary font-semibold mb-3">
        BTC Price vs Average mNAV Correlation
      </h3>
      <p className="text-text-secondary text-xs mb-3">
        Orange = BTC Price (left axis) &middot; Teal = Average mNAV across all companies (right axis)
      </p>
      <div ref={containerRef} />
    </div>
  );
}
