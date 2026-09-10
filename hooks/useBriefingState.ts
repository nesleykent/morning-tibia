"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BriefingOverrides } from "@/types/briefing";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import { MINI_WORLD_CHANGES_BY_ID } from "@/lib/defaults/miniWorldChanges";
import { WORLD_CHANGES_BY_ID } from "@/lib/defaults/worldChanges";
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
import { toTibiaDayKey } from "@/lib/utils/date";
import type { CombinedParseResult } from "@/lib/parser/parseGameText";
import { generateBriefingMessage, generatePlainTextBriefing } from "@/lib/formatter/generateBriefing";
import type { BriefingLanguage } from "@/lib/formatter/translations";
import { useViewerSettings } from "@/lib/context/ViewerSettingsContext";
import { reconcileEventServerSaveBoundaries } from "@/lib/events/reconcileEventServerSave";

const FALLBACK_WORLD = "Ustebra";

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Market prices are read-only live data that happens to live inside `overrides`, so every
 * wholesale replacement of that object has to carry them across.
 *
 * Not just tidiness: the feed is synced into state by an effect keyed on the *fetched data*,
 * which does not change merely because state was replaced. Anything that blanks the prices
 * therefore leaves the market section empty until the next fifteen-minute poll.
 */
function keepLiveData(
  next: BriefingOverrides,
  previous: BriefingOverrides,
): BriefingOverrides {
  return { ...next, marketPrices: previous.marketPrices };
}

export interface UseBriefingStateProps {
  /** Build-time content from TibiaWiki (see lib/data/wikiContentClient.ts) — not user-editable. */
  activeEvents: ActiveEvent[];
  upcomingEvents: UpcomingEvent[];
  drome: DromeRotationInfo | null;
}

