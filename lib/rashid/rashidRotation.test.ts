import { describe, expect, it } from "vitest";
import { getRashidLocation, getRashidRotationCities } from "./rashidRotation";

describe("getRashidLocation", () => {
  it("returns a city for every day of the week", () => {
    for (let day = 0; day < 7; day += 1) {
      // Jan 4 2026 was a Sunday, so Jan 4 + day walks Sun..Sat.
      const date = new Date(2026, 0, 4 + day);
      expect(getRashidRotationCities()).toContain(getRashidLocation(date));
    }
  });

  it("is deterministic for the same weekday", () => {
    const sundayA = new Date(2026, 0, 4);
    const sundayB = new Date(2026, 0, 11);
    expect(getRashidLocation(sundayA)).toBe(getRashidLocation(sundayB));
  });

  it("matches the documented Monday city", () => {
    const monday = new Date(2026, 0, 5);
    expect(getRashidLocation(monday)).toBe("Svargrond");
  });
});
