import { describe, expect, it } from "vitest";
import { createDefaultOverrides } from "@/lib/defaults";
import { MINI_WORLD_CHANGE_DEFINITIONS, isUnannounced } from "@/lib/defaults/miniWorldChanges";
import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";
import { generateBriefingMessage, generatePlainTextBriefing } from "./generateBriefing";
import { nameLinePattern } from "@/lib/testing/briefingLines";
import { BRIEFING_LANGUAGES } from "./translations";
import type { BriefingInput } from "./briefingModel";

const LANGUAGES = BRIEFING_LANGUAGES.map((entry) => entry.value);
const REFERENCE = new Date("2026-09-10T12:00:00Z");

/**
 * Every state of every change, in every language, through the renderer.
 *
 * The bulletin is generated for any of ninety-odd worlds from whatever the reader happened to
 * check that morning, so the combinations that reach it are not the ones anyone writes a test
 * for by hand: a single quiet Guide answer and nothing else, a board with one line, a state
 * nobody has seen in months. A format that only holds for the shapes someone thought of is a
 * format that breaks in front of a reader.
 *
 * These are structural checks, not wording ones — the wording lives in
 * generateBriefing.test.ts, which reads one scenario closely.
 */

function inputFor(language: BriefingInput["language"]): BriefingInput {
  return {
    world: "Antica",
    referenceDate: REFERENCE,
    overrides: createDefaultOverrides("Antica", REFERENCE),
    boostedCreature: { kind: "creature", name: "Badger", imageUrl: null },
    boostedBoss: { kind: "boss", name: "Mazoran", imageUrl: null },
    warzoneSchedule: null,
    activeEvents: [],
    upcomingEvents: [],
    drome: null,
    language,
    viewerTimeZone: "America/Sao_Paulo",
    upcomingEventsWindowDays: 7,
    marketTrendBasis: "last",
  };
}

