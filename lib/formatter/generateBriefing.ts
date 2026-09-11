import {
  buildBriefingModel,
  type BriefingInput,
  type BriefingModel,
  type ChangeLine,
  type EventLine,
} from "./briefingModel";
import type { BriefingNote, NoteIcon } from "./opportunityPhrases";
import type { MarketPriceId } from "@/types/market";

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
 * asterisks. They drifted, as duplicated renderers do. One renderer with a two-field `Style`
 * cannot.
 *
 * ## The shape, and why
 *
 * The bulletin is pasted into WhatsApp and Discord, and it is read on a phone by someone
 * deciding what to do with the next hour. That makes it a **document**, not a table: a
 * dateline, a greeting, today's headline facts, then one block per subject.
 *
 * A block is always the same three things in the same order, any of which may be absent:
 *
 * ```
 * 🌑 *Nightmare Isles* _(Kha'labal)_   the subject, bold, with its own emoji and its place
 * _A tempestade abriu o acesso._       what is true right now, in italics
 * ⚔️ Silencers, Retching Horrors…      what that is worth, one marker per line
 * ```
 *
 * The place rides on the subject's own line, parenthesised and set as an aside, because it is
 * not a fact anybody scans for — it qualifies the name. Under its own 📍 it cost a line in
 * every block and pushed the state sentence, which is what the reader came for, a line further
 * down; across twenty changes that is twenty lines of a phone screen spent on punctuation.
 *
 * The markers are the whole editorial idea. Every subordinate line declares its own kind with
 * a glyph — 🎯 bestiary, 👹 boss, 🐎 mount, 🍀 the item that tames one, 👕 outfit,
 * 🏆 achievement, 🔄 something to do, ⚔️ what spawns, 💡 advice, ⏳ what changes at server save
 * — so a reader scanning for "what can I actually do today" finds it without reading a word of
 * connective tissue. It replaces the old approach, which
 * appended the app's own vocabulary to each line ("só neste estado", "vale após o Server
 * Save") and made a forwarded message read like a database dump.
 *
 * ## Markup
 *
 * `*bold*` is WhatsApp's syntax; Discord reads it as italic. That degrades gracefully — still
 * emphasis, still readable — whereas Discord's `**bold**` arrives in WhatsApp as literal
 * asterisks. So single `*` for subjects and headings, `_` for the state sentence and for
 * asides, and nothing else. No indentation and no bullet glyphs: leading spaces are collapsed
 * inconsistently by chat clients, and a bullet reads as generated output where an emoji marker
 * reads as an edited one.
 *
 * Names keep their own casing. Section headings are the sole exception, and they are shouted
 * because they are signposts in a long message rather than things anybody reads as words.
 */

interface Style {
  /** Emoji are dropped entirely in plain mode rather than left as stray glyphs. */
  emoji: boolean;
  /** WhatsApp/Discord markup, for readers whose destination shows it literally. */
  markup: boolean;
}

const RICH: Style = { emoji: true, markup: true };
const PLAIN: Style = { emoji: false, markup: false };

/** One blank line between the parts of a block; two between the blocks themselves. */
const WITHIN = "\n\n";
const BETWEEN = "\n\n\n";

/**
 * The marker glyphs.
 *
 * Declared in one table so the vocabulary is legible as a vocabulary. Adding a kind of line
 * means adding a `NoteIcon` and a row here, never touching a render function.
 */
const ICON: Record<NoteIcon, string> = {
  bestiary: "🎯",
  boss: "👹",
  mount: "🐎",
  tamingItem: "🍀",
  outfit: "👕",
  achievement: "🏆",
  progress: "🔄",
  creatures: "⚔️",
  counter: "📊",
  advisory: "💡",
  deadline: "⏳",
};

/** Each market item's own glyph, so three price blocks are told apart at a glance. */
const MARKET_ITEM_ICON: Record<string, string> = {
  "Tibia Coin": "🪙",
  "Gold Token": "🟡",
  "Silver Token": "⚪",
};

function joinLines(lines: (string | null | undefined)[]): string {
  return lines.filter((line): line is string => Boolean(line && line.length > 0)).join("\n");
}

function join(separator: string, blocks: (string | null | undefined)[]): string {
  return blocks.filter((block): block is string => Boolean(block && block.length > 0)).join(separator);
}

function bold(style: Style, text: string): string {
  return style.markup ? `*${text}*` : text;
}

