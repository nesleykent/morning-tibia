import { describe, expect, it } from "vitest";
import {
  calendarDayDiff,
  formatCountdownClock,
  formatDuration,
  formatShortDateInZone,
  formatShortDateUTC,
  formatTimeInZone,
} from "./dateFormat";

describe("formatShortDateUTC", () => {
  it("formats DD/MM from UTC calendar fields", () => {
    expect(formatShortDateUTC(new Date("2026-09-01T00:00:00Z"))).toBe("01/09");
    expect(formatShortDateUTC(new Date("2026-01-05T23:00:00Z"))).toBe("05/01");
  });
});

describe("formatShortDateInZone / formatTimeInZone", () => {
  it("formats a UTC instant in a named zone", () => {
    // 2026-08-18T02:00:00Z is 2026-08-17 23:00 in America/Sao_Paulo (UTC-3, no DST).
    const at = new Date("2026-08-18T02:00:00Z");
    expect(formatShortDateInZone(at, "America/Sao_Paulo")).toBe("17/08");
    expect(formatTimeInZone(at, "America/Sao_Paulo")).toBe("23:00");
  });
});

describe("calendarDayDiff", () => {
  const tz = "America/Sao_Paulo";

  it("is zero for the same calendar day", () => {
    const now = new Date("2026-08-18T14:00:00Z");
    const later = new Date("2026-08-18T20:00:00Z");
    expect(calendarDayDiff(now, later, tz)).toBe(0);
  });

  it("is one for the next calendar day", () => {
    const now = new Date("2026-08-18T14:00:00Z");
    const tomorrow = new Date("2026-08-19T14:00:00Z");
    expect(calendarDayDiff(now, tomorrow, tz)).toBe(1);
  });

  it("is three for three calendar days ahead", () => {
    // 2026-08-18T14:00Z = 11:00 local (Aug 18); 2026-08-21T14:00Z = 11:00 local (Aug 21).
    const now = new Date("2026-08-18T14:00:00Z");
    const later = new Date("2026-08-21T14:00:00Z");
    expect(calendarDayDiff(now, later, tz)).toBe(3);
  });
});

describe("formatDuration", () => {
  it("omits the hours unit when zero", () => {
    expect(formatDuration(24)).toBe("24min");
  });

  it("omits the minutes unit when zero", () => {
    expect(formatDuration(180)).toBe("3h");
  });

  it("shows both units when neither is zero", () => {
    expect(formatDuration(204)).toBe("3h 24min");
  });

  it("clamps negative input to zero", () => {
    expect(formatDuration(-5)).toBe("0min");
  });
});

describe("formatCountdownClock", () => {
  it("formats under a day as HH:MM:SS", () => {
    expect(formatCountdownClock(3 * 3600_000 + 24 * 60_000 + 5_000)).toBe("03:24:05");
  });

  it("prefixes days once past 24h", () => {
    expect(formatCountdownClock(2 * 86_400_000 + 3661_000)).toBe("2d 01:01:01");
  });

  it("clamps negative input to zero", () => {
    expect(formatCountdownClock(-5000)).toBe("00:00:00");
  });
});
