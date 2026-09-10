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
    model.boostedCreatureLabel
      ? `👾 ${t.boostedCreature}\n${model.boostedCreatureLabel}`
      : null,

    model.boostedBossLabel ? `👹 ${t.boostedBoss}\n${model.boostedBossLabel}` : null,

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

  const miniWorldChangeBody =
    model.miniWorldChangeLines.length > 0
      ? joinNonEmpty(
          model.miniWorldChangeLines.map(
            (line) =>
              `${line.emoji} ${line.label}: ${line.valueLabel}`,
          ),
        )
      : `_${
          model.miniWorldChangesVerified
            ? t.miniWorldChangesNoneActive
            : t.miniWorldChangesNotVerified
        }_`;

  const miniWorldChangeSection = joinNonEmpty([
    `*🎎 ${t.sectionMiniWorldChanges}*`,
    miniWorldChangeBody,
  ]);

  const worldChangeBody =
    model.worldChangeLines.length > 0
      ? model.worldChangeLines
          .map((line) =>
            joinNonEmpty([`${line.emoji} ${line.label}`, line.headline, line.body]),
          )
          .join("\n\n")
      : `_${t.worldChangesNotVerified}_`;

  // One quiet line for the keywords nobody asked about. It exists so "unknown" cannot be read
  // as "nothing is happening there" — the two are different answers and the briefing owes the
  // reader the difference.
  const uncheckedNote =
    model.worldChangeLines.length > 0 && model.worldChangesUnchecked.length > 0
      ? `_${t.worldChangesUnchecked(model.worldChangesUnchecked)}_`
      : null;

  const worldChangeSection = joinBlocks([
    `*🌍 ${t.sectionWorldChanges}*\n${worldChangeBody}`,
    uncheckedNote,
  ]);

  // Only rendered when today's state actually created one — never an empty heading.
  //
  // Grouped under the enabling change rather than tagged with "thanks to X" per line: the
  // connector was what produced "Fire from the Earth — graças a Fire from the Earth" whenever
  // an achievement shares its name with the change that unlocks it.
  const opportunitySection =
    model.opportunityGroups.length > 0
      ? joinBlocks([
          ...model.opportunityGroups.map((group, index) =>
            joinNonEmpty([
              index === 0 ? `*🏆 ${t.sectionOpportunities}*` : null,
              `${group.emoji} ${group.label}`,
              ...group.lines.flatMap((line) => [line.headline, line.detail, line.advisory]),
            ]),
          ),
          model.opportunitiesHiddenCount > 0
            ? `_${t.opportunitiesHidden(model.opportunitiesHiddenCount)}_`
            : null,
        ])
      : "";

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

  // joinBlocks, not a bare join: `opportunitySection` is "" whenever today's state created
  // no opportunities, and including it left a doubled blank line in the middle of a message
  // that gets pasted straight into WhatsApp.
  return joinBlocks([
    header,
    statusSection,
    marketSection,
    miniWorldChangeSection,
    worldChangeSection,
    opportunitySection,
    upcomingSection,
  ]);
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
    model.boostedCreatureLabel ? `${t.boostedCreature}\n${model.boostedCreatureLabel}` : null,

    model.boostedBossLabel ? `${t.boostedBoss}\n${model.boostedBossLabel}` : null,

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

  const miniWorldChangeBody =
    model.miniWorldChangeLines.length > 0
      ? joinNonEmpty(
          model.miniWorldChangeLines.map(
            (line) =>
              `${line.label}: ${line.valueLabel}`,
          ),
        )
      : model.miniWorldChangesVerified
        ? t.miniWorldChangesNoneActive
        : t.miniWorldChangesNotVerified;

  const miniWorldChangeSection = joinNonEmpty([
    `${t.sectionMiniWorldChanges}:`,
    miniWorldChangeBody,
  ]);

  const worldChangeBody =
    model.worldChangeLines.length > 0
      ? model.worldChangeLines
          .map((line) => joinNonEmpty([line.label, line.headline, line.body]))
          .join("\n\n")
      : t.worldChangesNotVerified;

  const uncheckedNote =
    model.worldChangeLines.length > 0 && model.worldChangesUnchecked.length > 0
      ? t.worldChangesUnchecked(model.worldChangesUnchecked)
      : null;

  const worldChangeSection = joinBlocks([
    `${t.sectionWorldChanges}:\n${worldChangeBody}`,
    uncheckedNote,
  ]);

  const plainOpportunitySection =
    model.opportunityGroups.length > 0
      ? joinBlocks([
          ...model.opportunityGroups.map((group, index) =>
            joinNonEmpty([
              index === 0 ? t.sectionOpportunities.toUpperCase() : null,
              group.label,
              ...group.lines.flatMap((line) => [line.headline, line.detail, line.advisory]),
            ]),
          ),
          model.opportunitiesHiddenCount > 0
            ? t.opportunitiesHidden(model.opportunitiesHiddenCount)
            : null,
        ])
      : "";

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

  return joinBlocks([
    header,
    statusSection,
    marketSection,
    miniWorldChangeSection,
    worldChangeSection,
    plainOpportunitySection,
    upcomingSection,
  ]);
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
