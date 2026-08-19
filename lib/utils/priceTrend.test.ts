import { describe, expect, it } from "vitest";
import { ENTRIES_BY_BASIS, applyPriceUpdate, averageOfLastEntries, computeTrendForBasis } from "./priceTrend";
import type { MarketPrice, PriceSnapshot } from "@/types/market";

describe("averageOfLastEntries", () => {
  it("returns null with no history", () => {
    expect(averageOfLastEntries([], 3)).toBeNull();
  });

  it("averages only the last N entries, however many that is", () => {
    const history: PriceSnapshot[] = [
      { value: 100, timestamp: 1 },
      { value: 200, timestamp: 2 },
      { value: 300, timestamp: 3 },
    ];
    expect(averageOfLastEntries(history, 1)).toBe(300);
    expect(averageOfLastEntries(history, 2)).toBe(250); // (200 + 300) / 2
    expect(averageOfLastEntries(history, 3)).toBe(200); // (100 + 200 + 300) / 3
  });

  it("uses whatever is available when there are fewer than N entries (e.g. avg14 with 2 entries)", () => {
    const history: PriceSnapshot[] = [
      { value: 100, timestamp: 1 },
      { value: 200, timestamp: 2 },
    ];
    expect(averageOfLastEntries(history, 14)).toBe(150);
  });

  it("returns a single sparse entry as-is", () => {
    expect(averageOfLastEntries([{ value: 42, timestamp: 1 }], 7)).toBe(42);
  });
});

describe("ENTRIES_BY_BASIS", () => {
  it("maps each basis to an entry count, not a day count", () => {
    expect(ENTRIES_BY_BASIS.last).toBe(1);
    expect(ENTRIES_BY_BASIS.avg3).toBe(3);
    expect(ENTRIES_BY_BASIS.avg7).toBe(7);
    expect(ENTRIES_BY_BASIS.avg14).toBe(14);
  });
});

describe("computeTrendForBasis", () => {
  it("returns unchanged with fewer than 2 entries", () => {
    expect(computeTrendForBasis([], 1)).toBe("unchanged");
    expect(computeTrendForBasis([{ value: 100, timestamp: 0 }], 1)).toBe("unchanged");
  });

  it("basis 'last' (count 1) reduces to a plain two-point comparison", () => {
    const up: PriceSnapshot[] = [
      { value: 100, timestamp: 1 },
      { value: 110, timestamp: 2 },
    ];
    expect(computeTrendForBasis(up, 1)).toBe("up");

    const down: PriceSnapshot[] = [
      { value: 110, timestamp: 1 },
      { value: 100, timestamp: 2 },
    ];
    expect(computeTrendForBasis(down, 1)).toBe("down");
  });

  it("avg3 compares this 3-entry average against the one shifted back an entry", () => {
    // Window including the latest entry: [100, 110, 120] -> avg 110.
    // Window one entry earlier: [90, 100, 110] -> avg 100. 110 > 100 => up.
    const history: PriceSnapshot[] = [
      { value: 90, timestamp: 1 },
      { value: 100, timestamp: 2 },
      { value: 110, timestamp: 3 },
      { value: 120, timestamp: 4 },
    ];
    expect(computeTrendForBasis(history, 3)).toBe("up");
  });

  it("a single noisy tick can't flip an avg-based trend the way a two-point comparison would", () => {
    // Latest tick dips, but the 3-entry average is still rising overall.
    const history: PriceSnapshot[] = [
      { value: 100, timestamp: 1 },
      { value: 110, timestamp: 2 },
      { value: 130, timestamp: 3 },
      { value: 129, timestamp: 4 }, // dipped vs. the immediately prior tick
    ];
    // Current window [110,130,129] avg ~123, previous window [100,110,130] avg ~113.3 => up.
    expect(computeTrendForBasis(history, 3)).toBe("up");
    // But the naive "last entry" basis correctly reports the dip itself as down.
    expect(computeTrendForBasis(history, 1)).toBe("down");
  });

  it("returns unchanged when the compared windows are equal", () => {
    const history: PriceSnapshot[] = [
      { value: 100, timestamp: 1 },
      { value: 100, timestamp: 2 },
      { value: 100, timestamp: 3 },
    ];
    expect(computeTrendForBasis(history, 3)).toBe("unchanged");
  });
});

describe("applyPriceUpdate", () => {
  const base: MarketPrice = {
    id: "tibiaCoinSell",
    label: "Tibia Coin Sell Offer",
    value: null,
    isLive: false,
    sourceTimestamp: null,
    updatedAt: null,
    history: [],
  };

  it("sets the first value, seeding history with one entry", () => {
    const result = applyPriceUpdate(base, 40000, { isLive: true, now: "2026-08-18T10:00:00Z" });
    expect(result.value).toBe(40000);
    expect(result.isLive).toBe(true);
    expect(result.history).toHaveLength(1);
    expect(result.history[0]?.value).toBe(40000);
  });

  it("appends a history entry on a real change", () => {
    const withValue = applyPriceUpdate(base, 40000, { isLive: true, now: "2026-08-18T10:00:00Z" });
    const updated = applyPriceUpdate(withValue, 41000, { isLive: true, now: "2026-08-19T10:00:00Z" });
    expect(updated.value).toBe(41000);
    expect(updated.history.map((e) => e.value)).toEqual([40000, 41000]);
  });

  it("does not grow history when the new value repeats the current one", () => {
    const withValue = applyPriceUpdate(base, 40000, { isLive: true, now: "t1" });
    const repeated = applyPriceUpdate(withValue, 40000, { isLive: true, now: "t2" });
    expect(repeated.history).toHaveLength(1);
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
