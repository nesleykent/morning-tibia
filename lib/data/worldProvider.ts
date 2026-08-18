"use client";

import { useCallback, useEffect, useState } from "react";
import type { World, WorldDetail } from "@/types/world";
import type { BoostedEntity } from "@/types/boosted";
import type { WarzoneSchedule, WarzoneHealthMark } from "@/types/warzone";
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

const TIBIADATA_BASE = "https://api.tibiadata.com/v4";
const WARZONE_SCHEDULE_URL = "https://nesleykent.github.io/tibia-warzones-schedule/data/worlds.json";

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
  warzone_economic_ranking?: {
    market?: {
      tibia_coin?: { supply_price: number | null; demand_price: number | null; mid_price: number | null };
    };
  };
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

  const tibiaCoin = match.warzone_economic_ranking?.market?.tibia_coin;

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
    tibiaCoin: tibiaCoin
      ? {
          supplyPrice: tibiaCoin.supply_price ?? null,
          demandPrice: tibiaCoin.demand_price ?? null,
          midPrice: tibiaCoin.mid_price ?? null,
        }
      : null,
  };
}

interface ResourceState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Runs an async fetcher, exposing loading/error state and a manual `refresh`. Never
 * throws — a failed fetch just leaves `error` set so the rest of the dashboard (which is
 * mostly manual/local data) keeps working. `key` changes (e.g. a different world) trigger
 * a refetch the same way a dependency-array change would.
 */
function useAsyncResource<T>(key: string | null, fetcher: (forceRefresh: boolean) => Promise<T | null>) {
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

    fetcher(refreshToken > 0)
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

  return { ...state, refresh };
}

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
