import { describe, expect, it } from "vitest";
import { getStoredOfficialCalendar, OFFICIAL_CALENDAR_CAPTURED_AT } from "./officialCalendarStore";
import store from "./officialCalendar.json";
import { getLastServerSave } from "@/lib/utils/serverSave";

const BEFORE_EVERYTHING = new Date("2000-01-01T00:00:00Z");

describe("the committed official calendar capture", () => {
  it("is a well-formed capture with a recorded capture time and coverage", () => {
    expect(OFFICIAL_CALENDAR_CAPTURED_AT).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
    expect(store.source).toBe("tibia.com");
    expect(store.events.length).toBeGreaterThan(0);
    expect(store.coversFrom <= store.coversTo).toBe(true);
  });

  it("anchors every boundary on a real 10:00 Europe/Berlin server save", () => {
    for (const event of getStoredOfficialCalendar(BEFORE_EVERYTHING)) {
      for (const instant of [event.startAt, event.endAt]) {
        // The save at or before the instant is the instant itself only when it is a save.
        expect(getLastServerSave(new Date(instant)).toISOString()).toBe(instant);
      }
      expect(Date.parse(event.endAt)).toBeGreaterThan(Date.parse(event.startAt));
      expect(event.source).toBe("tibia.com");
      expect(event.url).toContain("tibia.com/news/?subtopic=eventcalendar");
    }
  });

  it("is sorted, has unique ids, and keeps repeated titles as separate occurrences", () => {
    const events = getStoredOfficialCalendar(BEFORE_EVERYTHING);
    expect([...events].sort((a, b) => a.startAt.localeCompare(b.startAt) || a.title.localeCompare(b.title))).toEqual(events);
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
    const fullMoons = events.filter((event) => event.title === "Full Moon");
    expect(fullMoons.length).toBeGreaterThan(1);
    expect(new Set(fullMoons.map((event) => event.startAt)).size).toBe(fullMoons.length);
  });

  it("drops periods that have already ended at the reference instant", () => {
    const all = getStoredOfficialCalendar(BEFORE_EVERYTHING);
    const cutoff = all[0]!.endAt;
    // Two events can share an ending save, so count what should survive rather than assume one drop.
    const expected = all.filter((event) => Date.parse(event.endAt) > Date.parse(cutoff));
    const later = getStoredOfficialCalendar(new Date(cutoff));
    expect(later).toEqual(expected);
    expect(later.length).toBeLessThan(all.length);
  });

  it("runs out cleanly rather than reporting stale periods forever", () => {
    const exhausted = getStoredOfficialCalendar(new Date("2030-01-01T00:00:00Z"));
    expect(exhausted).toEqual([]);
  });

  it("still covers the window a build reads today, or the capture needs refreshing", () => {
    // The capture is the app's only working official source while Tibia.com answers
    // unattended requests with a challenge. If this fails, run `npm run calendar:refresh`
    // from a machine that can load the page and commit lib/data/officialCalendar.json.
    expect(Date.parse(store.coversTo)).toBeGreaterThan(Date.parse(store.coversFrom));
    expect(store.events.at(-1)!.endAt > store.events[0]!.startAt).toBe(true);
  });
});
