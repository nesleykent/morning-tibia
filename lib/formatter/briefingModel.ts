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
import { formatShortDateInZone, formatTimeInZone } from "./dateFormat";
import { eventEmoji } from "./eventEmoji";
import {
  formatActiveEventLine,
  formatDromeBriefingLine,
  formatMarketPriceLabel,
  formatPriceAge,
  formatUpcomingEventLine,
  formatYasirLabel,
  notAvailableText,
} from "./phrases";
import { getTranslation, type BriefingLanguage, type BriefingTranslation } from "./translations";
import { getWorldChangeNarrative } from "./worldChangeNarratives";
import { getMiniWorldChangeNarrative } from "./miniWorldChangeNarratives";
import { groupOpportunities, type OpportunityGroup } from "./opportunityPhrases";
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

export interface MiniWorldChangeLine {
  emoji: string;
  label: string;
  valueLabel: string;
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
  detail: string;
}

export interface WorldChangeLine {
  emoji: string;
  label: string;
  headline: string;
  body: string | null;
}

export interface BriefingModel {
  language: BriefingLanguage;
  t: BriefingTranslation;
  dateLabel: string;
  worldName: string;
  greetingText: string;
  /** null when the feed failed — the renderers drop the whole block. */
  boostedCreatureLabel: string | null;
  boostedBossLabel: string | null;
  /** null means the field is genuinely not applicable today and the line is omitted. */
  boostedRegionValue: string | null;
  activeEventLines: EventLine[];
  dromeLine: string | null;
  warzoneLine: string | null;
  yasirLabel: string;
  rashidLabel: string;
  marketPriceLines: MarketPriceLine[];
  miniWorldChangeLines: MiniWorldChangeLine[];
  /** True once at least one Mini World Change has left "unknown" this session (a World
   * Board paste was actually applied) — distinguishes "checked, none active" from "nothing
   * has been checked yet" when miniWorldChangeLines is empty. */
  miniWorldChangesVerified: boolean;
  worldChangeLines: WorldChangeLine[];
  /**
   * World Changes no Guide has been asked about, by short label. UNKNOWN is a distinct state
   * from every recognised one, so it gets a distinct — and deliberately tiny — line rather
   * than being indistinguishable from "nothing is happening there".
   */
  worldChangesUnchecked: string[];
  /**
   * What today's *confirmed* states make worth doing, grouped by the change that created
   * them. Derived from the same evidence rules as everything else, so an unchecked change can
   * never produce one. Capped — the briefing is a morning summary, not a wiki.
   */
  opportunityGroups: OpportunityGroup[];
  /** Opportunities the cap left out, so the briefing can say there are more. */
  opportunitiesHiddenCount: number;
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
 * How many opportunity lines the briefing will print before it starts saying "and N more".
 *
 * A full Guide sweep plus a busy board can establish forty-odd opportunities, and a message
 * that long stops being a morning briefing and becomes a wiki dump. The budget is spent one
 * round at a time across the changes that have something to offer (see groupOpportunities), so
 * sixteen lines means a dozen different states heard from rather than three heard from at
 * length, with a small reserve so the deadline-bound tiers cannot be crowded out entirely. "Include everything" lifts it entirely.
 */
const OPPORTUNITY_LINE_LIMIT = 16;

export function buildBriefingModel(input: BriefingInput): BriefingModel {
  const { overrides } = input;
  const t = getTranslation(input.language);
  const locale = NUMBER_LOCALE[input.language];

  // Mini World Changes. A change only produces a line when the player actually knows
  // something: it is running (with the variant if a source named one), or a complete board
  // reading proved it is not. "Not checked" produces nothing at all — the briefing must
  // never present an unasked question as an answer.
  const miniWorldChangeLines: MiniWorldChangeLine[] = [];
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
      if (!overrides.includeAllChanges) continue;
      miniWorldChangeLines.push({
        emoji: def.emoji,
        label: def.name.toUpperCase(),
        valueLabel: t.notRunning,
      });
      continue;
    }

