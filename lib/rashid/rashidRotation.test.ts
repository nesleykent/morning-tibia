import { describe, expect, it } from "vitest";
import { getRashidLocation, getRashidRotationCities } from "./rashidRotation";

describe("getRashidLocation", () => {
  it("returns a city for every day of the week", () => {
    // Jan 4 2026 was a Sunday; noon UTC is always past the 10:00 Berlin server save.
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(Date.UTC(2026, 0, 4 + day, 12, 0, 0));
      expect(getRashidRotationCities()).toContain(getRashidLocation(date));
    }
  });

  it("is deterministic for the same weekday", () => {
    const sundayA = new Date(Date.UTC(2026, 0, 4, 12, 0, 0));
    const sundayB = new Date(Date.UTC(2026, 0, 11, 12, 0, 0));
    expect(getRashidLocation(sundayA)).toBe(getRashidLocation(sundayB));
  });

  it("matches the documented Monday city", () => {
    const monday = new Date(Date.UTC(2026, 0, 5, 12, 0, 0));
    expect(getRashidLocation(monday)).toBe("Svargrond");
  });

  it("stays on the previous Tibia day until the 10:00 CET server save, in winter", () => {
    // Berlin is CET (UTC+1) in January, so 10:00 Berlin = 09:00 UTC.
    const justBeforeSave = new Date("2026-01-05T08:59:00Z"); // 09:59 Monday in Berlin
    const justAfterSave = new Date("2026-01-05T09:00:00Z"); // 10:00 Monday in Berlin
    expect(getRashidLocation(justBeforeSave)).toBe("Carlin"); // still "Sunday" in Tibia
    expect(getRashidLocation(justAfterSave)).toBe("Svargrond"); // now "Monday" in Tibia
  });

  it("uses the CEST server-save offset in summer (DST-aware)", () => {
    // Berlin is CEST (UTC+2) in July, so 10:00 Berlin = 08:00 UTC. July 1 2026 is a Wednesday.
    const justBeforeSave = new Date("2026-07-01T07:59:00Z"); // 09:59 Wednesday in Berlin
    const justAfterSave = new Date("2026-07-01T08:00:00Z"); // 10:00 Wednesday in Berlin
    expect(getRashidLocation(justBeforeSave)).toBe("Liberty Bay"); // still "Tuesday" in Tibia
    expect(getRashidLocation(justAfterSave)).toBe("Port Hope"); // now "Wednesday" in Tibia
  });
});
