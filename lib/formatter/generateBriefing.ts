import {
  buildBriefingModel,
  type BriefingInput,
  type BriefingModel,
  type EventLine,
} from "./briefingModel";

export type {
  BriefingInput,
  BriefingModel,
  BriefingLanguage,
} from "./briefingModel";

export { BRIEFING_LANGUAGES } from "./translations";

function joinNonEmpty(lines: (string | null | undefined)[]): string {
  return lines
    .filter((line): line is string => Boolean(line && line.length > 0))
    .join("\n");
}

function joinBlocks(lines: (string | null | undefined)[]): string {
  return lines
    .filter((line): line is string => Boolean(line && line.length > 0))
    .join("\n\n");
}

function eventLineText(line: EventLine): string {
  return `${line.emoji} ${line.title}: ${line.detail}`;
}

function capitalizeFirst(text: string): string {
  if (text.length === 0) return text;
  return text[0]!.toUpperCase() + text.slice(1);
}

function compactActiveEventDetail(detail: string): string {
  const clean = detail.replace(/\.$/, "");
  const comma = clean.lastIndexOf(", ");

  if (comma > 0) {
    return `${capitalizeFirst(clean.slice(0, comma))} (${clean.slice(comma + 2)})`;
  }

  return capitalizeFirst(clean);
}

function compactMarketAge(age: string | null): string | null {
  if (!age) return null;

  return age
    .replace(/^há\s+/i, "")
    .replace(/^hace\s+/i, "")
    .replace(/\s+ago$/i, "")
    .replace(/\s+temu$/i, "")
    .trim();
}

function stripGp(value: string): string {
  return value.replace(/\s+gp$/i, "");
}

function merchantSectionTitle(
  language: BriefingModel["language"],
): string {
  return {
    pt: "COMERCIANTES",
    en: "MERCHANTS",
    es: "COMERCIANTES",
    pl: "HANDLARZE",
  }[language];
}

function marketOfferLabel(
  id: BriefingModel["marketPriceLines"][number]["id"],
  language: BriefingModel["language"],
): string {
  const buy = id === "tibiaCoinBuy";

  return {
    pt: buy ? "Compra" : "Venda",
    en: buy ? "Buy" : "Sell",
    es: buy ? "Compra" : "Venta",
    pl: buy ? "Kupno" : "Sprzedaż",
  }[language];
}

function marketItemName(
  id: BriefingModel["marketPriceLines"][number]["id"],
): string {
  if (id === "tibiaCoinSell" || id === "tibiaCoinBuy") {
    return "TIBIA COIN";
  }

  if (id === "goldTokenSell") {
    return "GOLD TOKEN";
  }

  return "SILVER TOKEN";
}

function marketBlocks(
  model: BriefingModel,
  rich: boolean,
): string[] {
  const itemOrder = [
    "TIBIA COIN",
    "GOLD TOKEN",
    "SILVER TOKEN",
  ];

  const blocks: string[] = [];

  for (const item of itemOrder) {
    const prices = model.marketPriceLines.filter(
      (price) => marketItemName(price.id) === item,
    );

    if (prices.length === 0) continue;

    const title = rich ? `🪙 ${item}` : item;

    const values = prices.map(
      (price) =>
        `${marketOfferLabel(price.id, model.language)}: ${stripGp(
          price.valueLabel,
        )} ${price.trendSymbol}`,
    );

    blocks.push([title, ...values].join("\n"));
  }

  return blocks;
}

export function renderRichBriefing(
  model: BriefingModel,
): string {
  const t = model.t;

  const header = joinNonEmpty([
    `📌 ${model.dateLabel}`,
    `🌞 ${model.greetingText}`,
  ]);

  const statusSection = joinBlocks([
    `👾 ${t.boostedCreature}\n${model.boostedCreatureLabel}`,

    `👹 ${t.boostedBoss}\n${model.boostedBossLabel}`,

    model.boostedRegionValue
      ? `🗺️ ${t.boostedRegion.toUpperCase()}\n${model.boostedRegionValue}`
      : null,

    ...model.activeEventLines.map(
      (line) =>
        `${line.emoji} ${line.title.toUpperCase()}\n${compactActiveEventDetail(
          line.detail,
        )}`,
    ),

    model.dromeLine
      ? `🏛️ ${t.tibiaDrome}\n${model.dromeLine}`
      : null,

    model.warzoneLine
      ? `⚔️ ${t.warzoneToday}\n${model.warzoneLine
          .split("; ")
          .join("\n")}`
      : null,
  ]);

  const firstMarketAge =
    model.marketPriceLines.find(
      (price) => price.ageLabel !== null,
    )?.ageLabel ?? null;

  const marketAge = compactMarketAge(firstMarketAge);

  const sourceHeader =
    model.marketPriceLines.length > 0
      ? `*TIBIAMARKET.TOP${
          marketAge ? ` (${marketAge})` : ""
        }*`
      : null;

  const marketSection = joinBlocks([
    `*💸 ${merchantSectionTitle(model.language)}*`,

    `💰 ${t.merchantYasir}\n${model.yasirLabel}`,

    `👳🏼‍♂️ ${t.merchantRashid}\n${model.rashidLabel}`,

    sourceHeader,

    ...marketBlocks(model, true),
  ]);

  const achievementBody =
    model.achievementLines.length > 0
      ? joinNonEmpty(
          model.achievementLines.map(
            (line) =>
              `${line.emoji} ${line.label}: ${line.valueLabel}`,
          ),
        )
      : `_${
          model.miniWorldChangesVerified
            ? t.miniWorldChangesNoneActive
            : t.miniWorldChangesNotVerified
        }_`;

  const achievementSection = joinNonEmpty([
    `*🎎 ${t.sectionMiniWorldChanges}*`,
    achievementBody,
  ]);

  const worldChangeBody =
    model.worldChangeLines.length > 0
      ? model.worldChangeLines
          .map((line) => {
            const parts = [
              `${line.emoji} ${line.label}`,
              line.headline,
            ];

            if (line.body) {
              parts.push(line.body);
            }

            if (line.extra) {
              parts.push(
                `${line.extra.emoji} ${line.extra.text}`,
              );
            }

            return parts.join("\n");
          })
          .join("\n\n")
      : `_${
          model.worldChangesVerified
            ? t.noWorldChanges
            : t.worldChangesNotVerified
        }_`;

  const worldChangeSection = joinNonEmpty([
    `*🌍 ${t.sectionWorldChanges}*`,
    worldChangeBody,
  ]);

  const upcomingBody =
    model.upcomingEventLines.length > 0
      ? joinNonEmpty(
          model.upcomingEventLines.map(
            (line) => `▫️ ${eventLineText(line)}`,
          ),
        )
      : `_${t.noUpcomingEvents}_`;

  const upcomingSection = joinNonEmpty([
    `*📅 ${t.sectionNextEvents}*`,
    upcomingBody,
  ]);

  return [
    header,
    statusSection,
    marketSection,
    achievementSection,
    worldChangeSection,
    upcomingSection,
  ].join("\n\n");
}

