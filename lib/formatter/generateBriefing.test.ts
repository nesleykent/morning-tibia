import { describe, expect, it } from "vitest";
import { generateBriefingMessage, generatePlainTextBriefing } from "./generateBriefing";
import { createDefaultOverrides } from "@/lib/defaults";
import { BRIEFING_LANGUAGES } from "./translations";
import type { BriefingInput } from "./briefingModel";
import { NAME_LINE, nameLinePattern } from "@/lib/testing/briefingLines";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";

const LANGUAGES = BRIEFING_LANGUAGES.map((entry) => entry.value);
/**
 * Monday 17 Aug 2026, written as an explicit instant rather than `new Date(2026, 7, 17)`.
 * Local-midnight construction means a different moment on every machine, and the fixtures
 * below are rendered into named zones (Europe/Berlin for Rashid, America/Sao_Paulo for the
 * viewer), so a local-midnight date is a different calendar day depending on who runs it.
 * Midday UTC sits far from every zone boundary these tests cross.
 */
const REFERENCE = new Date("2026-08-17T12:00:00Z");

/** Nothing established: the day the app has been opened and told nothing. */
function emptyInput(language: BriefingInput["language"] = "pt"): BriefingInput {
  return {
    world: "Ustebra",
    referenceDate: REFERENCE,
    overrides: createDefaultOverrides("Ustebra", REFERENCE),
    boostedCreature: { kind: "creature", name: "Gore Horn", imageUrl: null },
    boostedBoss: { kind: "boss", name: "Ratmiral", imageUrl: null },
    warzoneSchedule: null,
    activeEvents: [],
    upcomingEvents: [],
    drome: null,
    language,
    viewerTimeZone: "America/Sao_Paulo",
    upcomingEventsWindowDays: 14,
    marketTrendBasis: "last",
  };
}

/** A normal morning: a couple of changes checked, a merchant, a boosted region. */
function makeInput(language: BriefingInput["language"] = "pt"): BriefingInput {
  const input = emptyInput(language);
  const { overrides } = input;

  overrides.miniWorldChanges["fury-gates"] = {
    id: "fury-gates",
    status: "active",
    variantId: null,
    updatedAt: null,
  };
  overrides.worldChanges["hive-born"] = { id: "hive-born", stateId: "fallen", updatedAt: null };
  overrides.merchants.yasir = {
    ...overrides.merchants.yasir!,
    location: "Carlin",
    activityState: "location-known",
  };
  overrides.merchants.rashid = { ...overrides.merchants.rashid!, location: "Svargrond" };
  overrides.boostedRegions = ["Venore"];
  return input;
}

/** Each change's own glyph, so a name-line assertion does not hardcode one. */
const MINI_EMOJI: Record<string, string> = Object.fromEntries(
  MINI_WORLD_CHANGE_DEFINITIONS.map((definition) => [definition.name, definition.emoji]),
);

/** Every marker the bulletin can open a subordinate line with. */
const NOTE_MARKERS = ["🎯", "🏆", "🔄", "⚔️", "📊", "💡", "⏳"] as const;

/** `💰 *COMERCIANTES*` — a section signpost, which is the only thing shouted. */
const isHeading = (line: string) =>
  /^(?:\S+ )?\*([^*]+)\*$/.test(line) && line.replace(/[^A-Za-zÀ-ÿ]/g, "") ===
    line.replace(/[^A-Za-zÀ-ÿ]/g, "").toUpperCase();
/** `🌀 *Spirit Grounds* _(Ghostlands)_` — a change naming itself at the head of its block. */
const isNameLine = (line: string) => NAME_LINE.test(line) && !isHeading(line);
const isNoteLine = (line: string) => NOTE_MARKERS.some((marker) => line.startsWith(`${marker} `));

/**
 * The opportunity lines the bulletin printed, across every change.
 *
 * Found structurally rather than by punctuation: inside a change's block the first line is
 * the state and everything after it belongs to that change. Keying on the separator would
 * make the helper a second implementation of the format, free to disagree with the first.
 */
function opportunityLines(message: string): string[] {
  return message
    .split(/\n\n+/)
    .filter((block) => block.split("\n").some(isNameLine))
    .flatMap((block) => block.split("\n").filter(isNoteLine));
}

