export const COMPANY_COLORS: Record<string, string> = {
  MSTR: "#64ffda",
  MARA: "#e94560",
  RIOT: "#ffd93d",
  COIN: "#7b68ee",
  CLSK: "#ff6b6b",
  HIVE: "#48bfe3",
};

export const COMPANY_TICKERS = [
  "MSTR",
  "MARA",
  "RIOT",
  "COIN",
  "CLSK",
  "HIVE",
] as const;

export type CompanyTicker = (typeof COMPANY_TICKERS)[number];
