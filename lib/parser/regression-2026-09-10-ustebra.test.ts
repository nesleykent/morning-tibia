import { describe, expect, it } from "vitest";
import { parseGameText } from "./parseGameText";
import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { createDefaultOverrides } from "@/lib/defaults";
import { generateBriefingMessage } from "@/lib/formatter/generateBriefing";
import type { BriefingOverrides } from "@/types/briefing";
import type { CombinedParseResult } from "./parseGameText";

/**
 * A real morning on Ustebra, 10 September 2026: a whole World Board reading plus all fourteen
 * Guide keywords asked in one sitting.
 *
 * It is kept as a regression because it is the input that exposed three separate failures at
 * once, each of which silently deleted true information:
 *
 * 1. Two of the fourteen Guide replies did not parse at all — the live Demon War reply carries
 *    a clause TibiaWiki's transcript omits, and the live Thornfire reply spells "below" where
 *    the wiki spells "bellow". Both were reported as never checked.
 * 2. Six of the twelve replies that *did* parse were then dropped from the briefing for being
 *    "quiet" states, including the two — no White Deer, no Wild Horse — that explain why other
 *    things are impossible.
 * 3. The board reading settled that Yasir is not trading, and the briefing said "not yet
 *    checked" anyway, because completeness was only ever recognised from an opening line the
 *    board does not print into the Server Log.
 */

const BOARD = `
The wild animals north of the Green Claw Swamp clearly dominate the area. But poachers come here to hunt them.
A sandstorm travels through Darama, leading to isles full of deadly creatures inside a nightmare. Avoid the northernmost coast!
Nomads travel the eternal sands of Ankrahmun's desert. There must be a camp somewhere.
Judging by the unnerved mammoths in Svargrond, enough snow has melted away to reveal some very special flora.
The volcano on Goroma sends its fiery message into the sky. A lot of creatures are flooding the lands together with its lava.
A whole nest of spiders needs to be exterminated as Mamma Longlegs is on the loose.
Adventurers have told of a Spirit Gate in the Ghostlands. Fight the restless undead!
`;

const GUIDE = `
The water in the mine tunnels under Kazordoon is drained, but deeplings are trying to flood the mines again. If not enough are killed today, the tunnel will be flooded again.
The inner arcanum of the deep has been breached. Now nothing can stop the assault on Qjell's dark guardians. 3 actions against the Deeplings have been taken. This position will hold for a while.
The hive is well defended and prepared for war. 0 actions have been taken against the Hive Born. 200 actions are necessary to advance further into the hive.
The Shaburak have summoned their leaders and dominate the complex, while the Askarak are weakened.
Horestis's body has been desecrated. His curse now hangs over Ankrahmun like the shadow of the vulture and his tomb is almost empty.
The horse services near Thais and Venore are working normally.
The raging mage is currently in his tower in Zao and experimenting with the portal into another dimension.
The strange tower with the servants on Edron is covered in slime.
Starving wolves are roaming the region near Ab'Dendriel. As long as they are there, no white deer will return.
The Fire-Feathered Serpent dreams and the earth is bleeding lava.
The steamship from Thais to Kazordoon is currently not running - coal is needed to activate the service once again.
The swamp fever in Venore is currently under control and there is enough medicine for everyone.
Countless firestarters are in their cells below Shadowthorn, but right now they are safely guarded.
The great lake near Port Hope is clean.
`;

/** The exact states the fourteen replies above establish, keyword by keyword. */
const EXPECTED_STATES: Record<string, string> = {
  awash: "drained-quota-open",
  deeplings: "arcanum-breached",
  "hive-born": "defended",
  "demon-war": "shaburak-dominant",
  horestis: "desecrated",
  "horse-station": "normal",
  "mage-tower": "portal-open",
  "masters-voice": "passable",
  overhunting: "wolves",
  "sea-serpent": "dreaming",
  steamship: "not-running",
  "swamp-fever": "under-control",
  thornfire: "guarded",
  "twisted-waters": "clean",
};

/** The seven Mini World Changes the board announced, and the variants it named. */
const EXPECTED_MINI: Record<string, string | null> = {
  "poacher-caves": "game",
  "nightmare-isles": "daramas-northernmost-coast",
  "spirit-grounds": "ghostlands",
  nomads: null,
  thawing: null,
  "fire-from-the-earth": null,
  "spider-nest": null,
};

const REFERENCE_DATE = new Date("2026-09-10T12:00:00Z");