function setMini(input: BriefingInput, id: string, variantId: string | null = null) {
  input.overrides.miniWorldChanges[id] = { id, status: "active", variantId, updatedAt: null };
}

function setWorld(input: BriefingInput, id: string, stateId: string) {
  input.overrides.worldChanges[id] = { id, stateId, updatedAt: null };
}

function withMarket(input: BriefingInput): BriefingInput {
  const t = REFERENCE.getTime();
  input.overrides.marketPrices.tibiaCoinSell = {
    id: "tibiaCoinSell",
    label: "Tibia Coin Sell Offer",
    value: 41_500,
    isLive: true,
    sourceTimestamp: t - 2 * 3600e3,
    updatedAt: "x",
    history: [
      { value: 40_800, timestamp: t - 86400e3 },
      { value: 41_500, timestamp: t - 2 * 3600e3 },
    ],
  };
  input.overrides.marketPrices.tibiaCoinBuy = {
    id: "tibiaCoinBuy",
    label: "Tibia Coin Buy Offer",
    value: 39_900,
    isLive: true,
    sourceTimestamp: t - 2 * 3600e3,
    updatedAt: "x",
    history: [
      { value: 40_100, timestamp: t - 86400e3 },
      { value: 39_900, timestamp: t - 2 * 3600e3 },
    ],
  };
  return input;
}

/** Every shape of day the bulletin has to survive, for the sweeps that must hold for all. */
function everyScenario(): { name: string; input: BriefingInput }[] {
  const busy = withMarket(makeInput());
  setMini(busy, "stampede");
  setMini(busy, "spirit-grounds", "ghostlands");
  setMini(busy, "poacher-caves", "ghost-wolves");
  setWorld(busy, "overhunting", "wolves");
  setWorld(busy, "awash", "drained-quota-open");
  setWorld(busy, "steamship", "not-running");
  busy.overrides.merchants.yasir = {
    ...busy.overrides.merchants.yasir!,
    location: "",
    activityState: "inactive",
  };
  busy.warzoneSchedule = {
    world: "Ustebra",
    timezone: null,
    tracksWarzoneService: true,
    mark: "healthy",
    executions: [{ executionId: 1, scheduleTime: "12:00", warzoneSequence: "1-2-3" }],
  };

  const boardOnly = makeInput();
  setMini(boardOnly, "kingsday");
  boardOnly.overrides.worldChanges["hive-born"] = {
    id: "hive-born",
    stateId: null,
    updatedAt: null,
  };

  const quiet = makeInput();
  setWorld(quiet, "twisted-waters", "clean");

  const outage = makeInput();
  outage.unavailable = { boosted: true, warzone: true, market: true };

  return [
    { name: "nothing established", input: emptyInput() },
    { name: "ordinary morning", input: makeInput() },
    { name: "busy morning", input: busy },
    { name: "board only, no guide", input: boardOnly },
    { name: "quiet states only", input: quiet },
    { name: "every live feed down", input: outage },
  ];
}

