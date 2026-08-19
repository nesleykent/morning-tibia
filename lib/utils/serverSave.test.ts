import { describe, expect, it } from "vitest";
import { getNextServerSave } from "./serverSave";

describe("getNextServerSave", () => {
  it("returns later today when the save hasn't happened yet, in winter (CET)", () => {
    // Berlin is CET (UTC+1) in January, so 10:00 Berlin = 09:00 UTC.
    const justBeforeSave = new Date("2026-01-05T08:00:00Z"); // 09:00 Berlin
    const next = getNextServerSave(justBeforeSave);
    expect(next.toISOString()).toBe("2026-01-05T09:00:00.000Z");
  });

  it("rolls over to tomorrow once today's save has passed", () => {
    const justAfterSave = new Date("2026-01-05T09:00:01Z"); // 10:00:01 Berlin
    const next = getNextServerSave(justAfterSave);
    expect(next.toISOString()).toBe("2026-01-06T09:00:00.000Z");
  });

  it("uses the CEST offset in summer (DST-aware)", () => {
    // Berlin is CEST (UTC+2) in July, so 10:00 Berlin = 08:00 UTC.
    const justBeforeSave = new Date("2026-07-01T07:59:00Z");
    const next = getNextServerSave(justBeforeSave);
    expect(next.toISOString()).toBe("2026-07-01T08:00:00.000Z");
  });

  it("lands exactly on the save instant itself by rolling to tomorrow", () => {
    const atSave = new Date("2026-01-05T09:00:00Z"); // exactly 10:00 Berlin
    const next = getNextServerSave(atSave);
    expect(next.toISOString()).toBe("2026-01-06T09:00:00.000Z");
  });
});
