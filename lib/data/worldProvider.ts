"use client";

import { useCallback, useEffect, useState } from "react";
import type { World, WorldDetail } from "@/types/world";
import type { BoostedEntity } from "@/types/boosted";
import type { WarzoneSchedule, WarzoneHealthMark } from "@/types/warzone";
import type { MarketPriceId, PriceSnapshot } from "@/types/market";
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
import {
  mapMarketHistoryEntries,
  type RawMarketHistoryEntry,
  type RawMarketHistoryFile,
} from "./marketHistoryMapping";

const TIBIADATA_BASE = "https://api.tibiadata.com/v4";
const WARZONES_SCHEDULE_ORIGIN = "https://nesleykent.github.io/tibia-warzones-schedule";
const WARZONE_SCHEDULE_URL = `${WARZONES_SCHEDULE_ORIGIN}/data/worlds.json`;

/**
 * Fetches straight from TibiaData and nesleykent/tibia-warzones-schedule in the browser —
 * both set permissive CORS, so this works from a static, server-less deploy (GitHub
 * Pages) exactly the same as it does in local dev. No proxy route needed.
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

/** tibia-warzones-schedule's own item-slug convention (scripts/common.py's slugify:
 * lowercase, spaces to underscores) for the 3 items Morning Tibia tracks. */
const MARKET_ITEM_SLUGS = {
  tibiaCoin: "tibia_coins",
  goldToken: "gold_token",
  silverToken: "silver_token",
} as const;

async function fetchItemHistory(worldName: string, itemSlug: string): Promise<RawMarketHistoryEntry[]> {
  const url = `${WARZONES_SCHEDULE_ORIGIN}/data/market/world/${encodeURIComponent(worldName)}/${worldName.toLowerCase()}_${itemSlug}.json`;
  const data = await fetchJson<RawMarketHistoryFile>(url);
  return data.snapshots?.[0] ?? [];
}

/**
 * Real day-by-day market history (`day_average_sell`/`day_average_buy`, one entry per
 * calendar day, refreshed daily), mirrored as public static JSON by
 * nesleykent/tibia-warzones-schedule — the exact dataset that site's own trend/average
 * calculations are built on (its scripts/economic_ranking.py and assets/world.js), sourced
 * upstream from api.tibiamarket.top's /item_history endpoint. Reusing this published
 * mirror instead of calling that endpoint directly avoids needing its auth token, and
 * gives years of real daily granularity immediately instead of the single current-tick
 * snapshot a live "market_values"-style call would provide.
 */
async function fetchMarketHistoryDirect(worldName: string): Promise<Record<MarketPriceId, PriceSnapshot[]>> {
  const [tibiaCoin, goldToken, silverToken] = await Promise.all([
    fetchItemHistory(worldName, MARKET_ITEM_SLUGS.tibiaCoin),
    fetchItemHistory(worldName, MARKET_ITEM_SLUGS.goldToken),
    fetchItemHistory(worldName, MARKET_ITEM_SLUGS.silverToken),
  ]);

  return {
    tibiaCoinSell: mapMarketHistoryEntries(tibiaCoin, "day_average_sell"),
    tibiaCoinBuy: mapMarketHistoryEntries(tibiaCoin, "day_average_buy"),
    goldTokenSell: mapMarketHistoryEntries(goldToken, "day_average_sell"),
    silverTokenSell: mapMarketHistoryEntries(silverToken, "day_average_sell"),
  };
}

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

/** How often the market history is re-fetched while the dashboard stays open. The
 * upstream dataset itself only gains a new day's entry once daily, and the response
 * carries a 10-minute Cache-Control the browser already honors — this just catches a
 * same-day correction or a session left open across a day boundary. */
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

export function useMarketHistoryQuery(worldName: string | null) {
  return useAsyncResource<Record<MarketPriceId, PriceSnapshot[]>>(
    worldName ? `marketHistory:${worldName}` : null,
    () => fetchMarketHistoryDirect(worldName!),
    MARKET_POLL_INTERVAL_MS,
  );
}
