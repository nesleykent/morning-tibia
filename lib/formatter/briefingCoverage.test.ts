import { describe, expect, it } from "vitest";
import { createDefaultOverrides } from "@/lib/defaults";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";
import { generateBriefingMessage, generatePlainTextBriefing } from "./generateBriefing";
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
  expect(message, context).not.toMatch(/\n{3,}/);
  expect(message, context).toBe(message.trim());
  expect(message, context).not.toContain("**");

  for (const line of message.split("\n")) {
    expect(line, `${context}: indented — "${line}"`).toBe(line.trimStart());
    expect(line, `${context}: trailing space — "${line}"`).toBe(line.trimEnd());
    expect((line.match(/\*/g) ?? []).length % 2, `${context}: unbalanced * — "${line}"`).toBe(0);
    expect((line.match(/_/g) ?? []).length % 2, `${context}: unbalanced _ — "${line}"`).toBe(0);
    // A dangling separator means a chip resolved to nothing.
    expect(line, `${context}: dangling separator — "${line}"`).not.toMatch(/(·|—)\s*$/);
    expect(line, `${context}: doubled separator — "${line}"`).not.toMatch(/·\s*·/);
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
          expect(rich, context).toContain(`${definition.emoji} *${definition.shortLabel}* — `);
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
          // An always-active change with no variant known is deliberately left out: the
          // Forsaken Mine rotates at every server save whether or not anyone looked, so
          // "the mine changed again" is not news until the player has been down there.
          const reportable = definition.detection !== "always-active" || variantId !== null;
          if (reportable) {
            expect(rich, context).toContain(`${definition.emoji} *${definition.name}* — `);
          }
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
      expect(message, language).toContain("🎲");
      expect(message, language).toContain("*Kingsday* — ");
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

    expect(generateBriefingMessage(input).split("\n").length).toBeLessThan(45);
  });
});
