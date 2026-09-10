import { describe, expect, it } from "vitest";
import { parseGameText } from "./parseGameText";
import { WORLD_BOARD_PREAMBLE } from "./boardMessages";

/**
 * A real World Board reading plus Guide replies, copied from a live world on 2026-08-19.
 * Kept as a regression because it exercises every awkward shape at once: client timestamps,
 * a board line whose variant is named, several whose variants are not, and Guide replies for
 * three different World Changes.
 */
const OBSERVED_LOG = `
19:21:22 A fiery fury gate has opened near one of the major cities somewhere in Tibia.
19:21:22 Poachers have slaughtered nearly all wild animals north of the Green Claw Swamp. But vengeful spirits show up there now!
19:21:22 A sandstorm travels through Darama, leading to isles full of deadly creatures inside a nightmare. Avoid the river near Drefia!
19:21:22 Nomads travel the eternal sands of Ankrahmun's desert. There must be a camp somewhere.
19:21:22 The volcano on Goroma sends its fiery message into the sky. A lot of creatures are flooding the lands together with its lava.
19:21:22 Adventurers have told of a Spirit Gate in the Ghostlands. Fight the restless undead!

19:20:56 Guide Luke: The Askarak are in advantage right now.
19:20:58 Guide Luke: The horse services near Thais and Venore are working normally.
19:21:01 Guide Luke: The strange tower with the servants on Edron is covered in slime.
`;

describe("2026-08-19 live Tibia regression", () => {
  it("reads all six board changes and all three Guide replies", () => {
    const result = parseGameText(OBSERVED_LOG);
    const mini = new Map(result.miniWorldChangeSignals.map((s) => [s.changeId, s]));
    const world = new Map(result.worldChangeSignals.map((s) => [s.changeId, s]));

    // Variants the board's own wording supplies.
    expect(mini.get("poacher-caves")?.variantId).toBe("ghost-wolves");
    expect(mini.get("nightmare-isles")?.variantId).toBe("the-river-near-drefia");
    expect(mini.get("spirit-grounds")?.variantId).toBe("ghostlands");

    // Variants it does not: the gate's city and the nomad camp stay open questions.
    expect(mini.get("fury-gates")).toBeDefined();
    expect(mini.get("fury-gates")?.variantId).toBeNull();
    expect(mini.get("nomads")?.variantId).toBeNull();

    // Fire from the Earth has no variants at all — running is the whole story.
    expect(mini.get("fire-from-the-earth")?.variantId).toBeNull();

    expect(world.get("demon-war")?.stateId).toBe("askarak-advantage");
    expect(world.get("horse-station")?.stateId).toBe("normal");
    expect(world.get("masters-voice")?.stateId).toBe("passable");
  });

  it("reads the six board lines as the whole board, because that is how the board prints", () => {
    const result = parseGameText(OBSERVED_LOG);

    // This log has no opening line, which is normal: that line is the board object's *look*
    // text and does not travel with the messages it writes to the Server Log. What it does
    // have is six board messages, and the only action that puts one there writes all of them.
    expect(result.isCompleteBoardReading).toBe(true);
    expect(result.board.basis).toBe("recognised");
    expect(result.inactiveMiniWorldChangeIds).toContain("hive-outpost");
    expect(result.inactiveMerchantIds).toEqual(["yasir"]);
    // The three Guide replies in the same paste settle World Changes and nothing else.
    expect(result.worldChangeSignals).toHaveLength(3);
  });

  it("says the same thing when the board's own opening line is included", () => {
    const result = parseGameText(
      `19:21:20 You see the world board. ${WORLD_BOARD_PREAMBLE}\n${OBSERVED_LOG}`,
    );

    expect(result.isCompleteBoardReading).toBe(true);
    expect(result.board.basis).toBe("preamble");
    expect(result.inactiveMiniWorldChangeIds).toContain("hive-outpost");
    expect(result.inactiveMiniWorldChangeIds).toContain("warpath");
    expect(result.inactiveMiniWorldChangeIds).toContain("noodles-is-gone");
    expect(result.inactiveMiniWorldChangeIds).not.toContain("fury-gates");
    expect(result.inactiveMerchantIds).toEqual(["yasir"]);
  });
});
