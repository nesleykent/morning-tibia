import { describe, expect, it } from "vitest";
import { parseGameText } from "./parseGameText";

describe("parseGameText", () => {
  it("detects both a board signal and a guide signal from one combined paste", () => {
    const combined = `
You see the world board.
A fiery fury gate has opened near one of the major cities somewhere in Tibia.

Player: hive
Guide Ferob: The Shaburak have summoned their leaders and dominate the complex.
`;
    const result = parseGameText(combined);

    const furyGate = result.miniWorldChangeSignals.find((s) => s.changeId === "fury-gate");
    expect(furyGate?.state).toBe("active");

    const demonWar = result.worldChangeSignals.find((s) => s.changeId === "demon-war");
    expect(demonWar?.state).toBe("stage2");
  });

  it("still resolves a merchant hint from board text mixed in", () => {
    const combined = `
Oriental ships sighted! A trader for exotic creature products may currently be
  visiting Carlin, Ankrahmun or Liberty Bay.
Guide: The demon war is in a stalemate once again.
`;
    const result = parseGameText(combined);
    expect(result.merchantHints).toHaveLength(1);
    expect(result.merchantHints[0]?.merchantId).toBe("yasir");
    expect(result.worldChangeSignals.find((s) => s.changeId === "demon-war")?.state).toBe("inactive");
  });

  it("returns empty results for text with nothing recognizable", () => {
    const result = parseGameText("Just chatting with a friend about nothing in particular.");
    expect(result.miniWorldChangeSignals).toHaveLength(0);
    expect(result.worldChangeSignals).toHaveLength(0);
    expect(result.merchantHints).toHaveLength(0);
    expect(result.isCompleteSnapshot).toBe(false);
  });

  it("passes the board's complete-snapshot detection through, but never applies it to World Changes", () => {
    const combined = `
You see the world board.
This board will notify you of currently active mini world changes all over Tibia.
A fiery fury gate has opened near one of the major cities somewhere in Tibia.

Player: hive
Guide Ferob: The hive is well defended and prepared for war. 12 actions have been taken against the Hive Born. 200 actions are necessary to advance further into the hive.
`;
    const result = parseGameText(combined);
    expect(result.isCompleteSnapshot).toBe(true);
    // Every other Mini World Change gets synthesized inactive from the complete board reading...
    expect(result.miniWorldChangeSignals.find((s) => s.changeId === "goroma-volcano")?.state).toBe("inactive");
    // ...but the Guide NPC side (a per-keyword query, not a board listing) is untouched:
    // only hive-born is present, nothing else is synthesized as inactive.
    expect(result.worldChangeSignals).toHaveLength(1);
    expect(result.worldChangeSignals[0]?.changeId).toBe("hive-born");
  });
});
