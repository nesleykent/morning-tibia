"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BriefingOverrides } from "@/types/briefing";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import type { Merchant, MerchantId } from "@/types/merchant";
import type { MarketPriceId } from "@/types/market";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import type { DromeRotationInfo } from "@/types/drome";
import {
  useBoostedQuery,
  useWarzoneScheduleQuery,
  useWorldDetailQuery,
  useWorldsQuery,
} from "@/lib/data/worldProvider";
import { briefingRepository, type BriefingFormat } from "@/lib/storage/briefingRepository";
import { createDefaultOverrides } from "@/lib/defaults";
import { applyPriceUpdate } from "@/lib/utils/priceTrend";
import { toDateKey } from "@/lib/utils/date";
import { generateBriefingMessage, generatePlainTextBriefing } from "@/lib/formatter/generateBriefing";

const FALLBACK_WORLD = "Antica";

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
  const hasHydrated = useRef(false);

  // Hydrate from localStorage once on mount (client-only to avoid SSR/CSR mismatches; the
  // dashboard shell also withholds rendering until this has happened, via useIsClient).
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;
    const lastWorld = briefingRepository.getLastWorld() ?? FALLBACK_WORLD;
    const savedOverrides = briefingRepository.getOverrides(lastWorld, dateKey);
    setWorldState(lastWorld);
    setOverrides(savedOverrides ?? createDefaultOverrides(lastWorld, referenceDate));
    setPreferredFormatState(briefingRepository.getPreferredFormat());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const worldsQuery = useWorldsQuery();
  const worldDetailQuery = useWorldDetailQuery(world);
  const boostedQuery = useBoostedQuery();
  const warzoneQuery = useWarzoneScheduleQuery(world);

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
      setOverrides(saved ?? createDefaultOverrides(nextWorld, referenceDate));
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

  const setBoostedRegion = useCallback(
    (value: string) => persist((prev) => ({ ...prev, boostedRegion: value })),
    [persist],
  );

  const setIncludeAllMiniWorldChanges = useCallback(
    (value: boolean) => persist((prev) => ({ ...prev, includeAllMiniWorldChanges: value })),
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
  }, [worldsQuery, worldDetailQuery, boostedQuery, warzoneQuery]);

  const setPreferredFormat = useCallback((format: BriefingFormat) => {
    setPreferredFormatState(format);
    briefingRepository.setPreferredFormat(format);
  }, []);

  // Merge the live Tibia Coin price feed in — but only while the field hasn't been
  // hand-edited (updatedAt === null) or was itself previously filled from this same feed
  // (isLive === true), so a manual correction always sticks.
  useEffect(() => {
    const tibiaCoin = warzoneQuery.data?.tibiaCoin;
    if (!tibiaCoin) return;
    const timestamp = nowIso();

    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing an external feed in
    setOverrides((prev) => {
      let changed = false;
      const nextPrices = { ...prev.marketPrices };

      const sellCurrent = prev.marketPrices.tibiaCoinSell;
      if (sellCurrent && (sellCurrent.updatedAt === null || sellCurrent.isLive)) {
        const updated = applyPriceUpdate(sellCurrent, tibiaCoin.supplyPrice, {
          isLive: true,
          now: timestamp,
        });
        if (updated !== sellCurrent) {
          nextPrices.tibiaCoinSell = updated;
          changed = true;
        }
      }

      const buyCurrent = prev.marketPrices.tibiaCoinBuy;
      if (buyCurrent && (buyCurrent.updatedAt === null || buyCurrent.isLive)) {
        const updated = applyPriceUpdate(buyCurrent, tibiaCoin.demandPrice, {
          isLive: true,
          now: timestamp,
        });
        if (updated !== buyCurrent) {
          nextPrices.tibiaCoinBuy = updated;
          changed = true;
        }
      }

      if (!changed) return prev;
      const next = { ...prev, marketPrices: nextPrices };
      briefingRepository.setOverrides(next);
      return next;
    });
  }, [warzoneQuery.data]);

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
    }),
    [world, referenceDate, overrides, boostedQuery.data, warzoneQuery.data, activeEvents, upcomingEvents, drome],
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

    activeEvents,
    upcomingEvents,
    drome,

    overrides,
    updateMiniWorldChange,
    updateMerchant,
    updateMarketPrice,
    setBoostedRegion,
    setIncludeAllMiniWorldChanges,

    resetOverrides,
    refreshLiveData,

    briefingInput,
    richBriefing,
    plainBriefing,
    preferredFormat,
    setPreferredFormat,
  };
}

export type BriefingStateHook = ReturnType<typeof useBriefingState>;
