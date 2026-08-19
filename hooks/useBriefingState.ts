"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BriefingOverrides } from "@/types/briefing";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import type { WorldChangeValue } from "@/types/worldChange";
import type { Merchant, MerchantId } from "@/types/merchant";
import type { MarketTrendBasis } from "@/types/market";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import type { DromeRotationInfo } from "@/types/drome";
import {
  useBoostedQuery,
  useMarketHistoryQuery,
  useWarzoneScheduleQuery,
  useWorldDetailQuery,
  useWorldsQuery,
} from "@/lib/data/worldProvider";
import { briefingRepository, type BriefingFormat } from "@/lib/storage/briefingRepository";
import { createDefaultOverrides, mergeOverridesWithDefaults } from "@/lib/defaults";
import { toDateKey } from "@/lib/utils/date";
import { generateBriefingMessage, generatePlainTextBriefing } from "@/lib/formatter/generateBriefing";
import type { BriefingLanguage } from "@/lib/formatter/translations";
import { useViewerSettings } from "@/lib/context/ViewerSettingsContext";

const FALLBACK_WORLD = "Ustebra";

function nowIso(): string {
  return new Date().toISOString();
}

export interface UseBriefingStateProps {
  /** Build-time content from TibiaWiki (see lib/data/wikiContentClient.ts) — not user-editable. */
  activeEvents: ActiveEvent[];
  upcomingEvents: UpcomingEvent[];
  drome: DromeRotationInfo | null;
}

