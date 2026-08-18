import { buildBriefingModel, type BriefingInput, type BriefingModel } from "./briefingModel";

export type { BriefingInput, BriefingModel } from "./briefingModel";

function joinNonEmpty(lines: (string | null | undefined)[]): string {
  return lines.filter((line): line is string => Boolean(line && line.length > 0)).join("\n");
}

/**
 * Rich, WhatsApp-ready briefing: `*asterisks*` for bold and emoji throughout, matching
 * the structure of a typical community daily bulletin.
 */
export function renderRichBriefing(model: BriefingModel): string {
  const header = joinNonEmpty([`📌${model.dateLabel}`, `🌞Bom dia ${model.worldName}!`]);

  const statusLines = [
    `👾*CRIATURA BOOSTADA:* ${model.boostedCreatureLabel}`,
    `👹*BOSS BOOSTADO:* ${model.boostedBossLabel}`,
    `🗺️*Região boostada:* ${model.boostedRegionLabel}`,
    ...model.activeEventLines.map((line) => `🎉 ${line}`),
    model.dromeLine ? `🏛️*Tibia Drome:* ${model.dromeLine}` : null,
    model.warzoneLine ? `⚔️*Warzone hoje:* ${model.warzoneLine}` : null,
  ];
  const statusSection = joinNonEmpty([
    "🌎 *EVENTOS ATIVOS E STATUS DO DIA:*",
    joinNonEmpty(statusLines),
  ]);

  const marketLines = [
    `💰*YASIR:* ${model.yasirLabel}`,
    `👳🏼‍♂️*RASHID:* ${model.rashidLabel}`,
    ...model.marketPriceLines.map(
      (price) => `🪙*${price.label}:* ${price.valueLabel} ${price.trendSymbol}`,
    ),
  ];
  const marketSection = joinNonEmpty([
    "💸 *COMERCIANTES E CÂMBIO DO DIA:*",
    joinNonEmpty(marketLines),
  ]);

  const achievementBody =
    model.achievementLines.length > 0
      ? joinNonEmpty(
          model.achievementLines.map(
            (line) => `${line.emoji}*${line.label}:* ${line.valueLabel}`,
          ),
        )
      : "_Nenhuma mudança registrada hoje._";
  const achievementSection = joinNonEmpty(["🎎 *ACHIEVEMENTS E BOSSES:*", achievementBody]);

  const upcomingBody =
    model.upcomingEventLines.length > 0
      ? joinNonEmpty(model.upcomingEventLines.map((line) => `▫️ ${line}`))
      : "_Nenhum evento programado no momento._";
  const upcomingSection = joinNonEmpty(["📅 *NEXT EVENTOS:*", upcomingBody]);

  return [header, statusSection, marketSection, achievementSection, upcomingSection].join("\n\n");
}

/** Strips markdown bold and emoji for platforms that render them poorly (SMS, plain email). */
export function renderPlainBriefing(model: BriefingModel): string {
  const header = joinNonEmpty([model.dateLabel, `Bom dia ${model.worldName}!`]);

  const statusLines = [
    `CRIATURA BOOSTADA: ${model.boostedCreatureLabel}`,
    `BOSS BOOSTADO: ${model.boostedBossLabel}`,
    `Região boostada: ${model.boostedRegionLabel}`,
    ...model.activeEventLines,
    model.dromeLine ? `Tibia Drome: ${model.dromeLine}` : null,
    model.warzoneLine ? `Warzone hoje: ${model.warzoneLine}` : null,
  ];
  const statusSection = joinNonEmpty(["EVENTOS ATIVOS E STATUS DO DIA:", joinNonEmpty(statusLines)]);

  const marketLines = [
    `YASIR: ${model.yasirLabel}`,
    `RASHID: ${model.rashidLabel}`,
    ...model.marketPriceLines.map((price) => `${price.label}: ${price.valueLabel}`),
  ];
  const marketSection = joinNonEmpty(["COMERCIANTES E CÂMBIO DO DIA:", joinNonEmpty(marketLines)]);

  const achievementBody =
    model.achievementLines.length > 0
      ? joinNonEmpty(model.achievementLines.map((line) => `${line.label}: ${line.valueLabel}`))
      : "Nenhuma mudança registrada hoje.";
  const achievementSection = joinNonEmpty(["ACHIEVEMENTS E BOSSES:", achievementBody]);

  const upcomingBody =
    model.upcomingEventLines.length > 0
      ? joinNonEmpty(model.upcomingEventLines)
      : "Nenhum evento programado no momento.";
  const upcomingSection = joinNonEmpty(["NEXT EVENTOS:", upcomingBody]);

  return [header, statusSection, marketSection, achievementSection, upcomingSection].join("\n\n");
}

export function generateBriefingMessage(input: BriefingInput): string {
  return renderRichBriefing(buildBriefingModel(input));
}

export function generatePlainTextBriefing(input: BriefingInput): string {
  return renderPlainBriefing(buildBriefingModel(input));
}
