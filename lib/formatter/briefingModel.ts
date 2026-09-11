import type { BriefingOverrides } from "@/types/briefing";
import type { BoostedEntity } from "@/types/boosted";
import type { WarzoneSchedule } from "@/types/warzone";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import type { DromeRotationInfo } from "@/types/drome";
import type { MarketPriceId, MarketTrendBasis } from "@/types/market";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";
import { toBriefingDate } from "@/lib/utils/date";
import { convertTimeBetweenZones } from "@/lib/utils/timezone";
import { ENTRIES_BY_BASIS, averageOfLastEntries, computeTrendForBasis } from "@/lib/utils/priceTrend";
import { formatIsoDateUTC, formatShortDateInZone, formatTimeInZone } from "./dateFormat";
import { eventEmoji } from "./eventEmoji";
import {
  formatActiveEventLine,
  formatDromeBriefingParts,
  formatMarketPriceLabel,
  formatPriceAge,
  formatUpcomingEventDate,
  formatYasirLabel,
  notAvailableText,
} from "./phrases";
import { getTranslation, type BriefingLanguage, type BriefingTranslation } from "./translations";
import { getWorldChangeNarrative } from "./worldChangeNarratives";
import {
  getMiniWorldChangeAbsentNarrative,
  getMiniWorldChangeNarrative,
} from "./miniWorldChangeNarratives";
import { notesForChange, type BriefingNote } from "./opportunityPhrases";
import { deriveOpportunities } from "@/lib/opportunities/deriveOpportunities";

export type { BriefingLanguage } from "./translations";

export interface BriefingInput {
  world: string;
  /** "Now", for both the header date and all relative-date/deadline math. */
  referenceDate: Date;
  overrides: BriefingOverrides;
  boostedCreature: BoostedEntity | null;
  boostedBoss: BoostedEntity | null;
  warzoneSchedule: WarzoneSchedule | null;
  activeEvents: ActiveEvent[];
  upcomingEvents: UpcomingEvent[];
  drome: DromeRotationInfo | null;
  language: BriefingLanguage;
  /** IANA zone the viewer is in — used for the Drome deadline's clock time. */
  viewerTimeZone: string;
  /** How many days ahead the briefing text's upcoming-events section reaches (5/7/14) —
   * events further out than this are left off, so the section can't grow unbounded. */
  upcomingEventsWindowDays: number;
  /** Window (entry count) the market lines' displayed price and trend arrow are computed
   * over — see lib/utils/priceTrend.ts. */
  marketTrendBasis: MarketTrendBasis;
  /**
   * Live feeds that failed to load for this render. A failed section is omitted from the
   * briefing rather than printed with a "not available" placeholder: the briefing is pasted
   * into a chat as a statement of fact, so a line the app could not verify should not appear
   * at all. Absent means nothing failed.
   */
  unavailable?: {
    boosted?: boolean;
    warzone?: boolean;
    market?: boolean;
  };
}

/**
 * One change, and everything the bulletin has to say about it.
 *
 * State and opportunities live on the same entry because they are one subject. Rendered as two
 * sections they said everything twice — "Fire from the Earth: the volcano is erupting" up top,
 * then "Fire from the Earth / Hellgore volcano — hunt: in place of the usual creatures come
 * Demons, Dragons…" forty lines below. A reader scanning for what to do this morning had to
 * hold the first half in their head until the second half arrived.
 */
export interface ChangeLine {
  emoji: string;
  /** Official name, in its own casing — never upper-cased. */
  name: string;
  /**
   * Where it happens, from the catalog's own Location field. Null when the catalog has none,
   * which is a real distinction: Demon War and Sea Serpent are not anywhere in particular.
   */
  location: string | null;
  /** What is true right now, in one or two sentences. Set in italics by the renderer. */
  state: string;
  /** What this state is worth, each line carrying its own marker. */
  notes: BriefingNote[];
}

export interface MarketPriceLine {
  id: MarketPriceId;
  label: string;
  valueLabel: string;
  trendSymbol: string;
  /** null when there's no timestamp to compute an age from (a manual entry with no history yet). */
  ageLabel: string | null;
}

