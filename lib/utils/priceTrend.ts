import type { MarketTrendBasis, PriceSnapshot, PriceTrend } from "@/types/market";

/** How many history entries each basis averages over — an entry count, not a day count,
 * since the feed doesn't update daily (a "7-day window" could span 2 entries or 20). */
export const ENTRIES_BY_BASIS: Record<MarketTrendBasis, number> = {
  last: 1,
  avg3: 3,
  avg7: 7,
  avg14: 14,
};

/** Average of the last `count` history entries (fewer if there aren't that many yet).
 * Null only when there's no history at all. */
export function averageOfLastEntries(history: PriceSnapshot[], count: number): number | null {
  if (history.length === 0) return null;
  const window = history.slice(-count);
  const sum = window.reduce((total, entry) => total + entry.value, 0);
  return sum / window.length;
}

/**
 * Trend for a given basis: compares that basis's average including the latest entry
 * against the same basis computed one entry earlier (i.e. as of just before the latest
 * update) — so "avg7" trend reflects whether the 7-entry average moved, not just whether
 * the single newest tick moved. For `count === 1` this reduces to a plain two-point
 * comparison, matching "last entry" trend exactly. Fewer than 2 entries total means
 * there's nothing to compare yet.
 */
export function computeTrendForBasis(history: PriceSnapshot[], count: number): PriceTrend {
  if (history.length < 2) return "unchanged";
  const current = averageOfLastEntries(history, count);
  const previous = averageOfLastEntries(history.slice(0, -1), count);
  if (current === null || previous === null) return "unchanged";
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "unchanged";
}
