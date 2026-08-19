import { describe, expect, it } from "vitest";
import { getWorldChangeNarrative } from "./worldChangeNarratives";
import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";
import type { BriefingLanguage } from "./translations";

const LANGUAGES: BriefingLanguage[] = ["pt", "en", "es", "pl"];

describe("getWorldChangeNarrative", () => {
  it("returns null for an unknown changeId", () => {
    expect(getWorldChangeNarrative("not-a-real-id", "active", "", "pt")).toBeNull();
  });

  it("returns null for a state the change doesn't use (e.g. a stage on a toggle-only change)", () => {
    expect(getWorldChangeNarrative("swamp-fever", "stage1", "", "pt")).toBeNull();
  });

  it("switches Demon War's headline by which faction is winning", () => {
    const shaburak = getWorldChangeNarrative("demon-war", "stage1", "Shaburak advantage", "en");
    const askarak = getWorldChangeNarrative("demon-war", "stage1", "Askarak advantage", "en");
    expect(shaburak?.headline).toContain("Shaburak");
    expect(askarak?.headline).toContain("Askarak");
    expect(shaburak?.headline).not.toBe(askarak?.headline);
  });

  it("switches Awash's stage2 body by whether today's quota was met", () => {
    const met = getWorldChangeNarrative("awash", "stage2", "Drained — today's quota met", "en");
    const notMet = getWorldChangeNarrative("awash", "stage2", "Drained — quota not met yet today", "en");
    expect(met?.body).toMatch(/stay open/);
    expect(notMet?.body).toMatch(/still need/);
  });

  it("switches Thornfire's stage2 narrative between breaking-out and recovering", () => {
    const breakingOut = getWorldChangeNarrative("thornfire", "stage2", "Breaking out", "en");
    const recovering = getWorldChangeNarrative("thornfire", "stage2", "Recovering — fire being fought", "en");
    expect(breakingOut?.headline).toMatch(/slain/);
    expect(recovering?.headline).toMatch(/burns/);
    expect(recovering?.extra?.text).toMatch(/Thornfire Wolf/);
  });

  it("carries a fixed extra fact for Sea Serpent's awake stage", () => {
    const narrative = getWorldChangeNarrative("sea-serpent", "stage2", "", "pt");
    expect(narrative?.extra).toEqual({ emoji: "⚔️", text: "Renegade Quara dominam as regiões submersas de Oramond" });
  });

  it("provides content in all 4 languages for every defined World Change's known states", () => {
    // Every guide-npc World Change should have at least one narrative-bearing state per
    // language — otherwise it'd silently fall back to the compact ✅/❌ line, defeating the
    // point of the narrative section.
    for (const def of WORLD_CHANGE_DEFINITIONS) {
      const states = def.controlType === "toggle" ? (["active", "inactive"] as const) : (["stage1", "stage2", "stage3"] as const);
      const hasAnyNarrative = states.some((state) =>
        LANGUAGES.every((language) => getWorldChangeNarrative(def.id, state, "", language) !== null),
      );
      expect(hasAnyNarrative, `${def.id} should have at least one fully-localized narrative state`).toBe(true);
    }
  });
});