/** The invariants a pasteable message has to hold whatever it happens to contain. */
function expectWellFormed(message: string, context: string) {
  expect(message, context).not.toContain("undefined");
  expect(message, context).not.toContain("null");
  expect(message, context).not.toMatch(/\[object/);
  // Two blank lines separate the bulletin's top-level sections and one separates the blocks
  // inside them; that two-tier rhythm is what makes a long message scannable on a phone.
  // Three is always a hole where something rendered empty.
  expect(message, context).not.toMatch(/\n{4,}/);
  expect(message, context).toBe(message.trim());
  expect(message, context).not.toContain("**");

  // Bullet glyphs, middle dots and em dashes are banned outright. They are how generated text
  // gives itself away, and the bulletin is forwarded to people who did not generate it: the
  // moment it looks assembled rather than written, they stop reading it as a report about
  // their world. Ordinary punctuation says the same things.
  for (const banned of ["\u2022", "\u00B7", "\u25CF", "\u25CB", "\u25AA", "\u25AB", "\u25E6", "\u2023", "\u25B8", "\u2014"]) {
    expect(message, `${context}: contains ${JSON.stringify(banned)}`).not.toContain(banned);
  }

  for (const line of message.split("\n")) {
    expect(line, `${context}: indented — "${line}"`).toBe(line.trimStart());
    expect(line, `${context}: trailing space — "${line}"`).toBe(line.trimEnd());
    expect((line.match(/\*/g) ?? []).length % 2, `${context}: unbalanced * — "${line}"`).toBe(0);
    expect((line.match(/_/g) ?? []).length % 2, `${context}: unbalanced _ — "${line}"`).toBe(0);
    // A dangling separator means a chip resolved to nothing.
    expect(line, `${context}: dangling separator in "${line}"`).not.toMatch(/[,:;(]\s*$/);
    expect(line, `${context}: doubled separator in "${line}"`).not.toMatch(/,\s*,/);
  }
}

describe("every World Change state", () => {
  it("renders in every language, in both formats", () => {
    for (const language of LANGUAGES) {
      for (const definition of WORLD_CHANGE_DEFINITIONS) {
        for (const state of definition.states) {
          const input = inputFor(language);
          input.overrides.worldChanges[definition.id] = {
            id: definition.id,
            stateId: state.id,
            updatedAt: null,
          };
          const context = `${definition.id}/${state.id}/${language}`;

          const rich = generateBriefingMessage(input);
          expectWellFormed(rich, context);
          expect(rich, context).toMatch(nameLinePattern(definition.emoji, definition.name));
          expectWellFormed(generatePlainTextBriefing(input), `${context} (plain)`);
        }
      }
    }
  });
});

describe("every Mini World Change, with and without its variant", () => {
  it("renders in every language, in both formats", () => {
    for (const language of LANGUAGES) {
      for (const definition of MINI_WORLD_CHANGE_DEFINITIONS) {
        for (const variantId of [null, ...definition.variants.map((variant) => variant.id)]) {
          const input = inputFor(language);
          input.overrides.miniWorldChanges[definition.id] = {
            id: definition.id,
            status: "active",
            variantId,
            updatedAt: null,
          };
          const context = `${definition.id}/${variantId ?? "no variant"}/${language}`;

          const rich = generateBriefingMessage(input);
          expectWellFormed(rich, context);
          expect(rich, context).toMatch(nameLinePattern(definition.emoji, definition.name));
          expectWellFormed(generatePlainTextBriefing(input), `${context} (plain)`);
        }
      }
    }
  });

  it("renders a change a complete board ruled out, under 'include everything'", () => {
    for (const language of LANGUAGES) {
      const input = inputFor(language);
      input.overrides.includeAllChanges = true;
      input.overrides.miniWorldChanges["kingsday"] = {
        id: "kingsday",
        status: "inactive",
        variantId: null,
        updatedAt: null,
      };
      const message = generateBriefingMessage(input);
      expectWellFormed(message, `inactive/${language}`);
      expect(message, language).toContain("🎎");
      expect(message, language).toMatch(nameLinePattern("👑", "Kingsday"));
    }
  });
});

describe("the changes nothing announces", () => {
  it("are in the section in every language, on a day nothing has been checked", () => {
    // They are the section's permanent residents, and this is the day that matters: with no
    // evidence at all, every announced change is correctly absent and these three still have
    // to be there saying nobody has looked. No source reports them, so their absence would be
    // silence a reader cannot tell apart from "nothing is happening".
    const unannounced = MINI_WORLD_CHANGE_DEFINITIONS.filter(isUnannounced);
    expect(unannounced.map((definition) => definition.id)).toEqual([
      "beaver-breakout",
      "shipwrecked",
      "forsaken",
    ]);

    for (const language of LANGUAGES) {
      for (const format of [generateBriefingMessage, generatePlainTextBriefing]) {
        const message = format(inputFor(language));
        for (const definition of unannounced) {
          expect(message, `${definition.id}/${language}`).toContain(definition.name);
        }
      }
    }
  });

  it("say nobody has looked, in a sentence, rather than by being missing", () => {
    // The state line is the whole point of keeping them: it has to be a real sentence in each
    // language, not a label, and it must not commit to either answer.
    for (const language of LANGUAGES) {
      const blocks = generateBriefingMessage(inputFor(language)).split(/\n\n+/);
      for (const definition of MINI_WORLD_CHANGE_DEFINITIONS.filter(isUnannounced)) {
        const block = blocks.find((part) => part.includes(`*${definition.name}*`));
        const context = `${definition.id}/${language}`;
        expect(block, context).toBeDefined();

        const [, state] = block!.split("\n");
        expect(state, context).toMatch(/^_.+\._$/);
        expect(state!.length, context).toBeGreaterThan(40);
        // Nothing is confirmed, so the block carries no opportunity lines at all.
        expect(block!.split("\n"), context).toHaveLength(2);
      }
    }
  });
});

describe("the extremes", () => {
  it("stays well-formed with nothing at all established", () => {
    for (const language of LANGUAGES) {
      expectWellFormed(generateBriefingMessage(inputFor(language)), `empty/${language}`);
      expectWellFormed(generatePlainTextBriefing(inputFor(language)), `empty/${language} (plain)`);
    }
  });

  it("stays well-formed with every live feed down and nothing checked", () => {
    // Everything the app knows comes from somewhere that can fail. What is left still has to
    // be a message rather than a scaffold with holes in it.
    for (const language of LANGUAGES) {
      const input = inputFor(language);
      input.unavailable = { boosted: true, warzone: true, market: true };
      const message = generateBriefingMessage(input);
      expectWellFormed(message, `outage/${language}`);
      expect(message, language).toContain("Antica");
    }
  });

  it("stays well-formed with every change active at once", () => {
    // Not a day Tibia can have — it is the upper bound the layout has to survive without the
    // format collapsing or a section running away.
    const input = inputFor("pt");
    input.overrides.includeAllChanges = true;
    for (const definition of MINI_WORLD_CHANGE_DEFINITIONS) {
      input.overrides.miniWorldChanges[definition.id] = {
        id: definition.id,
        status: "active",
        variantId: definition.variants[0]?.id ?? null,
        updatedAt: null,
      };
    }
    for (const definition of WORLD_CHANGE_DEFINITIONS) {
      input.overrides.worldChanges[definition.id] = {
        id: definition.id,
        stateId: definition.states[definition.states.length - 1]!.id,
        updatedAt: null,
      };
    }

    const message = generateBriefingMessage(input);
    expectWellFormed(message, "everything at once");
    // No single line may grow past what a phone can wrap sensibly.
    for (const line of message.split("\n")) {
      expect(line.length, `too long: "${line}"`).toBeLessThan(300);
    }
  });

  it("keeps an ordinary morning short enough to be read in a chat window", () => {
    // The bulletin this replaced ran to 165 lines for one day, most of it the same facts
    // twice. A ceiling here is the only thing that keeps that from creeping back.
    //
    // 80, not the old 45: a change is now a block — its name, where it is, what is true, and
    // what that is worth — rather than one dense line. That is the format this bulletin is
    // meant to have, and it costs roughly four lines per change. The ceiling still does its
    // job, which is to catch the day duplication creeps back in, not to force density.
    const input = inputFor("pt");
    for (const id of ["fury-gates", "stampede", "spider-nest", "nomads"]) {
      input.overrides.miniWorldChanges[id] = { id, status: "active", variantId: null, updatedAt: null };
    }
    for (const [id, stateId] of [
      ["overhunting", "wolves"],
      ["awash", "drained-quota-open"],
      ["demon-war", "shaburak-dominant"],
      ["twisted-waters", "clean"],
    ] as const) {
      input.overrides.worldChanges[id] = { id, stateId, updatedAt: null };
    }

    expect(generateBriefingMessage(input).split("\n").length).toBeLessThan(80);
  });
});
