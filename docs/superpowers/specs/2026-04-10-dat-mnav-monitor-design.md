# DAT.co mNAV Monitor — Design Spec

## Context

This is a course assignment to build a web platform that monitors and visualizes financial indicators for Digital Asset Treasury (DAT) companies. The chosen indicator is **mNAV (Modified Net Asset Value)**, which measures how the market values a company relative to its Bitcoin holdings. The project must demonstrate data collection (40%), visualization (40%), and include a written report (20%), with an optional AI summary bonus (+10%).

## Indicator: mNAV

**Formula**: `mNAV = Market Cap / (BTC Holdings × BTC Price)`

- **mNAV > 1**: Premium — market values the company above its pure BTC holdings (implies market assigns value to the company's strategy, management, or leverage)
- **mNAV < 1**: Discount — market values the company below its BTC holdings
- **mNAV = 1**: Company is valued exactly at its Bitcoin holdings

**Relationship with BTC**: When BTC price rises, mNAV tends to compress (denominator grows faster if market cap doesn't keep pace). When BTC drops, mNAV can expand if the stock holds better than BTC. High-mNAV companies (like MSTR) reflect market confidence in their BTC acquisition strategy.

## Companies Tracked

| Ticker | Company | Notes |
|--------|---------|-------|
| MSTR | MicroStrategy (now Strategy) | Largest corporate BTC holder |
| MARA | Marathon Digital | Major BTC miner |
| RIOT | Riot Platforms | BTC miner |
| COIN | Coinbase | Crypto exchange, holds BTC on balance sheet |
| CLSK | CleanSpark | BTC miner |
| HIVE | HIVE Digital Technologies | BTC miner |

## Architecture

**Next.js app** deployed to Vercel.

```
Data Flow:
  1. Historical mNAV data → hardcoded in public/data/history.json (manually compiled)
  2. Company BTC holdings → hardcoded in public/data/holdings.json
  3. Live BTC price → fetched client-side from CoinGecko API (free, CORS-friendly)
  4. AI summaries → server-side API route proxies OpenAI (key in env var, never exposed)
  5. Charts → rendered client-side with TradingView Lightweight Charts + Chart.js
```

**Deployment**: Vercel (free tier, auto-deploys from GitHub, handles HTTPS).

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (dark theme)
- **Charts**: TradingView Lightweight Charts + Chart.js (npm packages)
- **AI**: OpenAI API via server-side API route (`/api/ai-summary`)
- **Deployment**: Vercel

## Data Sources

### Historical mNAV Data (`public/data/history.json`)
- Manually compiled daily mNAV snapshots
- Structure: array of daily records, each containing date, BTC price, and per-company data (stock price, market cap, BTC holdings, computed mNAV)
- Covers a meaningful time range (at least 90 days of daily data)

### Company Holdings (`public/data/holdings.json`)
- Static file with each company's current BTC holdings, shares outstanding, and metadata
- Updated manually when companies report new holdings

### Live BTC Price
- Source: CoinGecko API `/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`
- Free tier, no API key required, CORS-friendly from browsers
- Used to show a real-time BTC price indicator on the dashboard

### OpenAI API (AI Summary)
- Called via Next.js API route `/api/ai-summary` (server-side, key in `OPENAI_API_KEY` env var)
- Sends recent mNAV data as context, asks for trend summary and insights
- Key stored securely in Vercel environment variables, never exposed to client

## UI Design

### Layout: Tabbed Dashboard

Dark-themed financial dashboard with tab navigation:

**Tabs**:
1. **Overview** — default landing tab
2. **MSTR** — MicroStrategy detail
3. **MARA** — Marathon Digital detail
4. **RIOT** — Riot Platforms detail
5. **COIN** — Coinbase detail
6. **CLSK** — CleanSpark detail
7. **HIVE** — HIVE Digital detail
8. **AI Insights** — OpenAI-generated analysis

### Overview Tab
- **Header**: Title "DAT.co mNAV Monitor" + live BTC price indicator (green if up, red if down)
- **Summary cards row**: One card per company showing current mNAV value, colored (green > 1, red < 1), with a small trend arrow
- **Time-series chart**: All companies' mNAV plotted together over time (Lightweight Charts, multi-line)
- **Comparison bar chart**: Current mNAV values side-by-side (Chart.js horizontal bar)
- **mNAV = 1 reference line**: Horizontal dashed line on charts marking the premium/discount boundary

### Per-Company Tab
- **Company header**: Name, ticker, current stock price, market cap, BTC holdings count
- **mNAV time-series chart**: Single company's mNAV over time (Lightweight Charts)
- **Key metrics table**: Current mNAV, 7-day change, 30-day change, all-time high/low mNAV
- **BTC value vs Market Cap**: Area chart or bar showing the relationship

### AI Insights Tab
- **Generate button**: Triggers the API call to `/api/ai-summary`
- **Summary display**: Rendered markdown-style text showing:
  - Overall market trend
  - Per-company highlights
  - Notable mNAV movements
  - Relationship to BTC price movements

## File Structure

```
dat/
  app/
    layout.tsx            # Root layout with dark theme, fonts
    page.tsx              # Main dashboard page (tabbed UI)
    api/
      ai-summary/
        route.ts          # Server-side OpenAI proxy endpoint
  components/
    TabNav.tsx            # Tab navigation component
    OverviewTab.tsx       # Overview tab with summary cards + charts
    CompanyTab.tsx        # Per-company detail tab (reusable)
    AIInsightsTab.tsx     # AI insights tab
    MnavChart.tsx         # Lightweight Charts wrapper for mNAV time-series
    ComparisonChart.tsx   # Chart.js bar chart for mNAV comparison
    BtcPriceIndicator.tsx # Live BTC price display
    SummaryCard.tsx       # Single company mNAV summary card
  lib/
    data.ts               # Data loading and types
    constants.ts          # Company colors, names, config
  public/
    data/
      history.json        # Hardcoded daily mNAV time-series data
      holdings.json       # Company BTC holdings and metadata
  tailwind.config.ts      # Tailwind config with custom dark theme colors
  .env.local              # OPENAI_API_KEY (local dev)
```

## Color Scheme (Tailwind Custom)

- Background: `#0a0e17` (deep navy/black)
- Card/panel background: `#1a1f2e`
- Primary accent (positive/premium): `#64ffda` (teal green)
- Negative/discount: `#e94560` (coral red)
- Warning/highlight: `#ffd93d` (gold)
- Text primary: `#e6f1ff`
- Text secondary: `#8892b0`
- mNAV = 1 reference line: `#8892b0` dashed

## Data Schema

### `public/data/history.json`
```json
[
  {
    "date": "2026-01-10",
    "btc_price": 72000,
    "companies": {
      "MSTR": {
        "stock_price": 280.50,
        "shares_outstanding": 230000000,
        "market_cap": 64515000000,
        "btc_holdings": 538200,
        "mnav": 1.66
      }
    }
  }
]
```

### `public/data/holdings.json`
```json
{
  "MSTR": {
    "name": "MicroStrategy",
    "ticker": "MSTR",
    "btc_holdings": 538200,
    "shares_outstanding": 230000000,
    "sector": "Software / BTC Treasury",
    "last_updated": "2026-04-09"
  }
}
```

## API Route: `/api/ai-summary`

**Method**: POST

**Request body**:
```json
{
  "recentData": [/* last 30 days of history.json entries */]
}
```

**Response**: Streamed text or JSON with the AI-generated summary.

**Server-side logic**:
1. Receive recent mNAV data
2. Construct prompt asking OpenAI to analyze trends, compare companies, explain BTC correlation
3. Call OpenAI API with `OPENAI_API_KEY` from environment
4. Return the generated summary

## Responsive Design

- Desktop: Full tab bar, side-by-side charts where appropriate
- Tablet: Stacked layout, full-width charts
- Mobile: Scrollable tab bar, single-column layout, touch-friendly chart interactions

## Verification Plan

1. Run `bun dev` — all tabs should render at localhost:3000
2. Charts should display historical data from `history.json`
3. Live BTC price should fetch and display from CoinGecko
4. Tab switching should work without page reload (client-side navigation)
5. AI Insights tab should call `/api/ai-summary` and display the response
6. Deploy to Vercel and verify the public URL works
7. Test on mobile viewport (Chrome DevTools responsive mode)
8. Verify `OPENAI_API_KEY` is not exposed in client-side bundle
