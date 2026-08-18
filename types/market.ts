export type MarketPriceId = "tibiaCoinSell" | "tibiaCoinBuy" | "goldTokenSell" | "silverTokenSell";

export type PriceTrend = "up" | "down" | "unchanged";

export interface MarketPrice {
  id: MarketPriceId;
  label: string;
  /** Current price in gold coins. Null when never set. */
  value: number | null;
  previousValue: number | null;
  trend: PriceTrend;
  /** True when `value` came from the live warzone-schedule market feed rather than manual entry. */
  isLive: boolean;
  updatedAt: string | null;
}