export function renderPlainBriefing(
  model: BriefingModel,
): string {
  const t = model.t;

  const header = joinNonEmpty([
    model.dateLabel,
    model.greetingText,
  ]);

  const statusSection = joinBlocks([
    `${t.boostedCreature}\n${model.boostedCreatureLabel}`,

    `${t.boostedBoss}\n${model.boostedBossLabel}`,

    model.boostedRegionValue
      ? `${t.boostedRegion.toUpperCase()}\n${model.boostedRegionValue}`
      : null,

    ...model.activeEventLines.map(
      (line) =>
        `${line.title.toUpperCase()}\n${compactActiveEventDetail(
          line.detail,
        )}`,
    ),

    model.dromeLine
      ? `${t.tibiaDrome}\n${model.dromeLine}`
      : null,

    model.warzoneLine
      ? `${t.warzoneToday}\n${model.warzoneLine
          .split("; ")
          .join("\n")}`
      : null,
  ]);

  const firstMarketAge =
    model.marketPriceLines.find(
      (price) => price.ageLabel !== null,
    )?.ageLabel ?? null;

  const marketAge = compactMarketAge(firstMarketAge);

  const sourceHeader =
    model.marketPriceLines.length > 0
      ? `TIBIAMARKET.TOP${
          marketAge ? ` (${marketAge})` : ""
        }`
      : null;

  const marketSection = joinBlocks([
    merchantSectionTitle(model.language),

    `${t.merchantYasir}\n${model.yasirLabel}`,

    `${t.merchantRashid}\n${model.rashidLabel}`,

    sourceHeader,

    ...marketBlocks(model, false),
  ]);

  const achievementBody =
    model.achievementLines.length > 0
      ? joinNonEmpty(
          model.achievementLines.map(
            (line) =>
              `${line.label}: ${line.valueLabel}`,
          ),
        )
      : model.miniWorldChangesVerified
        ? t.miniWorldChangesNoneActive
        : t.miniWorldChangesNotVerified;

  const achievementSection = joinNonEmpty([
    `${t.sectionMiniWorldChanges}:`,
    achievementBody,
  ]);

  const worldChangeBody =
    model.worldChangeLines.length > 0
      ? model.worldChangeLines
          .map((line) => {
            const parts = [
              line.label,
              line.headline,
            ];

            if (line.body) {
              parts.push(line.body);
            }

            if (line.extra) {
              parts.push(line.extra.text);
            }

            return parts.join("\n");
          })
          .join("\n\n")
      : model.worldChangesVerified
        ? t.noWorldChanges
        : t.worldChangesNotVerified;

  const worldChangeSection = joinNonEmpty([
    `${t.sectionWorldChanges}:`,
    worldChangeBody,
  ]);

  const upcomingBody =
    model.upcomingEventLines.length > 0
      ? joinNonEmpty(
          model.upcomingEventLines.map(
            (line) =>
              `${line.title}: ${line.detail}`,
          ),
        )
      : t.noUpcomingEvents;

  const upcomingSection = joinNonEmpty([
    `${t.sectionNextEvents}:`,
    upcomingBody,
  ]);

  return [
    header,
    statusSection,
    marketSection,
    achievementSection,
    worldChangeSection,
    upcomingSection,
  ].join("\n\n");
}

export function generateBriefingMessage(
  input: BriefingInput,
): string {
  return renderRichBriefing(
    buildBriefingModel(input),
  );
}

export function generatePlainTextBriefing(
  input: BriefingInput,
): string {
  return renderPlainBriefing(
    buildBriefingModel(input),
  );
}
