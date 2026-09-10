import {
  buildBriefingModel,
  type BriefingInput,
  type BriefingModel,
  type ChangeLine,
  type EventLine,
} from "./briefingModel";

export type {
  BriefingInput,
  BriefingModel,
  BriefingLanguage,
} from "./briefingModel";

export { BRIEFING_LANGUAGES } from "./translations";

/**
 * The bulletin, in one renderer.
 *
 * There used to be two — `renderRichBriefing` and `renderPlainBriefing` — running ~150 lines
 * of near-identical logic that differed only in whether a line carried an emoji and a pair of
 * asterisks. They drifted, as duplicated renderers do: the rich one headed a section
 * `*🎎 MINI WORLD CHANGES*` while the plain one wrote `MINI WORLD CHANGES:`, and a fix to one
 * was a coin-flip to reach the other. One renderer with a two-field `Style` cannot drift.
 *
 * ## Formatting, and why this shape
 *
 * The output is pasted into WhatsApp and Discord, which constrains three things:
 *
 * - **Length.** A message nobody scrolls through is a message nobody reads. Every fact appears
 *   once, and a change's state and what that state is worth are the same entry rather than two
 *   sections that mention the same places forty lines apart.
 * - **Markup.** `*bold*` is WhatsApp's syntax; Discord reads it as italic. That degrades
 *   gracefully — still emphasis, still readable — whereas Discord's `**bold**` arrives in
 *   WhatsApp as literal asterisks. So single `*` for headings and `_` for asides, which both
 *   clients agree on, and nothing else.
 * - **No indentation.** Leading spaces are collapsed or shown inconsistently, so nesting is a
 *   `▸` prefix rather than whitespace.
 *
 * Names keep their own casing. Upper-casing them was noise — a column of `FIRE FROM THE EARTH`
 * reads as shouting — and it mangles official Tibia names the app is otherwise careful to
 * reproduce exactly.
 */

interface Style {
  /** Emoji are dropped entirely in plain mode rather than left as stray glyphs. */
  emoji: boolean;
  /** WhatsApp/Discord markup, for readers whose destination shows it literally. */
  markup: boolean;
}

const RICH: Style = { emoji: true, markup: true };
const PLAIN: Style = { emoji: false, markup: false };

function joinLines(lines: (string | null | undefined)[]): string {
  return lines.filter((line): line is string => Boolean(line && line.length > 0)).join("\n");
}

function joinBlocks(blocks: (string | null | undefined)[]): string {
  return blocks.filter((block): block is string => Boolean(block && block.length > 0)).join("\n\n");
}

/** `👾 Criatura boostada: Badger` — label and value on one line. */
function field(style: Style, emoji: string, label: string, value: string): string {
  return `${style.emoji ? `${emoji} ` : ""}${label}: ${value}`;
}

function heading(style: Style, emoji: string, text: string): string {
  const withEmoji = style.emoji ? `${emoji} ${text}` : text;
  return style.markup ? `*${withEmoji}*` : withEmoji;
}

/** An aside — an attribution, a caveat, an empty state. Never a fact the reader came for. */
function aside(style: Style, text: string): string {
  return style.markup ? `_${text}_` : text;
}

function stripGp(value: string): string {
  return value.replace(/\s+gp$/i, "");
}

/**
 * One change: what is true, then what that makes worth doing.
 *
 * The `▸` lines are the format's only nesting, and they exist because an opportunity is
 * subordinate to the state that created it. Printed as siblings in their own section, they
 * made the bulletin read as two unrelated lists that happened to name the same places.
 */
function changeBlock(style: Style, line: ChangeLine): string {
  const name = style.markup ? `*${line.name}*` : line.name;
  const head = `${style.emoji ? `${line.emoji} ` : ""}${name} — ${line.state}`;
  return joinLines([head, ...line.opportunities.map((opportunity) => `▸ ${opportunity.text}`)]);
}

/**
 * Changes with something to act on first, then the rest.
 *
 * The bulletin is read to decide what to do with a morning, so the entries that answer that
 * come first. Ordering is otherwise left alone: inside each half the catalog order is kept, so
 * the same world reads the same way from one day to the next.
 */
function byUsefulness(lines: ChangeLine[]): ChangeLine[] {
  return [
    ...lines.filter((line) => line.opportunities.length > 0),
    ...lines.filter((line) => line.opportunities.length === 0),
  ];
}

const MARKET_ITEMS = ["Tibia Coin", "Gold Token", "Silver Token"] as const;

function marketItemOf(id: BriefingModel["marketPriceLines"][number]["id"]): string {
  if (id === "tibiaCoinSell" || id === "tibiaCoinBuy") return "Tibia Coin";
  if (id === "goldTokenSell") return "Gold Token";
  return "Silver Token";
}

