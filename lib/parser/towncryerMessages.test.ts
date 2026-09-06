import { describe, expect, it } from "vitest";
import { TOWNCRYER_MESSAGES } from "./towncryerMessages";
import { BOARD_MESSAGES } from "./boardMessages";
import { MINI_WORLD_CHANGES_BY_ID } from "@/lib/defaults/miniWorldChanges";
import { parseTowncryerLog } from "./parseTowncryerLog";

describe("Towncryer catalog", () => {
  it("covers every Mini World Change the board covers", () => {
    const boardIds = new Set(BOARD_MESSAGES.map((m) => m.changeId).filter(Boolean));
    const cryerIds = new Set(TOWNCRYER_MESSAGES.map((m) => m.changeId).filter(Boolean));
    for (const id of boardIds) {
      expect(cryerIds.has(id), `Towncryer shout missing for ${id}`).toBe(true);
    }
  });

  it("only references changes and variants that exist", () => {
    for (const entry of TOWNCRYER_MESSAGES) {
      if (!entry.changeId) continue;
      const def = MINI_WORLD_CHANGES_BY_ID.get(entry.changeId);
      expect(def, `unknown changeId ${entry.changeId}`).toBeDefined();
      if (entry.variantId) {
        expect(
          def!.variants.some((v) => v.id === entry.variantId),
          `${entry.changeId} has no variant "${entry.variantId}"`,
        ).toBe(true);
      }
    }
  });

  it("shares no text with the World Board catalog", () => {
    // The single-paste import relies on the two catalogs never colliding.
    const boardText = new Set(BOARD_MESSAGES.map((m) => m.text));
    for (const entry of TOWNCRYER_MESSAGES) {
      expect(boardText.has(entry.text)).toBe(false);
    }
  });

  it("names the Jungle Camp faction, which the board never does", () => {
    const boardEntry = BOARD_MESSAGES.find((m) => m.changeId === "jungle-camp");
    expect(boardEntry?.variantId).toBeUndefined();

    const shouts = TOWNCRYER_MESSAGES.filter((m) => m.changeId === "jungle-camp");
    expect(shouts.map((s) => s.variantId).sort()).toEqual(["dworcs", "hunters"]);
  });

  it("reads a shout into a signal", () => {
    const result = parseTowncryerLog(
      "Hear ye! Hear ye! In Vengoth, a gate has opened to the spirit ground, where nightmares, banshees and ghouls abound!",
    );
    expect(result.signals[0]).toMatchObject({
      changeId: "spirit-grounds",
      variantId: "vengoth",
      source: "towncryer",
    });
  });

  it("treats the Oriental Trader shout as a merchant hint", () => {
    const result = parseTowncryerLog(
      "Hear ye! Hear ye! What a lucky and beautiful day! Visit Carlin, Ankrahmun, or Liberty Bay. Yasir, the oriental trader might be there. Gather your creature products, for this chance is rare.",
    );
    expect(result.signals).toHaveLength(0);
    expect(result.merchantHints[0]?.merchantId).toBe("yasir");
  });
});
