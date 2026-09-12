import { describe, expect, it } from "vitest";
import { mapEventSchedule } from "./eventScheduleMapping";
import { getEventScheduleFallback } from "./eventScheduleFallback";
import shippedSchedule from "./eventschedule.json";

/** Unix seconds for a 10:00 Europe/Berlin server save on the given date. */
function save(dateKey: string, offsetHours: number): number {
  return Date.parse(`${dateKey}T${String(10 - offsetHours).padStart(2, "0")}:00:00Z`) / 1000;
}
const CEST = 2;
const CET = 1;

describe("the Tibia client's eventschedule.json", () => {
  it("maps the shipped file into canonical periods anchored on real server saves", () => {
    const events = mapEventSchedule(shippedSchedule);
    expect(events.map((event) => [event.title, event.startAt, event.endAt])).toEqual([
      ["Halloween Event", "2026-10-31T09:00:00.000Z", "2026-11-03T09:00:00.000Z"],
      ["Christmas", "2026-12-12T09:00:00.000Z", "2026-12-31T09:00:00.000Z"],
      ["New Year", "2026-12-27T09:00:00.000Z", "2027-01-03T09:00:00.000Z"],
      ["Tibia Anniversary", "2027-01-07T09:00:00.000Z", "2027-01-10T09:00:00.000Z"],
      ["Valentine's Day", "2027-02-14T09:00:00.000Z", "2027-02-15T09:00:00.000Z"],
    ]);
    expect(events.every((event) => event.source === "tibia.com")).toBe(true);
    expect(events[0]).toMatchObject({
      id: "tibia-Halloween%20Event-2026-10-31",
      url: "https://www.tibia.com/news/?subtopic=eventcalendar&calendarmonth=10&calendaryear=2026",
      description: expect.stringContaining("Mutated Pumpkin"),
    });
  });

  it("produces the same instants the website parser produces for the same period", () => {
    // Halloween 2026 appears in both sources; the two paths must not disagree by an hour.
    const [halloween] = mapEventSchedule({
      eventlist: [{ name: "Halloween Event", startdate: save("2026-10-31", CET), enddate: save("2026-11-03", CET) }],
    });
    expect(halloween).toMatchObject({ startAt: "2026-10-31T09:00:00.000Z", endAt: "2026-11-03T09:00:00.000Z" });
  });

  it("keeps each side of Berlin's DST transitions on its own offset", () => {
    const events = mapEventSchedule({
      eventlist: [
        { name: "Spring", startdate: save("2026-03-27", CET), enddate: save("2026-03-30", CEST) },
        { name: "Autumn", startdate: save("2026-10-23", CEST), enddate: save("2026-10-26", CET) },
      ],
    });
    expect(events.map((event) => [event.startAt, event.endAt])).toEqual([
      ["2026-03-27T09:00:00.000Z", "2026-03-30T08:00:00.000Z"],
      ["2026-10-23T08:00:00.000Z", "2026-10-26T09:00:00.000Z"],
    ]);
  });

  it("snaps a boundary the file rounded off the save back onto the nearest save", () => {
    const [event] = mapEventSchedule({
      eventlist: [{
        name: "Rounded",
        startdate: Date.parse("2026-09-12T00:00:00Z") / 1000,
        enddate: Date.parse("2026-09-15T22:00:00Z") / 1000,
      }],
    });
    expect(event).toMatchObject({ startAt: "2026-09-12T08:00:00.000Z", endAt: "2026-09-16T08:00:00.000Z" });
  });

  it("skips malformed entries instead of publishing an invented period", () => {
    const events = mapEventSchedule({
      eventlist: [
        { name: "", startdate: save("2026-09-12", CEST), enddate: save("2026-09-15", CEST) },
        { name: "Missing dates" },
        { name: "Milliseconds not seconds", startdate: Date.parse("2026-09-12T08:00:00Z"), enddate: Date.parse("2026-09-15T08:00:00Z") },
        { name: "Zero length", startdate: save("2026-09-12", CEST), enddate: save("2026-09-12", CEST) },
        null,
        { name: "Valid", startdate: save("2026-09-12", CEST), enddate: save("2026-09-15", CEST), description: "  " },
      ],
    });
    expect(events).toEqual([expect.objectContaining({ title: "Valid", description: null })]);
  });

  it("rejects a file whose shape it does not recognise, rather than reporting no events", () => {
    expect(() => mapEventSchedule({})).toThrow(/eventschedule/);
    expect(() => mapEventSchedule(null)).toThrow(/eventschedule/);
    expect(() => mapEventSchedule("<html>Just a moment...</html>")).toThrow(/eventschedule/);
  });

  it("sorts by start and keeps repeated titles as distinct occurrences", () => {
    const events = mapEventSchedule({
      eventlist: [
        { name: "Vintage", startdate: save("2026-10-17", CEST), enddate: save("2026-10-24", CEST) },
        { name: "Vintage", startdate: save("2026-10-01", CEST), enddate: save("2026-10-08", CEST) },
      ],
    });
    expect(events.map((event) => event.startAt)).toEqual(["2026-10-01T08:00:00.000Z", "2026-10-17T08:00:00.000Z"]);
    expect(new Set(events.map((event) => event.id)).size).toBe(2);
  });
});

describe("getEventScheduleFallback", () => {
  it("drops periods that have already ended at the reference instant", () => {
    const before = getEventScheduleFallback(new Date("2026-11-03T08:59:59Z"));
    expect(before[0]!.title).toBe("Halloween Event");
    const atTheEndingSave = getEventScheduleFallback(new Date("2026-11-03T09:00:00Z"));
    expect(atTheEndingSave.map((event) => event.title)).toEqual(["Christmas", "New Year", "Tibia Anniversary", "Valentine's Day"]);
  });

  it("carries a period across the year rollover without losing it", () => {
    const events = getEventScheduleFallback(new Date("2027-01-01T12:00:00Z"));
    expect(events.map((event) => event.title)).toEqual(["New Year", "Tibia Anniversary", "Valentine's Day"]);
    expect(events[0]).toMatchObject({ startAt: "2026-12-27T09:00:00.000Z", endAt: "2027-01-03T09:00:00.000Z" });
  });
});
