import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchItemHistory,
  MARKET_HISTORY_DAYS,
  MARKET_ITEM_IDS,
  MIN_REQUEST_GAP_MS,
  resetMarketRequestPacingForTests,
} from "./tibiaMarketClient";

/** A `/item_history` reply: the two rows the mapping reads, plus the sentinel it drops. */
function historyResponse(rows: unknown[] = [{ time: 1, day_average_sell: 41510, day_average_buy: 39749 }]) {
  return { ok: true, status: 200, headers: new Headers(), json: async () => rows };
}

function rateLimited(retryAfterSeconds?: number) {
  return {
    ok: false,
    status: 429,
    headers: new Headers(retryAfterSeconds ? { "retry-after": String(retryAfterSeconds) } : {}),
    json: async () => ({}),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  resetMarketRequestPacingForTests();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Lets every queued timer and promise callback run to completion. */
async function settle(): Promise<void> {
  await vi.runAllTimersAsync();
}

describe("fetchItemHistory", () => {
  it("asks api.tibiamarket.top for one item's daily history on one world", async () => {
    const fetchMock = vi.fn().mockResolvedValue(historyResponse());
    vi.stubGlobal("fetch", fetchMock);

    const pending = fetchItemHistory("Ustebra", MARKET_ITEM_IDS.tibiaCoin);
    await settle();
    await expect(pending).resolves.toEqual([
      { time: 1, day_average_sell: 41510, day_average_buy: 39749 },
    ]);

    const url = new URL(fetchMock.mock.calls[0]![0] as string);
    expect(url.origin).toBe("https://api.tibiamarket.top");
    expect(url.pathname).toBe("/item_history");
    expect(url.searchParams.get("server")).toBe("Ustebra");
    expect(url.searchParams.get("item_id")).toBe(String(MARKET_ITEM_IDS.tibiaCoin));
    expect(url.searchParams.get("start_days_ago")).toBe(String(MARKET_HISTORY_DAYS));
  });

  it("escapes a world name rather than pasting it into the query raw", async () => {
    const fetchMock = vi.fn().mockResolvedValue(historyResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    const pending = fetchItemHistory("Ni'a Bra", MARKET_ITEM_IDS.goldToken);
    await settle();
    await pending;

    const url = new URL(fetchMock.mock.calls[0]![0] as string);
    expect(url.searchParams.get("server")).toBe("Ni'a Bra");
  });

  it("never has two requests in flight, and leaves the rate-limit gap between them", async () => {
    let inFlight = 0;
    let overlapped = false;
    const startedAt: number[] = [];
    const fetchMock = vi.fn().mockImplementation(async () => {
      startedAt.push(Date.now());
      inFlight += 1;
      if (inFlight > 1) overlapped = true;
      inFlight -= 1;
      return historyResponse();
    });
    vi.stubGlobal("fetch", fetchMock);

    const all = Promise.all([
      fetchItemHistory("Ustebra", MARKET_ITEM_IDS.tibiaCoin),
      fetchItemHistory("Ustebra", MARKET_ITEM_IDS.goldToken),
      fetchItemHistory("Ustebra", MARKET_ITEM_IDS.silverToken),
    ]);
    await settle();
    await all;

    expect(overlapped).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(startedAt[1]! - startedAt[0]!).toBeGreaterThanOrEqual(MIN_REQUEST_GAP_MS);
    expect(startedAt[2]! - startedAt[1]!).toBeGreaterThanOrEqual(MIN_REQUEST_GAP_MS);
  });

  it("waits out a 429 and returns the retry's data", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(rateLimited(5))
      .mockResolvedValueOnce(historyResponse());
    vi.stubGlobal("fetch", fetchMock);

    const pending = fetchItemHistory("Ustebra", MARKET_ITEM_IDS.tibiaCoin);
    await settle();

    await expect(pending).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up rather than retrying a 429 forever, and backs further off each time", async () => {
    const startedAt: number[] = [];
    const fetchMock = vi.fn().mockImplementation(async () => {
      startedAt.push(Date.now());
      return rateLimited();
    });
    vi.stubGlobal("fetch", fetchMock);

    // The assertion is attached before the clock runs, so the rejection is never loose.
    const settled = expect(
      fetchItemHistory("Ustebra", MARKET_ITEM_IDS.tibiaCoin),
    ).rejects.toThrow(/429/);
    await settle();
    await settled;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    // A drained bucket is left alone for longer on each refusal, rather than knocked at the
    // same rate until the attempts run out.
    expect(startedAt[2]! - startedAt[1]!).toBeGreaterThan(startedAt[1]! - startedAt[0]!);
  });

  it("retries a transient failure and returns what the retry gave", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, headers: new Headers(), json: async () => ({}) })
      .mockResolvedValueOnce(historyResponse());
    vi.stubGlobal("fetch", fetchMock);

    const pending = fetchItemHistory("Ustebra", MARKET_ITEM_IDS.silverToken);
    await settle();

    await expect(pending).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports a failure that never recovered, with its status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, headers: new Headers(), json: async () => ({}) }),
    );

    const settled = expect(fetchItemHistory("Ustebra", MARKET_ITEM_IDS.silverToken)).rejects.toThrow(
      /503/,
    );
    await settle();
    await settled;
  });

  it("drops a queued request whose caller has already given up", async () => {
    const fetchMock = vi.fn().mockResolvedValue(historyResponse());
    vi.stubGlobal("fetch", fetchMock);

    const controller = new AbortController();
    const first = fetchItemHistory("Ustebra", MARKET_ITEM_IDS.tibiaCoin);
    const abandoned = expect(
      fetchItemHistory("Ustebra", MARKET_ITEM_IDS.goldToken, controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
    controller.abort();

    await settle();
    await first;
    await abandoned;
    // Only the request that was still wanted ever reached the network.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not let one failed request reject the ones queued behind it", async () => {
    // The first item never recovers; the second must still come back with its data.
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      return new URL(url).searchParams.get("item_id") === String(MARKET_ITEM_IDS.tibiaCoin)
        ? { ok: false, status: 500, headers: new Headers(), json: async () => ({}) }
        : historyResponse();
    });
    vi.stubGlobal("fetch", fetchMock);

    const failing = expect(fetchItemHistory("Ustebra", MARKET_ITEM_IDS.tibiaCoin)).rejects.toThrow(
      /500/,
    );
    const following = fetchItemHistory("Ustebra", MARKET_ITEM_IDS.goldToken);
    await settle();

    await failing;
    await expect(following).resolves.toHaveLength(1);
  });
});
