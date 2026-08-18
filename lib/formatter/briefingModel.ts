import type { BriefingOverrides } from "@/types/briefing";
import type { BoostedEntity } from "@/types/boosted";
import type { WarzoneSchedule } from "@/types/warzone";
import type { MiniWorldChangeState } from "@/types/miniWorldChange";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { toBriefingDate } from "@/lib/utils/date";

export interface BriefingInput {
  world: string;
  referenceDate: Date;
  overrides: BriefingOverrides;
  boostedCreature: BoostedEntity | null;
  boostedBoss: BoostedEntity | null;
  warzoneSchedule: WarzoneSchedule | null;
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
  dateLabel: string;
  worldName: string;
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

const STAGE_ORDINAL: Partial<Record<MiniWorldChangeState, string>> = {
  stage1: "1º",
  stage2: "2º",
  stage3: "3º",
};

function formatAchievementValue(state: MiniWorldChangeState, detail: string): string | null {
  if (state === "unknown") return null;
  if (state === "inactive") return "❌";
  if (state === "active") return "✅";
  if (state === "stage1" || state === "stage2" || state === "stage3") {
    return `✅ - ${STAGE_ORDINAL[state]} Estágio`;
  }
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

  const achievementLines: AchievementLine[] = [];
  for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
    const value = overrides.miniWorldChanges[def.id];
    if (!value) continue;
    if (value.state === "inactive" && !overrides.includeAllMiniWorldChanges) continue;
    const valueLabel = formatAchievementValue(value.state, value.detail);
    if (valueLabel === null) continue;
    achievementLines.push({ emoji: def.emoji, label: def.label.toUpperCase(), valueLabel });
  }

  const marketPriceLines: MarketPriceLine[] = Object.values(overrides.marketPrices)
    .filter((price) => price.value !== null)
    .map((price) => ({
      label: price.label,
      valueLabel: `${price.value!.toLocaleString("pt-BR")} gp`,
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
        }`
      : null;

  const drome = overrides.drome;
  const dromeLine =
    drome.status === "unknown" && !drome.rotationLabel
      ? null
      : `${drome.status === "open" ? "Aberta" : drome.status === "closed" ? "Fechada" : "—"}${
          drome.rotationLabel ? ` — ${drome.rotationLabel}` : ""
        }`;

  return {
    dateLabel: toBriefingDate(input.referenceDate),
    worldName: input.world,
    boostedCreatureLabel: input.boostedCreature?.name ?? "—",
    boostedBossLabel: input.boostedBoss?.name ?? "—",
    boostedRegionLabel: overrides.boostedRegion.trim() || "—",
    activeEventLines: overrides.activeEvents.map((event) =>
      event.bonus ? `${event.title}: ${event.bonus}` : event.title,
    ),
    dromeLine,
    warzoneLine,
    yasirLabel: overrides.merchants.yasir?.location.trim() || "—",
    rashidLabel: overrides.merchants.rashid?.location.trim() || "—",
    marketPriceLines,
    achievementLines,
    upcomingEventLines: overrides.upcomingEvents.map((event) => {
      const parts = [event.title];
      if (event.startDate) parts.push(`(${event.startDate})`);
      if (event.note) parts.push(`— ${event.note}`);
      return parts.join(" ");
    }),
  };
}