export function useBriefingState({ activeEvents, upcomingEvents, drome }: UseBriefingStateProps) {
  // The moment this dispatch's Tibia day was established. Settable, because a tab left open
  // across a server save is describing a world that no longer exists — startNewDay() moves
  // the anchor forward rather than making the reader reload.
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  // Keyed on the Tibia day (server save to server save), not the device's calendar date —
  // see toTibiaDayKey. Two sessions either side of 10:00 CET are different days and must not
  // share a bucket.
  const dateKey = useMemo(() => toTibiaDayKey(referenceDate), [referenceDate]);

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
  /** State as it stood before the most recent paste, so that paste can be taken back. */
  const [undoSnapshot, setUndoSnapshot] = useState<BriefingOverrides | null>(null);

  const reconciledEvents = useMemo(
    () =>
      reconcileEventServerSaveBoundaries(
        activeEvents,
        upcomingEvents,
        referenceDate,
        viewerTimeZone,
      ),
    [activeEvents, upcomingEvents, referenceDate, viewerTimeZone],
  );

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

  // Mirrors `overrides` so an event handler can read the committed state without a stale
  // closure — used to snapshot what a paste is about to overwrite. Effects have always
  // flushed before a user event runs, so this is current by the time anyone reads it.
  const overridesRef = useRef(overrides);
  useEffect(() => {
    overridesRef.current = overrides;
  }, [overrides]);

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
      persist((prev) => {
        const current = prev.miniWorldChanges[id];
        if (!current) return prev;

        const next: MiniWorldChangeValue = { ...current, ...patch, id, updatedAt: nowIso() };
        const definition = MINI_WORLD_CHANGES_BY_ID.get(id);

        // A variant only describes *how* a change is running, so it cannot exist without
        // the change being active. This also stops a stale variant surviving into a later
        // session where the board says the change is over.
        if (next.status !== "active") {
          next.variantId = null;
        }

        // Reject a variant that isn't in this change's closed list (or any variant at all
        // on a plain on/off change) — a picker must never be able to invent a state the
        // game doesn't have.
        if (
          next.variantId !== null &&
          !definition?.variants.some((variant) => variant.id === next.variantId)
        ) {
          next.variantId = null;
        }

        return {
          ...prev,
          miniWorldChanges: { ...prev.miniWorldChanges, [id]: next },
        };
      });
    },
    [persist],
  );

  const updateWorldChange = useCallback(
    (id: string, patch: Partial<WorldChangeValue>) => {
      persist((prev) => {
        const current = prev.worldChanges[id];
        if (!current) return prev;

        const next: WorldChangeValue = { ...current, ...patch, id, updatedAt: nowIso() };
        const definition = WORLD_CHANGES_BY_ID.get(id);

        // Only a documented state of *this* World Change is acceptable.
        if (
          next.stateId !== null &&
          !definition?.states.some((state) => state.id === next.stateId)
        ) {
          return prev;
        }

        return { ...prev, worldChanges: { ...prev.worldChanges, [id]: next } };
      });
    },
    [persist],
  );

  const updateMerchant = useCallback(
    (id: MerchantId, patch: Partial<Merchant>) => {
      persist((prev) => {
        const current = prev.merchants[id];
        if (!current) return prev;

        const nextPatch: Partial<Merchant> = { ...patch };

        if (id === "yasir") {
          const proposedLocation =
            typeof nextPatch.location === "string" ? nextPatch.location.trim() : "";

          if (proposedLocation.length > 0) {
            const locationAllowed =
              current.activityState === "pending-location" ||
              current.activityState === "location-known";

            // A city picker cannot manufacture an active Oriental Trader MWC.
            if (!locationAllowed) return prev;
          }

          if (
            nextPatch.activityState === "inactive" ||
            nextPatch.activityState === "not-verified" ||
            nextPatch.activityState === "pending-location"
          ) {
            nextPatch.location = "";
          }
        }

        return {
          ...prev,
          merchants: {
            ...prev.merchants,
            [id]: {
              ...current,
              ...nextPatch,
              id,
              isComputed: false,
              updatedAt: nowIso(),
            },
          },
        };
      });
    },
    [persist],
  );

  /**
   * Writes everything a single paste established, in one atomic update.
   *
   * This used to live in the paste field itself, which looped over the parse result calling
   * four different setters. One update instead of twenty-plus means the dispatch re-renders
   * once, and — the reason it moved here — the state immediately before the paste can be
   * kept, so a paste is undoable. It needs to be: a complete board reading rules out up to
   * twenty-one changes in a single click, and the only way back used to be a reset.
   */
  const applyParsedEvidence = useCallback(
    (parsed: CombinedParseResult) => {
      if (parsed.isEmpty) return;
      setUndoSnapshot(overridesRef.current);

      persist((prev) => {
        const miniWorldChanges = { ...prev.miniWorldChanges };
        const worldChanges = { ...prev.worldChanges };
        const merchants = { ...prev.merchants };
        const stamp = nowIso();

        const setMini = (id: string, patch: Partial<MiniWorldChangeValue>) => {
          const current = miniWorldChanges[id];
          if (!current) return;
          const next: MiniWorldChangeValue = { ...current, ...patch, id, updatedAt: stamp };
          if (next.status !== "active") next.variantId = null;
          const definition = MINI_WORLD_CHANGES_BY_ID.get(id);
          if (
            next.variantId !== null &&
            !definition?.variants.some((variant) => variant.id === next.variantId)
          ) {
            next.variantId = null;
          }
          miniWorldChanges[id] = next;
        };

        for (const signal of parsed.miniWorldChangeSignals) {
          setMini(signal.changeId, { status: "active", variantId: signal.variantId });
        }
        for (const id of parsed.inactiveMiniWorldChangeIds) {
          setMini(id, { status: "inactive", variantId: null });
        }

        for (const signal of parsed.worldChangeSignals) {
          const current = worldChanges[signal.changeId];
          const definition = WORLD_CHANGES_BY_ID.get(signal.changeId);
          if (!current) continue;
          // Only a documented state of this change, same rule as the manual picker.
          if (!definition?.states.some((state) => state.id === signal.stateId)) continue;
          worldChanges[signal.changeId] = {
            ...current,
            stateId: signal.stateId,
            id: signal.changeId,
            updatedAt: stamp,
          };
        }

        const yasir = merchants.yasir;
        if (yasir) {
          const sawYasir = parsed.merchantHints.some((hint) => hint.merchantId === "yasir");
          const ruledOut = parsed.inactiveMerchantIds.includes("yasir");
          if (sawYasir) {
            // The board and the towncryer both name all three candidate cities, never one,
            // so the paste can only ever establish that he is trading — not where.
            merchants.yasir = {
              ...yasir,
              location: "",
              activityState: "pending-location",
              isComputed: false,
              updatedAt: stamp,
            };
          } else if (ruledOut) {
            merchants.yasir = {
              ...yasir,
              location: "",
              activityState: "inactive",
              isComputed: false,
              updatedAt: stamp,
            };
          }
        }

        return { ...prev, miniWorldChanges, worldChanges, merchants };
      });
    },
    [persist],
  );

  /** Puts back exactly what the last paste overwrote. Available until the next paste. */
  const undoLastEvidence = useCallback(() => {
    setUndoSnapshot((snapshot) => {
      if (!snapshot) return null;
      briefingRepository.setOverrides(snapshot);
      setOverrides(snapshot);
      return null;
    });
  }, []);

  /**
   * Moves the dispatch on to the Tibia day that has just begun. Called when a server save
   * passes while the tab is open: the world the page describes was rebuilt a moment ago, so
   * the anchor advances, saved state for the new day loads (normally nothing), and the live
   * feeds are refetched.
   */
  const startNewDay = useCallback(() => {
    const now = new Date();
    const nextKey = toTibiaDayKey(now);
    const saved = briefingRepository.getOverrides(world, nextKey);
    setReferenceDate(now);
    setOverrides((prev) => keepLiveData(mergeOverridesWithDefaults(saved, world, now), prev));
    setUndoSnapshot(null);
  }, [world]);

  const setBoostedRegions = useCallback(
    (regions: string[]) => persist((prev) => ({ ...prev, boostedRegions: regions })),
    [persist],
  );

  const setIncludeAllChanges = useCallback(
    (value: boolean) => persist((prev) => ({ ...prev, includeAllChanges: value })),
    [persist],
  );

  /**
   * Clears what the reader recorded for *this world, this Tibia day* — and nothing else.
   *
   * It used to call `clearAll()`, which walks the whole namespace: every other world, every
   * previous day, plus the briefing language, the rich/plain preference, the events window,
   * the market basis and the viewer timezone. It then forced the world back to Ustebra and
   * the language back to Portuguese. The dialog has always promised only "this world today",
   * so someone resetting a mis-pasted board lost settings they had never been warned about.
   * `clearOverrides` is the scoped method the repository has offered all along.
   */
  const resetOverrides = useCallback(() => {
    briefingRepository.clearOverrides(world, dateKey);
    // Prices are not something anyone filled in, so "reset what I recorded" leaves them be.
    setOverrides((prev) => keepLiveData(createDefaultOverrides(world, referenceDate), prev));
    setUndoSnapshot(null);
  }, [world, dateKey, referenceDate]);

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

  /**
   * Which live feeds are currently failing.
   *
   * Every query has always computed an `error`, and nothing ever read it — so a total
   * outage rendered as "?" and "—" with no message, and still produced a briefing the
   * reader could copy into a guild channel. Collected here so the page can say what broke
   * and the briefing can leave out what it does not know.
   */
  const liveData = useMemo(() => {
    const failures: string[] = [];
    if (boostedQuery.error) failures.push("boosted creature and boss");
    if (worldDetailQuery.error) failures.push("world status");
    if (worldsQuery.error) failures.push("the world list");
    if (warzoneQuery.error) failures.push("the warzone schedule");
    if (marketHistoryQuery.error) failures.push("market prices");
    return {
      boostedFailed: Boolean(boostedQuery.error),
      worldDetailFailed: Boolean(worldDetailQuery.error),
      worldsFailed: Boolean(worldsQuery.error),
      warzoneFailed: Boolean(warzoneQuery.error),
      marketFailed: Boolean(marketHistoryQuery.error),
      failures,
      hasFailure: failures.length > 0,
    };
  }, [
    boostedQuery.error,
    worldDetailQuery.error,
    worldsQuery.error,
    warzoneQuery.error,
    marketHistoryQuery.error,
  ]);

  const briefingInput = useMemo(
    () => ({
      world,
      referenceDate,
      overrides,
      boostedCreature: boostedQuery.data?.creature ?? null,
      boostedBoss: boostedQuery.data?.boss ?? null,
      warzoneSchedule: warzoneQuery.data,
      activeEvents: reconciledEvents.activeEvents,
      upcomingEvents: reconciledEvents.upcomingEvents,
      drome,
      language: briefingLanguage,
      viewerTimeZone,
      upcomingEventsWindowDays,
      marketTrendBasis,
      // A section the app could not load is left out of the briefing entirely rather than
      // printed as "not available" — the output is pasted into a guild channel as fact, and
      // a missing line is honest where a placeholder is just noise dressed as a reading.
      unavailable: {
        boosted: liveData.boostedFailed,
        warzone: liveData.warzoneFailed,
        market: liveData.marketFailed,
      },
    }),
    [
      world,
      referenceDate,
      overrides,
      boostedQuery.data,
      warzoneQuery.data,
      reconciledEvents,
      drome,
      briefingLanguage,
      viewerTimeZone,
      upcomingEventsWindowDays,
      marketTrendBasis,
      liveData,
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

    activeEvents: reconciledEvents.activeEvents,
    upcomingEvents: reconciledEvents.upcomingEvents,
    drome,

    overrides,
    updateMiniWorldChange,
    updateWorldChange,
    updateMerchant,
    setBoostedRegions,
    setIncludeAllChanges,

    applyParsedEvidence,
    undoLastEvidence,
    canUndoEvidence: undoSnapshot !== null,

    liveData,
    startNewDay,
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
