import { describe, expect, it } from "vitest";
import { getLastServerSave, getNextServerSave } from "./serverSave";
import { addTibiaDays, tibiaDayDiff, toTibiaBriefingDate, toTibiaDayKey } from "./date";
import { createDefaultOverrides } from "@/lib/defaults";
import { storageKeys } from "@/lib/storage/storageKeys";

/**
 * The Tibia day boundary. These cases are the whole point of the change: two moments on the
 * same calendar date must land in different buckets when a server save separates them.
 */
describe("toTibiaDayKey", () => {
  it("keeps the previous day's key until the save happens", () => {
    // 09:59 Berlin on 10 September — the save has not run yet, so this is still the day
    // that began at the 9 September save.
    expect(toTibiaDayKey(new Date("2026-09-10T07:59:00Z"))).toBe("2026-09-09");
  });

  it("advances the key the moment the save runs", () => {
    // 10:00 Berlin (08:00Z in CEST) on the same calendar date.
    expect(toTibiaDayKey(new Date("2026-09-10T08:00:00Z"))).toBe("2026-09-10");
  });

  it("gives one calendar date two different keys across its save", () => {
    const before = toTibiaDayKey(new Date("2026-09-10T07:00:00Z"));
    const after = toTibiaDayKey(new Date("2026-09-10T09:00:00Z"));
    expect(before).not.toBe(after);
  });

  it("does not change at local midnight", () => {
    const lateEvening = toTibiaDayKey(new Date("2026-09-10T21:00:00Z"));
    const afterMidnight = toTibiaDayKey(new Date("2026-09-11T01:00:00Z"));
    expect(lateEvening).toBe(afterMidnight);
  });

  it("stays correct in winter time (CET, save at 09:00Z)", () => {
    expect(toTibiaDayKey(new Date("2026-01-15T08:59:00Z"))).toBe("2026-01-14");
    expect(toTibiaDayKey(new Date("2026-01-15T09:00:00Z"))).toBe("2026-01-15");
  });
});

describe("toTibiaBriefingDate", () => {
  it("keeps the previous briefing date after local midnight until the server save", () => {
    // Midnight in Berlin on 12 September is still the Tibia day started by the 11 September save.
    const beforeSave = new Date("2026-09-11T22:00:00Z");
    expect(toTibiaBriefingDate(beforeSave)).toBe("11/09/2026");
  });

  it("advances the briefing date at the server save", () => {
    const afterSave = new Date("2026-09-12T08:00:00Z");
    expect(toTibiaBriefingDate(afterSave)).toBe("12/09/2026");
  });
});

describe("tibiaDayDiff", () => {
  it("does not call an event tomorrow just because it crosses local midnight", () => {
    const now = new Date("2026-09-11T22:00:00Z");
    const laterThatSameTibiaDay = new Date("2026-09-12T01:00:00Z");

    expect(tibiaDayDiff(now, laterThatSameTibiaDay)).toBe(0);
  });

  it("counts the next server-save period as one Tibia day", () => {
    const now = new Date("2026-09-11T22:00:00Z");
    const nextSave = new Date("2026-09-12T08:00:00Z");

    expect(tibiaDayDiff(now, nextSave)).toBe(1);
  });
});

describe("addTibiaDays", () => {
  it("advances by save periods even when the next period starts tomorrow locally", () => {
    expect(addTibiaDays(new Date("2026-09-11T22:00:00Z"), 1)).toBe("2026-09-12");
  });
});

describe("getLastServerSave", () => {
  it("is at or before now, and never more than a day back", () => {
    const now = new Date("2026-09-10T12:34:56Z");
    const last = getLastServerSave(now);
    expect(last.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(now.getTime() - last.getTime()).toBeLessThan(25 * 60 * 60 * 1000);
  });

  it("is exactly one save-cycle before the next one", () => {
    const now = new Date("2026-09-10T12:34:56Z");
    const gap = getNextServerSave(now).getTime() - getLastServerSave(now).getTime();
    // 24h normally; DST weeks make the pair 23h or 25h apart.
    expect(gap).toBeGreaterThanOrEqual(23 * 60 * 60 * 1000);
    expect(gap).toBeLessThanOrEqual(25 * 60 * 60 * 1000);
  });

  it("returns the save itself when now is exactly on it", () => {
    const save = getNextServerSave(new Date("2026-09-10T00:00:00Z"));
    expect(getLastServerSave(save).getTime()).toBe(save.getTime());
  });
});

/**
 * `setOverrides` writes under `overrides.date` while every reader looks up by the Tibia day
 * key. When those two disagree, saved state is written to one key and searched for at
 * another — silently losing everything the reader recorded. They must be the same function.
 */
describe("storage key agreement", () => {
  it("writes overrides under the same key the readers look them up by", () => {
    // 09:50 Berlin: before the save, so the Tibia day is still the 9th while the local
    // calendar (and the old toDateKey) would say the 10th.
    const beforeSave = new Date("2026-09-10T07:50:00Z");
    const overrides = createDefaultOverrides("Ustebra", beforeSave);

    expect(overrides.date).toBe(toTibiaDayKey(beforeSave));
    expect(storageKeys.overrides(overrides.world, overrides.date)).toBe(
      storageKeys.overrides("Ustebra", toTibiaDayKey(beforeSave)),
    );
    expect(overrides.date).toBe("2026-09-09");
  });

  it("moves to a new key once the save has run", () => {
    const before = createDefaultOverrides("Ustebra", new Date("2026-09-10T07:50:00Z"));
    const after = createDefaultOverrides("Ustebra", new Date("2026-09-10T08:10:00Z"));
    expect(before.date).not.toBe(after.date);
  });
});
