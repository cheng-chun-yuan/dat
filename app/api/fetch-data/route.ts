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

      const quote = result.value as { regularMarketPrice?: number; marketCap?: number };
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