describe("bulletin structure", () => {
  it("opens with the date, then greets the world by name", () => {
    expect(generateBriefingMessage(makeInput())).toMatch(
      /^📅 \*2026-08-17\*\n🌞 \*Bom dia, Ustebra!\*\n/,
    );
    expect(generatePlainTextBriefing(makeInput())).toMatch(/^2026-08-17\nBom dia, Ustebra!\n/);
  });

  it("keeps the dateline on the Tibia day before the next server save", () => {
    // 00:00 in Berlin on 12 September is still the Tibia day that began on the 11th.
    const referenceDate = new Date("2026-09-11T22:00:00Z");
    const input = emptyInput();
    input.referenceDate = referenceDate;
    input.overrides = createDefaultOverrides(input.world, referenceDate);

    expect(generateBriefingMessage(input)).toMatch(/^📅 \*2026-09-11\*\n/);
    expect(generatePlainTextBriefing(input)).toMatch(/^2026-09-11\n/);
  });

  it("does not call an event tomorrow when it starts before the next server save", () => {
    const referenceDate = new Date("2026-09-11T22:00:00Z");
    const input = emptyInput();
    input.referenceDate = referenceDate;
    input.overrides = createDefaultOverrides(input.world, referenceDate);
    input.upcomingEvents = [{
      id: "same-tibia-day",
      title: "Same Tibia Day Event",
      url: null,
      startAt: "2026-09-12T01:00:00.000Z",
      daysUntil: 0,
      certainty: "confirmed",
      occurrenceIndex: 0,
      occurrenceCount: 1,
    }];

    const message = generateBriefingMessage(input);
    expect(message).toContain("*11 de Setembro*");
    expect(message).toContain("⏳ Hoje");
    expect(message).not.toContain("Amanhã");
  });

  it("puts a change's state and what it is worth in the same entry", () => {
    // The two used to be separate sections, so a reader met "Overhunting: starving wolves" at
    // the top and "Overhunting / Starving Wolf — Bestiary" forty lines below, and had to hold
    // the first in their head until the second arrived.
    const input = makeInput();
    setWorld(input, "overhunting", "wolves");
    const message = generateBriefingMessage(input);

    const entry = message.split(/\n\n+/).find((block) => block.includes("*Overhunting*"))!;
    expect(entry).toContain("Starving Wolves rondam");
    expect(entry).toContain("🎯 *Starving Wolf:* 500 mortes, 15 Charm Points.");
    // …and the change is named exactly once in the whole bulletin.
    expect(message.match(/\*Overhunting\*/g)).toHaveLength(1);
  });

  it("names each change once, in every scenario", () => {
    for (const { name, input } of everyScenario()) {
      const message = generateBriefingMessage(input);
      const named = message.split("\n").filter(isNameLine);
      expect(new Set(named).size, name).toBe(named.length);
    }
  });

  it("keeps every official name in its own casing", () => {
    const input = makeInput();
    setMini(input, "fire-from-the-earth");
    const message = generateBriefingMessage(input);
    expect(message).toContain("*Fire from the Earth*");
    expect(message).not.toContain("FIRE FROM THE EARTH");
  });

  it("calls every change what TibiaWiki calls it, not what the catalog calls it in passing", () => {
    // Five World Changes have a canonical name that is not the keyword a Guide answers to, and
    // the bulletin used to print the keyword-ish short label for all five. A reader who takes
    // "Master's Voice" to the wiki finds nothing; "Their Master's Voice" is the article.
    const input = makeInput();
    for (const [id, stateId] of [
      ["horestis", "risen"],
      ["mage-tower", "portal-open"],
      ["masters-voice", "passable"],
      ["demon-war", "stalemate"],
      ["sea-serpent", "awake"],
    ] as const) {
      setWorld(input, id, stateId);
    }
    const message = generateBriefingMessage(input);

    for (const [canonical, short] of [
      ["The Mummy's Curse", "Horestis"],
      ["The Mage's Tower", "Mage Tower"],
      ["Their Master's Voice", "Master's Voice"],
      ["Demon Wars", "Demon War"],
      ["The Fire-Feathered Serpent", "Sea Serpent"],
    ]) {
      expect(message, canonical).toContain(`*${canonical}*`);
      expect(message, short).not.toContain(`*${short}*`);
    }
  });

  it("orders both change sections alphabetically by the name it prints", () => {
    // The catalog order is the game's: the Guide's keyword recitation, and the wiki's own
    // list. Neither is an order a reader can navigate, so a forwarded bulletin had to be read
    // end to end to find one change. Alphabetical by the printed name can be.
    const input = makeInput();
    for (const id of ["stampede", "bank-robbery", "grimvale", "nomads"]) setMini(input, id);
    for (const [id, stateId] of [
      ["overhunting", "wolves"],
      ["awash", "flooded"],
      ["masters-voice", "passable"],
      ["horse-station", "normal"],
    ] as const) {
      setWorld(input, id, stateId);
    }

    const sections = generateBriefingMessage(input).split("\n\n\n");
    const namesIn = (heading: string) =>
      sections
        .find((section) => section.startsWith(heading))!
        .split("\n")
        .filter(isNameLine)
        .map((line) => line.match(/\*([^*]+)\*/)![1]!);

    for (const heading of ["🎎 ", "🌍 "]) {
      const names = namesIn(heading);
      expect(names.length, heading).toBeGreaterThan(1);
      expect(names, heading).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")));
    }
  });

  it("lists the still-unasked World Changes by the same names, in the same order", () => {
    // The unasked line is the other half of the same section: a reader scanning it for a change
    // they care about must not have to know the app calls it something else there.
    const input = makeInput();
    setWorld(input, "overhunting", "wolves");
    const message = generateBriefingMessage(input);

    const unasked = message.match(/_Ainda sem resposta do Guide: (.+)\._$/m)![1]!.split(", ");
    expect(unasked).toContain("Their Master's Voice");
    expect(unasked).not.toContain("Master's Voice");
    expect(unasked).toEqual([...unasked].sort((a, b) => a.localeCompare(b, "en")));
  });
});

