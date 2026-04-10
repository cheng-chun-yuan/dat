# DAT.co mNAV Monitor — Enhancement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the existing mNAV dashboard to use real data from APIs (instead of hardcoded JSON), add a BTC price correlation chart, add a Report tab, and deploy to Vercel — fulfilling all grading criteria.

**Architecture:** Add a server-side API route `/api/fetch-data` that uses Yahoo Finance (via `yahoo-finance2`) to fetch real stock prices and CoinGecko for BTC price, then computes mNAV. The frontend fetches from this API instead of static JSON. A new Report tab provides the written analysis. A new BTC correlation chart overlays BTC price alongside mNAV.

**Tech Stack:** Next.js 16 (App Router), TypeScript, yahoo-finance2, CoinGecko API, lightweight-charts, chart.js, OpenAI API, Vercel deployment.

---

### Task 1: Install yahoo-finance2 dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
bun add yahoo-finance2
```

- [ ] **Step 2: Verify installation**

```bash
bun run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add yahoo-finance2 for real stock data"
```

---

### Task 2: Create server-side data fetching API route

This is the core data collection piece (40% of grade). The API route fetches real stock prices from Yahoo Finance, real BTC price from CoinGecko, and computes mNAV using hardcoded BTC holdings (which change infrequently and are sourced from public filings).

**Files:**
- Create: `app/api/fetch-data/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
// app/api/fetch-data/route.ts
import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

const COMPANIES: Record<
  string,
  { name: string; btc_holdings: number; shares_outstanding: number; sector: string; description: string }
> = {
  MSTR: {
    name: "Strategy (MicroStrategy)",
    btc_holdings: 528185,
    shares_outstanding: 244440000,
    sector: "Software / BTC Treasury",
    description: "The largest corporate Bitcoin holder.",
  },
  MARA: {
    name: "MARA Holdings",
    btc_holdings: 47600,
    shares_outstanding: 337000000,
    sector: "Bitcoin Mining",
    description: "One of the largest publicly traded Bitcoin mining companies.",
  },
  RIOT: {
    name: "Riot Platforms",
    btc_holdings: 19211,
    shares_outstanding: 420000000,
    sector: "Bitcoin Mining",
    description: "A leading Bitcoin mining company.",
  },
  COIN: {
    name: "Coinbase Global",
    btc_holdings: 9480,
    shares_outstanding: 250000000,
    sector: "Crypto Exchange",
    description: "The largest cryptocurrency exchange in the US.",
  },
  CLSK: {
    name: "CleanSpark",
    btc_holdings: 11869,
    shares_outstanding: 295000000,
    sector: "Bitcoin Mining",
    description: "An American Bitcoin mining company.",
  },
  HIVE: {
    name: "HIVE Digital Technologies",
    btc_holdings: 2201,
    shares_outstanding: 140000000,
    sector: "Bitcoin Mining",
    description: "A global green-energy focused Bitcoin mining company.",
  },
};

