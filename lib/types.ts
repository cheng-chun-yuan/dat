export interface CompanyDayData {
  stock_price: number;
  shares_outstanding: number;
  market_cap: number;
  btc_holdings: number;
  mnav: number;
}

export interface HistoryEntry {
  date: string;
  btc_price: number;
  companies: Record<string, CompanyDayData>;
}

export interface HoldingsEntry {
  name: string;
  ticker: string;
  btc_holdings: number;
  shares_outstanding: number;
  sector: string;
  last_updated: string;
  description: string;
}

export type HoldingsData = Record<string, HoldingsEntry>;
