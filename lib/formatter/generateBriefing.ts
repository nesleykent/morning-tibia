import { buildBriefingModel, type BriefingInput, type BriefingModel } from "./briefingModel";

export type { BriefingInput, BriefingModel, BriefingLanguage } from "./briefingModel";
export { BRIEFING_LANGUAGES } from "./translations";

function joinNonEmpty(lines: (string | null | undefined)[]): string {
  return lines.filter((line): line is string => Boolean(line && line.length > 0)).join("\n");
}

/**
 * Rich, WhatsApp-ready briefing: `*asterisks*` for bold and emoji throughout, matching
 * the structure of a typical community daily bulletin. Section headers/labels are
 * localized via model.t (see lib/formatter/translations.ts); merchant names (Yasir,
 * Rashid) and in-game content names stay as-is across languages, same as the reference.
 */
export function renderRichBriefing(model: BriefingModel): string {
  const t = model.t;
  const header = joinNonEmpty([`📌${model.dateLabel}`, model.greeting]);

  const statusLines = [
    `👾*${t.boostedCreature}:* ${model.boostedCreatureLabel}`,
    `👹*${t.boostedBoss}:* ${model.boostedBossLabel}`,
    `🗺️*${t.boostedRegion}:* ${model.boostedRegionLabel}`,
    ...model.activeEventLines.map((line) => `🎉 ${line}`),
    model.dromeLine ? `🏛️*${t.tibiaDrome}:* ${model.dromeLine}` : null,
    model.warzoneLine ? `⚔️*${t.warzoneToday}:* ${model.warzoneLine}` : null,
  ];
  const statusSection = joinNonEmpty([`🌎 *${t.sectionStatus}:*`, joinNonEmpty(statusLines)]);

  const marketLines = [
    `💰*YASIR:* ${model.yasirLabel}`,
    `👳🏼‍♂️*RASHID:* ${model.rashidLabel}`,
    ...model.marketPriceLines.map(
      (price) => `🪙*${price.label}:* ${price.valueLabel} ${price.trendSymbol}`,
    ),
  ];
  const marketSection = joinNonEmpty([`💸 *${t.sectionMarket}:*`, joinNonEmpty(marketLines)]);

  const achievementBody =
    model.achievementLines.length > 0
      ? joinNonEmpty(
          model.achievementLines.map(
            (line) => `${line.emoji}*${line.label}:* ${line.valueLabel}`,
          ),
        )
      : `_${t.noAchievements}_`;
  const achievementSection = joinNonEmpty([`🎎 *${t.sectionAchievements}:*`, achievementBody]);

  const upcomingBody =
    model.upcomingEventLines.length > 0
      ? joinNonEmpty(model.upcomingEventLines.map((line) => `▫️ ${line}`))
      : `_${t.noUpcomingEvents}_`;
  const upcomingSection = joinNonEmpty([`📅 *${t.sectionNextEvents}:*`, upcomingBody]);

  return [header, statusSection, marketSection, achievementSection, upcomingSection].join("\n\n");
}

/** Strips markdown bold and emoji for platforms that render them poorly (SMS, plain email). */
export function renderPlainBriefing(model: BriefingModel): string {
  const t = model.t;
  const header = joinNonEmpty([model.dateLabel, model.greeting.replace(/^🌞/, "")]);

  const statusLines = [
    `${t.boostedCreature}: ${model.boostedCreatureLabel}`,
    `${t.boostedBoss}: ${model.boostedBossLabel}`,
    `${t.boostedRegion}: ${model.boostedRegionLabel}`,
    ...model.activeEventLines,
    model.dromeLine ? `${t.tibiaDrome}: ${model.dromeLine}` : null,
    model.warzoneLine ? `${t.warzoneToday}: ${model.warzoneLine}` : null,
  ];
  const statusSection = joinNonEmpty([`${t.sectionStatus}:`, joinNonEmpty(statusLines)]);

  const marketLines = [
    `YASIR: ${model.yasirLabel}`,
    `RASHID: ${model.rashidLabel}`,
    ...model.marketPriceLines.map((price) => `${price.label}: ${price.valueLabel}`),
  ];
  const marketSection = joinNonEmpty([`${t.sectionMarket}:`, joinNonEmpty(marketLines)]);

  const achievementBody =
    model.achievementLines.length > 0
      ? joinNonEmpty(model.achievementLines.map((line) => `${line.label}: ${line.valueLabel}`))
      : t.noAchievements;
  const achievementSection = joinNonEmpty([`${t.sectionAchievements}:`, achievementBody]);

  const upcomingBody =
    model.upcomingEventLines.length > 0 ? joinNonEmpty(model.upcomingEventLines) : t.noUpcomingEvents;
  const upcomingSection = joinNonEmpty([`${t.sectionNextEvents}:`, upcomingBody]);

  return [header, statusSection, marketSection, achievementSection, upcomingSection].join("\n\n");
}

export function generateBriefingMessage(input: BriefingInput): string {
  return renderRichBriefing(buildBriefingModel(input));
}

export function generatePlainTextBriefing(input: BriefingInput): string {
  return renderPlainBriefing(buildBriefingModel(input));
}
