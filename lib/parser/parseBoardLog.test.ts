import { describe, expect, it } from "vitest";
import { parseBoardLog } from "./parseBoardLog";
import { WORLD_BOARD_PREAMBLE } from "./boardMessages";

const PREAMBLE = `You see the world board. ${WORLD_BOARD_PREAMBLE}`;

describe("parseBoardLog", () => {
  it("reads an active change out of a board line", () => {
    const result = parseBoardLog(
      "A fiery fury gate has opened near one of the major cities somewhere in Tibia.",
    );

    expect(result.signals).toHaveLength(1);
    expect(result.signals[0]).toMatchObject({
      changeId: "fury-gates",
      variantId: null,
      source: "board",
    });
  });

  it("takes the variant from the board's own wording where it names one", () => {
    const result = parseBoardLog(
      "Adventurers have told of a Spirit Gate in the Ghostlands. Fight the restless undead!",
    );

    expect(result.signals[0]).toMatchObject({
      changeId: "spirit-grounds",
      variantId: "ghostlands",
    });
  });

  it("reads the Poacher Caves phase from the board text", () => {
    const result = parseBoardLog(
      "Poachers have slaughtered nearly all wild animals north of the Green Claw Swamp. But vengeful spirits show up there now!",
    );

    expect(result.signals[0]).toMatchObject({
      changeId: "poacher-caves",
      variantId: "ghost-wolves",
    });
  });

  it("leaves the variant open when the board announces a change without naming one", () => {
    // The board says "somewhere in Tibia" for Fury Gates and "a camp somewhere" for Nomads;
    // neither names the spot, and the parser must not invent one.
    const result = parseBoardLog(`
      A fiery fury gate has opened near one of the major cities somewhere in Tibia.
      Nomads travel the eternal sands of Ankrahmun's desert. There must be a camp somewhere.
      Strange sounds echo through Trapwood as hunters and dworcs fight over the holy grounds and the game that roams there.
    `);

    expect(result.signals.map((s) => s.changeId).sort()).toEqual([
      "fury-gates",
      "jungle-camp",
      "nomads",
    ]);
    expect(result.signals.every((s) => s.variantId === null)).toBe(true);
  });

  it("picks up the Oriental Trader as a merchant hint, not a change", () => {
    const result = parseBoardLog(
      "Oriental ships sighted! A trader for exotic creature products may currently be visiting Carlin, Ankrahmun or Liberty Bay.",
    );

    expect(result.signals).toHaveLength(0);
    expect(result.merchantHints[0]).toMatchObject({
      merchantId: "yasir",
      candidates: ["Carlin", "Ankrahmun", "Liberty Bay"],
    });
  });

  it("finds nothing in unrelated text", () => {
    const result = parseBoardLog("Nothing to see here, just chatting with a friend.");

    expect(result.signals).toHaveLength(0);
    expect(result.merchantHints).toHaveLength(0);
    expect(result.isCompleteReading).toBe(false);
  });

  describe("completeness", () => {
    it("treats the board's own preamble as a complete reading", () => {
      expect(parseBoardLog(PREAMBLE).isCompleteReading).toBe(true);
    });

    it("recognises a complete reading with no active changes at all", () => {
      // A perfectly normal board state, and the one case where the preamble is the ONLY
      // thing present. It still proves every change is not running.
      const result = parseBoardLog(PREAMBLE);
      expect(result.isCompleteReading).toBe(true);
      expect(result.signals).toHaveLength(0);
    });

    it("treats a recognised board message as a complete reading on its own", () => {
      // Using the board writes its whole current listing into the Server Log in one action,
      // and the game offers no way to produce a partial one. So a message in the log implies
      // the listing it came from, and the reading can settle absences.
      //
      // This replaced a rule that required the board's opening line, which is the object's
      // *look* text and does not travel with the messages: both real logs kept as fixtures in
      // this repo lack it, so in practice nothing could ever be ruled out.
      const result = parseBoardLog(
        "A fiery fury gate has opened near one of the major cities somewhere in Tibia.",
      );

      expect(result.isCompleteReading).toBe(true);
      expect(result.completenessBasis).toBe("recognised");
    });

    it("treats the Oriental Trader line as a board reading too", () => {
      // It reaches the Server Log by the same action as every other board message.
      const result = parseBoardLog(
        "Oriental ships sighted! A trader for exotic creature products may currently be visiting Carlin, Ankrahmun or Liberty Bay.",
      );

      expect(result.isCompleteReading).toBe(true);
      expect(result.completenessBasis).toBe("recognised");
    });

    it("prefers the preamble as the basis when both are present", () => {
      const result = parseBoardLog(
        `${PREAMBLE}\nA fiery fury gate has opened near one of the major cities somewhere in Tibia.`,
      );
      expect(result.completenessBasis).toBe("preamble");
    });

    it("concludes nothing from text that is not a board reading", () => {
      // A Guide reply answers one keyword; a Towncryer shout announces one change as he walks
      // his route. Neither is a listing, so neither may mark anything absent.
      for (const text of [
        "Guide Luke: The great lake near Port Hope is clean.",
        "Hear ye! Hear ye! It is Kingsday, people, let us celebrate and sing!",
        "just chatting with a friend about the weather",
        "",
      ]) {
        const result = parseBoardLog(text);
        expect(result.isCompleteReading, text).toBe(false);
        expect(result.completenessBasis, text).toBe("none");
      }
    });

    it("counts what it recognised, for the paste receipt", () => {
      const result = parseBoardLog(`
        A fiery fury gate has opened near one of the major cities somewhere in Tibia.
        Oriental ships sighted! A trader for exotic creature products may currently be visiting Carlin, Ankrahmun or Liberty Bay.
      `);
      expect(result.recognisedCount).toBe(2);
    });

    it("survives client timestamps and line wrapping", () => {
      const result = parseBoardLog(`
        19:21:20 You see the world board. ${WORLD_BOARD_PREAMBLE}
        19:21:22 A fiery fury gate has opened near one of the major
        cities somewhere in Tibia.
      `);

      expect(result.isCompleteReading).toBe(true);
      expect(result.signals[0]?.changeId).toBe("fury-gates");
    });
  });
});