/** Applies a parse result the way useBriefingState does, so the test exercises the real path. */
function applyEvidence(parsed: CombinedParseResult): BriefingOverrides {
  const overrides = createDefaultOverrides("Ustebra", REFERENCE_DATE);

  for (const signal of parsed.miniWorldChangeSignals) {
    overrides.miniWorldChanges[signal.changeId] = {
      id: signal.changeId,
      status: "active",
      variantId: signal.variantId,
      updatedAt: null,
    };
  }
  for (const id of parsed.inactiveMiniWorldChangeIds) {
    overrides.miniWorldChanges[id] = { id, status: "inactive", variantId: null, updatedAt: null };
  }
  for (const signal of parsed.worldChangeSignals) {
    overrides.worldChanges[signal.changeId] = {
      id: signal.changeId,
      stateId: signal.stateId,
      updatedAt: null,
    };
  }
  if (parsed.inactiveMerchantIds.includes("yasir")) {
    overrides.merchants.yasir = {
      ...overrides.merchants.yasir!,
      activityState: "inactive",
      location: "",
    };
  }
  overrides.merchants.rashid = { ...overrides.merchants.rashid!, location: "Edron" };
  return overrides;
}

function briefingFor(overrides: BriefingOverrides, language: "pt" | "en" = "pt"): string {
  return generateBriefingMessage({
    world: "Ustebra",
    referenceDate: REFERENCE_DATE,
    overrides,
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
  });
}

const wholeBoard = () => parseGameText(`${BOARD}\n${GUIDE}`, { declaredComplete: true });

describe("2026-09-10 Ustebra regression — parsing", () => {
  it("reads all fourteen Guide replies, including the two that used to fail", () => {
    const states = new Map(
      wholeBoard().worldChangeSignals.map((signal) => [signal.changeId, signal.stateId]),
    );

    expect(states.size).toBe(14);
    expect(Object.fromEntries(states)).toEqual(EXPECTED_STATES);

    // The two specific failures, called out so a regression names itself:
    // a live reply that continues past the catalog's sentence…
    expect(states.get("demon-war")).toBe("shaburak-dominant");
    // …and a live reply whose spelling differs from TibiaWiki's transcript.
    expect(states.get("thornfire")).toBe("guarded");
  });

  it("reads all seven announced Mini World Changes with the variants the board names", () => {
    const mini = new Map(
      wholeBoard().miniWorldChangeSignals.map((signal) => [signal.changeId, signal.variantId]),
    );
    expect(Object.fromEntries(mini)).toEqual(EXPECTED_MINI);
  });

  it("does not invent a Guide reply that is not there", () => {
    const answered = new Set(wholeBoard().guide.answeredChangeIds);
    expect(wholeBoard().guide.unrecognisedReplies).toEqual([]);
    // Every id the parser produced is a real World Change, and nothing else was claimed.
    for (const id of answered) {
      expect(WORLD_CHANGE_DEFINITIONS.some((def) => def.id === id)).toBe(true);
    }
  });
});

describe("2026-09-10 Ustebra regression — evidence semantics", () => {
  it("treats the declared whole board as a complete snapshot", () => {
    const parsed = wholeBoard();
    expect(parsed.board.completeness).toBe("complete");
    expect(parsed.board.basis).toBe("declared");
    expect(parsed.board.recognisedCount).toBe(7);
  });

  it("settles Yasir as ABSENT, because a complete board did not announce him", () => {
    const parsed = wholeBoard();
    expect(parsed.inactiveMerchantIds).toEqual(["yasir"]);
    expect(applyEvidence(parsed).merchants.yasir?.activityState).toBe("inactive");
    expect(briefingFor(applyEvidence(parsed))).toContain("💰 YASIR\nnão está comerciando hoje");
    expect(briefingFor(applyEvidence(parsed))).not.toContain("ainda não verificado");
  });

  it("leaves Yasir UNKNOWN when the same text is pasted without the declaration", () => {
    // Byte-for-byte the same board, only the reader has not said it is the whole thing. That
    // is a partial observation, and a partial observation can never settle an absence.
    const partial = parseGameText(`${BOARD}\n${GUIDE}`);
    expect(partial.board.completeness).toBe("partial");
    expect(partial.board.basis).toBe("none");
    expect(partial.inactiveMerchantIds).toEqual([]);
    expect(partial.inactiveMiniWorldChangeIds).toEqual([]);
    expect(applyEvidence(partial).merchants.yasir?.activityState).toBe("not-verified");
    expect(briefingFor(applyEvidence(partial))).toContain("💰 YASIR\nainda não verificado");
  });

  it("keeps UNKNOWN and ABSENT apart for Mini World Changes too", () => {
    const complete = applyEvidence(wholeBoard());
    const partial = applyEvidence(parseGameText(`${BOARD}\n${GUIDE}`));

    // Kingsday is announced and was not on the board: absent under a complete reading…
    expect(complete.miniWorldChanges["kingsday"]?.status).toBe("inactive");
    // …and still unknown under a partial one.
    expect(partial.miniWorldChanges["kingsday"]?.status).toBe("unchecked");

    // Silent changes are never settled by any board reading, complete or not: the board could
    // not have mentioned them, so its silence about them means nothing at all.
    for (const id of ["beaver-breakout", "shipwrecked"]) {
      expect(complete.miniWorldChanges[id]?.status, id).toBe("unchecked");
      expect(partial.miniWorldChanges[id]?.status, id).toBe("unchecked");
    }
  });

  it("does not let one Guide answer say anything about the other thirteen keywords", () => {
    const single = parseGameText("Guide Luke: The great lake near Port Hope is clean.");
    expect(single.worldChangeSignals).toHaveLength(1);
    expect(single.worldChangeSignals[0]?.changeId).toBe("twisted-waters");

    const overrides = applyEvidence(single);
    for (const def of WORLD_CHANGE_DEFINITIONS) {
      if (def.id === "twisted-waters") continue;
      expect(overrides.worldChanges[def.id]?.stateId, def.id).toBeNull();
    }
  });

  it("reports a Guide reply it cannot read instead of silently dropping it", () => {
    const parsed = parseGameText(
      "Guide Elena: The mysterious thing near Kazordoon is doing something we have never transcribed.",
    );
    expect(parsed.worldChangeSignals).toEqual([]);
    expect(parsed.guide.unrecognisedReplies).toEqual([
      "The mysterious thing near Kazordoon is doing something we have never transcribed.",
    ]);
    expect(parsed.isEmpty).toBe(false);
  });
});

