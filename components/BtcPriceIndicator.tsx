"use client";

import { useState, useEffect } from "react";
import { fetchBtcPrice } from "@/lib/data";

export default function BtcPriceIndicator() {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    fetchBtcPrice().then(setPrice);
    const interval = setInterval(() => fetchBtcPrice().then(setPrice), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!price) {
    return (
      <div className="text-text-secondary text-sm">BTC: Loading...</div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-bg-card px-4 py-2 rounded-lg">
      <span className="text-text-secondary text-sm">BTC</span>
      <span className="text-accent-positive font-mono font-bold">
        ${price.toLocaleString()}
      </span>
    </div>
  );
}
