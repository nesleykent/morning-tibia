"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BriefingOverrides } from "@/types/briefing";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import type { Merchant, MerchantId } from "@/types/merchant";
import type { MarketPriceId } from "@/types/market";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import type { DromeRotation } from "@/types/drome";
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

export function useBriefingState() {
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

  const persist = useCallback((next: BriefingOverrides) => {
    setOverrides(next);
    briefingRepository.setOverrides(next);
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
      persist({
        ...overrides,
        miniWorldChanges: {
          ...overrides.miniWorldChanges,
          [id]: { ...overrides.miniWorldChanges[id]!, ...patch, id, updatedAt: nowIso() },
        },
      });
    },
    [overrides, persist],
  );

  const updateMerchant = useCallback(
    (id: MerchantId, patch: Partial<Merchant>) => {
      persist({
        ...overrides,
        merchants: {
          ...overrides.merchants,
          [id]: {
            ...overrides.merchants[id]!,
            ...patch,
            id,
            isComputed: false,
            updatedAt: nowIso(),
          },
        },
      });
    },
    [overrides, persist],
  );

  const updateMarketPrice = useCallback(
    (id: MarketPriceId, newValue: number | null) => {
      const current = overrides.marketPrices[id];
      if (!current) return;
      persist({
        ...overrides,
        marketPrices: {
          ...overrides.marketPrices,
          [id]: applyPriceUpdate(current, newValue, { isLive: false, now: nowIso() }),
        },
      });
    },
    [overrides, persist],
  );

  const setBoostedRegion = useCallback(
    (value: string) => persist({ ...overrides, boostedRegion: value }),
    [overrides, persist],
  );

  const setIncludeAllMiniWorldChanges = useCallback(
    (value: boolean) => persist({ ...overrides, includeAllMiniWorldChanges: value }),
    [overrides, persist],
  );

  const updateDrome = useCallback(
    (patch: Partial<DromeRotation>) => persist({ ...overrides, drome: { ...overrides.drome, ...patch } }),
    [overrides, persist],
  );

  const addActiveEvent = useCallback(
    (event: Omit<ActiveEvent, "id">) =>
      persist({
        ...overrides,
        activeEvents: [...overrides.activeEvents, { ...event, id: crypto.randomUUID() }],
      }),
    [overrides, persist],
  );

  const removeActiveEvent = useCallback(
    (id: string) =>
      persist({ ...overrides, activeEvents: overrides.activeEvents.filter((e) => e.id !== id) }),
    [overrides, persist],
  );

  const addUpcomingEvent = useCallback(
    (event: Omit<UpcomingEvent, "id">) =>
      persist({
        ...overrides,
        upcomingEvents: [...overrides.upcomingEvents, { ...event, id: crypto.randomUUID() }],
      }),
    [overrides, persist],
  );

  const removeUpcomingEvent = useCallback(
    (id: string) =>
      persist({
        ...overrides,
        upcomingEvents: overrides.upcomingEvents.filter((e) => e.id !== id),
      }),
    [overrides, persist],
  );

  const resetOverrides = useCallback(() => {
    briefingRepository.clearOverrides(world, dateKey);
    persist(createDefaultOverrides(world, referenceDate));
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
    }),
    [world, referenceDate, overrides, boostedQuery.data, warzoneQuery.data],
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

    overrides,
    updateMiniWorldChange,
    updateMerchant,
    updateMarketPrice,
    setBoostedRegion,
    setIncludeAllMiniWorldChanges,
    updateDrome,
    addActiveEvent,
    removeActiveEvent,
    addUpcomingEvent,
    removeUpcomingEvent,

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