describe("2026-09-10 Ustebra regression — briefing output", () => {
  const message = briefingFor(applyEvidence(wholeBoard()));

  it("keeps every one of the fourteen recognised World Changes", () => {
    for (const def of WORLD_CHANGE_DEFINITIONS) {
      expect(message, def.id).toContain(`${def.emoji} ${def.shortLabel.toUpperCase()}`);
    }
    // Six of these were previously deleted for being "quiet" states.
    for (const label of [
      "🚢 STEAMSHIP",
      "🐴 HORSE STATION",
      "🐝 HIVE BORN",
      "🦟 SWAMP FEVER",
      "🌵 THORNFIRE",
      "💧 TWISTED WATERS",
    ]) {
      expect(message, label).toContain(label);
    }
    // Nothing is left over to report as unchecked, so the note stays away.
    expect(message).not.toContain("Ainda não consultadas hoje");
  });

  it("keeps every one of the seven announced Mini World Changes", () => {
    for (const id of Object.keys(EXPECTED_MINI)) {
      const def = MINI_WORLD_CHANGE_DEFINITIONS.find((d) => d.id === id)!;
      expect(message, id).toContain(`${def.emoji} ${def.name.toUpperCase()}`);
    }
  });

  it("describes the state the Guide actually reported, not the change in general", () => {
    expect(message).toContain("Starving Wolves rondam a região de Ab'Dendriel.");
    expect(message).toContain("Não há White Deer na região enquanto os lobos estiverem lá.");
    expect(message).toContain("O barco a vapor entre Thais e Kazordoon não está operando");
    expect(message).toContain("A Hive está bem defendida e preparada para a guerra.");
  });

  it("never recommends content this state blocks", () => {
    // The wolves are out, so nothing about White Deer, the Kingly Deer mount or antler trading
    // may be offered; and the horses are penned, so no Wild Horse taming either.
    expect(message).not.toContain("Kingly Deer");
    expect(message).not.toContain("White Deer Antlers");
    expect(message).not.toContain("War Horse");
    // Master's Voice is passable, so the Mad Mage is reachable — but only as progress, never
    // as something available today.
    expect(message).not.toMatch(/Mad Mage — Boss · Bane$/m);
  });

  it("surfaces the state-specific opportunity the blocked content hid", () => {
    expect(message).toContain("🦌 OVERHUNTING");
    expect(message).toContain("Starving Wolf — Bestiary · 500 mortes · 15 Charm Points");
  });

  it("offers more than achievements", () => {
    // The old catalog could only express achievements, so a state whose whole value was a
    // bestiary entry, a boss or a hunting ground reported nothing at all.
    for (const kind of ["Bestiary", "Boss", "Caçada", "Progresso da World Change"]) {
      expect(message, kind).toContain(kind);
    }
    expect(message).toContain("Achievement");
  });

  it("marks availability honestly, in all three tiers", () => {
    // Available today carries no marker — the section already says today.
    expect(message).toContain("Deepling Scout — Bestiary · 1000 mortes · 25 Charm Points");
    expect(message).toContain("dá para avançar hoje");
    expect(message).toContain("vale a partir do próximo Server Save");
    expect(message).not.toContain("undefined");
  });

  it("reads as Portuguese, not as Portuguese with English pasted into it", () => {
    expect(message).toContain("O portal para as Nightmare Isles está na costa mais ao norte de Darama.");
    expect(message).not.toMatch(/darama's northernmost coast/i);
    // The old "<name> — thanks to <name>" connector is gone with the grouping that replaced it.
    expect(message).not.toContain("graças a Fire from the Earth");
  });
});