export interface EventLine {
  emoji: string;
  title: string;
  /** The headline fact: a spoken date for a scheduled event, or how long an active one has. */
  detail: string;
  /** "Em 2 dias", on its own line under the date. Null for events already running. */
  countdown: string | null;
}

export interface BriefingModel {
  language: BriefingLanguage;
  t: BriefingTranslation;
  dateLabel: string;
  /** "2026-09-10" — the bulletin's dateline, unambiguous wherever it is forwarded. */
  isoDateLabel: string;
  worldName: string;
  /** null when the feed failed — the renderers drop the whole block. */
  boostedCreatureLabel: string | null;
  boostedBossLabel: string | null;
  /** null means the field is genuinely not applicable today and the line is omitted. */
  boostedRegionValue: string | null;
  activeEventLines: EventLine[];
  /** The rotation deadline and its countdown, kept apart so the renderer can set them apart. */
  drome: { label: string; countdown: string | null } | null;
  /** One entry per execution, so the renderer owns the separator and the sequence's markup. */
  warzoneEntries: { time: string; sequence: string | null }[];
  yasirLabel: string;
  rashidLabel: string;
  marketPriceLines: MarketPriceLine[];
  /** Where the market numbers came from and how old they are, or null when there are none. */
  marketSourceLabel: string | null;
  miniWorldChangeLines: ChangeLine[];
  /** True once at least one Mini World Change has left "unknown" this session (a World
   * Board paste was actually applied) — distinguishes "checked, none active" from "nothing
   * has been checked yet" when miniWorldChangeLines is empty. */
  miniWorldChangesVerified: boolean;
  worldChangeLines: ChangeLine[];
  /**
   * World Changes no Guide has been asked about, by short label. UNKNOWN is a distinct state
   * from every recognised one, so it gets a distinct — and deliberately tiny — line rather
   * than being indistinguishable from "nothing is happening there".
   */
  worldChangesUnchecked: string[];
  upcomingEventLines: EventLine[];
  upcomingEventsHiddenCount: number;
}

const NUMBER_LOCALE: Record<BriefingLanguage, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  pl: "pl-PL",
};

const TREND_SYMBOL: Record<"up" | "down" | "unchanged", string> = {
  up: "⬆️",
  down: "⬇️",
  unchanged: "➡️",
};

export function trendSymbol(trend: "up" | "down" | "unchanged"): string {
  return TREND_SYMBOL[trend];
}

/**
 * How many opportunity lines any single change may contribute to the bulletin.
 *
 * The cap is per change rather than global, which keeps a busy morning readable without an
 * arbitrator deciding between changes. A drained Awash has four things to offer and a quiet
 * Thawing has one; two apiece is enough to see what each state is worth, and the catalog view
 * has the rest. A deadline-bound line is admitted on top of the cap — see opportunityLinesFor.
 * "Include everything" lifts it entirely.
 */
const OPPORTUNITIES_PER_CHANGE = 2;

/** Where the market numbers come from. Lower-case: it is a domain, not a shout. */
const MARKET_SOURCE = "tibiamarket.top";

