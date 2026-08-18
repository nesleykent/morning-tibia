import type { MarketPrice, PriceTrend } from "@/types/market";

export function computeTrend(previousValue: number | null, newValue: number | null): PriceTrend {
  if (previousValue === null || newValue === null) return "unchanged";
  if (newValue > previousValue) return "up";
  if (newValue < previousValue) return "down";
  return "unchanged";
}

/**
 * Applies a new observed value to a MarketPrice, sliding the old value into
 * `previousValue` and recomputing the trend — the same rule whether the new
 * value came from live data or a manual edit.
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
  if (price.value === newValue) {
    return { ...price, isLive: options.isLive, sourceTimestamp, updatedAt: options.now };
  }
  return {
    ...price,
    previousValue: price.value,
    value: newValue,
    trend: computeTrend(price.value, newValue),
    isLive: options.isLive,
    sourceTimestamp,
    updatedAt: options.now,
  };
}
