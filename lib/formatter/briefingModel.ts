import type { BriefingOverrides } from "@/types/briefing";
import type { BoostedEntity } from "@/types/boosted";
import type { WarzoneSchedule } from "@/types/warzone";
import type { MiniWorldChangeState } from "@/types/miniWorldChange";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import type { DromeRotationInfo } from "@/types/drome";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";
import { toBriefingDate } from "@/lib/utils/date";
import { getTranslation, type BriefingLanguage, type BriefingTranslation } from "./translations";

export type { BriefingLanguage } from "./translations";

export interface BriefingInput {
  world: string;
  referenceDate: Date;
  overrides: BriefingOverrides;
  boostedCreature: BoostedEntity | null;
  boostedBoss: BoostedEntity | null;
  warzoneSchedule: WarzoneSchedule | null;
  activeEvents: ActiveEvent[];
  upcomingEvents: UpcomingEvent[];
  drome: DromeRotationInfo | null;
  language: BriefingLanguage;
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
}

export interface BriefingModel {
  language: BriefingLanguage;
  t: BriefingTranslation;
  dateLabel: string;
  worldName: string;
  greeting: string;
  boostedCreatureLabel: string;
  boostedBossLabel: string;
  boostedRegionLabel: string;
  activeEventLines: string[];
  dromeLine: string | null;
  warzoneLine: string | null;
  yasirLabel: string;
  rashidLabel: string;
  marketPriceLines: MarketPriceLine[];
  achievementLines: AchievementLine[];
  upcomingEventLines: string[];
}

const NUMBER_LOCALE: Record<BriefingLanguage, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  pl: "pl-PL",
};

function formatAchievementValue(
  state: MiniWorldChangeState,
  detail: string,
  t: BriefingTranslation,
): string | null {
  if (state === "unknown") return null;
  if (state === "inactive") return "❌";
  if (state === "active") return "✅";
  if (state === "stage1") return `✅ - ${t.stageOrdinal(1)}`;
  if (state === "stage2") return `✅ - ${t.stageOrdinal(2)}`;
  if (state === "stage3") return `✅ - ${t.stageOrdinal(3)}`;
  // location / creature / boss controlType values.
  return detail.trim().length > 0 ? detail.trim() : "—";
}

export function trendSymbol(trend: "up" | "down" | "unchanged"): string {
  if (trend === "up") return "🔺";
  if (trend === "down") return "🔻";
  return "➖";
}

export function buildBriefingModel(input: BriefingInput): BriefingModel {
  const { overrides } = input;
  const t = getTranslation(input.language);
  const locale = NUMBER_LOCALE[input.language];

  const achievementLines: AchievementLine[] = [];
  for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
    const value = overrides.miniWorldChanges[def.id];
    if (!value) continue;
    if (value.state === "inactive" && !overrides.includeAllChanges) continue;
    const valueLabel = formatAchievementValue(value.state, value.detail, t);
    if (valueLabel === null) continue;
    achievementLines.push({ emoji: def.emoji, label: def.label.toUpperCase(), valueLabel });
  }
  for (const def of WORLD_CHANGE_DEFINITIONS) {
    const value = overrides.worldChanges[def.id];
    if (!value) continue;
    if (value.state === "inactive" && !overrides.includeAllChanges) continue;
    const valueLabel = formatAchievementValue(value.state, value.detail, t);
    if (valueLabel === null) continue;
    achievementLines.push({ emoji: def.emoji, label: def.label.toUpperCase(), valueLabel });
  }

  const marketPriceLines: MarketPriceLine[] = Object.values(overrides.marketPrices)
    .filter((price) => price.value !== null)
    .map((price) => ({
      label: price.label,
      valueLabel: `${price.value!.toLocaleString(locale)} gp`,
      trendSymbol: trendSymbol(price.trend),
    }));

  const warzone = input.warzoneSchedule;
  const warzoneLine =
    warzone && warzone.executions.length > 0
      ? `${warzone.executions.map((e) => e.scheduleTime).join(", ")}${
          warzone.executions.some((e) => e.warzoneSequence)
            ? ` (${warzone.executions
                .filter((e) => e.warzoneSequence)
                .map((e) => e.warzoneSequence)
                .join(" / ")})`
            : ""
        }${warzone.timezone ? ` [${warzone.timezone}]` : ""}`
      : null;

  const drome = input.drome;
  const dromeLine =
    drome && (drome.rotationNumber || drome.nextRotationIn)
      ? [
          drome.rotationNumber ? `Rotation ${drome.rotationNumber}` : null,
          drome.nextRotationIn ? `next in ${drome.nextRotationIn}` : null,
        ]
          .filter(Boolean)
          .join(" — ")
      : null;

  return {
    language: input.language,
    t,
    dateLabel: toBriefingDate(input.referenceDate),
    worldName: input.world,
    greeting: t.greeting(input.world),
    boostedCreatureLabel: input.boostedCreature?.name ?? "—",
    boostedBossLabel: input.boostedBoss?.name ?? "—",
    boostedRegionLabel: overrides.boostedRegion.trim() || "—",
    activeEventLines: input.activeEvents.map((event) => `${event.title}: ${event.detail}`),
    dromeLine,
    warzoneLine,
    yasirLabel: overrides.merchants.yasir?.location.trim() || "—",
    rashidLabel: overrides.merchants.rashid?.location.trim() || "—",
    marketPriceLines,
    achievementLines,
    upcomingEventLines: input.upcomingEvents.map((event) => `${event.title}: ${event.detail}`),
  };
}
