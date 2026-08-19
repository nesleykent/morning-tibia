import { describe, expect, it } from "vitest";
import { MAX_STORED_HISTORY_ENTRIES, mapMarketHistoryEntries } from "./marketHistoryMapping";

describe("mapMarketHistoryEntries", () => {
  it("picks the requested price field and converts the timestamp to milliseconds", () => {
    const entries = mapMarketHistoryEntries(
      [{ time: 1735679571.5, day_average_sell: 41827, day_average_buy: 39916 }],
      "day_average_sell",
    );
    expect(entries).toEqual([{ value: 41827, timestamp: Math.round(1735679571.5 * 1000) }]);
  });

  it("drops entries where the requested field is the upstream's -1/missing sentinel", () => {
    const entries = mapMarketHistoryEntries(
      [
        { time: 1, day_average_sell: -1, day_average_buy: 100 },
        { time: 2, day_average_sell: 0, day_average_buy: 100 },
        { time: 3, day_average_buy: 100 }, // field absent entirely
        { time: 4, day_average_sell: 500, day_average_buy: 100 },
      ],
      "day_average_sell",
    );
    expect(entries).toEqual([{ value: 500, timestamp: 4000 }]);
  });

  it("sorts oldest first regardless of input order", () => {
    const entries = mapMarketHistoryEntries(
      [
        { time: 3, day_average_sell: 300 },
        { time: 1, day_average_sell: 100 },
        { time: 2, day_average_sell: 200 },
      ],
      "day_average_sell",
    );
    expect(entries.map((e) => e.value)).toEqual([100, 200, 300]);
  });

  it("caps the result at MAX_STORED_HISTORY_ENTRIES, keeping the most recent ones", () => {
    const raw = Array.from({ length: MAX_STORED_HISTORY_ENTRIES + 10 }, (_, i) => ({
      time: i,
      day_average_sell: i,
    }));
    const entries = mapMarketHistoryEntries(raw, "day_average_sell");
    expect(entries).toHaveLength(MAX_STORED_HISTORY_ENTRIES);
    expect(entries[0]?.value).toBe(10); // the oldest 10 were trimmed off
    expect(entries[entries.length - 1]?.value).toBe(MAX_STORED_HISTORY_ENTRIES + 9);
  });

  it("returns an empty array for an empty or all-invalid input", () => {
    expect(mapMarketHistoryEntries([], "day_average_sell")).toEqual([]);
    expect(mapMarketHistoryEntries([{ time: 1, day_average_sell: -1 }], "day_average_sell")).toEqual([]);
  });
});
