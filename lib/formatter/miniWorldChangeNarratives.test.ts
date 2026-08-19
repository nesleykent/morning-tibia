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

  it("names the specific stage number in a stage-type narrative", () => {
    const stage2 = getMiniWorldChangeNarrative("goroma-volcano", "stage2", "", "en");
    expect(stage2).toMatch(/stage 2/);
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
