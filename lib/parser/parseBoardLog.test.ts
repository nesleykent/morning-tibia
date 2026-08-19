import { describe, expect, it } from "vitest";
import { parseBoardLog } from "./parseBoardLog";

const SAMPLE_LOG = `
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
    const result = parseBoardLog(SAMPLE_LOG);
    const furyGate = result.signals.find((s) => s.changeId === "fury-gate");
    expect(furyGate?.state).toBe("active");
  });

  it("extracts a direct signal for the Hive Outpost mini world change", () => {
    const result = parseBoardLog(SAMPLE_LOG);
    const hiveOutpost = result.signals.find((s) => s.changeId === "hive-outpost");
    expect(hiveOutpost?.state).toBe("active");
  });

  it("extracts a location signal with detail when the board pinpoints it", () => {
    const result = parseBoardLog(SAMPLE_LOG);
    const spiritGate = result.signals.find((s) => s.changeId === "spirit-gate");
    expect(spiritGate?.state).toBe("location");
    expect(spiritGate?.detail).toBe("Vengoth");
  });

  it("resolves a simple toggle change to a full state (Chakoya Iceberg has no stages)", () => {
    const result = parseBoardLog(SAMPLE_LOG);
    const iceberg = result.signals.find((s) => s.changeId === "big-iceberg");
    expect(iceberg?.state).toBe("active");
  });

  it("surfaces a note instead of guessing a location it can't determine", () => {
    const result = parseBoardLog(SAMPLE_LOG);
    const bibbys = result.signals.find((s) => s.changeId === "bibbys-bloodbath");
    expect(bibbys?.state).toBeNull();
    expect(bibbys?.note).toMatch(/active/i);
  });

  it("tolerates a message that wraps across two lines", () => {
    const result = parseBoardLog(SAMPLE_LOG);
    expect(result.merchantHints).toHaveLength(1);
    expect(result.merchantHints[0]).toMatchObject({
      merchantId: "yasir",
      candidates: ["Carlin", "Ankrahmun", "Liberty Bay"],
    });
  });

  it("matches Kingsday and ignores unrelated text", () => {
    const result = parseBoardLog(SAMPLE_LOG);
    expect(result.signals.some((s) => s.changeId === "thais-kingsday")).toBe(true);
    // fury-gate, hive-outpost, big-iceberg, spirit-gate, thais-kingsday, bibbys-bloodbath (note-only)
    expect(result.signals).toHaveLength(6);
  });

  it("returns empty results for text with no known messages", () => {
    const result = parseBoardLog("Nothing to see here, just chatting with a friend.");
    expect(result.signals).toHaveLength(0);
    expect(result.merchantHints).toHaveLength(0);
  });
});
