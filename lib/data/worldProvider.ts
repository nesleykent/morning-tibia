"use client";

import { useCallback, useEffect, useState } from "react";
import type { World, WorldDetail } from "@/types/world";
import type { BoostedEntity } from "@/types/boosted";
import type { WarzoneSchedule } from "@/types/warzone";

interface ResourceState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches one JSON resource through our own API routes, exposing loading/error state
 * and a manual `refresh`. Never throws — a failed fetch just leaves `error` set so the
 * rest of the dashboard (which is mostly manual/local data) keeps working.
 */
function useApiResource<T>(url: string | null, extract: (json: unknown) => T | null) {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    isLoading: Boolean(url),
    error: null,
  });
  const [refreshToken, setRefreshToken] = useState(0);

  // Fetching on mount/url-change is the sanctioned effect pattern when there's no data
  // library (React docs: "if you don't use a framework ... it's more common to fetch data
  // in an Effect"). The two setState calls below intentionally reset/mark-loading before
  // the request settles.
  useEffect(() => {
    if (!url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ data: null, isLoading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    fetch(url, { cache: refreshToken > 0 ? "no-store" : "default" })
      .then(async (res) => {
        const json = (await res.json()) as unknown;
        if (!res.ok) {
          const message =
            typeof json === "object" && json !== null && "error" in json
              ? String((json as { error: unknown }).error)
              : `Request failed (${res.status})`;
          throw new Error(message);
        }
        return json;
      })
      .then((json) => {
        if (cancelled) return;
        setState({ data: extract(json), isLoading: false, error: null });
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
  }, [url, refreshToken]);

  const refresh = useCallback(() => setRefreshToken((n) => n + 1), []);

  return { ...state, refresh };
}

export function useWorldsQuery() {
  return useApiResource<World[]>("/api/tibia/worlds", (json) => {
    const worlds = (json as { worlds?: World[] })?.worlds;
    return Array.isArray(worlds) ? worlds : [];
  });
}

export function useBoostedQuery() {
  return useApiResource<{ creature: BoostedEntity | null; boss: BoostedEntity | null }>(
    "/api/tibia/boosted",
    (json) => {
      const body = json as { creature?: BoostedEntity | null; boss?: BoostedEntity | null };
      return { creature: body?.creature ?? null, boss: body?.boss ?? null };
    },
  );
}

export function useWorldDetailQuery(worldName: string | null) {
  const url = worldName ? `/api/tibia/world/${encodeURIComponent(worldName)}` : null;
  return useApiResource<WorldDetail>(url, (json) => (json as { world?: WorldDetail })?.world ?? null);
}

export function useWarzoneScheduleQuery(worldName: string | null) {
  const url = worldName ? `/api/warzones?world=${encodeURIComponent(worldName)}` : null;
  return useApiResource<WarzoneSchedule>(
    url,
    (json) => (json as { schedule?: WarzoneSchedule | null })?.schedule ?? null,
  );
}
