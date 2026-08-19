import type { PriceSnapshot } from "@/types/market";

export interface RawMarketHistoryEntry {
  time: number;
  day_average_sell?: number;
  day_average_buy?: number;
}

export interface RawMarketHistoryFile {
  snapshots?: RawMarketHistoryEntry[][];
}

/** The dataset spans years of daily entries, but the widest basis this app offers is
 * "avg14" — keep a few months' worth (bounding what gets stored in localStorage) rather
 * than persisting the full history for no functional benefit. */
export const MAX_STORED_HISTORY_ENTRIES = 90;

/**
 * Turns tibia-warzones-schedule's raw daily market-history rows into this app's
 * PriceSnapshot[] shape: picks one price field (`day_average_sell` or
 * `day_average_buy`), drops the `-1`-sentinel/missing entries the upstream feed uses for
 * "not tracked that day", sorts oldest-first, and caps the length.
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
