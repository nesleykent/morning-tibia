import { describe, expect, it } from "vitest";
import { parseBoardLog } from "./parseBoardLog";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";

const COMPLETE_SAMPLE_LOG = `
You see the world board.
This board will notify you of currently active mini world changes all over Tibia.
A fiery fury gate has opened near one of the major cities somewhere in Tibia.
A hive infestation has been sighted south-west of Liberty Bay! An unnerving humming and buzzing is filling the air.
A big iceberg has been washed up at the coast north of Port Hope. It seems to be inhabited by strange white furballs.
Adventurers have told of a Spirit Gate in Vengoth. Fight the restless undead!
Oriental ships sighted! A trader for exotic creature products may currently be
  visiting Carlin, Ankrahmun or Liberty Bay.
Hail to the King! It's Kingsday in Thais, join the celebration!
Bibby Bloodbath and her crew are roaming the lands, destroying everything in their path.
Some unrelated line that shouldn't match anything at all.
`;

describe("parseBoardLog", () => {
  it("extracts a direct signal for an unambiguous toggle message", () => {
    const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
    const furyGate = result.signals.find((s) => s.changeId === "fury-gate");
    expect(furyGate?.state).toBe("active");
  });

  it("extracts a direct signal for the Hive Outpost mini world change", () => {
    const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
    const hiveOutpost = result.signals.find((s) => s.changeId === "hive-outpost");
    expect(hiveOutpost?.state).toBe("active");
  });

  it("extracts a location signal with detail when the board pinpoints it", () => {
    const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
    const spiritGate = result.signals.find((s) => s.changeId === "spirit-gate");
    expect(spiritGate?.state).toBe("location");
    expect(spiritGate?.detail).toBe("Vengoth");
  });

  it("resolves a simple toggle change to a full state (Chakoya Iceberg has no stages)", () => {
    const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
    const iceberg = result.signals.find((s) => s.changeId === "big-iceberg");
    expect(iceberg?.state).toBe("active");
  });

  it("marks Bibby's Bloodbath active without guessing a location it can't determine", () => {
    const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
    const bibbys = result.signals.find((s) => s.changeId === "bibbys-bloodbath");
    expect(bibbys?.state).toBe("active");
    expect(bibbys?.detail).toBe("");
  });

  it("tolerates a message that wraps across two lines", () => {
    const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
    expect(result.merchantHints).toHaveLength(1);
    expect(result.merchantHints[0]).toMatchObject({
      merchantId: "yasir",
      candidates: ["Carlin", "Ankrahmun", "Liberty Bay"],
    });
  });

  it("matches Kingsday and ignores unrelated text", () => {
    const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
    expect(result.signals.some((s) => s.changeId === "thais-kingsday")).toBe(true);
  });

  it("returns empty results for text with no known messages", () => {
    const result = parseBoardLog("Nothing to see here, just chatting with a friend.");
    expect(result.signals).toHaveLength(0);
    expect(result.merchantHints).toHaveLength(0);
    expect(result.isCompleteSnapshot).toBe(false);
  });

  describe("complete snapshot detection", () => {
    it("recognizes the board's own fixed preamble as a genuine, complete reading", () => {
      const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
      expect(result.isCompleteSnapshot).toBe(true);
    });

    it("never treats a fragmentary paste (no preamble) as a complete reading", () => {
      const fragment = "A fiery fury gate has opened near one of the major cities somewhere in Tibia.";
      const result = parseBoardLog(fragment);
      expect(result.isCompleteSnapshot).toBe(false);
      // Without the preamble, an unmentioned change must stay absent — never synthesized inactive.
      expect(result.signals.some((s) => s.changeId === "hive-outpost")).toBe(false);
    });

    it("infers every unmentioned Mini World Change as inactive once the reading is complete", () => {
      const result = parseBoardLog(COMPLETE_SAMPLE_LOG);
      // One signal per catalog definition: the ones the board text mentions, plus a
      // synthesized "inactive" for every one it doesn't.
      expect(result.signals).toHaveLength(MINI_WORLD_CHANGE_DEFINITIONS.length);
      const hiveOutpostOnly = result.signals.filter((s) => s.changeId === "hive-outpost");
      expect(hiveOutpostOnly).toHaveLength(1);
      const goroma = result.signals.find((s) => s.changeId === "goroma-volcano");
      expect(goroma?.state).toBe("inactive");
      const noodles = result.signals.find((s) => s.changeId === "noodles");
      expect(noodles?.state).toBe("inactive");
    });

    it("marks Yasir inactive when the Oriental Trader message is absent from a complete reading", () => {
      const withoutYasir = COMPLETE_SAMPLE_LOG.replace(
        /Oriental ships sighted![\s\S]*?visiting Carlin, Ankrahmun or Liberty Bay\.\n/,
        "",
      );
      const result = parseBoardLog(withoutYasir);
      expect(result.isCompleteSnapshot).toBe(true);
      expect(result.merchantHints).toHaveLength(0);
      expect(result.inactiveMerchantIds).toEqual(["yasir"]);
    });

    it("never marks Yasir inactive from a fragmentary reading", () => {
      const result = parseBoardLog("Hail to the King! It's Kingsday in Thais, join the celebration!");
      expect(result.isCompleteSnapshot).toBe(false);
      expect(result.inactiveMerchantIds).toEqual([]);
    });
  });
});
