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
    expect(result.merchantHints[0]?.merchantId).toBe("rashid");
    expect(result.worldChangeSignals.find((s) => s.changeId === "demon-war")?.state).toBe("inactive");
  });

  it("returns empty results for text with nothing recognizable", () => {
    const result = parseGameText("Just chatting with a friend about nothing in particular.");
    expect(result.miniWorldChangeSignals).toHaveLength(0);
    expect(result.worldChangeSignals).toHaveLength(0);
    expect(result.merchantHints).toHaveLength(0);
  });
});
