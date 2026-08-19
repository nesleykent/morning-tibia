import { describe, expect, it } from "vitest";
import { applyPriceUpdate, averageOverDays, computeTrendFromHistory } from "./priceTrend";
import type { MarketPrice, PriceSnapshot } from "@/types/market";

describe("computeTrendFromHistory", () => {
  it("returns unchanged with fewer than 2 entries", () => {
    expect(computeTrendFromHistory([])).toBe("unchanged");
    expect(computeTrendFromHistory([{ value: 100, timestamp: 0 }])).toBe("unchanged");
  });

  it("compares oldest vs newest within the last 3 entries", () => {
    const up: PriceSnapshot[] = [
      { value: 100, timestamp: 1 },
      { value: 110, timestamp: 2 },
      { value: 120, timestamp: 3 },
    ];
    expect(computeTrendFromHistory(up)).toBe("up");

    const down: PriceSnapshot[] = [
      { value: 120, timestamp: 1 },
      { value: 110, timestamp: 2 },
      { value: 100, timestamp: 3 },
    ];
    expect(computeTrendFromHistory(down)).toBe("down");
  });

  it("ignores entries older than the last 3 when computing the window", () => {
    // A big rise 4 entries back shouldn't matter — only the most recent 3 count.
    const history: PriceSnapshot[] = [
      { value: 50, timestamp: 1 },
      { value: 200, timestamp: 2 }, // huge spike, now out of the 3-entry window
      { value: 100, timestamp: 3 },
      { value: 95, timestamp: 4 },
      { value: 90, timestamp: 5 },
    ];
    expect(computeTrendFromHistory(history)).toBe("down"); // 100 -> 95 -> 90
  });

  it("returns unchanged when the window's endpoints are equal", () => {
    const history: PriceSnapshot[] = [
      { value: 100, timestamp: 1 },
      { value: 150, timestamp: 2 },
      { value: 100, timestamp: 3 },
    ];
    expect(computeTrendFromHistory(history)).toBe("unchanged");
  });
});

describe("averageOverDays", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const now = 10 * DAY;

  it("returns null when nothing falls in the window", () => {
    const history: PriceSnapshot[] = [{ value: 100, timestamp: now - 20 * DAY }];
    expect(averageOverDays(history, 7, now)).toBeNull();
  });

  it("averages only entries within the window, however many there are", () => {
    const history: PriceSnapshot[] = [
      { value: 100, timestamp: now - 20 * DAY }, // outside a 7-day window
      { value: 200, timestamp: now - 5 * DAY },
      { value: 300, timestamp: now - 1 * DAY },
    ];
    expect(averageOverDays(history, 7, now)).toBe(250); // (200 + 300) / 2
  });

  it("includes a single sparse entry as-is when it's the only one in range", () => {
    const history: PriceSnapshot[] = [{ value: 42, timestamp: now - 2 * DAY }];
    expect(averageOverDays(history, 14, now)).toBe(42);
  });
});

describe("applyPriceUpdate", () => {
  const base: MarketPrice = {
    id: "tibiaCoinSell",
    label: "Tibia Coins (Sell)",
    value: null,
    trend: "unchanged",
    isLive: false,
    sourceTimestamp: null,
    updatedAt: null,
    history: [],
  };

  it("sets the first value without a trend, seeding history with one entry", () => {
    const result = applyPriceUpdate(base, 40000, { isLive: true, now: "2026-08-18T10:00:00Z" });
    expect(result.value).toBe(40000);
    expect(result.trend).toBe("unchanged");
    expect(result.isLive).toBe(true);
    expect(result.history).toHaveLength(1);
    expect(result.history[0]?.value).toBe(40000);
  });

  it("appends a history entry and recomputes the trend on a real change", () => {
    const withValue = applyPriceUpdate(base, 40000, { isLive: true, now: "2026-08-18T10:00:00Z" });
    const updated = applyPriceUpdate(withValue, 41000, { isLive: true, now: "2026-08-19T10:00:00Z" });
    expect(updated.value).toBe(41000);
    expect(updated.trend).toBe("up");
    expect(updated.history.map((e) => e.value)).toEqual([40000, 41000]);
  });

  it("does not grow history when the new value repeats the current one", () => {
    const withValue = applyPriceUpdate(base, 40000, { isLive: true, now: "t1" });
    const repeated = applyPriceUpdate(withValue, 40000, { isLive: true, now: "t2" });
    expect(repeated.history).toHaveLength(1);
    expect(repeated.trend).toBe("unchanged");
    expect(repeated.updatedAt).toBe("t2"); // freshness label still refreshes
  });

  it("does not append a duplicate history entry when a live snapshot repeats", () => {
    const withValue = applyPriceUpdate(base, 40000, {
      isLive: true,
      now: "t1",
      sourceTimestamp: 1000,
    });
    const samePoll = applyPriceUpdate(withValue, 40000, {
      isLive: true,
      now: "t2",
      sourceTimestamp: 1000,
    });
    expect(samePoll.history).toHaveLength(1);
  });
});
