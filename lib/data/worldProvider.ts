"use client";

import { useCallback, useEffect, useState } from "react";
import type { World, WorldDetail } from "@/types/world";
import type { BoostedEntity } from "@/types/boosted";
import type { WarzoneSchedule, WarzoneHealthMark } from "@/types/warzone";
import type { MarketHistory } from "@/types/market";
import {
  mapBoostedBoss,
  mapBoostedCreature,
  mapWorldDetail,
  mapWorldSummary,
  type RawBoostedBossResponse,
  type RawBoostedCreatureResponse,
  type RawWorldDetailResponse,
  type RawWorldsResponse,
} from "./tibiaDataMapping";
import { mapMarketHistoryEntries, type RawMarketHistoryEntry } from "./marketHistoryMapping";
import { fetchItemHistory, MARKET_ITEM_IDS } from "./tibiaMarketClient";

const TIBIADATA_BASE = "https://api.tibiadata.com/v4";
const WARZONES_SCHEDULE_ORIGIN = "https://nesleykent.github.io/tibia-warzones-schedule";
const WARZONE_SCHEDULE_URL = `${WARZONES_SCHEDULE_ORIGIN}/data/worlds.json`;

/**
 * Fetches straight from TibiaData, nesleykent/tibia-warzones-schedule and
 * api.tibiamarket.top in the browser — all three set permissive CORS, so this works from a
 * static, server-less deploy (GitHub Pages) exactly the same as it does in local dev. No
 * proxy route needed.
 */
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${url}`);
  }
  return (await res.json()) as T;
}

async function fetchWorldsDirect(): Promise<World[]> {
  const data = await fetchJson<RawWorldsResponse>(`${TIBIADATA_BASE}/worlds`);
  return data.worlds.regular_worlds.map(mapWorldSummary).sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchWorldDetailDirect(name: string): Promise<WorldDetail | null> {
  const data = await fetchJson<RawWorldDetailResponse>(`${TIBIADATA_BASE}/world/${encodeURIComponent(name)}`);
  if (!data.world?.name) return null;
  return mapWorldDetail(data.world);
}

async function fetchBoostedDirect(): Promise<{ creature: BoostedEntity | null; boss: BoostedEntity | null }> {
  const [creatureData, bossData] = await Promise.all([
    fetchJson<RawBoostedCreatureResponse>(`${TIBIADATA_BASE}/creatures`),
    fetchJson<RawBoostedBossResponse>(`${TIBIADATA_BASE}/boostablebosses`),
  ]);
  return { creature: mapBoostedCreature(creatureData), boss: mapBoostedBoss(bossData) };
}

interface RawWarzoneExecution {
  execution_id: number;
  schedule_time: string;
  warzone_sequence: string;
}

interface RawWarzoneWorld {
  name: string;
  timezone?: string;
  tracks_warzone_service?: boolean;
  mark?: string;
  warzone_executions?: RawWarzoneExecution[];
}

function normalizeMark(mark: string | undefined): WarzoneHealthMark {
  if (mark === "healthy" || mark === "inconclusive" || mark === "degraded") return mark;
  return "unknown";
}

// Module-level cache: the full worlds.json (~420KB) is shared across every
// useWarzoneScheduleQuery consumer/world-switch within a session instead of
// re-downloading it each time. No cross-session persistence — a fresh page load
// refetches, matching the source's own 10-minute Cache-Control anyway.
let warzoneCache: { data: RawWarzoneWorld[]; fetchedAt: number } | null = null;
const WARZONE_CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchAllWarzoneWorlds(forceRefresh: boolean): Promise<RawWarzoneWorld[]> {
  const isStale = !warzoneCache || Date.now() - warzoneCache.fetchedAt > WARZONE_CACHE_TTL_MS;
  if (!forceRefresh && warzoneCache && !isStale) return warzoneCache.data;
  const data = await fetchJson<RawWarzoneWorld[]>(WARZONE_SCHEDULE_URL);
  warzoneCache = { data, fetchedAt: Date.now() };
  return data;
}

async function fetchWarzoneScheduleDirect(
  worldName: string,
  forceRefresh: boolean,
): Promise<WarzoneSchedule | null> {
  const all = await fetchAllWarzoneWorlds(forceRefresh);
  const match = all.find((w) => w.name.toLowerCase() === worldName.toLowerCase());
  if (!match) return null;

  return {
    world: match.name,
    timezone: match.timezone ?? null,
    tracksWarzoneService: Boolean(match.tracks_warzone_service),
    mark: normalizeMark(match.mark),
    executions: (match.warzone_executions ?? []).map((execution) => ({
      executionId: execution.execution_id,
      scheduleTime: execution.schedule_time,
      warzoneSequence: execution.warzone_sequence,
    })),
  };
}

/**
 * The three items the app tracks, in the order they are fetched, each with the price ids
 * one item's rows produce. Tibia Coins come first because their single response carries two
 * of the four numbers, and because they are the figure every reader looks for.
 */
const MARKET_ITEMS: { id: number; toHistory: (entries: RawMarketHistoryEntry[]) => MarketHistory }[] = [
  {
    id: MARKET_ITEM_IDS.tibiaCoin,
    toHistory: (entries) => ({
      tibiaCoinSell: mapMarketHistoryEntries(entries, "day_average_sell"),
      tibiaCoinBuy: mapMarketHistoryEntries(entries, "day_average_buy"),
    }),
  },
  {
    id: MARKET_ITEM_IDS.goldToken,
    toHistory: (entries) => ({ goldTokenSell: mapMarketHistoryEntries(entries, "day_average_sell") }),
  },
  {
    id: MARKET_ITEM_IDS.silverToken,
    toHistory: (entries) => ({ silverTokenSell: mapMarketHistoryEntries(entries, "day_average_sell") }),
  },
];

/**
 * What the API has already told us this session, by world.
 *
 * Worth keeping in a way the warzone schedule's own cache above is not: every entry here
 * cost three rate-limited requests spread over some fifteen seconds, and the reader
 * comparing a few worlds would otherwise pay that again for each one every time they came
 * back. The feed gains an entry once a day, so nothing is lost by holding it — and it is
 * dropped whenever the reader asks for a refresh, or the poll comes round.
 */
const marketHistoryCache = new Map<string, MarketHistory>();

interface ResourceState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * A handful of live-data fetches firing in parallel on first paint occasionally trips a
 * transient rate-limit/edge hiccup on the external APIs (observed in production — an
 * immediate retry always recovered), so every resource gets one automatic retry before
 * surfacing an error to the user.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 2, delayMs = 900): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

/**
 * Runs an async fetcher, exposing loading/error state and a manual `refresh`. Never
 * throws — a failed fetch just leaves `error` set so the rest of the dashboard (which is
 * mostly manual/local data) keeps working. `key` changes (e.g. a different world) trigger
 * a refetch the same way a dependency-array change would.
 *
 * `pollIntervalMs`, when given, also refetches on a timer while the key stays the same —
 * needed for the market feed specifically: its trend/average is derived from a rolling
 * history of *distinct* observed values (see lib/utils/priceTrend.ts), which never
 * accumulates past a single entry if the price is only ever sampled once per page load.
 */
function useAsyncResource<T>(
  key: string | null,
  fetcher: (forceRefresh: boolean) => Promise<T | null>,
  pollIntervalMs?: number,
) {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    isLoading: Boolean(key),
    error: null,
  });
  const [refreshToken, setRefreshToken] = useState(0);

  // Fetching on mount/key-change is the sanctioned effect pattern when there's no data
  // library (React docs: "if you don't use a framework ... it's more common to fetch data
  // in an Effect"). The two setState calls below intentionally reset/mark-loading before
  // the request settles.
  useEffect(() => {
    if (!key) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ data: null, isLoading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    withRetry(() => fetcher(refreshToken > 0))
      .then((data) => {
        if (cancelled) return;
        setState({ data, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Something went wrong",
        });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refreshToken]);

  const refresh = useCallback(() => setRefreshToken((n) => n + 1), []);

  useEffect(() => {
    if (!key || !pollIntervalMs) return;
    const id = setInterval(() => setRefreshToken((n) => n + 1), pollIntervalMs);
    return () => clearInterval(id);
  }, [key, pollIntervalMs]);

  return { ...state, refresh };
}

/** How often the market history is re-fetched while the dashboard stays open. The feed
 * itself only gains a new day's entry once daily — this just catches a same-day correction
 * or a session left open across a day boundary, and it is deliberately far longer than the
 * API's rate-limit window so polling never competes with a world switch for a slot. */
const MARKET_POLL_INTERVAL_MS = 15 * 60 * 1000;

export function useWorldsQuery() {
  return useAsyncResource<World[]>("worlds", fetchWorldsDirect);
}

export function useBoostedQuery() {
  return useAsyncResource<{ creature: BoostedEntity | null; boss: BoostedEntity | null }>(
    "boosted",
    fetchBoostedDirect,
  );
}

export function useWorldDetailQuery(worldName: string | null) {
  return useAsyncResource<WorldDetail>(
    worldName ? `world:${worldName}` : null,
    () => fetchWorldDetailDirect(worldName!),
  );
}

export function useWarzoneScheduleQuery(worldName: string | null) {
  return useAsyncResource<WarzoneSchedule>(
    worldName ? `warzone:${worldName}` : null,
    (forceRefresh) => fetchWarzoneScheduleDirect(worldName!, forceRefresh),
  );
}

/**
 * Day-by-day market history for the world on screen, from api.tibiamarket.top.
 *
 * Not built on useAsyncResource, because this is the one feed that cannot be fetched in a
 * single shot: the API is rate-limited per address and has no endpoint returning several
 * items' histories at once, so the three items go one after another (see
 * MIN_REQUEST_GAP_MS) and the whole set takes some fifteen seconds. Waiting for all of it
 * would leave the Market panel empty for that whole time, so each item is published the
 * moment it arrives — Tibia Coins, which carry the two headline numbers, within the first
 * second — and the rest fill in behind it. `data` is therefore partial until the last one
 * lands.
 *
 * `error` is only set when *every* item failed. A single item that could not be fetched
 * leaves the others showing and simply says nothing about itself, which is what the rest of
 * the app does with a fact it does not have.
 */
export function useMarketHistoryQuery(worldName: string | null) {
  const [state, setState] = useState<ResourceState<MarketHistory>>({
    data: null,
    isLoading: Boolean(worldName),
    error: null,
  });
  const [refreshToken, setRefreshToken] = useState(0);

  // Same sanctioned fetch-in-an-Effect pattern as useAsyncResource above; the setState
  // calls here deliberately mark loading before the requests settle.
  useEffect(() => {
    if (!worldName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    const cached = marketHistoryCache.get(worldName);
    if (cached) {
      setState({ data: cached, isLoading: false, error: null });
      return;
    }

    // Abandoning a request also drops the ones still queued behind it, so switching world
    // twice in a row doesn't leave the third world waiting on the first two.
    const controller = new AbortController();
    setState({ data: null, isLoading: true, error: null });

    void (async () => {
      const collected: MarketHistory = {};
      // Re-published as a fresh object each time an item lands, so consumers keyed on this
      // value see each arrival; held onto so the final state does not needlessly change
      // identity once more when nothing new has come in.
      let published: MarketHistory | null = null;
      let delivered = 0;
      let lastError: unknown = null;

      for (const item of MARKET_ITEMS) {
        try {
          const entries = await fetchItemHistory(worldName, item.id, controller.signal);
          if (controller.signal.aborted) return;
          delivered += 1;
          Object.assign(collected, item.toHistory(entries));
          published = { ...collected };
          setState({ data: published, isLoading: true, error: null });
        } catch (error) {
          if (controller.signal.aborted) return;
          lastError = error;
        }
      }

      if (controller.signal.aborted) return;
      // Only a complete set is worth remembering: a half-answer served back from the cache
      // would look like the API had nothing more to say about the missing asset.
      if (delivered === MARKET_ITEMS.length) marketHistoryCache.set(worldName, collected);
      setState({
        data: published,
        isLoading: false,
        error:
          published === null && lastError !== null
            ? lastError instanceof Error
              ? lastError.message
              : "Something went wrong"
            : null,
      });
    })();

    return () => controller.abort();
  }, [worldName, refreshToken]);

  // Refreshing means forgetting what was cached — otherwise Retry, and the poll, would
  // cheerfully hand back the very answer the reader is asking us to go and check.
  const refresh = useCallback(() => {
    if (worldName) marketHistoryCache.delete(worldName);
    setRefreshToken((n) => n + 1);
  }, [worldName]);

  useEffect(() => {
    if (!worldName) return;
    const id = setInterval(() => {
      marketHistoryCache.delete(worldName);
      setRefreshToken((n) => n + 1);
    }, MARKET_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [worldName]);

  return { ...state, refresh };
}
