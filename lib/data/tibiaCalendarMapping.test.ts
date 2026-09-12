import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { assembleCalendarEvents, parseCalendarMonth } from "./tibiaCalendarMapping";
import { calendarFixture, OFFICIAL_AUTUMN_EVENTS } from "@/lib/testing/tibiaCalendarFixture";

describe("official calendar HTML", () => {
  it("parses the original November 12 cell captured directly from Tibia.com", () => {
    const cell = readFileSync(new URL("./__fixtures__/tibia-calendar-2026-11-12.html", import.meta.url), "utf8").trim();
    const html = calendarFixture(2026, 11).replace('<td><div><span>12 </span></div></td>', () => cell);
    const day = parseCalendarMonth(html).days.find((entry) => entry.date === "2026-11-12")!;
    expect(day.events).toEqual([
      expect.objectContaining({ title: "Lightbearer", boundary: false, description: expect.stringContaining("Don't let even one go out") }),
      expect.objectContaining({ title: "Full Moon", boundary: true, description: expect.stringContaining("werewolves") }),
    ]);
  });
  it("extracts simultaneous bars and the matching tooltip descriptions", () => {
    const month = parseCalendarMonth(calendarFixture(2026, 9, OFFICIAL_AUTUMN_EVENTS));
    expect(month).toMatchObject({ year: 2026, month: 9 });
    expect(month.days[0]!.date).toBe("2026-08-31");
    expect(month.days.at(-1)!.date).toBe("2026-10-11");
    expect(month.days.find((day) => day.date === "2026-09-15")!.events).toEqual([
      expect.objectContaining({ title: "Full Moon", boundary: true, description: expect.stringContaining("werewolves") }),
      expect.objectContaining({ title: "Colours of Magic", boundary: true, description: expect.stringContaining("coloured powders") }),
    ]);
  });

  it("joins spillover cells without duplicates and keeps distinct repeated occurrences", () => {
    const months = [9, 10, 11].map((month) => parseCalendarMonth(calendarFixture(2026, month, OFFICIAL_AUTUMN_EVENTS)));
    const events = assembleCalendarEvents(months);
    expect(events).toHaveLength(10);
    expect(new Set(events.map((event) => event.id)).size).toBe(10);
    expect(events.filter((event) => event.title === "Annual Autumn Vintage").map((event) => event.startAt)).toEqual(["2026-10-01T08:00:00.000Z", "2026-10-17T08:00:00.000Z"]);
    expect(events.find((event) => event.title === "Halloween Event")).toMatchObject({ startAt: "2026-10-31T09:00:00.000Z", endAt: "2026-11-03T09:00:00.000Z", source: "tibia.com" });
    expect(assembleCalendarEvents([...months].reverse())).toEqual(events);
  });

  it("does not invent dates from a clipped first or last cell", () => {
    const html = calendarFixture(2026, 9, [
      { title: "Clipped start", start: "2026-08-01", end: "2026-09-05" },
      { title: "Clipped end", start: "2026-09-29", end: "2026-10-30" },
    ]);
    expect(assembleCalendarEvents([parseCalendarMonth(html)])).toEqual([]);
  });

  it("keeps adjacent occurrences separate even when there is no empty day between them", () => {
    const events = [
      { title: "Repeated", start: "2026-09-01", end: "2026-09-03" },
      { title: "Repeated", start: "2026-09-04", end: "2026-09-06" },
    ];
    const result = assembleCalendarEvents([parseCalendarMonth(calendarFixture(2026, 9, events))]);
    expect(result.map((event) => [event.startAt.slice(0, 10), event.endAt.slice(0, 10)])).toEqual([["2026-09-01", "2026-09-03"], ["2026-09-04", "2026-09-06"]]);
  });

  it("extracts seasonal icon events and closes their cross-month periods", () => {
    const event = { title: "Hot Cuisine Month", start: "2026-08-01", end: "2026-09-01", seasonal: true };
    const months = [8, 9].map((month) => parseCalendarMonth(calendarFixture(2026, month, [event])));
    expect(assembleCalendarEvents(months)).toEqual([expect.objectContaining({ title: event.title, startAt: "2026-08-01T08:00:00.000Z", endAt: "2026-09-01T08:00:00.000Z" })]);
  });

  it.each([
    [3, "2026-03-29", "2026-03-30", "08"],
    [10, "2026-10-25", "2026-10-26", "09"],
  ])("uses Berlin's post-DST offset on the transition date in month %i", (month, start, end, hour) => {
    const events = assembleCalendarEvents([parseCalendarMonth(calendarFixture(2026, Number(month), [{ title: "DST", start: String(start), end: String(end) }]))]);
    expect(events[0]!.startAt).toBe(`${start}T${hour}:00:00.000Z`);
  });

  it("joins a period spanning December and January", () => {
    const event = { title: "New Year", start: "2026-12-28", end: "2027-01-08" };
    const months = [parseCalendarMonth(calendarFixture(2026, 12, [event])), parseCalendarMonth(calendarFixture(2027, 1, [event]))];
    expect(assembleCalendarEvents(months)[0]).toMatchObject({ startAt: "2026-12-28T09:00:00.000Z", endAt: "2027-01-08T09:00:00.000Z" });
  });

  it("decodes nested HTML entities as text without executing tooltip JavaScript", () => {
    const title = "A Pirate's <Party> & Friends";
    const description = 'Gain "XP" & rewards — <script>alert(1)</script> is text.';
    const month = parseCalendarMonth(calendarFixture(2026, 9, [{ title, description, start: "2026-09-01", end: "2026-09-03" }]));
    expect(assembleCalendarEvents([month])[0]).toMatchObject({ title, description });
  });

  it("splits two occurrences that hand over at one server save", () => {
    // A single day carrying two marked bars of one title is an ending save and a
    // starting save, not one continuous period.
    const events = [
      { title: "Handover", start: "2026-09-01", end: "2026-09-05" },
      { title: "Handover", start: "2026-09-05", end: "2026-09-09" },
    ];
    const result = assembleCalendarEvents([parseCalendarMonth(calendarFixture(2026, 9, events))]);
    expect(result.map((event) => [event.startAt, event.endAt])).toEqual([
      ["2026-09-01T08:00:00.000Z", "2026-09-05T08:00:00.000Z"],
      ["2026-09-05T08:00:00.000Z", "2026-09-09T08:00:00.000Z"],
    ]);
  });

  it("anchors both boundaries on the asterisked days, not on the bar's first sighting", () => {
    // The September grid also draws the event's opening days in its August spillover row.
    const event = { title: "Spans August", start: "2026-08-28", end: "2026-09-03" };
    const months = [8, 9].map((month) => parseCalendarMonth(calendarFixture(2026, month, [event])));
    expect(assembleCalendarEvents(months)).toEqual([expect.objectContaining({
      startAt: "2026-08-28T08:00:00.000Z", endAt: "2026-09-03T08:00:00.000Z",
      url: "https://www.tibia.com/news/?subtopic=eventcalendar&calendarmonth=8&calendaryear=2026",
    })]);
    // Reading September alone cannot see the opening marker, so no date is invented.
    expect(assembleCalendarEvents([months[1]!])).toEqual([]);
  });

  it("closes a period that runs from one year into the next", () => {
    const event = { title: "New Year", start: "2026-12-30", end: "2027-01-02" };
    const months = [parseCalendarMonth(calendarFixture(2026, 12, [event])), parseCalendarMonth(calendarFixture(2027, 1, [event]))];
    expect(assembleCalendarEvents(months)).toEqual([expect.objectContaining({
      id: "tibia-New%20Year-2026-12-30", startAt: "2026-12-30T09:00:00.000Z", endAt: "2027-01-02T09:00:00.000Z",
    })]);
  });

  it("distinguishes a valid empty month from a challenge or changed layout", () => {
    expect(assembleCalendarEvents([parseCalendarMonth(calendarFixture(2026, 9))])).toEqual([]);
    expect(() => parseCalendarMonth("<h1>Just a moment...</h1>")).toThrow(/Unrecognized/);
    expect(() => parseCalendarMonth(calendarFixture(2026, 9).replace("<span>31 </span>", "<span>30 </span>"))).toThrow(/day sequence/);
  });
});
