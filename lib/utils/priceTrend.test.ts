import { describe, expect, it } from "vitest";
import { applyPriceUpdate, computeTrend } from "./priceTrend";
import type { MarketPrice } from "@/types/market";

describe("computeTrend", () => {
  it("returns unchanged when either value is missing", () => {
    expect(computeTrend(null, 100)).toBe("unchanged");
    expect(computeTrend(100, null)).toBe("unchanged");
  });

  it("returns up/down/unchanged correctly", () => {
    expect(computeTrend(100, 120)).toBe("up");
    expect(computeTrend(120, 100)).toBe("down");
    expect(computeTrend(100, 100)).toBe("unchanged");
  });
});

describe("applyPriceUpdate", () => {
  const base: MarketPrice = {
    id: "tibiaCoinSell",
    label: "Tibia Coin — sell",
    value: null,
    previousValue: null,
    trend: "unchanged",
    isLive: false,
    updatedAt: null,
  };

  it("sets the first value without a trend", () => {
    const result = applyPriceUpdate(base, 40000, { isLive: true, now: "2026-08-18T10:00:00Z" });
    expect(result.value).toBe(40000);
    expect(result.previousValue).toBeNull();
    expect(result.trend).toBe("unchanged");
    expect(result.isLive).toBe(true);
  });

  it("slides the previous value and computes trend on a real change", () => {
    const withValue = applyPriceUpdate(base, 40000, { isLive: true, now: "t1" });
    const updated = applyPriceUpdate(withValue, 41000, { isLive: true, now: "t2" });
    expect(updated.previousValue).toBe(40000);
    expect(updated.value).toBe(41000);
    expect(updated.trend).toBe("up");
  });

  it("does not disturb previousValue when the new value repeats the current one", () => {
    const withValue = applyPriceUpdate(base, 40000, { isLive: true, now: "t1" });
    const repeated = applyPriceUpdate(withValue, 40000, { isLive: true, now: "t2" });
    expect(repeated.previousValue).toBeNull();
    expect(repeated.trend).toBe("unchanged");
  });
});
