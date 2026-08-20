import { describe, expect, it } from "vitest";
import { formatYasirLabel } from "./phrases";

describe("Yasir Oriental Trader gating", () => {
  it("renders the exact required briefing value when the MWC is inactive", () => {
    for (const language of ["pt", "en", "es", "pl"] as const) {
      expect(formatYasirLabel("inactive", "", language)).toBe("No Sir!");
    }
  });

  it("does not expose a stale location while inactive", () => {
    expect(formatYasirLabel("inactive", "Carlin", "pt")).toBe("No Sir!");
  });
});
