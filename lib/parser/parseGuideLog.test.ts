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

  it("covers every one of the 14 official Guide keywords", () => {
    const covered = new Set(GUIDE_MESSAGES.map((entry) => entry.changeId));
    for (const [id] of WORLD_CHANGES_BY_ID) {
      expect(covered.has(id), `no Guide reply text for ${id}`).toBe(true);
    }
  });
});
