import { describe, expect, it } from "vitest";
import { formatYasirLabel } from "./phrases";

describe("Yasir Oriental Trader gating", () => {
  it("states the confirmed absence in the briefing's own language", () => {
    const expected = {
      pt: "não está comerciando hoje",
      en: "not trading today",
      es: "no está comerciando hoy",
      pl: "dziś nie handluje",
    } as const;

    for (const [language, phrase] of Object.entries(expected)) {
      expect(formatYasirLabel("inactive", "", language as keyof typeof expected)).toBe(phrase);
    }
  });

  it("keeps ABSENT and UNKNOWN visibly different", () => {
    // The whole point of the evidence model, at the one place a reader sees it: "we checked
    // and he is not here" must never read the same as "nobody looked".
    for (const language of ["pt", "en", "es", "pl"] as const) {
      expect(formatYasirLabel("inactive", "", language)).not.toBe(
        formatYasirLabel("not-verified", "", language),
      );
    }
  });

  it("does not expose a stale location while inactive", () => {
    expect(formatYasirLabel("inactive", "Carlin", "pt")).toBe("não está comerciando hoje");
  });
});
