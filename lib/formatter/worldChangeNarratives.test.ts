import { describe, expect, it } from "vitest";
import { getWorldChangeNarrative } from "./worldChangeNarratives";
import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";
import type { BriefingLanguage } from "./translations";

const LANGUAGES: BriefingLanguage[] = ["pt", "en", "es", "pl"];

describe("getWorldChangeNarrative", () => {
  it("returns null for an unknown changeId", () => {
    expect(getWorldChangeNarrative("not-a-real-id", "slumbering", "pt")).toBeNull();
  });

  it("returns null for a state the change doesn't have", () => {
    expect(getWorldChangeNarrative("swamp-fever", "burning", "pt")).toBeNull();
  });

  it("switches Demon War's headline by which faction is winning", () => {
    const shaburak = getWorldChangeNarrative("demon-war", "shaburak-advantage", "en");
    const askarak = getWorldChangeNarrative("demon-war", "askarak-advantage", "en");

    expect(shaburak?.headline).toContain("Shaburak");
    expect(askarak?.headline).toContain("Askarak");
    expect(shaburak?.headline).not.toBe(askarak?.headline);
  });

  it("switches Awash's body by whether today's deepling quota was met", () => {
    const met = getWorldChangeNarrative("awash", "drained-quota-met", "en");
    const open = getWorldChangeNarrative("awash", "drained-quota-open", "en");

    expect(met?.body).toMatch(/stay open/);
    expect(open?.body).toMatch(/still need/);
    expect(met?.body).not.toBe(open?.body);
  });

  it("distinguishes Thornfire breaking out from Thornfire being fought back", () => {
    const breakingOut = getWorldChangeNarrative("thornfire", "breaking-out", "en");
    const beingFought = getWorldChangeNarrative("thornfire", "being-fought", "en");

    expect(breakingOut).not.toBeNull();
    expect(beingFought).not.toBeNull();
    expect(breakingOut?.headline).not.toBe(beingFought?.headline);
  });

  it("distinguishes Overhunting dwindling from the deer leaving outright", () => {
    const dwindling = getWorldChangeNarrative("overhunting", "dwindling", "en");
    const leaving = getWorldChangeNarrative("overhunting", "leaving", "en");

    expect(dwindling?.headline).not.toBe(leaving?.headline);
  });

  it("has fully localized text for every documented state of every World Change", () => {
    for (const def of WORLD_CHANGE_DEFINITIONS) {
      for (const state of def.states) {
        for (const language of LANGUAGES) {
          expect(
            getWorldChangeNarrative(def.id, state.id, language),
            `${def.id}/${state.id}/${language}`,
          ).not.toBeNull();
        }
      }
    }
  });
});
