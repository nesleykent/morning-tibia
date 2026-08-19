import { describe, expect, it } from "vitest";
import { getMiniWorldChangeNarrative } from "./miniWorldChangeNarratives";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import type { BriefingLanguage } from "./translations";

const LANGUAGES: BriefingLanguage[] = ["pt", "en", "es", "pl"];

describe("getMiniWorldChangeNarrative", () => {
  it("returns null for an unknown changeId", () => {
    expect(getMiniWorldChangeNarrative("not-a-real-id", "active", "", "pt")).toBeNull();
  });

  it("returns null for a state the change doesn't use", () => {
    expect(getMiniWorldChangeNarrative("fury-gate", "stage1", "", "pt")).toBeNull();
  });

  it("interpolates the parsed location into a location-type narrative", () => {
    const withLocation = getMiniWorldChangeNarrative("spirit-gate", "location", "Vengoth", "en");
    expect(withLocation).toContain("Vengoth");
  });

  it("distinguishes each stage of a genuine stage-type change (Poacher Caves)", () => {
    const stage1 = getMiniWorldChangeNarrative("poacher-caves", "stage1", "", "en");
    const stage3 = getMiniWorldChangeNarrative("poacher-caves", "stage3", "", "en");
    expect(stage1).toMatch(/wild animals dominate/i);
    expect(stage3).toMatch(/vengeful spirits/i);
    expect(stage1).not.toBe(stage3);
  });

  it("resolves a formerly-mismodeled toggle change to a single active narrative, not a stage", () => {
    expect(getMiniWorldChangeNarrative("goroma-volcano", "active", "", "en")).toMatch(/erupting/i);
    expect(getMiniWorldChangeNarrative("goroma-volcano", "stage1", "", "en")).toBeNull();
  });

  it("gives Bibby's Bloodbath and Noodles a distinct 'active, location pending' narrative", () => {
    for (const changeId of ["bibbys-bloodbath", "noodles"]) {
      for (const language of LANGUAGES) {
        const pending = getMiniWorldChangeNarrative(changeId, "active", "", language);
        const known = getMiniWorldChangeNarrative(changeId, "location", "Carlin", language);
        expect(pending, `${changeId}/${language} active narrative`).not.toBeNull();
        expect(known, `${changeId}/${language} location narrative`).not.toBeNull();
        expect(pending).not.toBe(known);
      }
    }
  });

  it("provides content in all 4 languages for every defined Mini World Change's known states", () => {
    const STATES_BY_CONTROL_TYPE = {
      toggle: ["active"],
      stage: ["stage1", "stage2", "stage3"],
      location: ["location"],
      creature: ["creature"],
      boss: ["boss"],
    } as const;

    for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
      const states = STATES_BY_CONTROL_TYPE[def.controlType];
      const hasAnyNarrative = states.some((state) =>
        LANGUAGES.every((language) => getMiniWorldChangeNarrative(def.id, state, "somewhere", language) !== null),
      );
      expect(hasAnyNarrative, `${def.id} should have at least one fully-localized narrative state`).toBe(true);
    }
  });
});