/** An aside — an attribution, a state sentence, a caveat. Never a fact the reader came for. */
function italic(style: Style, text: string): string {
  return style.markup ? `_${text}_` : text;
}

function withIcon(style: Style, emoji: string, text: string): string {
  return style.emoji ? `${emoji} ${text}` : text;
}

/** `👾 *Criatura Boostada:* Corym Skirmisher` — the colon belongs to the label. */
function field(style: Style, emoji: string, label: string, value: string): string {
  return withIcon(style, emoji, `${bold(style, `${label}:`)} ${value}`);
}

function heading(style: Style, emoji: string, text: string): string {
  return withIcon(style, emoji, bold(style, text));
}

function stripGp(value: string): string {
  return value.replace(/\s+gp$/i, "");
}

/** `🎯 *Deepling Scout:* 1.000 mortes, 25 Charm Points.` */
function noteLine(style: Style, note: BriefingNote): string {
  const body = note.subject ? `${bold(style, `${note.subject}:`)} ${note.text}` : note.text;
  return withIcon(style, ICON[note.icon], body);
}

/**
 * One subject, and everything the bulletin has to say about it.
 *
 * State and opportunities live in the same block because they are one subject. Rendered as
 * separate sections they said everything twice — the volcano's state up top and what erupting
 * is worth forty lines below — and a reader scanning for the morning's plan had to hold the
 * first half in their head until the second arrived.
 */
function changeBlock(style: Style, line: ChangeLine): string {
  // Semicolons between the places, because a place's own name may contain a comma: Horse
  // Station's horses run between two towns — `(Thais; Venore)` — while the lake a comma
  // merely locates is one place, `(Lake Equivocolao, Port Hope)`. The catalog draws that
  // distinction by giving each independent place its own entry; here it becomes punctuation.
  const where = line.locations.join("; ");
  return joinLines([
    withIcon(
      style,
      line.emoji,
      join(" ", [bold(style, line.name), where ? italic(style, `(${where})`) : null]),
    ),
    italic(style, line.state),
    ...line.notes.map((note) => noteLine(style, note)),
  ]);
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
    ...lines.filter((line) => line.notes.length > 0),
    ...lines.filter((line) => line.notes.length === 0),
  ];
}

const MARKET_ITEMS = ["Tibia Coin", "Gold Token", "Silver Token"] as const;

function marketItemOf(id: MarketPriceId): string {
  if (id === "tibiaCoinSell" || id === "tibiaCoinBuy") return "Tibia Coin";
  if (id === "goldTokenSell") return "Gold Token";
  return "Silver Token";
}

/**
 * One block per item: the item names itself, then each side of the book gets a line.
 *
 * Sell before buy. The reader of this bulletin is overwhelmingly checking what their coins
 * would fetch, not what it would cost to top up, and the two used to share a line where the
 * pair of five-digit numbers ran together.
 */
function marketBlocks(model: BriefingModel, style: Style): string[] {
  return MARKET_ITEMS.flatMap((item) => {
    const prices = model.marketPriceLines.filter((price) => marketItemOf(price.id) === item);
    if (prices.length === 0) return [];

    const ordered = [...prices].sort(
      (a, b) => Number(a.id === "tibiaCoinBuy") - Number(b.id === "tibiaCoinBuy"),
    );
    return [
      joinLines([
        withIcon(style, MARKET_ITEM_ICON[item] ?? "🪙", bold(style, item)),
        ...ordered.map((price) =>
          bold(
            style,
            `${model.t.marketOffer(price.id)}: ${stripGp(price.valueLabel)}${
              style.emoji ? ` ${price.trendSymbol}` : ""
            }`,
          ),
        ),
      ]),
    ];
  });
}

/**
 * A section: a shouted heading, then its blocks.
 *
 * `tight` sections keep the heading against their first line, because their body is a short
 * flat list and a blank line there reads as a missing entry. The long sections breathe.
 */
function section(
  style: Style,
  emoji: string,
  title: string,
  blocks: string[],
  options: { tight?: boolean; empty?: string | null } = {},
): string | null {
  const head = heading(style, emoji, title);
  if (blocks.length === 0) {
    return options.empty ? joinLines([head, italic(style, options.empty)]) : null;
  }
  return options.tight
    ? joinLines([head, ...blocks])
    : join(WITHIN, [head, ...blocks]);
}

