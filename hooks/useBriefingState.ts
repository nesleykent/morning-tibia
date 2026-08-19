"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BriefingOverrides } from "@/types/briefing";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import type { WorldChangeValue } from "@/types/worldChange";
import type { Merchant, MerchantId } from "@/types/merchant";
import type { MarketPriceId } from "@/types/market";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import type { DromeRotationInfo } from "@/types/drome";
import {
  useBoostedQuery,
  useMarketValuesQuery,
  useWarzoneScheduleQuery,
  useWorldDetailQuery,
  useWorldsQuery,
} from "@/lib/data/worldProvider";
import { MARKET_ITEM_IDS } from "@/lib/data/marketItemIds";
import { briefingRepository, type BriefingFormat } from "@/lib/storage/briefingRepository";
import { createDefaultOverrides, mergeOverridesWithDefaults } from "@/lib/defaults";
import { applyPriceUpdate } from "@/lib/utils/priceTrend";
import { toDateKey } from "@/lib/utils/date";
import { generateBriefingMessage, generatePlainTextBriefing } from "@/lib/formatter/generateBriefing";
import type { BriefingLanguage } from "@/lib/formatter/translations";

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
  const [autoViewerTimeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [viewerTimeZoneOverride, setViewerTimeZoneOverrideState] = useState<string | null>(null);
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
    setViewerTimeZoneOverrideState(briefingRepository.getViewerTimeZoneOverride());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const worldsQuery = useWorldsQuery();
  const worldDetailQuery = useWorldDetailQuery(world);
  const boostedQuery = useBoostedQuery();
  const warzoneQuery = useWarzoneScheduleQuery(world);
  const marketValuesQuery = useMarketValuesQuery(world);

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

  const updateMarketPrice = useCallback(
    (id: MarketPriceId, newValue: number | null) => {
      persist((prev) => {
        const current = prev.marketPrices[id];
        if (!current) return prev;
        return {
          ...prev,
          marketPrices: {
            ...prev.marketPrices,
            [id]: applyPriceUpdate(current, newValue, { isLive: false, now: nowIso() }),
          },
        };
      });
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
    marketValuesQuery.refresh();
  }, [worldsQuery, worldDetailQuery, boostedQuery, warzoneQuery, marketValuesQuery]);

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

  const setViewerTimeZoneOverride = useCallback((timeZone: string | null) => {
    setViewerTimeZoneOverrideState(timeZone);
    briefingRepository.setViewerTimeZoneOverride(timeZone);
  }, []);

  const viewerTimeZone = viewerTimeZoneOverride ?? autoViewerTimeZone;

  // Merge the live api.tibiamarket.top feed in — but only while a field hasn't been
  // hand-edited (updatedAt === null) or was itself previously filled from this same feed
  // (isLive === true), so a manual correction always sticks. Mapping: "sell price" (what
  // you receive selling into the market) is the current highest buy_offer (bid); "buy
  // price" (what you pay) is the current lowest sell_offer (ask).
  useEffect(() => {
    const snapshots = marketValuesQuery.data;
    if (!snapshots || snapshots.length === 0) return;
    const timestamp = nowIso();
    const byItemId = new Map(snapshots.map((s) => [s.itemId, s]));

    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing an external feed in
    setOverrides((prev) => {
      let changed = false;
      const nextPrices = { ...prev.marketPrices };

      const applyLive = (
        priceId: keyof typeof prev.marketPrices,
        newValue: number | null,
        sourceTimestamp: number,
      ) => {
        const current = nextPrices[priceId];
        if (!current || !(current.updatedAt === null || current.isLive)) return;
        const updated = applyPriceUpdate(current, newValue, { isLive: true, now: timestamp, sourceTimestamp });
        if (updated !== current) {
          nextPrices[priceId] = updated;
          changed = true;
        }
      };

      const tibiaCoin = byItemId.get(MARKET_ITEM_IDS.tibiaCoin);
      if (tibiaCoin) {
        applyLive("tibiaCoinSell", tibiaCoin.buyOffer, tibiaCoin.time);
        applyLive("tibiaCoinBuy", tibiaCoin.sellOffer, tibiaCoin.time);
      }
      const goldToken = byItemId.get(MARKET_ITEM_IDS.goldToken);
      if (goldToken) applyLive("goldTokenSell", goldToken.buyOffer, goldToken.time);
      const silverToken = byItemId.get(MARKET_ITEM_IDS.silverToken);
      if (silverToken) applyLive("silverTokenSell", silverToken.buyOffer, silverToken.time);

      if (!changed) return prev;
      const next = { ...prev, marketPrices: nextPrices };
      briefingRepository.setOverrides(next);
      return next;
    });
  }, [marketValuesQuery.data]);

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
    marketValuesQuery,

    activeEvents,
    upcomingEvents,
    drome,

    overrides,
    updateMiniWorldChange,
    updateWorldChange,
    updateMerchant,
    updateMarketPrice,
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
    viewerTimeZone,
    viewerTimeZoneOverride,
    autoViewerTimeZone,
    setViewerTimeZoneOverride,
  };
}

export type BriefingStateHook = ReturnType<typeof useBriefingState>;
