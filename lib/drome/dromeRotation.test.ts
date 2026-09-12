import { describe, expect, it } from "vitest";
import { getDromeRotation } from "./dromeRotation";
import { formatDromeBriefingLine } from "@/lib/formatter/phrases";

describe("fixed Tibiadrome rotation", () => {
  it("matches the official leaderboard observed on September 12, 2026", () => {
    expect(getDromeRotation(new Date("2026-09-12T01:00:00Z"))).toEqual({
      rotationNumber: "#135",
      endsAt: "2026-09-16T08:00:00.000Z",
    });
  });

  it("switches the number and deadline exactly at the Wednesday server save", () => {
    expect(getDromeRotation(new Date("2026-09-16T07:59:59.999Z"))).toEqual({
      rotationNumber: "#135", endsAt: "2026-09-16T08:00:00.000Z",
    });
    expect(getDromeRotation(new Date("2026-09-16T08:00:00.000Z"))).toEqual({
      rotationNumber: "#136", endsAt: "2026-09-30T08:00:00.000Z",
    });
    expect(getDromeRotation(new Date("2026-09-16T08:00:00.001Z"))).toEqual({
      rotationNumber: "#136", endsAt: "2026-09-30T08:00:00.000Z",
    });
  });

  it.each([
    ["2026-03-18T09:00:00Z", "#123", "2026-04-01T08:00:00.000Z", 335],
    ["2026-10-14T08:00:00Z", "#138", "2026-10-28T09:00:00.000Z", 337],
  ])("keeps the deadline at 10:00 Berlin across DST from %s", (start, rotationNumber, endsAt, hours) => {
    const rotation = getDromeRotation(new Date(start))!;
    expect(rotation).toEqual({ rotationNumber, endsAt });
    expect((Date.parse(rotation.endsAt!) - Date.parse(start)) / 3_600_000).toBe(hours);
    const before = getDromeRotation(new Date(Date.parse(endsAt) - 1));
    expect(before).toEqual(rotation);
    expect(getDromeRotation(new Date(endsAt))!.rotationNumber).not.toBe(rotationNumber);
  });

  it.each([
    "2026-03-29T00:59:59Z", "2026-03-29T01:00:00Z", "2026-03-29T08:00:00Z",
  ])("does not change the rotation during the spring clock change at %s", (now) => {
    expect(getDromeRotation(new Date(now))).toEqual({ rotationNumber: "#123", endsAt: "2026-04-01T08:00:00.000Z" });
  });

  it.each([
    "2026-10-25T00:59:59Z", "2026-10-25T01:00:00Z", "2026-10-25T09:00:00Z",
  ])("does not change the rotation during the autumn clock change at %s", (now) => {
    expect(getDromeRotation(new Date(now))).toEqual({ rotationNumber: "#138", endsAt: "2026-10-28T09:00:00.000Z" });
  });

  it("handles year rollover and leap days without a per-year calendar", () => {
    expect(getDromeRotation(new Date("2026-12-31T12:00:00Z"))).toEqual({ rotationNumber: "#143", endsAt: "2027-01-06T09:00:00.000Z" });
    expect(getDromeRotation(new Date("2024-02-29T12:00:00Z"))).toEqual({ rotationNumber: "#69", endsAt: "2024-03-06T09:00:00.000Z" });
  });

  it("produces the same rotation for the same instant expressed in different time zones", () => {
    const expected = getDromeRotation(new Date("2026-09-16T08:00:00Z"));
    for (const instant of ["2026-09-16T10:00:00+02:00", "2026-09-16T05:00:00-03:00", "2026-09-16T17:00:00+09:00"]) {
      expect(getDromeRotation(new Date(instant))).toEqual(expected);
    }
  });

  it("handles the exceptional first rotation and the start of the regular cadence", () => {
    expect(getDromeRotation(new Date("2021-07-12T07:59:59Z"))).toBeNull();
    expect(getDromeRotation(new Date("2021-07-12T08:00:00Z"))).toEqual({ rotationNumber: "#1", endsAt: "2021-07-28T08:00:00.000Z" });
    expect(getDromeRotation(new Date("2021-07-28T07:59:59Z"))!.rotationNumber).toBe("#1");
    expect(getDromeRotation(new Date("2021-07-28T08:00:00Z"))).toEqual({ rotationNumber: "#2", endsAt: "2021-08-11T08:00:00.000Z" });
  });

  it("does not invent a rotation for an invalid clock or the SSR clock placeholder", () => {
    expect(getDromeRotation(new Date(NaN))).toBeNull();
    expect(getDromeRotation(new Date(0))).toBeNull();
  });

  it("feeds the existing briefing formatter with the locally computed number and deadline", () => {
    const now = new Date("2026-09-12T12:00:00Z");
    const rotation = getDromeRotation(now)!;
    const text = formatDromeBriefingLine(rotation.rotationNumber!, rotation.endsAt!, "pt", now, "America/Sao_Paulo");
    expect(text).toContain("#135");
    expect(text).toContain("16/09");
  });
});
