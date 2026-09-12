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

/**
 * Day-by-day history for each tracked price, as the live feed delivers it.
 *
 * Partial on purpose: api.tibiamarket.top rate-limits by address, so the three items are
 * fetched one after another and each one is handed over as it lands rather than the reader
 * waiting on the slowest. An id that isn't here yet simply hasn't arrived; every consumer
 * already treats a price with no history as one it cannot speak about.
 */
export type MarketHistory = Partial<Record<MarketPriceId, PriceSnapshot[]>>;

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