export async function GET() {
  try {
    // 1. Fetch BTC price from CoinGecko
    const btcRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
      { next: { revalidate: 300 } }
    );
    const btcData = await btcRes.json();
    const btcPrice = btcData.bitcoin.usd as number;

    // 2. Fetch stock quotes from Yahoo Finance
    const tickers = Object.keys(COMPANIES);
    const quotes = await Promise.allSettled(
      tickers.map((ticker) => yahooFinance.quote(ticker))
    );

    // 3. Compute mNAV for each company
    const companies: Record<string, {
      stock_price: number;
      shares_outstanding: number;
      market_cap: number;
      btc_holdings: number;
      mnav: number;
    }> = {};

    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      const result = quotes[i];
      if (result.status !== "fulfilled" || !result.value) continue;

      const quote = result.value;
      const price = quote.regularMarketPrice ?? 0;
      const marketCap = quote.marketCap ?? price * COMPANIES[ticker].shares_outstanding;

      const btcValue = COMPANIES[ticker].btc_holdings * btcPrice;
      const mnav = btcValue > 0 ? marketCap / btcValue : 0;

      companies[ticker] = {
        stock_price: price,
        shares_outstanding: COMPANIES[ticker].shares_outstanding,
        market_cap: marketCap,
        btc_holdings: COMPANIES[ticker].btc_holdings,
        mnav: Math.round(mnav * 10000) / 10000,
      };
    }

    const today = new Date().toISOString().split("T")[0];

    return NextResponse.json({
      date: today,
      btc_price: btcPrice,
      companies,
      holdings: COMPANIES,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test locally**

```bash
bun run dev
# In another terminal:
curl http://localhost:3000/api/fetch-data | jq .
```

Expected: JSON with real BTC price, real stock prices, computed mNAV for each company.

- [ ] **Step 3: Commit**

```bash
git add app/api/fetch-data/route.ts
git commit -m "feat: add API route for real-time mNAV data from Yahoo Finance + CoinGecko"
```

---

### Task 3: Create historical data API route

Fetches historical stock prices to build time-series mNAV data (not hardcoded).

**Files:**
- Create: `app/api/history/route.ts`

- [ ] **Step 1: Create the history API route**

```typescript
// app/api/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

const BTC_HOLDINGS: Record<string, number> = {
  MSTR: 528185,
  MARA: 47600,
  RIOT: 19211,
  COIN: 9480,
  CLSK: 11869,
  HIVE: 2201,
};

const SHARES: Record<string, number> = {
  MSTR: 244440000,
  MARA: 337000000,
  RIOT: 420000000,
  COIN: 250000000,
  CLSK: 295000000,
  HIVE: 140000000,
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = Math.min(Number(searchParams.get("days") || "90"), 365);

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // 1. Fetch BTC historical prices from CoinGecko
    const btcDays = Math.min(days, 365);
    const btcRes = await fetch(
      `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${btcDays}&interval=daily`,
      { next: { revalidate: 3600 } }
    );
    const btcData = await btcRes.json();
    const btcPrices: Record<string, number> = {};
    for (const [timestamp, price] of btcData.prices) {
      const date = new Date(timestamp).toISOString().split("T")[0];
      btcPrices[date] = price;
    }

    // 2. Fetch historical stock data for all tickers
    const tickers = Object.keys(BTC_HOLDINGS);
    const stockHistories: Record<string, Record<string, { close: number; marketCap?: number }>> = {};

    await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const result = await yahooFinance.chart(ticker, {
            period1: startDate.toISOString().split("T")[0],
            period2: endDate.toISOString().split("T")[0],
            interval: "1d",
          });

          stockHistories[ticker] = {};
          if (result.quotes) {
            for (const q of result.quotes) {
              if (q.date && q.close) {
                const date = new Date(q.date).toISOString().split("T")[0];
                stockHistories[ticker][date] = {
                  close: q.close,
                };
              }
            }
          }
        } catch {
          stockHistories[ticker] = {};
        }
      })
    );

    // 3. Build history entries for dates that have both BTC price and stock data
    const allDates = Object.keys(btcPrices).sort();
    const history = [];

    for (const date of allDates) {
      const btcPrice = btcPrices[date];
      const companies: Record<string, {
        stock_price: number;
        shares_outstanding: number;
        market_cap: number;
        btc_holdings: number;
        mnav: number;
      }> = {};

      let hasAnyCompany = false;

      for (const ticker of tickers) {
        const stockDay = stockHistories[ticker]?.[date];
        if (!stockDay) continue;

        const marketCap = stockDay.close * SHARES[ticker];
        const btcValue = BTC_HOLDINGS[ticker] * btcPrice;
        const mnav = btcValue > 0 ? marketCap / btcValue : 0;

        companies[ticker] = {
          stock_price: Math.round(stockDay.close * 100) / 100,
          shares_outstanding: SHARES[ticker],
          market_cap: Math.round(marketCap),
          btc_holdings: BTC_HOLDINGS[ticker],
          mnav: Math.round(mnav * 10000) / 10000,
        };
        hasAnyCompany = true;
      }

      if (hasAnyCompany) {
        history.push({
          date,
          btc_price: Math.round(btcPrice * 100) / 100,
          companies,
        });
      }
    }

    return NextResponse.json(history);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test locally**

```bash
curl "http://localhost:3000/api/history?days=90" | jq '.[0:2]'
```

Expected: Array of daily entries with real stock prices, BTC prices, and computed mNAV.

- [ ] **Step 3: Commit**

```bash
git add app/api/history/route.ts
git commit -m "feat: add historical mNAV API using Yahoo Finance + CoinGecko"
```

---

### Task 4: Update frontend to use real API data instead of static JSON

Switch the data loading from static `history.json` to the live API routes. Keep the static JSON as fallback.

**Files:**
- Modify: `lib/data.ts`

- [ ] **Step 1: Update data loading functions**

Replace the contents of `lib/data.ts` with:

```typescript
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
```

- [ ] **Step 2: Verify build**

```bash
bun run build
```

Expected: Build succeeds.

- [ ] **Step 3: Test in browser**

```bash
bun run dev
```

Open the app — it should show real market data. If APIs are rate-limited, it falls back to static JSON gracefully.

- [ ] **Step 4: Commit**

```bash
git add lib/data.ts
git commit -m "feat: switch data loading from static JSON to real API with fallback"
```

---

### Task 5: Add BTC Price vs mNAV correlation chart to Overview

Add a dual-axis chart showing BTC price and average mNAV on the same timeline to visualize the correlation.

**Files:**
- Create: `components/CorrelationChart.tsx`
- Modify: `components/OverviewTab.tsx`

- [ ] **Step 1: Create the correlation chart component**

```typescript
// components/CorrelationChart.tsx
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
```

- [ ] **Step 2: Add to OverviewTab**

In `components/OverviewTab.tsx`, add the import and render the component:

Add import at top:
```typescript
import CorrelationChart from "./CorrelationChart";
```

Add after the ComparisonChart in the JSX (before the closing `</div>` of the space-y-6 container):
```tsx
{/* BTC vs mNAV Correlation */}
<CorrelationChart history={history} />
```

- [ ] **Step 3: Verify it renders**

```bash
bun run dev
```

Check the Overview tab — the correlation chart should appear below the bar chart.

- [ ] **Step 4: Commit**

```bash
git add components/CorrelationChart.tsx components/OverviewTab.tsx
git commit -m "feat: add BTC price vs mNAV correlation chart to overview"
```

---

### Task 6: Add Report tab

Create a Report tab with the written analysis required for the assignment (20% of grade). Covers: indicator choice, BTC relationship, methodology, and data sources.

**Files:**
- Create: `components/ReportTab.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create the Report tab component**

```tsx
// components/ReportTab.tsx
"use client";

export default function ReportTab() {
  return (
    <div className="max-w-4xl space-y-8">
      <div className="bg-bg-card rounded-xl p-8 border border-border">
        <h2 className="text-2xl font-bold text-text-primary mb-6">
          DAT.co mNAV Monitor — Project Report
        </h2>

        {/* Section 1: Selected Indicator */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-accent-positive mb-3">
            1. Selected Indicator: mNAV (Modified Net Asset Value)
          </h3>
          <div className="text-text-secondary leading-relaxed space-y-3">
            <p>
              <strong className="text-text-primary">What is mNAV?</strong>{" "}
              Modified Net Asset Value (mNAV) measures how the market values a
              Digital Asset Treasury (DAT) company relative to the value of its
              Bitcoin holdings. It is calculated as:
            </p>
            <div className="bg-bg-primary rounded-lg p-4 font-mono text-accent-warning text-center text-lg">
              mNAV = Market Cap / (BTC Holdings × BTC Price)
            </div>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong className="text-text-primary">mNAV &gt; 1 (Premium):</strong>{" "}
                The market values the company above the dollar value of its Bitcoin,
                implying the market assigns value to the company&apos;s strategy,
                management, or operational leverage.
              </li>
              <li>
                <strong className="text-text-primary">mNAV &lt; 1 (Discount):</strong>{" "}
                The market values the company below its Bitcoin holdings, suggesting
                skepticism about management or structural issues.
              </li>
              <li>
                <strong className="text-text-primary">mNAV = 1:</strong>{" "}
                The company is valued exactly at the worth of its Bitcoin holdings.
              </li>
            </ul>
            <p>
              <strong className="text-text-primary">Why mNAV?</strong>{" "}
              mNAV is the most widely used valuation metric for DAT companies
              because it directly answers the fundamental question investors care about:
              &quot;Am I paying a premium or discount to own Bitcoin through this
              company instead of buying BTC directly?&quot; This makes it the most
              actionable indicator for investment decisions in the DAT sector.
            </p>
          </div>
        </section>

        {/* Section 2: Relationship with Bitcoin */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-accent-positive mb-3">
            2. Relationship with Bitcoin (BTC)
          </h3>
          <div className="text-text-secondary leading-relaxed space-y-3">
            <p>
              mNAV is fundamentally tied to the Bitcoin price through the denominator
              of the formula (BTC Holdings × BTC Price). Key observations about the
              BTC-mNAV relationship:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong className="text-text-primary">BTC Rally → mNAV Compression:</strong>{" "}
                When BTC price rises rapidly, the denominator (BTC value) grows faster
                than the numerator (market cap) unless the stock rallies even harder.
                This often compresses mNAV toward 1.0.
              </li>
              <li>
                <strong className="text-text-primary">BTC Decline → mNAV Expansion:</strong>{" "}
                When BTC drops, stocks of DAT companies may hold better than the
                underlying BTC value (especially if investors believe in a recovery),
                causing mNAV to expand above 1.0.
              </li>
              <li>
                <strong className="text-text-primary">Sentiment Amplifier:</strong>{" "}
                In bullish crypto markets, high-mNAV companies like MicroStrategy (MSTR)
                often see their premium expand as retail investors use the stock as
                leveraged BTC exposure. This creates a reflexive cycle: rising BTC →
                rising stock → higher mNAV → more investor interest.
              </li>
              <li>
                <strong className="text-text-primary">Divergences Signal Opportunity:</strong>{" "}
                When a company&apos;s mNAV drops below 1.0 while BTC is stable or rising,
                it may signal either a buying opportunity (if the discount is temporary)
                or fundamental problems with the company.
              </li>
            </ul>
            <p>
              Our correlation chart on the Overview tab visually demonstrates this
              relationship — BTC price movements (orange line) are overlaid with the
              average mNAV across all tracked companies (teal line), revealing how
              tightly correlated (or divergent) these metrics can be.
            </p>
          </div>
        </section>

        {/* Section 3: Data Sources & Methodology */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-accent-positive mb-3">
            3. Data Collection Methodology
          </h3>
          <div className="text-text-secondary leading-relaxed space-y-3">
            <p>This platform aggregates data from multiple sources:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong className="text-text-primary">Stock Prices & Market Cap:</strong>{" "}
                Yahoo Finance API (via yahoo-finance2) — provides real-time and historical
                stock quotes for MSTR, MARA, RIOT, COIN, CLSK, and HIVE.
              </li>
              <li>
                <strong className="text-text-primary">BTC Price:</strong>{" "}
                CoinGecko API (free tier) — provides real-time and historical Bitcoin
                prices in USD. Updated every 60 seconds on the dashboard.
              </li>
              <li>
                <strong className="text-text-primary">BTC Holdings:</strong>{" "}
                Sourced from company quarterly filings (10-Q/10-K), press releases,
                and investor presentations. These are updated manually as companies
                report new acquisitions.
              </li>
            </ul>
            <p>
              The mNAV is computed server-side using Next.js API routes, ensuring
              API keys are never exposed to the client. Historical data covers up to
              90 days of daily granularity.
            </p>
          </div>
        </section>

        {/* Section 4: Companies Tracked */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-accent-positive mb-3">
            4. Companies Tracked
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="text-left py-2 px-3">Ticker</th>
                  <th className="text-left py-2 px-3">Company</th>
                  <th className="text-left py-2 px-3">Sector</th>
                  <th className="text-left py-2 px-3">Role</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-mono text-accent-positive">MSTR</td>
                  <td className="py-2 px-3">Strategy (MicroStrategy)</td>
                  <td className="py-2 px-3">Software / BTC Treasury</td>
                  <td className="py-2 px-3">Largest corporate BTC holder</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-mono text-accent-negative">MARA</td>
                  <td className="py-2 px-3">MARA Holdings</td>
                  <td className="py-2 px-3">Bitcoin Mining</td>
                  <td className="py-2 px-3">Major BTC miner</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-mono text-accent-warning">RIOT</td>
                  <td className="py-2 px-3">Riot Platforms</td>
                  <td className="py-2 px-3">Bitcoin Mining</td>
                  <td className="py-2 px-3">BTC miner</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-mono" style={{color: "#7b68ee"}}>COIN</td>
                  <td className="py-2 px-3">Coinbase Global</td>
                  <td className="py-2 px-3">Crypto Exchange</td>
                  <td className="py-2 px-3">Largest US crypto exchange</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 px-3 font-mono" style={{color: "#ff6b6b"}}>CLSK</td>
                  <td className="py-2 px-3">CleanSpark</td>
                  <td className="py-2 px-3">Bitcoin Mining</td>
                  <td className="py-2 px-3">Sustainable BTC miner</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono" style={{color: "#48bfe3"}}>HIVE</td>
                  <td className="py-2 px-3">HIVE Digital Technologies</td>
                  <td className="py-2 px-3">Bitcoin Mining</td>
                  <td className="py-2 px-3">Green-energy BTC miner</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Technical Implementation */}
        <section>
          <h3 className="text-lg font-semibold text-accent-positive mb-3">
            5. Technical Implementation
          </h3>
          <div className="text-text-secondary leading-relaxed space-y-3">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong className="text-text-primary">Framework:</strong> Next.js 16 (App Router) with TypeScript
              </li>
              <li>
                <strong className="text-text-primary">Styling:</strong> Tailwind CSS v4 with custom dark theme
              </li>
              <li>
                <strong className="text-text-primary">Charts:</strong> TradingView Lightweight Charts (time-series) + Chart.js (bar charts)
              </li>
              <li>
                <strong className="text-text-primary">AI:</strong> OpenAI GPT-4o-mini via server-side API route for trend analysis
              </li>
              <li>
                <strong className="text-text-primary">Deployment:</strong> Vercel (auto-deploy from GitHub)
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add Report tab to page.tsx**

In `app/page.tsx`:

Add import:
```typescript
import ReportTab from "@/components/ReportTab";
```

Update the TABS array to include Report:
```typescript
const TABS = [
  { id: "overview", label: "Overview" },
  ...COMPANY_TICKERS.map((t) => ({ id: t, label: t })),
  { id: "ai", label: "AI Insights" },
  { id: "report", label: "Report" },
];
```

Add the tab render in the main content area (after the AI tab conditional):
```tsx
{activeTab === "report" && <ReportTab />}
```

- [ ] **Step 3: Verify it renders**

```bash
bun run dev
```

Click the "Report" tab — the full report should display.

- [ ] **Step 4: Commit**

```bash
git add components/ReportTab.tsx app/page.tsx
git commit -m "feat: add Report tab with indicator analysis and BTC relationship"
```

---

### Task 7: Build and verify everything works together

**Files:** None (verification only)

- [ ] **Step 1: Run build**

```bash
bun run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run dev and manually test all tabs**

```bash
bun run dev
```

Test checklist:
1. Overview tab: summary cards, mNAV time-series chart, comparison bar chart, correlation chart
2. Each company tab (MSTR, MARA, RIOT, COIN, CLSK, HIVE): stats, chart, metrics
3. AI Insights tab: generate button works (requires OPENAI_API_KEY in .env.local)
4. Report tab: all sections render correctly
5. BTC price indicator in header updates

- [ ] **Step 3: Commit final state**

```bash
git add -A
git commit -m "chore: verify full build and all features"
```

---

### Task 8: Deploy to Vercel

**Files:** None (deployment)

- [ ] **Step 1: Initialize git repo and push to GitHub**

```bash
git init  # if not already done
git add -A
git commit -m "feat: DAT.co mNAV monitor - complete dashboard"
gh repo create dat-mnav-monitor --public --source=. --push
```

- [ ] **Step 2: Deploy to Vercel**

```bash
bunx vercel --prod
```

Or connect via Vercel dashboard:
1. Go to vercel.com → New Project → Import from GitHub
2. Select the `dat-mnav-monitor` repo
3. Add environment variable: `OPENAI_API_KEY` = your key
4. Deploy

- [ ] **Step 3: Verify deployed URL**

Open the Vercel URL and test all tabs work on the live site.

- [ ] **Step 4: Record the deployed URL**

Save the URL for the report submission.
