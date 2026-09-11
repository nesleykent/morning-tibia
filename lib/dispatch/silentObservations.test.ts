import { beforeEach, describe, expect, it } from "vitest";
import { composeDispatch } from "./composeDispatch";
import { buildDailyDigest } from "@/lib/dashboard/dailyDigest";
import { createDefaultOverrides, mergeOverridesWithDefaults } from "@/lib/defaults";
import { MINI_WORLD_CHANGES_BY_ID, MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { generateBriefingMessage } from "@/lib/formatter/generateBriefing";
import { parseGameText } from "@/lib/parser/parseGameText";
import { briefingRepository } from "@/lib/storage/briefingRepository";
import { toTibiaDayKey } from "@/lib/utils/date";
import type { BriefingOverrides } from "@/types/briefing";
import type { MiniWorldChangeStatus } from "@/types/miniWorldChange";

/**
 * Manual tracking for the two Mini World Changes nothing announces.
 *
 * ## The mechanics these tests encode
 *
 * Beaver Breakout and Shipwrecked are *silent* changes: TibiaWiki BR marks both with the same
 * warning, "esta é uma mini world change silenciosa, portanto é necessário checar pessoalmente
 * se ela está ocorrendo em seu servidor". Neither the World Board nor the Towncryer ever
 * mentions them, so the only way to know is to go and look.
 *
 * Both are binary. The wiki documents no stages for either, and illustrates Beaver Breakout
 * with exactly two pictures — "Giant Beavers presos no cercado" and "Giant Beavers soltos".
 * That is the whole state space, and it is why the manual model needs nothing beyond the
 * `status` the app already stores: the sight the player reports determines the state exactly.
 *
 * Their lifetime is one Tibia day. The wiki says Mini World Changes happen "diariamente, de
 * maneira aleatória e sem avisos", and singles out Bank Robbery as ending early "ao contrário
 * de outras Mini World Changes que se mantêm ativas durante todo o dia" — so every other one,
 * these two included, holds for the whole day and turns over at server save. (The English
 * wiki's "They last a few hours" is the 2011 implementation note and contradicts its own
 * statistics method, which gathers data by checking the World Board "once every 24 hours".)
 * An observation is therefore valid exactly as long as the Tibia day it was made in, which is
 * already the bucket every other fact in this app lives in.
 *
 * Sources:
 *  - https://www.tibiawiki.com.br/wiki/Mini_World_Changes (§ Beaver Breakout, § Shipwrecked,
 *    § O que são as Mini World Changes?, § Bank Robbery)
 *  - https://tibia.fandom.com/wiki/Mini_World_Changes
 *  - https://tibia.fandom.com/wiki/Giant_Beaver
 */

const SILENT_IDS = ["beaver-breakout", "shipwrecked"] as const;
const REFERENCE = new Date("2026-09-10T12:00:00Z");

function overridesWith(
  states: Partial<Record<string, MiniWorldChangeStatus>> = {},
): BriefingOverrides {
  const overrides = createDefaultOverrides("Ustebra", REFERENCE);
  for (const [id, status] of Object.entries(states)) {
    overrides.miniWorldChanges[id] = { id, status: status!, variantId: null, updatedAt: null };
  }
  return overrides;
}

function dispatchFor(overrides: BriefingOverrides) {
  const digest = buildDailyDigest(overrides.miniWorldChanges, overrides.worldChanges);
  return composeDispatch(digest, overrides.merchants, overrides.boostedRegions);
}

/** Every segment of the "Nothing announces these" stanza, flattened for inspection. */
function goAndLookStanza(overrides: BriefingOverrides) {
  return dispatchFor(overrides).find((stanza) => stanza.id === "silent") ?? null;
}

function lineFor(overrides: BriefingOverrides, name: string) {
  const stanza = goAndLookStanza(overrides);
  return (
    stanza?.lines.find((line) =>
      line.some((segment) => "text" in segment && segment.text === name),
    ) ?? null
  );
}

function briefingFor(overrides: BriefingOverrides, language: "pt" | "en" = "pt"): string {
  return generateBriefingMessage({
    world: "Ustebra",
    referenceDate: REFERENCE,
    overrides,
    boostedCreature: null,
    boostedBoss: null,
    warzoneSchedule: null,
    activeEvents: [],
    upcomingEvents: [],
    drome: null,
    language,
    viewerTimeZone: "America/Sao_Paulo",
    upcomingEventsWindowDays: 7,
    marketTrendBasis: "last",
  });
}

describe("the catalog models both silent changes as two sights, not as a flag", () => {
  it.each(SILENT_IDS)("%s offers exactly one active and one inactive observation", (id) => {
    const definition = MINI_WORLD_CHANGES_BY_ID.get(id)!;
    expect(definition.detection).toBe("silent");

    const observations = definition.observations ?? [];
    expect(observations).toHaveLength(2);
    expect(observations.map((o) => o.establishes).sort()).toEqual(["active", "inactive"]);
    // Ids are distinct, so a pick can always be resolved back to one sight.
    expect(new Set(observations.map((o) => o.id)).size).toBe(2);
  });

  it.each(SILENT_IDS)("%s describes what is seen, not what the app concludes", (id) => {
    for (const observation of MINI_WORLD_CHANGES_BY_ID.get(id)!.observations ?? []) {
      // The vocabulary this replaced: a "Running" button and a "No" button.
      expect(observation.label).not.toMatch(/^(running|not running|no|yes|active|inactive)$/i);
      expect(observation.label.split(" ").length).toBeGreaterThan(2);
    }
  });

  it("gives observations only to the changes that need them", () => {
    for (const definition of MINI_WORLD_CHANGE_DEFINITIONS) {
      if (definition.detection === "silent") {
        expect(definition.observations, definition.id).toBeDefined();
      } else {
        // An announced change is settled by a board reading; an always-active one is never
        // off. Offering either a "what did you see" picker would be manual tracking where
        // automatic detection already works.
        expect(definition.observations, definition.id).toBeUndefined();
      }
    }
  });
});

describe("unverified", () => {
  it("asks what the player saw, and offers both sights", () => {
    const stanza = goAndLookStanza(overridesWith())!;
    expect(stanza.heading).toBe("Nothing announces these");

    for (const id of SILENT_IDS) {
      const definition = MINI_WORLD_CHANGES_BY_ID.get(id)!;
      const line = lineFor(overridesWith(), definition.name)!;
      const blank = line.find((segment) => segment.kind === "blank")!;

      expect(blank, id).toBeDefined();
      expect(blank.kind === "blank" && blank.target).toBe(`obs:${id}`);
      // Unanswered: no value, so the page renders it as an open gold question.
      expect(blank.kind === "blank" && blank.value).toBeNull();
      expect(blank.kind === "blank" && blank.options.map((o) => o.id)).toEqual(
        definition.observations!.map((o) => o.id),
      );
    }
  });

  it("still explains how to identify the state before it has been answered", () => {
    const line = lineFor(overridesWith(), "Shipwrecked")!;
    const prose = line.map((s) => ("text" in s ? s.text : "")).join(" ");
    expect(prose).toContain("north coast of Krailos");
  });

  it("claims nothing in the briefing", () => {
    const message = briefingFor(overridesWith());
    expect(message).not.toContain("Beaver Breakout");
    expect(message).not.toContain("Shipwrecked");
  });
});

describe("a confirmed sighting", () => {
  it("reports the beavers loose, and what that makes possible", () => {
    const message = briefingFor(overridesWith({ "beaver-breakout": "active" }));
    expect(message).toContain("🦫 *Beaver Breakout*");
    expect(message).toContain("Os Giant Beavers estão soltos em Silvertides");
    // The payoff the state exists for: the mount, tamed with a Colourful Water Lily.
    expect(message).toContain("Colourful Water Lily");
  });

  it("reports the wreck, and the respawn it brings", () => {
    const message = briefingFor(overridesWith({ shipwrecked: "active" }));
    expect(message).toContain("🏝️ *Shipwrecked*");
    expect(message).toContain("navio pirata naufragou na costa norte de Krailos");
    expect(message).toContain("Pirate Corsair");
  });

  it.each(SILENT_IDS)("%s: reports an empty look as its own finding", (id) => {
    const message = briefingFor(overridesWith({ [id]: "inactive" }));
    const definition = MINI_WORLD_CHANGES_BY_ID.get(id)!;
    expect(message).toContain(`${definition.emoji} *${definition.name}*`);
    // Not the flat "Não está acontecendo." every board-ruled-out change would get.
    expect(message).not.toContain("Não está acontecendo.");
  });

  it("says an empty look plainly, without needing 'include quiet items'", () => {
    const overrides = overridesWith({ "beaver-breakout": "inactive" });
    expect(overrides.includeAllChanges).toBe(false);
    expect(briefingFor(overrides)).toContain("continuam no cercado");
  });

  it("distinguishes 'nobody looked' from 'looked, nothing there'", () => {
    expect(briefingFor(overridesWith())).not.toContain("Beaver Breakout");
    expect(briefingFor(overridesWith({ "beaver-breakout": "inactive" }))).toContain(
      "Beaver Breakout",
    );
  });

  it("stays revisable, showing the sight instead of the instruction", () => {
    const overrides = overridesWith({ shipwrecked: "inactive" });
    const line = lineFor(overrides, "Shipwrecked")!;
    const blank = line.find((segment) => segment.kind === "blank")!;

    expect(blank.kind === "blank" && blank.value).toBe("The coast is clear, no pirates");
    // The "go and look" instruction is gone once it has been looked at.
    const prose = line.map((s) => ("text" in s ? s.text : "")).join(" ");
    expect(prose).not.toContain("north coast of Krailos");
  });

  it("never lets a silent change join the sentence about what the board ruled out", () => {
    const overrides = overridesWith({ "beaver-breakout": "inactive", shipwrecked: "inactive" });
    const quiet = dispatchFor(overrides).find((stanza) => stanza.id === "quiet");
    const prose = (quiet?.lines ?? [])
      .flat()
      .map((segment) => ("text" in segment ? segment.text : ""))
      .join(" ");
    // The board is structurally incapable of mentioning either, so it cannot have ruled
    // them out, and the page must not say it did.
    expect(prose).not.toContain("Beaver Breakout");
    expect(prose).not.toContain("Shipwrecked");
  });

  it("says nothing about implementation anywhere in the bulletin", () => {
    for (const status of ["active", "inactive"] as const) {
      const message = briefingFor(overridesWith({ "beaver-breakout": status, shipwrecked: status }));
      for (const leak of [
        "manual",
        "manually",
        "override",
        "unchecked",
        "silent",
        "observation",
        "status",
      ]) {
        expect(message.toLowerCase(), `${status}/${leak}`).not.toContain(leak);
      }
    }
  });
});

describe("the daily lifecycle", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    // The repository guards on `typeof window`, so the node suite needs one to write into.
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        get length() { return store.size; },
        key: (i: number) => [...store.keys()][i] ?? null,
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    };
  });

  it("survives a reload inside the same Tibia day", () => {
    const dayKey = toTibiaDayKey(REFERENCE);
    const overrides = overridesWith({ shipwrecked: "active" });
    briefingRepository.setOverrides(overrides);

    const reloaded = briefingRepository.getOverrides("Ustebra", dayKey);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.miniWorldChanges["shipwrecked"]?.status).toBe("active");
    // …and it is still the confirmed state after the defaults are merged back over it.
    const merged = mergeOverridesWithDefaults(reloaded, "Ustebra", REFERENCE);
    expect(merged.miniWorldChanges["shipwrecked"]?.status).toBe("active");
  });

  it("expires at server save, because that is when the world could have changed", () => {
    briefingRepository.setOverrides(overridesWith({ shipwrecked: "active" }));

    // The next Tibia day is a different bucket, and nothing was ever written to it.
    const tomorrow = new Date(REFERENCE.getTime() + 24 * 60 * 60 * 1000);
    const nextKey = toTibiaDayKey(tomorrow);
    expect(nextKey).not.toBe(toTibiaDayKey(REFERENCE));

    const carried = briefingRepository.getOverrides("Ustebra", nextKey);
    expect(carried).toBeNull();
    // Which is what the day-rollover reset loads, so yesterday's sighting is not reasserted.
    const fresh = mergeOverridesWithDefaults(carried, "Ustebra", tomorrow);
    expect(fresh.miniWorldChanges["shipwrecked"]?.status).toBe("unchecked");
    expect(fresh.miniWorldChanges["beaver-breakout"]?.status).toBe("unchecked");
  });

  it("keeps one world's sighting out of another's", () => {
    briefingRepository.setOverrides(overridesWith({ shipwrecked: "active" }));
    expect(briefingRepository.getOverrides("Antica", toTibiaDayKey(REFERENCE))).toBeNull();
  });
});

