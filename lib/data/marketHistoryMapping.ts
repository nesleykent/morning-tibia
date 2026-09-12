import type { PriceSnapshot } from "@/types/market";

/** One row of api.tibiamarket.top's `/item_history` — its `MarketValues` schema, narrowed
 * to the fields this app reads. `time` is seconds since the epoch, as a float. */
export interface RawMarketHistoryEntry {
  time: number;
  day_average_sell?: number;
  day_average_buy?: number;
}

/** A ceiling on what gets stored in localStorage, below the window each request asks for
 * (MARKET_HISTORY_DAYS) and far above the widest basis this app offers, "avg14" — so a
 * feed that one day returns more than it was asked for still cannot grow a saved day
 * without bound. */
export const MAX_STORED_HISTORY_ENTRIES = 90;

/**
 * Turns api.tibiamarket.top's raw daily market-history rows into this app's
 * PriceSnapshot[] shape: picks one price field (`day_average_sell` or
 * `day_average_buy`), drops the `-1`-sentinel/missing entries the feed uses for "not
 * traded that day", sorts oldest-first, and caps the length.
 */
export function mapMarketHistoryEntries(
  entries: RawMarketHistoryEntry[],
  field: "day_average_sell" | "day_average_buy",
): PriceSnapshot[] {
  const snapshots = entries
    .map((entry) => ({ value: entry[field], time: entry.time }))
    .filter((entry): entry is { value: number; time: number } => typeof entry.value === "number" && entry.value > 0)
    .map((entry) => ({ value: entry.value, timestamp: Math.round(entry.time * 1000) }))
    .sort((a, b) => a.timestamp - b.timestamp);
  return snapshots.length > MAX_STORED_HISTORY_ENTRIES
    ? snapshots.slice(snapshots.length - MAX_STORED_HISTORY_ENTRIES)
    : snapshots;
}