describe("formatting that has to survive a paste", () => {
  it("uses only the markup WhatsApp and Discord both understand", () => {
    for (const { name, input } of everyScenario()) {
      const message = generateBriefingMessage(input);
      // `**bold**` is Discord's; WhatsApp shows it as literal asterisks. Single `*` degrades
      // to italics on Discord, which is still emphasis.
      expect(message, name).not.toContain("**");
      expect(message, name).not.toMatch(/[#`~|]/);
      // Every `*` and `_` must be a matched pair on its own line.
      for (const line of message.split("\n")) {
        expect((line.match(/\*/g) ?? []).length % 2, `${name}: ${line}`).toBe(0);
        expect((line.match(/_/g) ?? []).length % 2, `${name}: ${line}`).toBe(0);
      }
    }
  });

  it("never indents, because leading whitespace is eaten in chat clients", () => {
    for (const { name, input } of everyScenario()) {
      for (const line of generateBriefingMessage(input).split("\n")) {
        expect(line, name).toBe(line.trimStart());
      }
    }
  });

  it("never doubles a blank line or ends with whitespace", () => {
    for (const { name, input } of everyScenario()) {
      for (const message of [generateBriefingMessage(input), generatePlainTextBriefing(input)]) {
        // Two blank lines part the top-level sections, one parts the blocks inside them.
        // Three would be a hole where something rendered empty.
        expect(message, name).not.toMatch(/\n{4,}/);
        expect(message, name).toBe(message.trim());
      }
    }
  });

  it("gives the plain format the same text, minus emoji and markup", () => {
    // One renderer, two styles — so the two can no longer drift into different section
    // shapes, which is what happened when they were separate functions.
    for (const { name, input } of everyScenario()) {
      const plain = generatePlainTextBriefing(input);
      expect(plain, name).not.toMatch(/[*_]/);
      // Trend arrows stay: they are the value, not decoration — a price with the arrow
      // removed has lost half of what it says.
      const withoutArrows = plain.replace(/[⬆⬇➡]️?/g, "");
      expect(withoutArrows, name).not.toMatch(/\p{Extended_Pictographic}/u);

      // Compared on a normalised form: reversing the renderer's emoji exactly would mean
      // re-implementing ZWJ and variation-selector handling in the test, which proves nothing.
      const normalise = (text: string) =>
        text
          .replace(/[*_]/g, "")
          .replace(/\p{Extended_Pictographic}[\u{FE0F}\u{1F3FB}-\u{1F3FF}\u{200D}\p{Extended_Pictographic}]*/gu, "")
          .replace(/[ \t]+/g, " ")
          .split("\n")
          .map((line) => line.trim())
          .join("\n");
      expect(normalise(generateBriefingMessage(input)), name).toBe(normalise(plain));
    }
  });
});

/**
 * Where a change happens, and how the bulletin punctuates it.
 *
 * The place used to be a line of its own under a 📍. It is now an aside on the change's own
 * name, which is the whole reason these cases are pinned: the three shapes below are settled
 * by the catalog, not by the renderer parsing a string, and the renderer cannot tell them
 * apart once they have been joined into one.
 */
describe("where a change happens", () => {
  it("sets the place on the change's own name, never on a line of its own", () => {
    const input = makeInput("en");
    setMini(input, "fury-gates");
    const message = generateBriefingMessage(input);

    expect(message).toContain("🔥 *Fury Gates* _(Fury Dungeon)_\n");
    // Not anywhere else in the bulletin either: the marker is gone from the vocabulary.
    for (const { name, input: scenario } of everyScenario()) {
      expect(generateBriefingMessage(scenario), name).not.toContain("📍");
    }
  });

  it("parts two independent places with a semicolon", () => {
    // The horses run between the two ends of the Thaian road, and the deer between two
    // forests. Commas there read as one place with a two-part name.
    const input = makeInput("en");
    setWorld(input, "horse-station", "escaped");
    setWorld(input, "overhunting", "dwindling");
    const message = generateBriefingMessage(input);

    expect(message).toContain("🐴 *Horse Station* _(Thais; Venore)_\n");
    expect(message).toContain("🦌 *Overhunting* _(Ab'Dendriel; Carlin)_\n");
  });

  it("keeps the comma that belongs to one place's own name", () => {
    // "Lake Equivocolao, Port Hope" is a lake and the town it is near: one place, expressed
    // with a comma. Parting it would send the reader to two.
    const input = makeInput("en");
    setWorld(input, "twisted-waters", "clean");
    expect(generateBriefingMessage(input)).toContain(
      "💧 *Twisted Waters* _(Lake Equivocolao, Port Hope)_\n",
    );
  });

  it("names a change the catalog cannot place without an empty aside", () => {
    // Demon War is the Hero Cave, which the catalog does place; Sea Serpent's grounds are not
    // a region anybody sails to. Either way the aside is never printed empty.
    for (const { name, input } of everyScenario()) {
      for (const line of generateBriefingMessage(input).split("\n")) {
        expect(line, `${name}: ${line}`).not.toMatch(/_\(\s*\)_/);
      }
    }
  });
});

/**
 * The one semicolon in a subordinate line, and where it goes.
 *
 * A line that opens with a clause — a list of creatures, an achievement's requirement — and
 * closes with what that clause costs or pays has two halves, and both halves may carry commas
 * of their own. The semicolon is what keeps "Spidris Elite" from reading as the item before
 * "1,000 kills". A line that opens *with* the figures has no such clause and keeps its comma.
 */
describe("a clause, then what it is worth", () => {
  it("parts a grouped creature list from the cost they share", () => {
    const input = makeInput("en");
    setMini(input, "nomads");
    expect(generateBriefingMessage(input)).toContain(
      "🎯 *Bestiary:* Nomad (Blue) and Nomad (Female); 500 kills, 15 Charm Points each.",
    );
  });

  it("leaves a line that opens with the figures alone", () => {
    // Yielothax is one creature, so the subject already names it and the text is nothing but
    // the two columns. There is no clause to part, and a semicolon here would invent one.
    const input = makeInput("en");
    setWorld(input, "mage-tower", "mage-slain");
    setWorld(input, "awash", "drained-quota-open");
    const message = generateBriefingMessage(input);

    expect(message).toContain("🎯 *Yielothax:* 1,000 kills, 25 Charm Points.");
    expect(message).toContain("🎯 *Deepling Scout:* 1,000 kills, 25 Charm Points.");
  });

  it("parts an achievement's requirement from what it pays", () => {
    const input = makeInput("en");
    setMini(input, "thawing");
    setMini(input, "nomads");
    const message = generateBriefingMessage(input);

    expect(message).toContain("🏆 *Ice Harvester:* Harvest 10 Ice Flower Seeds; 1 achievement point.");
    // A requirement with a comma inside it keeps that comma, and still parts from its points.
    expect(message).toContain(
      "🏆 *Chest Robber:* Loot the chest of 3 different Nomad camps; 1 achievement point.",
    );
  });

  it("never parts the two figures of a bestiary cost from each other", () => {
    // Kills and Charm Points are one pair of columns, whether one creature carries them or
    // seven share them, so they read the same way in both shapes.
    for (const { name, input } of everyScenario()) {
      for (const line of opportunityLines(generateBriefingMessage(input))) {
        expect(line, `${name}: ${line}`).not.toMatch(/(mortes|kills|muertes|zabójstw);/);
      }
    }
  });
});

describe("today's numbers", () => {
  it("keeps each status fact to one label-and-value line", () => {
    const input = makeInput();
    // Midday UTC on 2 Sep, so it is still 2 Sep for the America/Sao_Paulo viewer this
    // input describes. Local midnight here read as 01/09 on a UTC runner.
    input.drome = { rotationNumber: "#134", endsAt: "2026-09-02T12:00:00Z" } as never;
    input.warzoneSchedule = {
      world: "Ustebra",
      timezone: null,
      tracksWarzoneService: true,
      mark: "healthy",
      executions: [
        { executionId: 1, scheduleTime: "12:00", warzoneSequence: "1-2-3" },
        { executionId: 2, scheduleTime: "20:00", warzoneSequence: "1-3-2" },
      ],
    };
    const message = generateBriefingMessage(input);

    expect(message).toContain("👾 *Criatura Boostada:* Gore Horn");
    expect(message).toContain("👹 *Boss Boostado:* Ratmiral");
    expect(message).toContain("🗺️ *Região Boostada:* Venore");
    // Sixteen days out, so past the week where a weekday name is unambiguous.
    expect(message).toContain("🏛️ *Tibia Drome:* rotação #134 até 02/09");
    // Several execution times are a list, not a run-on sentence, and not four lines either.
    // Semicolons, because each entry already carries a parenthesised sequence.
    expect(message).toContain("⚔️ *Warzones:* 12:00 _(1-2-3)_; 20:00 _(1-3-2)_");
  });

  it("gives each market item its own block, selling price first", () => {
    // Sell before buy: the reader is overwhelmingly checking what their coins would fetch,
    // not what topping up would cost.
    const message = generateBriefingMessage(withMarket(makeInput()));
    expect(message).toContain("🪙 *Tibia Coin*\n*Venda: 41.500 ⬆️*\n*Compra: 39.900 ⬇️*");
    // The source heads the section, because it is the provenance of every number under it, and
    // it reads as an aside rather than a sentence: parenthesised, lower case, no full stop.
    expect(message).toMatch(/📈 \*MARKET\*\n_\(preços de tibiamarket\.top, .+\)_/);
    expect(message).not.toContain("TIBIAMARKET");
  });

  it("omits what the live feeds could not supply, rather than printing a placeholder", () => {
    const input = makeInput();
    input.unavailable = { boosted: true, market: true };
    const message = generateBriefingMessage(input);
    expect(message).not.toContain("Criatura Boostada:");
    expect(message).not.toContain("Boss Boostado:");
    expect(message).not.toContain("🪙");
    expect(message).not.toContain("tibiamarket");
    // …and the rest of the bulletin still stands.
    expect(message).toContain("👳 *Rashid:* Svargrond");
  });

  it("drops the events section entirely when nothing is scheduled", () => {
    // "No events right now" is a heading plus a line saying the heading was unnecessary, in a
    // message that gets forwarded to other people.
    expect(generateBriefingMessage(makeInput())).not.toContain("PRÓXIMOS EVENTOS");
  });

  it("lists upcoming events as one line each when there are some", () => {
    const input = makeInput();
    input.upcomingEvents = [
      {
        title: "Double XP Weekend",
        startAt: "2026-08-19T12:00:00Z",
        daysUntil: 2,
        certainty: "confirmed",
      } as never,
    ];
    const message = generateBriefingMessage(input);
    expect(message).toContain("📆 *PRÓXIMOS EVENTOS*");
    // Title, then the date said aloud, then how far off it is — three short lines rather
    // than one dense one, because this is the part people act on.
    expect(message).toMatch(/\*Double XP Weekend\*\n\*19 de Agosto\*\n⏳ Em 2 dias/);
  });
});

describe("what the reader is told, and what they are not", () => {
  it("says nothing was checked without telling the reader to go and check it", () => {
    // The bulletin is pasted into a guild channel; instructions there address the wrong person.
    const message = generateBriefingMessage(emptyInput());
    expect(message).toContain("🌍 *WORLD CHANGES*\n_Não conferido hoje._");
    expect(message).not.toMatch(/cole o texto|pergunte a um Guide/i);
    // Nor anywhere else: the three changes nothing announces are in the section every day,
    // and their unchecked line is a statement about the world, never an errand.
    expect(message).not.toMatch(/olhe|confira|vá at[ée]|v[aá] ver|desça/i);
  });

  it("keeps the changes nothing announces in the section on a day nobody looked", () => {
    // The Mini World Changes section has no empty state any more, because it cannot be empty.
    // For an announced change silence is an answer — the board would have said so — but no
    // board reading can rule these three out, so leaving them off would make "nobody has been
    // to Krailos" and "the coast is clear" look identical.
    const message = generateBriefingMessage(emptyInput());
    expect(message).toContain("🎎 *MINI WORLD CHANGES*\n\n🦫 *Beaver Breakout*");
    for (const name of ["Beaver Breakout", "Shipwrecked", "Forsaken"]) {
      expect(message, name).toMatch(nameLinePattern(MINI_EMOJI[name]!, name));
    }
    // The section's old whole-section fallbacks are gone with it.
    expect(message).not.toContain("_Não conferido hoje._\n\n🦫");
    expect(message).not.toContain("Nenhuma ativa no momento");
  });

  it("keeps an announced change nobody asked about off the bulletin entirely", () => {
    // The restraint the section was built on, still intact where it applies: an unasked
    // question must never be presented as an answer, and for the twenty announced changes
    // absence is exactly what "unasked" looks like.
    const message = generateBriefingMessage(emptyInput());
    for (const name of ["Fury Gates", "Stampede", "Kingsday", "Spirit Grounds"]) {
      expect(message, name).not.toContain(name);
    }

    // …and a complete board reading that ruled one out still prints nothing for it.
    const ruledOut = emptyInput();
    ruledOut.overrides.miniWorldChanges["stampede"] = {
      id: "stampede",
      status: "inactive",
      variantId: null,
      updatedAt: null,
    };
    expect(generateBriefingMessage(ruledOut)).not.toContain("Stampede");
  });

  it("names the Guide keywords still unasked, so unknown cannot read as nothing", () => {
    const input = emptyInput();
    setWorld(input, "twisted-waters", "clean");
    const message = generateBriefingMessage(input);
    // The lake's own name carries the comma — it is one place, not two — so it keeps it where
    // a change that happens in two places would be parted with a semicolon.
    expect(message).toContain(
      "💧 *Twisted Waters* _(Lake Equivocolao, Port Hope)_\n_O lago perto de Port Hope está limpo no momento._",
    );
    expect(message).toMatch(/_Ainda sem resposta do Guide: .*Steamship.*_/);
  });

  it("never mentions a change nobody checked", () => {
    expect(generateBriefingMessage(makeInput())).not.toContain("Grimvale");
  });
});

describe("opportunities, under the change that created them", () => {
  it("skips the ones that only restate the change", () => {
    // An NPC service is what its own state line already says: Horse Station's state reads
    // "os serviços estão funcionando normalmente, e com os cavalos no cercado nenhum Wild
    // Horse aparece", and the `service` entry underneath said it again in other words.
    //
    // A `hunting` entry is deliberately *not* skipped, though it used to be. What is spawning
    // in a changed area is the most operational fact such a state has, and dropping it left
    // "um Spirit Gate está aberto" with nothing about what waits on the other side.
    const input = makeInput();
    setWorld(input, "horse-station", "normal");
    setMini(input, "spirit-grounds", "ghostlands");
    const message = generateBriefingMessage(input);

    const horses = message.split(/\n\n+/).find((block) => block.includes("*Horse Station*"))!;
    expect(horses.split("\n").filter(isNoteLine)).toEqual([]);

    const spirits = message.split(/\n\n+/).find((block) => block.includes("*Spirit Grounds*"))!;
    expect(spirits).toContain("Um Spirit Gate está aberto em Ghostlands.");
    expect(spirits.split("\n").filter(isNoteLine)).not.toEqual([]);
  });

  it("expands a rich state and still keeps its deadline line last", () => {
    // Awash's drained stage is one of the busy ones: a 1,000-kill bestiary entry, the
    // achievement on top of it, a boss, that boss's achievement, and a quota that expires at
    // the server save. All of them fit, and the quota stays last because it is the only one
    // that is worthless tomorrow.
    const input = makeInput();
    setWorld(input, "awash", "drained-quota-open");
    const entry = generateBriefingMessage(input)
      .split("\n\n")
      .find((block) => block.includes("*Awash*"))!;

    // Counted off the markers, so the block's own name and location lines are not mistaken
    // for opportunities.
    const opportunities = entry.split("\n").filter(isNoteLine);
    expect(opportunities.length).toBeGreaterThan(3);
    expect(opportunities.at(-1)).toMatch(/^🔄 /);
    expect(opportunities.at(-1)).toContain("Server Save");
  });

  it("keeps a quiet state to the one or two lines it actually has", () => {
    // The cap is a ceiling, not a target. A clean lake has exactly one thing to say, and the
    // same renderer that gives a fallen hive seven lines has to give this one line.
    const input = makeInput();
    setWorld(input, "twisted-waters", "clean");
    const entry = generateBriefingMessage(input)
      .split(/\n\n+/)
      .find((block) => block.includes("*Twisted Waters*"))!;
    expect(entry.split("\n").filter(isNoteLine)).toHaveLength(1);
  });

  it("says what today's effort actually buys, without the app's own vocabulary", () => {
    // This used to append the catalog's availability tier to the line — "só neste estado",
    // "só progresso hoje", "vale após o Server Save". Those describe how the app models an
    // entry, not anything a player does, and they went out to guild channels verbatim.
    // A marker now says what kind of line it is, and the sentence says the rest.
    const input = makeInput();
    setWorld(input, "steamship", "not-running");
    const message = generateBriefingMessage(input);

    const entry = message.split(/\n\n+/).find((block) => block.includes("*Steamship*"))!;
    expect(entry).toMatch(/^🔄 .*Junkar/m);
    expect(entry).toMatch(/^⏳ /m);

    for (const banned of ["só neste estado", "só progresso hoje", "vale após o Server Save"]) {
      expect(message, banned).not.toContain(banned);
    }
  });

  it("gives every line something to act on beyond the name", () => {
    // "Slug Drug — item" names a thing without saying what to do with it, which is the one
    // thing a reader needs at eight in the morning.
    for (const { name, input } of everyScenario()) {
      for (const line of opportunityLines(generateBriefingMessage(input))) {
        // Strip the marker; what is left has to be worth the line it costs.
        const said = line.replace(/^\S+\s+/, "");
        expect(said.length, `${name}: ${line}`).toBeGreaterThan(6);
        // A line that names a subject has to follow it with something.
        if (said.startsWith("*")) {
          const after = said.slice(said.indexOf(":* ") + 3);
          expect(after.length, `${name}: ${line}`).toBeGreaterThan(6);
        }
      }
    }
  });

  it("never offers something the current state blocks", () => {
    const input = makeInput();
    setWorld(input, "overhunting", "wolves");
    const message = generateBriefingMessage(input);
    expect(message).not.toContain("Kingly Deer");
    expect(message).not.toContain("White Deer Antlers");
  });
});

describe("language", () => {
  it("renders every language without leaving a gap", () => {
    for (const language of LANGUAGES) {
      const message = generateBriefingMessage(makeInput(language));
      expect(message, language).not.toContain("undefined");
      expect(message, language).not.toMatch(/\[object/);
      expect(message.length, language).toBeGreaterThan(80);
    }
  });

  it("translates the app's own words and leaves Tibia's alone", () => {
    const input = makeInput("en");
    setWorld(input, "overhunting", "wolves");
    const english = generateBriefingMessage(input);
    expect(english).toContain("👾 *Boosted Creature:* Gore Horn");
    expect(english).toContain("🌍 *WORLD CHANGES*");
    expect(english).toContain("🎯 *Starving Wolf:* 500 kills, 15 Charm Points.");

    const portuguese = generateBriefingMessage(makeInput());
    expect(portuguese).toContain("👾 *Criatura Boostada:* Gore Horn");
    // "kills" was the last English word left in a Portuguese line of numbers.
    const ptWolves = generateBriefingMessage(
      (() => {
        const input = makeInput();
        setWorld(input, "overhunting", "wolves");
        return input;
      })(),
    );
    expect(ptWolves).toContain("🎯 *Starving Wolf:* 500 mortes, 15 Charm Points.");

    // Merchants, Charm Points and the change names are Tibia's, not the app's.
    for (const language of LANGUAGES) {
      const message = generateBriefingMessage(makeInput(language));
      expect(message, language).toContain("*Rashid:* Svargrond");
      expect(message, language).toContain("*Yasir:* Carlin");
    }
  });

  it("keeps Portuguese prose free of stray English", () => {
    const input = makeInput();
    setMini(input, "nightmare-isles", "daramas-northernmost-coast");
    setWorld(input, "demon-war", "shaburak-dominant");
    const message = generateBriefingMessage(input);
    expect(message).not.toMatch(/darama's northernmost coast/i);
    expect(message).not.toMatch(/\bonly in this state\b/);
    expect(message).not.toMatch(/\bprogress only\b/);
  });
});