export function buildBriefingModel(input: BriefingInput): BriefingModel {
  const { overrides } = input;
  const t = getTranslation(input.language);
  const locale = NUMBER_LOCALE[input.language];

  // Mini World Changes. A change only produces a line when the player actually knows
  // something: it is running (with the variant if a source named one), or a complete board
  // reading proved it is not. "Not checked" produces nothing at all — the briefing must
  // never present an unasked question as an answer.
  // Every established change carries its own opportunities, so the two are written once.
  const allOpportunities = deriveOpportunities({
    miniWorldChanges: overrides.miniWorldChanges,
    worldChanges: overrides.worldChanges,
    merchants: overrides.merchants,
  });
  const perChangeLimit = overrides.includeAllChanges
    ? Number.MAX_SAFE_INTEGER
    : OPPORTUNITIES_PER_CHANGE;
  const notesFor = (conditionName: string): BriefingNote[] =>
    notesForChange(
      allOpportunities.filter((o) => o.conditionName === conditionName),
      input.language,
      perChangeLimit,
    );

  const miniWorldChangeLines: ChangeLine[] = [];
  let miniWorldChangesVerified = false;
  for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
    const value = overrides.miniWorldChanges[def.id];
    if (!value || value.status === "unchecked") continue;

    // An always-active change is running whether or not the player checked anything, so it
    // must not count as evidence that a World Board reading happened — otherwise a fresh
    // session would claim to have been verified.
    if (def.detection !== "always-active") miniWorldChangesVerified = true;

    // ...and with no variant known there is nothing specific to report about it. Saying
    // "the mine rotated" every single day is noise, so it waits until the player has looked.
    if (def.detection === "always-active" && value.variantId === null && !overrides.includeAllChanges) {
      continue;
    }

    if (value.status === "inactive") {
      // A silent change the player went and looked at is the one negative worth printing.
      // Every other negative comes twenty at a time from a board reading and is already
      // reduced to a single sentence elsewhere; this one cost somebody a trip, and it is the
      // only way the rest of the guild can learn the answer. Without it, "nobody checked"
      // and "checked, nothing there" look identical in the bulletin.
      const absent =
        def.detection === "silent"
          ? getMiniWorldChangeAbsentNarrative(def.id, input.language)
          : null;
      if (absent) {
        miniWorldChangeLines.push({
          emoji: def.emoji,
          name: def.name,
          location: def.briefingLocation || def.location || null,
          state: absent,
          notes: [],
        });
        continue;
      }
      if (!overrides.includeAllChanges) continue;
      miniWorldChangeLines.push({
        emoji: def.emoji,
        name: def.name,
        location: def.briefingLocation || def.location || null,
        state: t.notRunning,
        notes: [],
      });
      continue;
    }

    const variantLabel =
      def.variants.find((variant) => variant.id === value.variantId)?.label ?? null;
    const narrative = getMiniWorldChangeNarrative(def.id, value.variantId, input.language);

    miniWorldChangeLines.push({
      emoji: def.emoji,
      name: def.name,
      location: def.briefingLocation || def.location || null,
      // `def.reference` — the catalog's known-spots list — deliberately does not travel into
      // the bulletin. Noodles alone carries twelve of them, which renders as a 376-character
      // line nobody reads on a phone, and a hint the player still has to go and verify is
      // exactly the kind of bulk the catalog view exists to hold.
      state: narrative ?? variantLabel ?? t.running,
      notes: notesFor(def.name),
    });
  }

  // World Changes. The rule is only that the player asked: **every recognised state gets a
  // line**, because the section is a report of today's world state and a state the Guide
  // actually named is exactly that report.
  //
  // This used to drop any state marked `quiet` unless the reader turned on "include
  // everything", which silently deleted six of the fourteen answers from a full Guide sweep —
  // the steamship being out of service, the horse stables running, the hive holding, the swamp
  // fever contained, the firestarters guarded and the lake clean. Every one of those is a fact
  // about today that changes what a player can do, and several of them are the *reason*
  // something else is impossible. `quiet` now only affects ordering-adjacent presentation
  // decisions elsewhere; it can no longer make a checked change disappear.
  const worldChangeLines: ChangeLine[] = [];
  const worldChangesUnchecked: string[] = [];
  for (const def of WORLD_CHANGE_DEFINITIONS) {
    const value = overrides.worldChanges[def.id];
    const state = value?.stateId ? def.states.find((option) => option.id === value.stateId) : undefined;

    if (!state) {
      // UNKNOWN, and kept as such: never asked is not the same as nothing happening.
      worldChangesUnchecked.push(def.shortLabel);
      continue;
    }

    const narrative = getWorldChangeNarrative(def.id, state.id, input.language);
    worldChangeLines.push({
      emoji: def.emoji,
      name: def.shortLabel,
      location: def.briefingLocation || def.location || null,
      // Headline and body are one paragraph about one state, so they are joined into one
      // line. Split across two they read as two separate facts, and the second — "no White
      // Deer while the wolves are there" — is the half that decides what the morning is worth.
      state: [narrative?.headline ?? state.label, narrative?.body].filter(Boolean).join(" "),
      notes: notesFor(def.shortLabel),
    });
  }

  const marketEntryCount = ENTRIES_BY_BASIS[input.marketTrendBasis];
  const marketPriceLines: MarketPriceLine[] = (
    input.unavailable?.market ? [] : Object.entries(overrides.marketPrices)
  )
    .filter(([, price]) => price.value !== null)
    .map(([id, price]) => {
      const latestEntry = price.history[price.history.length - 1];
      const ageTimestamp = price.sourceTimestamp ?? latestEntry?.timestamp ?? null;
      const basisValue = averageOfLastEntries(price.history, marketEntryCount) ?? price.value!;
      return {
        id: id as MarketPriceId,
        label: formatMarketPriceLabel(id as Parameters<typeof formatMarketPriceLabel>[0], input.language),
        valueLabel: `${Math.round(basisValue).toLocaleString(locale)} gp`,
        trendSymbol: trendSymbol(computeTrendForBasis(price.history, marketEntryCount)),
        ageLabel:
          ageTimestamp !== null
            ? formatPriceAge(ageTimestamp, input.referenceDate.getTime(), input.language)
            : null,
      };
    });

  // Attribution belongs to the numbers, so it is computed once here rather than reassembled
  // by each renderer. It used to sit as its own bold block between the merchants and the
  // coins, reading like a section heading for a section that did not exist.
  const marketAge = marketPriceLines.find((price) => price.ageLabel !== null)?.ageLabel ?? null;
  const marketSourceLabel =
    marketPriceLines.length > 0 ? t.marketSource(MARKET_SOURCE, marketAge) : null;

  const warzone = input.unavailable?.warzone ? null : input.warzoneSchedule;
  const warzoneEntries = (warzone?.executions ?? []).map((execution) => ({
    time: warzone!.timezone
      ? convertTimeBetweenZones(
          execution.scheduleTime,
          warzone!.timezone!,
          input.viewerTimeZone,
          input.referenceDate,
        )
      : execution.scheduleTime,
    sequence: execution.warzoneSequence || null,
  }));

  const drome =
    input.drome?.rotationNumber && input.drome.endsAt
      ? formatDromeBriefingParts(
          input.drome.rotationNumber,
          input.drome.endsAt,
          input.language,
          input.referenceDate,
          input.viewerTimeZone,
        )
      : null;

  const activeEventLines: EventLine[] = input.activeEvents.map((event) => ({
    emoji: eventEmoji(event.title),
    title: event.title,
    detail: formatActiveEventLine(event, input.language),
    countdown: null,
  }));

  const sortedUpcoming = input.upcomingEvents; // already sorted ascending by the data source
  const visibleUpcoming = sortedUpcoming.filter((event) => event.daysUntil <= input.upcomingEventsWindowDays);
  const upcomingEventLines: EventLine[] = visibleUpcoming.map((event) => ({
    emoji: eventEmoji(event.title),
    title: event.title,
    detail: formatUpcomingEventDate(event, input.language),
    countdown: t.inDays(event.daysUntil),
  }));

  const yasirMerchant = overrides.merchants.yasir;
  const rashidLocation = overrides.merchants.rashid?.location.trim();

  return {
    language: input.language,
    t,
    dateLabel: toBriefingDate(input.referenceDate),
    isoDateLabel: formatIsoDateUTC(input.referenceDate),
    worldName: input.world,
    boostedCreatureLabel: input.unavailable?.boosted
      ? null
      : (input.boostedCreature?.name ?? notAvailableText(input.language)),
    boostedBossLabel: input.unavailable?.boosted
      ? null
      : (input.boostedBoss?.name ?? notAvailableText(input.language)),
    boostedRegionValue: overrides.boostedRegions.length > 0 ? overrides.boostedRegions.join(", ") : null,
    activeEventLines,
    drome,
    warzoneEntries,
    yasirLabel: yasirMerchant
      ? formatYasirLabel(yasirMerchant.activityState, yasirMerchant.location, input.language)
      : notAvailableText(input.language),
    rashidLabel: rashidLocation || notAvailableText(input.language),
    marketPriceLines,
    marketSourceLabel,
    miniWorldChangeLines,
    miniWorldChangesVerified,
    worldChangeLines,
    worldChangesUnchecked,
    upcomingEventLines,
    upcomingEventsHiddenCount: Math.max(0, sortedUpcoming.length - visibleUpcoming.length),
  };
}

// Re-exported so components can build their own zone-aware date/time labels the same way
// the formatter does (e.g. the Drome card showing "ends 21/08 at 23:00" outside the briefing text).
export { formatShortDateInZone, formatTimeInZone };
