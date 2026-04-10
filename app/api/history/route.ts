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
          }) as { quotes?: Array<{ date?: Date; close?: number | null }> };

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