    const variantLabel =
      def.variants.find((variant) => variant.id === value.variantId)?.label ?? null;
    const narrative = getMiniWorldChangeNarrative(def.id, value.variantId, input.language);

    miniWorldChangeLines.push({
      emoji: def.emoji,
      label: def.name.toUpperCase(),
      valueLabel: narrative ?? variantLabel ?? t.running,
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
  const worldChangeLines: WorldChangeLine[] = [];
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
      label: def.shortLabel.toUpperCase(),
      headline: narrative?.headline ?? state.label,
      body: narrative?.body ?? null,
    });
  }

  const { groups: opportunityGroups, hiddenCount: opportunitiesHiddenCount } = groupOpportunities(
    deriveOpportunities({
      miniWorldChanges: overrides.miniWorldChanges,
      worldChanges: overrides.worldChanges,
      merchants: overrides.merchants,
    }),
    input.language,
    overrides.includeAllChanges ? Number.MAX_SAFE_INTEGER : OPPORTUNITY_LINE_LIMIT,
  );

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

  const warzone = input.unavailable?.warzone ? null : input.warzoneSchedule;
  const warzoneLine =
    warzone && warzone.executions.length > 0
      ? warzone.executions
          .map((execution) => {
            const time = warzone.timezone
              ? convertTimeBetweenZones(
                  execution.scheduleTime,
                  warzone.timezone,
                  input.viewerTimeZone,
                  input.referenceDate,
                )
              : execution.scheduleTime;
            return execution.warzoneSequence ? `${time} (${execution.warzoneSequence})` : time;
          })
          .join("; ")
      : null;

  const dromeLine =
    input.drome?.rotationNumber && input.drome.endsAt
      ? formatDromeBriefingLine(
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
  }));

  const sortedUpcoming = input.upcomingEvents; // already sorted ascending by the data source
  const visibleUpcoming = sortedUpcoming.filter((event) => event.daysUntil <= input.upcomingEventsWindowDays);
  const upcomingEventLines: EventLine[] = visibleUpcoming.map((event) => ({
    emoji: eventEmoji(event.title),
    title: event.title,
    detail: formatUpcomingEventLine(event, input.language),
  }));

  const yasirMerchant = overrides.merchants.yasir;
  const rashidLocation = overrides.merchants.rashid?.location.trim();

  return {
    language: input.language,
    t,
    dateLabel: toBriefingDate(input.referenceDate),
    worldName: input.world,
    greetingText: t.greeting(input.world),
    boostedCreatureLabel: input.unavailable?.boosted
      ? null
      : (input.boostedCreature?.name ?? notAvailableText(input.language)),
    boostedBossLabel: input.unavailable?.boosted
      ? null
      : (input.boostedBoss?.name ?? notAvailableText(input.language)),
    boostedRegionValue: overrides.boostedRegions.length > 0 ? overrides.boostedRegions.join(", ") : null,
    activeEventLines,
    dromeLine,
    warzoneLine,
    yasirLabel: yasirMerchant
      ? formatYasirLabel(yasirMerchant.activityState, yasirMerchant.location, input.language)
      : notAvailableText(input.language),
    rashidLabel: rashidLocation || notAvailableText(input.language),
    marketPriceLines,
    miniWorldChangeLines,
    miniWorldChangesVerified,
    worldChangeLines,
    worldChangesUnchecked,
    opportunityGroups,
    opportunitiesHiddenCount,
    upcomingEventLines,
    upcomingEventsHiddenCount: Math.max(0, sortedUpcoming.length - visibleUpcoming.length),
  };
}

// Re-exported so components can build their own zone-aware date/time labels the same way
// the formatter does (e.g. the Drome card showing "ends 21/08 at 23:00" outside the briefing text).
export { formatShortDateInZone, formatTimeInZone };
