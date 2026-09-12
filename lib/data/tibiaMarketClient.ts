import type { RawMarketHistoryEntry } from "./marketHistoryMapping";

/**
 * The market data's own source: https://www.tibiamarket.top, documented at
 * https://api.tibiamarket.top/docs.
 *
 * Morning Tibia used to read the same numbers from a static mirror published by
 * nesleykent/tibia-warzones-schedule, which republishes this endpoint's rows on its own
 * schedule. The mirror bought convenience — three plain files, fetched in parallel, no rate
 * limit — at the cost of however far behind that job happened to be. Reading the API leaves
 * nobody in between to fall behind.
 *
 * `/item_history` needs no token and answers with `access-control-allow-origin: *`, so the
 * static GitHub Pages build calls it straight from the browser, exactly like TibiaData.
 */
const TIBIA_MARKET_BASE = "https://api.tibiamarket.top";

/**
 * api.tibiamarket.top's own item ids for the three assets this app tracks, confirmed
 * against its `/item_metadata` catalog (`wiki_name`: "Tibia Coins", "Gold Token",
 * "Silver Token").
 */
export const MARKET_ITEM_IDS = {
  tibiaCoin: 22118,
  goldToken: 22721,
  silverToken: 22516,
} as const;

/**
 * How far back each history request reaches. The app stores at most
 * MAX_STORED_HISTORY_ENTRIES daily entries and its widest basis averages 14 of them, so a
 * longer window would be paid for on every poll and thrown away on arrival.
 */
export const MARKET_HISTORY_DAYS = 90;

/**
 * How long to leave between requests.
 *
 * The API rate-limits by address: `x-ratelimit-limit: 1` with `retry-after: 5`, and firing
 * the three item histories in parallel (which is what the mirror allowed) returns 429 for
 * two of the three. So every call goes through a queue that keeps one request in flight at
 * a time and leaves this gap behind each one.
 *
 * Seven rather than the advertised five, measured against the live endpoint: its
 * `x-ratelimit-reset` lands six to seven seconds out, and a sustained five- or six-second
 * cadence starts being refused after a handful of requests — it is a bucket with a small
 * burst allowance, not a flat one-per-five-seconds. Three items at seven seconds fits
 * inside the burst with room to spare, which matters because a refusal costs a whole window
 * and therefore more time than the wait it was trying to save.
 */
export const MIN_REQUEST_GAP_MS = 7_000;

/** How many times one request is sent before it is reported as failed. */
const MAX_ATTEMPTS = 3;

/** Tail of the queue: every queued call chains onto this, so none of them overlap. */
let queue: Promise<unknown> = Promise.resolve();
/** Nothing is sent before this instant. Moved on after each request, and further out when
 * the API tells us it is rate-limiting. */
let nextRequestAllowedAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Rejects the way an aborted `fetch` does, so callers have one thing to recognise. */
function abortError(): Error {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}

/**
 * Runs `task` once the queue is free and the gap since the previous request has passed.
 *
 * A task whose caller has already given up (the reader switched world, the page unmounted)
 * is dropped rather than run, so an abandoned world's requests never hold the queue against
 * the world actually on screen.
 */
function enqueue<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  const run = queue.then(async () => {
    if (signal?.aborted) throw abortError();
    const wait = nextRequestAllowedAt - Date.now();
    if (wait > 0) await sleep(wait);
    if (signal?.aborted) throw abortError();
    try {
      return await task();
    } finally {
      nextRequestAllowedAt = Date.now() + MIN_REQUEST_GAP_MS;
    }
  });
  // The chain must never carry a rejection, or one failed request would reject everything
  // queued behind it.
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/**
 * How long the API wants to be left alone after a 429.
 *
 * It sends `Retry-After` but no `Access-Control-Expose-Headers`, so a browser will not let
 * this read it — the header is visible only to the tests and to anything calling from a
 * server. Read it where it is readable, and fall back to the documented gap where it isn't.
 */
function retryDelayMs(response: Response): number {
  const header = Number(response.headers.get("retry-after"));
  return Number.isFinite(header) && header > 0 ? header * 1000 : MIN_REQUEST_GAP_MS;
}

/**
 * One request, retried a couple of times before it is called a failure: a 429 because the
 * API is asking us to wait, anything else because a single blip on one of three sequential
 * requests would otherwise leave a silent hole in the Market panel.
 */
async function requestMarketJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await enqueue(
        () => fetch(`${TIBIA_MARKET_BASE}${path}`, { headers: { Accept: "application/json" }, signal }),
        signal,
      );
      if (response.ok) return (await response.json()) as T;

      if (response.status === 429) {
        // A drained bucket needs more than the standing gap, and knocking at the same rate
        // only keeps it drained — so each refusal backs the next attempt off further. The
        // queue does the waiting; this just pushes its next slot out.
        nextRequestAllowedAt = Math.max(
          nextRequestAllowedAt,
          Date.now() + retryDelayMs(response) * (attempt + 1),
        );
      }
      lastError = new Error(`Request failed (${response.status}): ${path}`);
    } catch (error) {
      // Being abandoned is not something to retry.
      if (signal?.aborted) throw error;
      // Anything else is a blip, and the queue's own gap is the backoff.
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Request failed: ${path}`);
}

/**
 * One item's daily market history on one world, straight from `/item_history` — `time` in
 * seconds, prices in `day_average_sell`/`day_average_buy`, and `-1` where the item wasn't
 * traded that day. That is the shape `mapMarketHistoryEntries` already reads, because the
 * mirror this replaces was republishing these very rows.
 *
 * A world the API doesn't track answers `200` with an empty array rather than an error, so
 * "nothing known about this world" arrives as no snapshots rather than as a failure.
 */
export function fetchItemHistory(
  world: string,
  itemId: number,
  signal?: AbortSignal,
): Promise<RawMarketHistoryEntry[]> {
  const query = new URLSearchParams({
    server: world,
    item_id: String(itemId),
    start_days_ago: String(MARKET_HISTORY_DAYS),
    end_days_ago: "0",
  });
  return requestMarketJson<RawMarketHistoryEntry[]>(`/item_history?${query.toString()}`, signal);
}

/** Test seam: forget the pacing state so one test's requests don't stall the next one's. */
export function resetMarketRequestPacingForTests(): void {
  queue = Promise.resolve();
  nextRequestAllowedAt = 0;
}