export function useBriefingState({ activeEvents, upcomingEvents, drome }: UseBriefingStateProps) {
  const [referenceDate] = useState(() => new Date());
  const dateKey = useMemo(() => toDateKey(referenceDate), [referenceDate]);

  const [world, setWorldState] = useState<string>(FALLBACK_WORLD);
  const [overrides, setOverrides] = useState<BriefingOverrides>(() =>
    createDefaultOverrides(FALLBACK_WORLD, referenceDate),
  );
  const [preferredFormat, setPreferredFormatState] = useState<BriefingFormat>("rich");
  const [briefingLanguage, setBriefingLanguageState] = useState<BriefingLanguage>("pt");
  const [upcomingEventsWindowDays, setUpcomingEventsWindowDaysState] = useState<number>(7);
  const [marketTrendBasis, setMarketTrendBasisState] = useState<MarketTrendBasis>("last");
  const { viewerTimeZone, setViewerTimeZone } = useViewerSettings();
  const hasHydrated = useRef(false);

  // Hydrate from localStorage once on mount (client-only to avoid SSR/CSR mismatches; the
  // dashboard shell also withholds rendering until this has happened, via useIsClient).
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;
    const lastWorld = briefingRepository.getLastWorld() ?? FALLBACK_WORLD;
    const savedOverrides = briefingRepository.getOverrides(lastWorld, dateKey);
    setWorldState(lastWorld);
    setOverrides(mergeOverridesWithDefaults(savedOverrides, lastWorld, referenceDate));
    setPreferredFormatState(briefingRepository.getPreferredFormat());
    setBriefingLanguageState(briefingRepository.getBriefingLanguage());
    setUpcomingEventsWindowDaysState(briefingRepository.getUpcomingEventsWindowDays());
    setMarketTrendBasisState(briefingRepository.getMarketTrendBasis());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const worldsQuery = useWorldsQuery();
  const worldDetailQuery = useWorldDetailQuery(world);
  const boostedQuery = useBoostedQuery();
  const warzoneQuery = useWarzoneScheduleQuery(world);
  const marketHistoryQuery = useMarketHistoryQuery(world);

  // Takes an updater (prev => next), not a plain object, so calling several update*
  // functions synchronously in a loop (e.g. bulk-applying parsed signals) still sees
  // each other's changes instead of each one clobbering the last based on a stale
  // `overrides` closure.
  const persist = useCallback((updater: (prev: BriefingOverrides) => BriefingOverrides) => {
    setOverrides((prev) => {
      const next = updater(prev);
      briefingRepository.setOverrides(next);
      return next;
    });
  }, []);

  const setWorld = useCallback(
    (nextWorld: string) => {
      if (nextWorld === world) return;
      briefingRepository.setLastWorld(nextWorld);
      const saved = briefingRepository.getOverrides(nextWorld, dateKey);
      setWorldState(nextWorld);
      setOverrides(mergeOverridesWithDefaults(saved, nextWorld, referenceDate));
    },
    [world, dateKey, referenceDate],
  );

  const updateMiniWorldChange = useCallback(
    (id: string, patch: Partial<MiniWorldChangeValue>) => {
      persist((prev) => ({
        ...prev,
        miniWorldChanges: {
          ...prev.miniWorldChanges,
          [id]: { ...prev.miniWorldChanges[id]!, ...patch, id, updatedAt: nowIso() },
        },
      }));
    },
    [persist],
  );

  const updateWorldChange = useCallback(
    (id: string, patch: Partial<WorldChangeValue>) => {
      persist((prev) => ({
        ...prev,
        worldChanges: {
          ...prev.worldChanges,
          [id]: { ...prev.worldChanges[id]!, ...patch, id, updatedAt: nowIso() },
        },
      }));
    },
    [persist],
  );

  const updateMerchant = useCallback(
    (id: MerchantId, patch: Partial<Merchant>) => {
      persist((prev) => ({
        ...prev,
        merchants: {
          ...prev.merchants,
          [id]: {
            ...prev.merchants[id]!,
            ...patch,
            id,
            isComputed: false,
            updatedAt: nowIso(),
          },
        },
      }));
    },
    [persist],
  );

  const setBoostedRegions = useCallback(
    (regions: string[]) => persist((prev) => ({ ...prev, boostedRegions: regions })),
    [persist],
  );

  const setIncludeAllChanges = useCallback(
    (value: boolean) => persist((prev) => ({ ...prev, includeAllChanges: value })),
    [persist],
  );

  const resetOverrides = useCallback(() => {
    briefingRepository.clearOverrides(world, dateKey);
    persist(() => createDefaultOverrides(world, referenceDate));
  }, [world, dateKey, referenceDate, persist]);

  const refreshLiveData = useCallback(() => {
    worldsQuery.refresh();
    worldDetailQuery.refresh();
    boostedQuery.refresh();
    warzoneQuery.refresh();
    marketHistoryQuery.refresh();
  }, [worldsQuery, worldDetailQuery, boostedQuery, warzoneQuery, marketHistoryQuery]);

  const setPreferredFormat = useCallback((format: BriefingFormat) => {
    setPreferredFormatState(format);
    briefingRepository.setPreferredFormat(format);
  }, []);

  const setBriefingLanguage = useCallback((language: BriefingLanguage) => {
    setBriefingLanguageState(language);
    briefingRepository.setBriefingLanguage(language);
  }, []);

  const setUpcomingEventsWindowDays = useCallback((days: number) => {
    setUpcomingEventsWindowDaysState(days);
    briefingRepository.setUpcomingEventsWindowDays(days);
  }, []);

  const setMarketTrendBasis = useCallback((basis: MarketTrendBasis) => {
    setMarketTrendBasisState(basis);
    briefingRepository.setMarketTrendBasis(basis);
  }, []);

  // Merge the real day-by-day market history in (see fetchMarketHistoryDirect in
  // lib/data/worldProvider.ts for where it comes from — the same dataset
  // tibia-warzones-schedule's own trend/average calculations are built on). Prices are
  // fully read-only here — see MarketPriceCard — so this always replaces each price's
  // history wholesale with the authoritative dataset rather than diffing incrementally.
  useEffect(() => {
    const history = marketHistoryQuery.data;
    if (!history) return;
    const timestamp = nowIso();

    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing an external feed in
    setOverrides((prev) => {
      let changed = false;
      const nextPrices = { ...prev.marketPrices };

      for (const id of Object.keys(history) as (keyof typeof history)[]) {
        const current = nextPrices[id];
        const snapshots = history[id];
        if (!current || snapshots.length === 0) continue;
        const latest = snapshots[snapshots.length - 1]!;
        const alreadyCurrent =
          current.history.length === snapshots.length &&
          current.history[current.history.length - 1]?.timestamp === latest.timestamp &&
          current.value === latest.value;
        if (alreadyCurrent) continue;

        nextPrices[id] = {
          ...current,
          value: latest.value,
          isLive: true,
          sourceTimestamp: latest.timestamp,
          updatedAt: timestamp,
          history: snapshots,
        };
        changed = true;
      }

      if (!changed) return prev;
      const next = { ...prev, marketPrices: nextPrices };
      briefingRepository.setOverrides(next);
      return next;
    });
  }, [marketHistoryQuery.data]);

  const briefingInput = useMemo(
    () => ({
      world,
      referenceDate,
      overrides,
      boostedCreature: boostedQuery.data?.creature ?? null,
      boostedBoss: boostedQuery.data?.boss ?? null,
      warzoneSchedule: warzoneQuery.data,
      activeEvents,
      upcomingEvents,
      drome,
      language: briefingLanguage,
      viewerTimeZone,
      upcomingEventsWindowDays,
      marketTrendBasis,
    }),
    [
      world,
      referenceDate,
      overrides,
      boostedQuery.data,
      warzoneQuery.data,
      activeEvents,
      upcomingEvents,
      drome,
      briefingLanguage,
      viewerTimeZone,
      upcomingEventsWindowDays,
      marketTrendBasis,
    ],
  );

  const richBriefing = useMemo(() => generateBriefingMessage(briefingInput), [briefingInput]);
  const plainBriefing = useMemo(() => generatePlainTextBriefing(briefingInput), [briefingInput]);

  return {
    world,
    setWorld,
    referenceDate,
    dateKey,

    worldsQuery,
    worldDetailQuery,
    boostedQuery,
    warzoneQuery,
    marketHistoryQuery,

    activeEvents,
    upcomingEvents,
    drome,

    overrides,
    updateMiniWorldChange,
    updateWorldChange,
    updateMerchant,
    setBoostedRegions,
    setIncludeAllChanges,

    resetOverrides,
    refreshLiveData,

    briefingInput,
    richBriefing,
    plainBriefing,
    preferredFormat,
    setPreferredFormat,
    briefingLanguage,
    setBriefingLanguage,
    upcomingEventsWindowDays,
    setUpcomingEventsWindowDays,
    marketTrendBasis,
    setMarketTrendBasis,
    viewerTimeZone,
    setViewerTimeZone,
  };
}

export type BriefingStateHook = ReturnType<typeof useBriefingState>;
