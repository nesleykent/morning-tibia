import { describe, expect, it } from "vitest";
import { parseGameText } from "./parseGameText";
import { createDefaultOverrides } from "@/lib/defaults";
import { generateBriefingMessage } from "@/lib/formatter/generateBriefing";
import type { BriefingOverrides } from "@/types/briefing";
import type { CombinedParseResult } from "./parseGameText";

/**
 * A real morning on Antica, 11 September 2026, from a fourteen-world sweep taken the same hour.
 *
 * Kept as a regression because it is the log that closed the catalog's last two reading gaps,
 * both of which had been failing quietly for as long as the catalog existed:
 *
 * 1. Swamp Fever's middle stage — "under control, but medicine is direly needed" — had never
 *    been transcribed publicly, so the state was modelled but unreachable and declared with
 *    `guideWordingUnknown`. Eleven of the fourteen worlds swept were sitting in it.
 * 2. Overhunting's recovery stage — "enough have been driven away and the deer population will
 *    return soon" — was not in the catalog at all, so Antica's reply read as never checked.
 *
 * Both now parse, and with them every documented state of all fourteen World Changes has
 * verbatim Guide text behind it.
 */

const LOG = `
12:02:51 The wild animals north of the Green Claw Swamp clearly dominate the area. But poachers come here to hunt them.
12:02:51 A sandstorm travels through Darama, leading to isles full of deadly creatures inside a nightmare. Avoid the river near Drefia!
12:02:51 Judging by the unnerved mammoths in Svargrond, enough snow has melted away to reveal some very special flora.
12:02:51 The river in Zao Steppe runs deep, there may be more fish than usual!
12:02:51 The volcano on Goroma sends its fiery message into the sky. A lot of creatures are flooding the lands together with its lava.
12:02:51 Bibby Bloodbath and her crew are roaming the lands, destroying everything in their path.
12:02:51 A whole nest of spiders needs to be exterminated as Mamma Longlegs is on the loose.
12:02:51 Adventurers have told of a Spirit Gate in the Daramian mountains. Fight the restless undead!

12:03:16 Guide Luke: Hello there, Player and welcome to Thais! Would you like some information and a map guide?
12:03:19 Guide Luke: The water in the mine tunnels under Kazordoon is drained and enough deeplings have been killed today to ensure it remains that way.
12:03:20 Guide Luke: God-king Qjell seems to be pleased, the floodgates to the Drowned Library have opened. However, a passage to reach the outer rim of the caves still has to be created. ...
12:03:20 Guide Luke: 250 actions against the Deeplings have been taken. Enough to advance even further into the deep.
12:03:22 Guide Luke: The hive is well defended and prepared for war. ...
12:03:22 Guide Luke: 4 actions have been taken against the Hive Born. 200 actions are necessary to advance further into the hive.
12:03:23 Guide Luke: The Shaburak are in advantage right now.
12:03:25 Guide Luke: Horestis's body has been desecrated. By now, his curse has ended though. His minions are recovering slowly.
12:03:26 Guide Luke: Horses are on the loose near Thais! As long as there haven't been enough horses chased back into the pen, the service is on hold.
12:03:28 Guide Luke: The raging mage in Zao has been slain and the portal into another dimension will close.
12:03:29 Guide Luke: The strange tower with the servants on Edron is covered in slime.
12:03:31 Guide Luke: Starving wolves are roaming the region near Ab'Dendriel, but enough have been driven away and the deer population will return soon.
12:03:32 Guide Luke: The Fire-Feathered Serpent dreams and the earth is bleeding lava.
12:03:34 Guide Luke: The steamship from Thais to Kazordoon is currently not running - coal is needed to activate the service once again.
12:03:35 Guide Luke: The swamp fever in Venore is currently under control, but medicine is direly needed to prevent the next outbreak.
12:03:36 Guide Luke: Countless firestarters are in their cells below Shadowthorn, but right now they are safely guarded.
12:03:38 Guide Luke: The great lake near Port Hope is clean.
`;