function render(model: BriefingModel, style: Style): string {
  const t = model.t;

  // Dateline, then the greeting, then today's headline facts. The greeting is the one piece
  // of warmth in the message and it costs a line; it earns it by making a forwarded bulletin
  // read as something a person sent rather than something a bot emitted.
  const masthead = joinLines([
    withIcon(style, "📅", bold(style, model.isoDateLabel)),
    withIcon(style, "🌞", bold(style, t.greeting(model.worldName))),
  ]);

  const headline = joinLines([
    model.boostedCreatureLabel
      ? field(style, "👾", t.boostedCreature, model.boostedCreatureLabel)
      : null,
    model.boostedBossLabel ? field(style, "👹", t.boostedBoss, model.boostedBossLabel) : null,
    model.boostedRegionValue
      ? field(style, "🗺️", t.boostedRegion, model.boostedRegionValue)
      : null,
    ...model.activeEventLines.map((line) => field(style, line.emoji, line.title, line.detail)),
    model.drome
      ? field(
          style,
          "🏛️",
          t.tibiaDrome,
          join(" ", [
            model.drome.label,
            model.drome.countdown ? italic(style, `(${model.drome.countdown})`) : null,
          ]),
        )
      : null,
    // Semicolons, not commas: each entry already contains a parenthesised sequence, and a
    // comma list ran the four of them together into one unreadable string.
    model.warzoneEntries.length > 0
      ? field(
          style,
          "⚔️",
          t.warzoneToday,
          model.warzoneEntries
            .map((entry) =>
              join(" ", [entry.time, entry.sequence ? italic(style, `(${entry.sequence})`) : null]),
            )
            .join("; "),
        )
      : null,
  ]);

  const merchants = section(
    style,
    "💰",
    t.sectionMerchants,
    [
      joinLines([
        field(style, "👳", t.merchantRashid, model.rashidLabel),
        field(style, "💰", t.merchantYasir, model.yasirLabel),
      ]),
    ],
    { tight: true },
  );

  // The attribution sits directly under the heading rather than after the numbers: it is the
  // provenance of everything below it, and a bulletin that is forwarded onward should say
  // where its prices came from before it quotes them.
  const marketItems = marketBlocks(model, style);
  const market =
    marketItems.length > 0
      ? join(WITHIN, [
          joinLines([
            heading(style, "📈", t.sectionMarket),
            model.marketSourceLabel ? italic(style, model.marketSourceLabel) : null,
          ]),
          ...marketItems,
        ])
      : null;

  const mini = section(
    style,
    "🎎",
    t.sectionMiniWorldChanges,
    byUsefulness(model.miniWorldChangeLines).map((line) => changeBlock(style, line)),
    { empty: model.miniWorldChangesVerified ? t.miniWorldChangesNoneActive : t.notCheckedToday },
  );

  const worldBody = byUsefulness(model.worldChangeLines).map((line) => changeBlock(style, line));
  const world = join(WITHIN, [
    section(style, "🌍", t.sectionWorldChanges, worldBody, { empty: t.notCheckedToday }),
    // Unasked keywords, named so "we don't know" cannot be read as "nothing is happening".
    worldBody.length > 0 && model.worldChangesUnchecked.length > 0
      ? italic(style, t.worldChangesUnchecked(model.worldChangesUnchecked))
      : null,
  ]);

  // Omitted entirely when there is nothing scheduled. "No events right now" is a heading plus
  // a line to say the heading was unnecessary, and the bulletin is forwarded to other people.
  // Name, date, countdown, then what the event is actually worth turning up for. The last
  // part is the one a reader acts on: "Grimvale starts tomorrow" tells them when, and "Feroxa
  // appears on the 13th, prepare the quest requirements first" tells them what tomorrow is for.
  const upcoming = section(
    style,
    "📆",
    t.sectionNextEvents,
    model.upcomingEventLines.map((line: EventLine) =>
      joinLines([
        withIcon(style, line.emoji, bold(style, line.title)),
        bold(style, line.detail),
        line.countdown ? withIcon(style, ICON.deadline, line.countdown) : null,
        ...line.notes.map((note) =>
          withIcon(
            style,
            note.emoji,
            note.subject ? `${bold(style, `${note.subject}:`)} ${note.text}` : note.text,
          ),
        ),
      ]),
    ),
  );

  return join(BETWEEN, [
    // The masthead and the headline facts are one block, one blank line apart.
    join(WITHIN, [masthead, headline]),
    join(WITHIN, [merchants, market]),
    mini,
    world,
    upcoming,
  ]);
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
