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
    expect(getMiniWorldChangeNarrative("spirit-grounds", "vengoth", "en")).toContain("Vengoth");
  });

  it("writes the variant's name in the briefing's own language", () => {
    // The bug this replaces: the English variant label was interpolated straight into the
    // Portuguese sentence and lower-cased, giving "acessíveis por darama's northernmost coast".
    const pt = getMiniWorldChangeNarrative("nightmare-isles", "daramas-northernmost-coast", "pt");
    expect(pt).toBe("O portal para as Nightmare Isles está na costa mais ao norte de Darama.");
    expect(pt).not.toMatch(/northernmost/i);

    expect(getMiniWorldChangeNarrative("nomads", "south-of-the-tarpit-tomb", "pt")).toContain(
      "ao sul do Tarpit Tomb",
    );
    expect(getMiniWorldChangeNarrative("warpath", "north-of-carlin", "es")).toContain(
      "al norte de Carlin",
    );
  });

  it("says plainly that the spot is unknown when no source named one", () => {
    // Fury Gates is the clearest case: the board and the Towncryer both confirm a gate is
    // open and neither ever says which of the ten cities it is.
    const pending = getMiniWorldChangeNarrative("fury-gates", null, "en");
    const known = getMiniWorldChangeNarrative("fury-gates", "thais", "en");

    expect(pending).toMatch(/isn't known yet/i);
    expect(known).toContain("Thais");
    expect(pending).not.toBe(known);
  });

  it("distinguishes each Poacher Caves phase by what it means, not by a number", () => {
    const game = getMiniWorldChangeNarrative("poacher-caves", "game", "en");
    const poachers = getMiniWorldChangeNarrative("poacher-caves", "poachers", "en");
    const wolves = getMiniWorldChangeNarrative("poacher-caves", "ghost-wolves", "en");

    expect(game).toMatch(/wild animals dominate/i);
    expect(poachers).toMatch(/poachers are ravaging/i);
    expect(wolves).toMatch(/ghost wolves/i);
    expect(new Set([game, poachers, wolves]).size).toBe(3);
  });

  it("says which faction holds Trapwood, and never guesses when the source didn't say", () => {
    // The boss each faction brings is a state-specific opportunity now, not narration — the
    // narrative's job is the state itself.
    expect(getMiniWorldChangeNarrative("jungle-camp", "hunters", "en")).toMatch(/hunters hold/i);
    expect(getMiniWorldChangeNarrative("jungle-camp", "dworcs", "en")).toMatch(/dworcs hold/i);
    const unknown = getMiniWorldChangeNarrative("jungle-camp", null, "en");
    expect(unknown).toMatch(/doesn't say who's winning/i);
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
          const named = getMiniWorldChangeNarrative(def.id, variant.id, language);
          expect(named, `${def.id}/${variant.id}/${language}`).not.toBeNull();
          // A variant id with no name behind it falls through to the "we don't know which"
          // wording, which would be the app claiming ignorance it does not have. Comparing
          // against the unknown-variant sentence catches exactly that.
          expect(
            named,
            `${def.id}/${variant.id}/${language} fell through to the unknown-variant wording`,
          ).not.toBe(getMiniWorldChangeNarrative(def.id, null, language));
        }
      }
    }
  });
});
