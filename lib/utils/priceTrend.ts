import type { MarketPrice, PriceSnapshot, PriceTrend } from "@/types/market";

const MAX_HISTORY_ENTRIES = 30;
const TREND_WINDOW = 3;

/**
 * Trend from the last 3 distinct observed values (oldest vs newest in that window) rather
 * than a plain two-point comparison — a single noisy tick can't flip it on its own. Fewer
 * than 2 entries means there's nothing to compare yet.
 */
export function computeTrendFromHistory(history: PriceSnapshot[]): PriceTrend {
  if (history.length < 2) return "unchanged";
  const window = history.slice(-TREND_WINDOW);
  const oldest = window[0]!.value;
  const newest = window[window.length - 1]!.value;
  if (newest > oldest) return "up";
  if (newest < oldest) return "down";
  return "unchanged";
}

/** Average of every history entry whose timestamp falls within the last `days` days —
 * however many that is, since the feed isn't updated daily. Null when there's nothing in
 * that window (e.g. the price hasn't changed in longer than the window). */
export function averageOverDays(history: PriceSnapshot[], days: number, now: number): number | null {
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  const inWindow = history.filter((entry) => entry.timestamp >= cutoff);
  if (inWindow.length === 0) return null;
  const sum = inWindow.reduce((total, entry) => total + entry.value, 0);
  return sum / inWindow.length;
}

function pushHistory(history: PriceSnapshot[], entry: PriceSnapshot): PriceSnapshot[] {
  const next = [...history, entry];
  return next.length > MAX_HISTORY_ENTRIES ? next.slice(next.length - MAX_HISTORY_ENTRIES) : next;
}

/**
 * Applies a new observed value to a MarketPrice — the same rule whether it came from live
 * data or a manual edit. Only appends a new history entry (and recomputes the trend) when
 * the value actually changed; a repeated observation just refreshes the freshness label.
 */
export function applyPriceUpdate(
  price: MarketPrice,
  newValue: number | null,
  options: { isLive: boolean; now: string; sourceTimestamp?: number | null },
): MarketPrice {
  const sourceTimestamp = options.sourceTimestamp ?? (options.isLive ? price.sourceTimestamp : null);
  if (newValue === null) {
    return { ...price, isLive: options.isLive, sourceTimestamp };
  }

  const lastEntry = price.history[price.history.length - 1] ?? null;
  if (lastEntry !== null && lastEntry.value === newValue) {
    return { ...price, isLive: options.isLive, sourceTimestamp, updatedAt: options.now };
  }

  const entryTimestamp = sourceTimestamp ?? Date.parse(options.now);
  const history = pushHistory(price.history, { value: newValue, timestamp: entryTimestamp });

  return {
    ...price,
    value: newValue,
    trend: computeTrendFromHistory(history),
    isLive: options.isLive,
    sourceTimestamp,
    updatedAt: options.now,
    history,
  };
}