describe("automatic detection is left exactly as it was", () => {
  const BOARD = [
    "The wild animals north of the Green Claw Swamp clearly dominate the area. But poachers come here to hunt them.",
    "A whole nest of spiders needs to be exterminated as Mamma Longlegs is on the loose.",
    "Adventurers have told of a Spirit Gate in the Ghostlands. Fight the restless undead!",
  ].join("\n");

  it("a complete board reading still rules out every announced change", () => {
    const parsed = parseGameText(BOARD);
    expect(parsed.isCompleteBoardReading).toBe(true);
    expect(parsed.inactiveMiniWorldChangeIds).toContain("kingsday");
    expect(parsed.inactiveMiniWorldChangeIds.length).toBeGreaterThan(10);
  });

  it("and still refuses to rule out anything it cannot see", () => {
    const parsed = parseGameText(BOARD);
    for (const id of [...SILENT_IDS, "forsaken"]) {
      expect(parsed.inactiveMiniWorldChangeIds, id).not.toContain(id);
    }
  });

  it("leaves Forsaken exactly as it was: always active, settled only by its variant", () => {
    const forsaken = MINI_WORLD_CHANGES_BY_ID.get("forsaken")!;
    expect(forsaken.detection).toBe("always-active");
    expect(forsaken.observations).toBeUndefined();
    expect(forsaken.variants.map((v) => v.id)).toEqual([
      "rorcs",
      "leaf-golems",
      "cyclopes",
      "lost-dwarves",
    ]);

    // Its picker is still a variant picker, not an observation picker.
    const overrides = overridesWith();
    overrides.miniWorldChanges["forsaken"] = {
      id: "forsaken",
      status: "active",
      variantId: null,
      updatedAt: null,
    };
    const line = lineFor(overrides, "Forsaken")!;
    const blank = line.find((segment) => segment.kind === "blank")!;
    expect(blank.kind === "blank" && blank.target).toBe("mwc:forsaken");
  });
});
