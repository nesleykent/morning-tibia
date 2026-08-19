import { buildBriefingModel, type BriefingInput, type BriefingModel, type EventLine } from "./briefingModel";

export type { BriefingInput, BriefingModel, BriefingLanguage } from "./briefingModel";
export { BRIEFING_LANGUAGES } from "./translations";

function joinNonEmpty(lines: (string | null | undefined)[]): string {
  return lines.filter((line): line is string => Boolean(line && line.length > 0)).join("\n");
}

function eventLineText(line: EventLine): string {
  return `${line.emoji} ${line.title}: ${line.detail}`;
}

/**
 * Rich, WhatsApp-ready briefing: `*asterisks*` bold every section heading only — field
 * labels stay plain so the message reads as scannable one-fact-per-line text, matching a
 * typical community daily bulletin. Section headers/labels are localized via model.t (see
 * lib/formatter/translations.ts); merchant names (Yasir, Rashid) and in-game content names
 * stay untranslated across languages, same as the official game.
 */
export function renderRichBriefing(model: BriefingModel): string {
  const t = model.t;
  const header = joinNonEmpty([`📌${model.dateLabel}`, `🌞 ${model.greetingText}`]);

  const statusLines = [
    `👾 ${t.boostedCreature}: ${model.boostedCreatureLabel}`,
    `👹 ${t.boostedBoss}: ${model.boostedBossLabel}`,
    model.boostedRegionValue ? `🗺️ ${t.boostedRegion}: ${model.boostedRegionValue}` : null,
    ...model.activeEventLines.map((line) => eventLineText(line)),
    model.dromeLine ? `🏛️ ${t.tibiaDrome}: ${model.dromeLine}` : null,
    model.warzoneLine ? `⚔️ ${t.warzoneToday}: ${model.warzoneLine}` : null,
  ];
  const statusSection = joinNonEmpty([`*🌎 ${t.sectionStatus}*`, joinNonEmpty(statusLines)]);

  const marketLines = [
    `💰 ${t.merchantYasir}: ${model.yasirLabel}`,
    `👳🏼‍♂️ ${t.merchantRashid}: ${model.rashidLabel}`,
    ...model.marketPriceLines.map(
      (price) =>
        `🪙 ${price.label}: ${price.valueLabel} ${price.trendSymbol}${price.ageLabel ? ` (${price.ageLabel})` : ""}`,
    ),
  ];
  const marketSection = joinNonEmpty([`*💸 ${t.sectionMarket}*`, joinNonEmpty(marketLines)]);

  const achievementBody =
    model.achievementLines.length > 0
      ? joinNonEmpty(model.achievementLines.map((line) => `${line.emoji} ${line.label}: ${line.valueLabel}`))
      : `_${t.noAchievements}_`;
  const achievementSection = joinNonEmpty([`*🎎 ${t.sectionAchievements}*`, achievementBody]);

  const worldChangeBody =
    model.worldChangeLines.length > 0
      ? model.worldChangeLines
          .map((line) => {
            const parts = [`${line.emoji} ${line.label}`, line.headline];
            if (line.body) parts.push(line.body);
            if (line.extra) parts.push(`${line.extra.emoji} ${line.extra.text}`);
            return parts.join("\n");
          })
          .join("\n\n")
      : `_${t.noWorldChanges}_`;
  const worldChangeSection = joinNonEmpty([`*🌍 ${t.sectionWorldChanges}*`, worldChangeBody]);

  const upcomingBody =
    model.upcomingEventLines.length > 0
      ? joinNonEmpty(model.upcomingEventLines.map((line) => `▫️ ${eventLineText(line)}`))
      : `_${t.noUpcomingEvents}_`;
  const upcomingSection = joinNonEmpty([`*📅 ${t.sectionNextEvents}*`, upcomingBody]);

  return [header, statusSection, marketSection, achievementSection, worldChangeSection, upcomingSection].join(
    "\n\n",
  );
}

/** Strips markdown bold and emoji for platforms that render them poorly (SMS, plain email). */
export function renderPlainBriefing(model: BriefingModel): string {
  const t = model.t;
  const header = joinNonEmpty([model.dateLabel, model.greetingText]);

  const statusLines = [
    `${t.boostedCreature}: ${model.boostedCreatureLabel}`,
    `${t.boostedBoss}: ${model.boostedBossLabel}`,
    model.boostedRegionValue ? `${t.boostedRegion}: ${model.boostedRegionValue}` : null,
    ...model.activeEventLines.map((line) => `${line.title}: ${line.detail}`),
    model.dromeLine ? `${t.tibiaDrome}: ${model.dromeLine}` : null,
    model.warzoneLine ? `${t.warzoneToday}: ${model.warzoneLine}` : null,
  ];
  const statusSection = joinNonEmpty([`${t.sectionStatus}:`, joinNonEmpty(statusLines)]);

  const marketLines = [
    `${t.merchantYasir}: ${model.yasirLabel}`,
    `${t.merchantRashid}: ${model.rashidLabel}`,
    ...model.marketPriceLines.map(
      (price) => `${price.label}: ${price.valueLabel}${price.ageLabel ? ` (${price.ageLabel})` : ""}`,
    ),
  ];
  const marketSection = joinNonEmpty([`${t.sectionMarket}:`, joinNonEmpty(marketLines)]);

  const achievementBody =
    model.achievementLines.length > 0
      ? joinNonEmpty(model.achievementLines.map((line) => `${line.label}: ${line.valueLabel}`))
      : t.noAchievements;
  const achievementSection = joinNonEmpty([`${t.sectionAchievements}:`, achievementBody]);

  const worldChangeBody =
    model.worldChangeLines.length > 0
      ? model.worldChangeLines
          .map((line) => {
            const parts = [line.label, line.headline];
            if (line.body) parts.push(line.body);
            if (line.extra) parts.push(line.extra.text);
            return parts.join("\n");
          })
          .join("\n\n")
      : t.noWorldChanges;
  const worldChangeSection = joinNonEmpty([`${t.sectionWorldChanges}:`, worldChangeBody]);

  const upcomingBody =
    model.upcomingEventLines.length > 0
      ? joinNonEmpty(model.upcomingEventLines.map((line) => `${line.title}: ${line.detail}`))
      : t.noUpcomingEvents;
  const upcomingSection = joinNonEmpty([`${t.sectionNextEvents}:`, upcomingBody]);

  return [header, statusSection, marketSection, achievementSection, worldChangeSection, upcomingSection].join(
    "\n\n",
  );
}

export function generateBriefingMessage(input: BriefingInput): string {
  return renderRichBriefing(buildBriefingModel(input));
}

export function generatePlainTextBriefing(input: BriefingInput): string {
  return renderPlainBriefing(buildBriefingModel(input));
}
