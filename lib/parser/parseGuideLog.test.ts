import { describe, expect, it } from "vitest";
import { parseGuideLog } from "./parseGuideLog";
import { GUIDE_MESSAGES } from "./guideMessages";
import { WORLD_CHANGES_BY_ID } from "@/lib/defaults/worldChanges";

describe("parseGuideLog", () => {
  it("reads a documented state out of a Guide reply", () => {
    const log = `
Player: hive
Guide Ferob: The hive is well defended and prepared for war. 12 actions have been taken against the Hive Born. 200 actions are necessary to advance further into the hive.
`;
    const result = parseGuideLog(log);
    expect(result.signals.find((s) => s.changeId === "hive-born")?.stateId).toBe("defended");
  });

  it("distinguishes which faction is winning the demon war", () => {
    const shaburak = parseGuideLog("Guide: The Shaburak have summoned their leaders and dominate the complex.");
    expect(shaburak.signals[0]).toMatchObject({
      changeId: "demon-war",
      stateId: "shaburak-dominant",
    });

    const askarak = parseGuideLog("Guide: The Askarak are in advantage right now.");
    expect(askarak.signals[0]).toMatchObject({
      changeId: "demon-war",
      stateId: "askarak-advantage",
    });
  });

  it("keeps only the latest reply when a keyword was asked more than once", () => {
    const log = `
Guide: Horestis near Ankrahmun is slumbering in his tomb.
... some time later ...
Guide: The great Pharaoh Horestis near Ankrahmun has risen from his slumber to crush all intruders.
`;
    const horestis = parseGuideLog(log).signals.filter((s) => s.changeId === "horestis");
    expect(horestis).toHaveLength(1);
    expect(horestis[0]?.stateId).toBe("risen");
  });

  it("tells the two Awash 'drained' replies apart", () => {
    const met = parseGuideLog(
      "Guide: The water in the mine tunnels under Kazordoon is drained and enough deeplings have been killed today to ensure it remains that way.",
    );
    expect(met.signals[0]?.stateId).toBe("drained-quota-met");

    const open = parseGuideLog(
      "Guide: The water in the mine tunnels under Kazordoon is drained, but deeplings are trying to flood the mines again.",
    );
    expect(open.signals[0]?.stateId).toBe("drained-quota-open");
  });

  it("returns nothing for a Guide chat with no world-change reply", () => {
    expect(parseGuideLog("Guide: Hello there, adventurer!").signals).toHaveLength(0);
  });

  it("never touches Mini World Changes, even when the log mentions one by name", () => {
    // Guide text must not be able to reach into the other mechanic's catalog.
    const result = parseGuideLog(
      "Guide: I have heard the witch Wyda seems to be bored, and that a fiery fury gate has opened.",
    );
    expect(result.signals).toHaveLength(0);
  });

  it("only ever produces states the catalog actually documents", () => {
    for (const entry of GUIDE_MESSAGES) {
      const def = WORLD_CHANGES_BY_ID.get(entry.changeId);
      expect(def, `unknown changeId ${entry.changeId}`).toBeDefined();
      expect(
        def!.states.some((state) => state.id === entry.stateId),
        `${entry.changeId} has no documented state "${entry.stateId}"`,
      ).toBe(true);
    }
  });

  it("reads a reply that carries on past the wording the catalog quotes", () => {
    // TibiaWiki's transcript stops at "…dominate the complex."; the live reply keeps going. The
    // parser used to require the catalog string verbatim, full stop included, so this whole
    // World Change came back as never checked.
    const result = parseGuideLog(
      "Guide Luke: The Shaburak have summoned their leaders and dominate the complex, while the Askarak are weakened.",
    );
    expect(result.signals[0]).toMatchObject({
      changeId: "demon-war",
      stateId: "shaburak-dominant",
    });
  });

  it("accepts either spelling of a reply the wiki and the client disagree about", () => {
    for (const spelling of ["below", "bellow"]) {
      const result = parseGuideLog(
        `Guide Elena: Countless firestarters are in their cells ${spelling} Shadowthorn, but right now they are safely guarded.`,
      );
      expect(result.signals[0], spelling).toMatchObject({
        changeId: "thornfire",
        stateId: "guarded",
      });
    }
  });

  it("still tells apart two replies that share a first sentence", () => {
    // Only the *trailing* punctuation is ignored, never an interior full stop — these two
    // Horestis replies differ solely in what follows "has been desecrated.".
    const desecrated = parseGuideLog(
      "Guide: Horestis's body has been desecrated. His curse now hangs over Ankrahmun like the shadow of the vulture and his tomb is almost empty.",
    );
    expect(desecrated.signals[0]?.stateId).toBe("desecrated");

    const ended = parseGuideLog(
      "Guide: Horestis's body has been desecrated. By now, his curse has ended though. His minions are recovering slowly.",
    );
    expect(ended.signals[0]?.stateId).toBe("curse-ended");
  });

  describe("replies the catalog cannot read", () => {
    it("reports them instead of dropping them", () => {
      const result = parseGuideLog("Guide Tiko: Something entirely new is happening in Zao.");
      expect(result.signals).toEqual([]);
      expect(result.unrecognisedReplies).toEqual([
        "Something entirely new is happening in Zao.",
      ]);
    });

    it("does not flag a reply it did understand", () => {
      const result = parseGuideLog("Guide Luke: The great lake near Port Hope is clean.");
      expect(result.signals).toHaveLength(1);
      expect(result.unrecognisedReplies).toEqual([]);
    });

    it("does not flag ordinary chat that is not a Guide speaking", () => {
      const result = parseGuideLog("Someone: hey, is the hive open today?");
      expect(result.unrecognisedReplies).toEqual([]);
    });

    it("reports the same unreadable reply once, however often it was repeated", () => {
      const result = parseGuideLog(
        [
          "Guide Tiko: Something entirely new is happening in Zao.",
          "Guide Tiko: Something entirely new is happening in Zao.",
        ].join("\n"),
      );
      expect(result.unrecognisedReplies).toHaveLength(1);
    });
  });

  it("covers every one of the 14 official Guide keywords", () => {
    const covered = new Set(GUIDE_MESSAGES.map((entry) => entry.changeId));
    for (const [id] of WORLD_CHANGES_BY_ID) {
      expect(covered.has(id), `no Guide reply text for ${id}`).toBe(true);
    }
  });
});