const REFERENCE_DATE = new Date("2026-09-11T12:00:00Z");

function applyEvidence(parsed: CombinedParseResult): BriefingOverrides {
  const overrides = createDefaultOverrides("Antica", REFERENCE_DATE);
  for (const signal of parsed.miniWorldChangeSignals) {
    overrides.miniWorldChanges[signal.changeId] = {
      id: signal.changeId,
      status: "active",
      variantId: signal.variantId,
      updatedAt: null,
    };
  }
  for (const id of parsed.inactiveMiniWorldChangeIds) {
    overrides.miniWorldChanges[id] = {
      id,
      status: "inactive",
      variantId: null,
      updatedAt: null,
    };
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
  return overrides;
}

const parsed = () => parseGameText(LOG);

describe("2026-09-11 Antica regression", () => {
  it("reads all fourteen Guide replies, including the two the catalog used to miss", () => {
    const states = Object.fromEntries(
      parsed().worldChangeSignals.map((signal) => [signal.changeId, signal.stateId]),
    );
    expect(states).toEqual({
      awash: "drained-quota-met",
      deeplings: "floodgates-open",
      "hive-born": "defended",
      "demon-war": "shaburak-advantage",
      horestis: "curse-ended",
      "horse-station": "escaped",
      "mage-tower": "mage-slain",
      "masters-voice": "passable",
      overhunting: "wolves-receding",
      "sea-serpent": "dreaming",
      steamship: "not-running",
      "swamp-fever": "medicine-needed",
      thornfire: "guarded",
      "twisted-waters": "clean",
    });
  });

  it("reports nothing as unreadable, greeting and action counters included", () => {
    expect(parsed().guide.unrecognisedReplies).toEqual([]);
  });

  it("reads the whole board and rules out the rest of the catalog", () => {
    const result = parsed();
    expect(result.board.completeness).toBe("complete");
    expect(result.miniWorldChangeSignals).toHaveLength(8);
    expect(result.inactiveMiniWorldChangeIds).toHaveLength(15);
  });

  it("files the Spirit Gate under the region the board named, not the default one", () => {
    // The board said Darama. The 📍 line used to say Ghostlands regardless, contradicting the
    // sentence printed directly under it and pointing the reader at a different continent.
    expect(briefing()).toContain("🌀 *Spirit Grounds*\n📍 Darama\n");
  });

  it("writes the recovery stage without promising deer that are not back yet", () => {
    const text = briefing();
    // The state sentence may say the deer are coming back; the opportunity list may not offer
    // them, because on this stage there is still not one to hunt.
    expect(text).toContain("🎯 *Starving Wolf:* 500 kills, 15 Charm Points.");
    expect(text).not.toContain("*White Deer:*");
    expect(text).not.toContain("Kingly Deer");
    // The fever is only being held back, so nothing from the outbreak stage may appear.
    expect(text).toContain("🔄 *Hold the fever back:*");
    expect(text).not.toContain("Feverish Citizen");
    expect(text).not.toContain("Afflicted");
  });

  it("settles Yasir off the same complete board reading, without asking the reader", () => {
    // The board named no Yasir sighting and the reading is complete, so "nobody checked" would
    // be a lie about evidence the player already has.
    expect(briefing()).not.toContain("not yet checked");
  });
});

function briefing(): string {
  return generateBriefingMessage({
    world: "Antica",
    referenceDate: REFERENCE_DATE,
    overrides: applyEvidence(parsed()),
    boostedCreature: { kind: "creature", name: "Badger", imageUrl: null },
    boostedBoss: { kind: "boss", name: "Mazoran", imageUrl: null },
    warzoneSchedule: null,
    activeEvents: [],
    upcomingEvents: [],
    drome: null,
    language: "en",
    viewerTimeZone: "America/Sao_Paulo",
    upcomingEventsWindowDays: 7,
    marketTrendBasis: "last",
  });
}
