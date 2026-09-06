import { describe, expect, it } from "vitest";
import { parseGameText } from "./parseGameText";
import { WORLD_BOARD_PREAMBLE } from "./boardMessages";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";

const PREAMBLE = `You see the world board. ${WORLD_BOARD_PREAMBLE}`;

describe("parseGameText", () => {
  it("reads board text and Guide text out of a single paste", () => {
    const result = parseGameText(`
      A whole nest of spiders needs to be exterminated as Mamma Longlegs is on the loose.
      Guide Luke: The demon war is in a stalemate once again.
    `);

    expect(result.miniWorldChangeSignals[0]?.changeId).toBe("spider-nest");
    expect(result.worldChangeSignals[0]).toMatchObject({
      changeId: "demon-war",
      stateId: "stalemate",
    });
  });

  describe("what a partial paste may conclude", () => {
    it("marks nothing inactive without the board preamble", () => {
      const result = parseGameText(
        "A fiery fury gate has opened near one of the major cities somewhere in Tibia.",
      );

      expect(result.isCompleteBoardReading).toBe(false);
      expect(result.inactiveMiniWorldChangeIds).toEqual([]);
      expect(result.inactiveMerchantIds).toEqual([]);
      expect(result.miniWorldChangeSignals).toHaveLength(1);
    });

    it("marks nothing inactive from a Guide log, however long", () => {
      const result = parseGameText(`
        Guide Luke: Horestis near Ankrahmun is slumbering in his tomb.
        Guide Luke: The great lake near Port Hope is clean.
        Guide Luke: The demon war is in a stalemate once again.
      `);

      expect(result.isCompleteBoardReading).toBe(false);
      expect(result.inactiveMiniWorldChangeIds).toEqual([]);
      expect(result.inactiveMerchantIds).toEqual([]);
    });

    it("marks nothing inactive from Towncryer shouts alone", () => {
      const result = parseGameText(
        "Towncryer: Hear ye! Hear ye! Bibby is back with blood as her track! Wreaking havoc on her path, let her feel your wrath!",
      );

      expect(result.isCompleteBoardReading).toBe(false);
      expect(result.inactiveMiniWorldChangeIds).toEqual([]);
      expect(result.miniWorldChangeSignals[0]).toMatchObject({
        changeId: "warpath",
        source: "towncryer",
      });
    });
  });

  describe("what a complete board reading may conclude", () => {
    it("marks every unlisted change as not running", () => {
      const result = parseGameText(`
        ${PREAMBLE}
        A whole nest of spiders needs to be exterminated as Mamma Longlegs is on the loose.
      `);

      expect(result.isCompleteBoardReading).toBe(true);
      expect(result.miniWorldChangeSignals.map((s) => s.changeId)).toEqual(["spider-nest"]);
      expect(result.inactiveMiniWorldChangeIds).toHaveLength(
        MINI_WORLD_CHANGE_DEFINITIONS.length - 1,
      );
      expect(result.inactiveMiniWorldChangeIds).not.toContain("spider-nest");
      expect(result.inactiveMerchantIds).toEqual(["yasir"]);
    });

    it("an empty board proves everything is quiet today", () => {
      const result = parseGameText(PREAMBLE);

      expect(result.inactiveMiniWorldChangeIds).toHaveLength(MINI_WORLD_CHANGE_DEFINITIONS.length);
      expect(result.inactiveMerchantIds).toEqual(["yasir"]);
    });

    it("does not mark Yasir inactive when the board lists him", () => {
      const result = parseGameText(`
        ${PREAMBLE}
        Oriental ships sighted! A trader for exotic creature products may currently be visiting Carlin, Ankrahmun or Liberty Bay.
      `);

      expect(result.inactiveMerchantIds).toEqual([]);
      expect(result.merchantHints).toHaveLength(1);
    });

    it("a Towncryer shout in the same paste adds a change rather than being cleared by the board", () => {
      // The shout is about something the board didn't list. Since the board is the only
      // exhaustive source, the sensible reading is that they were seen at different times —
      // so the change stays active and is simply excluded from the inactive set.
      const result = parseGameText(`
        ${PREAMBLE}
        Towncryer: Hear ye! Hear ye! Bibby is back with blood as her track! Wreaking havoc on her path, let her feel your wrath!
      `);

      expect(result.miniWorldChangeSignals.map((s) => s.changeId)).toEqual(["warpath"]);
      expect(result.inactiveMiniWorldChangeIds).not.toContain("warpath");
    });
  });

  describe("source separation", () => {
    it("board text never sets a World Change", () => {
      const result = parseGameText(`
        ${PREAMBLE}
        A hive infestation has been sighted south-west of Liberty Bay! An unnerving humming and buzzing is filling the air.
      `);

      // "Hive Outpost" (Mini World Change) and "Hive Born" (World Change) are different
      // mechanics that both say "hive" — the board line must only touch the former.
      expect(result.miniWorldChangeSignals.map((s) => s.changeId)).toEqual(["hive-outpost"]);
      expect(result.worldChangeSignals).toHaveLength(0);
    });

    it("Guide text never sets a Mini World Change", () => {
      const result = parseGameText(
        "Guide Luke: The hive is well defended and prepared for war.",
      );

      expect(result.worldChangeSignals.map((s) => s.changeId)).toEqual(["hive-born"]);
      expect(result.miniWorldChangeSignals).toHaveLength(0);
    });
  });

  describe("the Towncryer fills in what the board cannot", () => {
    it("learns the Jungle Camp faction from a shout the board can't provide", () => {
      const board = parseGameText(
        "Strange sounds echo through Trapwood as hunters and dworcs fight over the holy grounds and the game that roams there.",
      );
      expect(board.miniWorldChangeSignals[0]?.variantId).toBeNull();

      const withShout = parseGameText(`
        Strange sounds echo through Trapwood as hunters and dworcs fight over the holy grounds and the game that roams there.
        Towncryer: Beware of Tiquanda's dworcs, you all! In their voodoo circle, heads will fall!
      `);
      expect(withShout.miniWorldChangeSignals).toHaveLength(1);
      expect(withShout.miniWorldChangeSignals[0]).toMatchObject({
        changeId: "jungle-camp",
        variantId: "dworcs",
      });
    });
  });

  it("reports an empty result for unrelated text instead of changing anything", () => {
    const result = parseGameText("hey, are you coming to the raid tonight?");

    expect(result.isEmpty).toBe(true);
    expect(result.miniWorldChangeSignals).toHaveLength(0);
    expect(result.worldChangeSignals).toHaveLength(0);
    expect(result.inactiveMiniWorldChangeIds).toEqual([]);
  });
});