function marketLines(model: BriefingModel, style: Style): string[] {
  return MARKET_ITEMS.flatMap((item) => {
    const prices = model.marketPriceLines.filter((price) => marketItemOf(price.id) === item);
    if (prices.length === 0) return [];

    // Buy before sell, the order a player meets them in: what one costs, then what one
    // fetches. Both on the item's own line, because they are two halves of one price — as
    // separate rows under a shared title they took four lines to say two numbers.
    const ordered = [...prices].sort(
      (a, b) => Number(a.id !== "tibiaCoinBuy") - Number(b.id !== "tibiaCoinBuy"),
    );
    const values = ordered
      .map(
        (price) =>
          `${model.t.marketOffer(price.id)} ${stripGp(price.valueLabel)} ${price.trendSymbol}`,
      )
      .join(" · ");

    return [field(style, "🪙", item, values)];
  });
}

function render(model: BriefingModel, style: Style): string {
  const t = model.t;

  // World and date on one line. A date line, a greeting line and a blank was three lines of
  // chrome before any information, on the first screen that is the only one many readers see.
  const worldName = style.markup ? `*${model.worldName}*` : model.worldName;
  const header = `${style.emoji ? "📅 " : ""}${worldName} · ${model.dateLabel}`;

  const status = joinLines([
    model.boostedCreatureLabel
      ? field(style, "👾", t.boostedCreature, model.boostedCreatureLabel)
      : null,
    model.boostedBossLabel ? field(style, "👹", t.boostedBoss, model.boostedBossLabel) : null,
    model.boostedRegionValue
      ? field(style, "🗺️", t.boostedRegion, model.boostedRegionValue)
      : null,
    ...model.activeEventLines.map((line) => field(style, line.emoji, line.title, line.detail)),
    model.dromeLine ? field(style, "🏛️", t.tibiaDrome, model.dromeLine) : null,
    // The model joins several executions with "; "; a middle dot reads as a list of times
    // rather than as a sentence that lost its way.
    model.warzoneLine
      ? field(style, "⚔️", t.warzoneToday, model.warzoneLine.split("; ").join(" · "))
      : null,
  ]);

  const merchants = joinLines([
    heading(style, "💸", t.sectionMerchants),
    field(style, "👳🏼‍♂️", t.merchantRashid, model.rashidLabel),
    field(style, "💰", t.merchantYasir, model.yasirLabel),
    ...marketLines(model, style),
    model.marketSourceLabel ? aside(style, model.marketSourceLabel) : null,
  ]);

  // The heading rides on the first entry rather than standing off on its own, so a section
  // opens the same way whether its body is a flat list (merchants) or a run of blocks.
  const section = (title: string, blocks: string[], empty: string | null): string => {
    if (blocks.length === 0) return joinLines([title, empty]);
    return joinBlocks([joinLines([title, blocks[0]!]), ...blocks.slice(1)]);
  };

  const mini = section(
    heading(style, "🎲", t.sectionMiniWorldChanges),
    byUsefulness(model.miniWorldChangeLines).map((line) => changeBlock(style, line)),
    aside(style, model.miniWorldChangesVerified ? t.miniWorldChangesNoneActive : t.notCheckedToday),
  );

  const world = joinBlocks([
    section(
      heading(style, "🌍", t.sectionWorldChanges),
      byUsefulness(model.worldChangeLines).map((line) => changeBlock(style, line)),
      aside(style, t.notCheckedToday),
    ),
    // Unasked keywords, named so "we don't know" cannot be read as "nothing is happening".
    model.worldChangeLines.length > 0 && model.worldChangesUnchecked.length > 0
      ? aside(style, t.worldChangesUnchecked(model.worldChangesUnchecked))
      : null,
  ]);

  // Omitted entirely when there is nothing scheduled. "No events right now" is a heading plus
  // a line to say the heading was unnecessary, and the bulletin is forwarded to other people.
  const upcoming =
    model.upcomingEventLines.length > 0
      ? joinLines([
          heading(style, "📅", t.sectionNextEvents),
          ...model.upcomingEventLines.map((line: EventLine) =>
            field(style, line.emoji, line.title, line.detail),
          ),
        ])
      : null;

  return joinBlocks([header, status, merchants, mini, world, upcoming]);
}

export function renderRichBriefing(model: BriefingModel): string {
  return render(model, RICH);
}

export function renderPlainBriefing(model: BriefingModel): string {
  return render(model, PLAIN);
}

export function generateBriefingMessage(input: BriefingInput): string {
  return renderRichBriefing(buildBriefingModel(input));
}

export function generatePlainTextBriefing(input: BriefingInput): string {
  return renderPlainBriefing(buildBriefingModel(input));
}
