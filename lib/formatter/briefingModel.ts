import type { BriefingOverrides } from "@/types/briefing";
import type { BoostedEntity } from "@/types/boosted";
import type { WarzoneSchedule } from "@/types/warzone";
import type { MiniWorldChangeState } from "@/types/miniWorldChange";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import type { DromeRotationInfo } from "@/types/drome";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";
import { toBriefingDate } from "@/lib/utils/date";
import { convertTimeBetweenZones } from "@/lib/utils/timezone";
import { formatShortDateInZone, formatTimeInZone } from "./dateFormat";
import { eventEmoji } from "./eventEmoji";
import {
  formatActiveEventLine,
  formatDromeLine,
  formatMarketPriceLabel,
  formatPriceAge,
  formatUpcomingEventLine,
  formatYasirLabel,
  notAvailableText,
} from "./phrases";
import { getTranslation, type BriefingLanguage, type BriefingTranslation } from "./translations";
import { getWorldChangeNarrative } from "./worldChangeNarratives";
import { getMiniWorldChangeNarrative } from "./miniWorldChangeNarratives";

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
}

export interface AchievementLine {
  emoji: string;
  label: string;
  valueLabel: string;
}

export interface MarketPriceLine {
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
  extra: { emoji: string; text: string } | null;
}

export interface BriefingModel {
  language: BriefingLanguage;
  t: BriefingTranslation;
  dateLabel: string;
  worldName: string;
  greetingText: string;
  boostedCreatureLabel: string;
  boostedBossLabel: string;
  /** null means the field is genuinely not applicable today and the line is omitted. */
  boostedRegionValue: string | null;
  activeEventLines: EventLine[];
  dromeLine: string | null;
  warzoneLine: string | null;
  yasirLabel: string;
  rashidLabel: string;
  marketPriceLines: MarketPriceLine[];
  achievementLines: AchievementLine[];
  /** True once at least one Mini World Change has left "unknown" this session (a World
   * Board paste was actually applied) — distinguishes "checked, none active" from "nothing
   * has been checked yet" when achievementLines is empty. */
  miniWorldChangesVerified: boolean;
  worldChangeLines: WorldChangeLine[];
  /** Same idea as miniWorldChangesVerified, but for a Guide NPC chat log. */
  worldChangesVerified: boolean;
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

function formatAchievementValue(
  state: MiniWorldChangeState,
  detail: string,
  t: BriefingTranslation,
): string | null {
  if (state === "unknown") return null;
  if (state === "inactive") return "❌";
  if (state === "active") return "✅";
  if (state === "stage1") return `✅ ${t.stageOrdinal(1)}`;
  if (state === "stage2") return `✅ ${t.stageOrdinal(2)}`;
  if (state === "stage3") return `✅ ${t.stageOrdinal(3)}`;
  // location / creature / boss controlType values.
  return detail.trim().length > 0 ? detail.trim() : null;
}

export function buildBriefingModel(input: BriefingInput): BriefingModel {
  const { overrides } = input;
  const t = getTranslation(input.language);
  const locale = NUMBER_LOCALE[input.language];

  const achievementLines: AchievementLine[] = [];
  let miniWorldChangesVerified = false;
  for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
    const value = overrides.miniWorldChanges[def.id];
    if (!value) continue;
    if (value.state !== "unknown") miniWorldChangesVerified = true;
    if (value.state === "inactive" && !overrides.includeAllChanges) continue;
    const narrative = getMiniWorldChangeNarrative(def.id, value.state, value.detail, input.language);
    const valueLabel = narrative ?? formatAchievementValue(value.state, value.detail, t);
    if (valueLabel === null) continue;
    achievementLines.push({ emoji: def.emoji, label: def.label.toUpperCase(), valueLabel });
  }

  const worldChangeLines: WorldChangeLine[] = [];
  let worldChangesVerified = false;
  for (const def of WORLD_CHANGE_DEFINITIONS) {
    if (overrides.worldChanges[def.id]?.state !== "unknown") worldChangesVerified = true;
    const value = overrides.worldChanges[def.id];
    if (!value || value.state === "unknown") continue;
    if (value.state === "inactive" && !overrides.includeAllChanges) continue;
    const narrative = getWorldChangeNarrative(def.id, value.state, value.detail, input.language);
    if (narrative) {
      worldChangeLines.push({
        emoji: def.emoji,
        label: def.shortLabel.toUpperCase(),
        headline: narrative.headline,
        body: narrative.body ?? null,
        extra: narrative.extra ?? null,
      });
      continue;
    }
    // Fallback for a state with no authored narrative yet — keep the compact form so
    // nothing silently disappears from the briefing.
    const valueLabel = formatAchievementValue(value.state, value.detail, t);
    if (valueLabel === null) continue;
    worldChangeLines.push({
      emoji: def.emoji,
      label: def.shortLabel.toUpperCase(),
      headline: valueLabel,
      body: null,
      extra: null,
    });
  }

  const marketPriceLines: MarketPriceLine[] = Object.entries(overrides.marketPrices)
    .filter(([, price]) => price.value !== null)
    .map(([id, price]) => {
      const latestEntry = price.history[price.history.length - 1];
      const ageTimestamp = price.sourceTimestamp ?? latestEntry?.timestamp ?? null;
      return {
        label: formatMarketPriceLabel(id as Parameters<typeof formatMarketPriceLabel>[0], input.language),
        valueLabel: `${price.value!.toLocaleString(locale)} gp`,
        trendSymbol: trendSymbol(price.trend),
        ageLabel:
          ageTimestamp !== null
            ? formatPriceAge(ageTimestamp, input.referenceDate.getTime(), input.language)
            : null,
      };
    });

  const warzone = input.warzoneSchedule;
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
      ? formatDromeLine(
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
    boostedCreatureLabel: input.boostedCreature?.name ?? notAvailableText(input.language),
    boostedBossLabel: input.boostedBoss?.name ?? notAvailableText(input.language),
    boostedRegionValue: overrides.boostedRegions.length > 0 ? overrides.boostedRegions.join(", ") : null,
    activeEventLines,
    dromeLine,
    warzoneLine,
    yasirLabel: yasirMerchant
      ? formatYasirLabel(yasirMerchant.activityState, yasirMerchant.location, input.language)
      : notAvailableText(input.language),
    rashidLabel: rashidLocation || notAvailableText(input.language),
    marketPriceLines,
    achievementLines,
    miniWorldChangesVerified,
    worldChangeLines,
    worldChangesVerified,
    upcomingEventLines,
    upcomingEventsHiddenCount: Math.max(0, sortedUpcoming.length - visibleUpcoming.length),
  };
}

// Re-exported so components can build their own zone-aware date/time labels the same way
// the formatter does (e.g. the Drome card showing "ends 21/08 at 23:00" outside the briefing text).
export { formatShortDateInZone, formatTimeInZone };
