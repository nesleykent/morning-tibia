import { describe, expect, it } from "vitest";
import { getMiniWorldChangeNarrative } from "./miniWorldChangeNarratives";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import type { BriefingLanguage } from "./translations";

const LANGUAGES: BriefingLanguage[] = ["pt", "en", "es", "pl"];

describe("getMiniWorldChangeNarrative", () => {
  it("returns null for an unknown changeId", () => {
    expect(getMiniWorldChangeNarrative("not-a-real-id", null, "pt")).toBeNull();
  });

  it("names the location when a source supplied one", () => {
    expect(getMiniWorldChangeNarrative("spirit-grounds", "Vengoth", "en")).toContain("Vengoth");
  });

  it("says plainly that the spot is unknown when no source named one", () => {
    // Fury Gates is the clearest case: the board and the Towncryer both confirm a gate is
    // open and neither ever says which of the ten cities it is.
    const pending = getMiniWorldChangeNarrative("fury-gates", null, "en");
    const known = getMiniWorldChangeNarrative("fury-gates", "Thais", "en");

    expect(pending).toMatch(/isn't known yet/i);
    expect(known).toContain("Thais");
    expect(pending).not.toBe(known);
  });

  it("distinguishes each Poacher Caves phase by what it means, not by a number", () => {
    const game = getMiniWorldChangeNarrative("poacher-caves", "Wild animals dominate", "en");
    const poachers = getMiniWorldChangeNarrative("poacher-caves", "Poachers dominate", "en");
    const wolves = getMiniWorldChangeNarrative(
      "poacher-caves",
      "Vengeful ghost wolves dominate",
      "en",
    );

    expect(game).toMatch(/wild animals dominate/i);
    expect(poachers).toMatch(/poachers are ravaging/i);
    expect(wolves).toMatch(/ghost wolves/i);
    expect(new Set([game, poachers, wolves]).size).toBe(3);
  });

  it("names the Jungle Camp boss that follows from the winning faction", () => {
    expect(getMiniWorldChangeNarrative("jungle-camp", "Hunters dominate", "en")).toMatch(/Arthom/);
    expect(getMiniWorldChangeNarrative("jungle-camp", "Dworcs dominate", "en")).toMatch(/Oodok/);
    // With no faction known, it must not pick one.
    const unknown = getMiniWorldChangeNarrative("jungle-camp", null, "en");
    expect(unknown).not.toMatch(/Arthom|Oodok/);
  });

  it("never claims to know where Noodles is", () => {
    // The World Board says only that he left the castle; he then wanders the peninsula.
    for (const language of LANGUAGES) {
      const text = getMiniWorldChangeNarrative("noodles-is-gone", null, language);
      expect(text, language).not.toBeNull();
      expect(text).not.toMatch(/Greenshore|Cyclops|Snake Tower/);
    }
  });

  it("has fully localized text for every Mini World Change", () => {
    for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
      for (const language of LANGUAGES) {
        expect(
          getMiniWorldChangeNarrative(def.id, null, language),
          `${def.id}/${language}`,
        ).not.toBeNull();
      }
    }
  });

  it("has localized text for every variant of every change", () => {
    for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
      for (const variant of def.variants) {
        for (const language of LANGUAGES) {
          expect(
            getMiniWorldChangeNarrative(def.id, variant.label, language),
            `${def.id}/${variant.id}/${language}`,
          ).not.toBeNull();
        }
      }
    }
  });
});
