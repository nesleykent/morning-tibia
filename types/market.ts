export type MarketPriceId = "tibiaCoinSell" | "tibiaCoinBuy" | "goldTokenSell" | "silverTokenSell";

export type PriceTrend = "up" | "down" | "unchanged";

/** Which window the displayed price and trend arrow are computed over — an entry count,
 * not a day count, since the feed doesn't update daily (see lib/utils/priceTrend.ts). */
export type MarketTrendBasis = "last" | "avg3" | "avg7" | "avg14";

export interface PriceSnapshot {
  value: number;
  /** ms since epoch — the source data's own timestamp for a live entry (when the price
   * actually last changed in-game, not when we happened to poll it), or the moment of a
   * manual edit. */
  timestamp: number;
}

export interface MarketPrice {
  id: MarketPriceId;
  label: string;
  /** Current (most recent) price in gold coins. Null when never set. */
  value: number | null;
  /** True when `value` came from the live api.tibiamarket.top feed rather than manual entry. */
  isLive: boolean;
  /** When the live feed's current snapshot was taken (ms since epoch) — null for manual entries. */
  sourceTimestamp: number | null;
  updatedAt: string | null;
  /** Bounded rolling log of distinct observed values, oldest first — the source of truth
   * for the trend and the N-day average. A new entry is only appended when the value
   * actually changes, so this naturally handles a feed that isn't updated every day. */
  history: PriceSnapshot[];
}
