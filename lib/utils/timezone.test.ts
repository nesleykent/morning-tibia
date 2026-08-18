import { describe, expect, it } from "vitest";
import {
  convertTimeBetweenZones,
  getTimezoneOffsetMinutes,
  shiftTimeByMinutes,
} from "./timezone";

// Fixed reference date: Brazil abolished DST in 2019, so America/Sao_Paulo is a stable
// UTC-3 year-round, making it a reliable anchor for these tests regardless of when they run.
const REFERENCE = new Date("2026-08-18T12:00:00Z");

describe("getTimezoneOffsetMinutes", () => {
  it("reports UTC as zero", () => {
    expect(getTimezoneOffsetMinutes("UTC", REFERENCE)).toBe(0);
  });

  it("reports America/Sao_Paulo as UTC-3", () => {
    expect(getTimezoneOffsetMinutes("America/Sao_Paulo", REFERENCE)).toBe(-180);
  });
});

describe("shiftTimeByMinutes", () => {
  it("shifts forward within the same day", () => {
    expect(shiftTimeByMinutes("12:55", 30)).toBe("13:25");
  });

  it("wraps past midnight and flags the day shift", () => {
    expect(shiftTimeByMinutes("23:30", 90)).toBe("01:00 (+1d)");
  });

  it("wraps before midnight and flags the day shift", () => {
    expect(shiftTimeByMinutes("00:30", -90)).toBe("23:00 (-1d)");
  });

  it("leaves unparseable input unchanged", () => {
    expect(shiftTimeByMinutes("bad", 30)).toBe("bad");
  });
});

describe("convertTimeBetweenZones", () => {
  it("converts a Sao Paulo time to UTC (3 hours ahead)", () => {
    expect(convertTimeBetweenZones("12:55", "America/Sao_Paulo", "UTC", REFERENCE)).toBe("15:55");
  });

  it("round-trips back to the original time", () => {
    const utc = convertTimeBetweenZones("20:00", "America/Sao_Paulo", "UTC", REFERENCE);
    const backToSaoPaulo = convertTimeBetweenZones(utc.replace(" (+1d)", ""), "UTC", "America/Sao_Paulo", REFERENCE);
    expect(backToSaoPaulo).toBe("20:00");
  });
});
