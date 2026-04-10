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
                <strong className="text-text-primary">Stock Prices &amp; Market Cap:</strong>{" "}
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
