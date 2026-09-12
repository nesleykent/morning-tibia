import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchEventContent } from "./eventContentClient";
import { calendarFixture, OFFICIAL_AUTUMN_EVENTS } from "@/lib/testing/tibiaCalendarFixture";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function stubOfficialCalendar(events = OFFICIAL_AUTUMN_EVENTS) {
  const fetcher = vi.fn(async (input: string) => {
    const url = new URL(input);
    return { ok: true, text: async () => calendarFixture(Number(url.searchParams.get("calendaryear")), Number(url.searchParams.get("calendarmonth")), events) };
  });
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

describe("event source integration", () => {
  it("provides active/upcoming official data to the existing dashboard contract", async () => {
    const fetcher = stubOfficialCalendar();
    const result = await fetchEventContent(new Date("2026-09-12T08:00:00Z"));
    expect(result.activeEvents).toEqual([expect.objectContaining({ title: "Full Moon", scheduledStartAt: "2026-09-12T08:00:00.000Z", endAt: "2026-09-15T08:00:00.000Z", daysRemaining: 3, source: "tibia.com", description: expect.stringContaining("werewolves") })]);
    expect(result.upcomingEvents[0]).toMatchObject({ title: "Colours of Magic", daysUntil: 3, certainty: "confirmed", endAt: "2026-09-23T08:00:00.000Z" });
    expect(result.upcomingEvents.filter((event) => event.title === "Annual Autumn Vintage").map((event) => [event.occurrenceIndex, event.occurrenceCount])).toEqual([[0, 2], [1, 2]]);
    expect(fetcher.mock.calls.every(([input]) => (input as string).startsWith("https://www.tibia.com/news/?subtopic=eventcalendar"))).toBe(true);
  });

  it("transitions an event from upcoming to active exactly at its starting server save", async () => {
    stubOfficialCalendar();
    const before = await fetchEventContent(new Date("2026-09-12T07:59:59.999Z"));
    expect(before.activeEvents).toEqual([]);
    // Still the previous Tibia day until the save, so the countdown reads one save period.
    expect(before.upcomingEvents[0]).toMatchObject({ title: "Full Moon", daysUntil: 1 });

    const at = await fetchEventContent(new Date("2026-09-12T08:00:00.000Z"));
    expect(at.activeEvents.map((event) => event.title)).toEqual(["Full Moon"]);
    // Only October's Full Moon is still ahead; September's has moved out of upcoming.
    expect(at.upcomingEvents.filter((event) => event.title === "Full Moon").map((event) => event.startAt))
      .toEqual(["2026-10-12T08:00:00.000Z"]);
  });

  it("hands over from one event to the next at a single server save", async () => {
    // Full Moon ends and Colours of Magic begins at the same 2026-09-15 save.
    stubOfficialCalendar();
    const before = await fetchEventContent(new Date("2026-09-15T07:59:59.999Z"));
    expect(before.activeEvents.map((event) => event.title)).toEqual(["Full Moon"]);
    expect(before.upcomingEvents[0]).toMatchObject({ title: "Colours of Magic", daysUntil: 1 });

    const at = await fetchEventContent(new Date("2026-09-15T08:00:00.000Z"));
    expect(at.activeEvents.map((event) => event.title)).toEqual(["Colours of Magic"]);
    expect(at.upcomingEvents.filter((event) => event.title === "Full Moon").map((event) => event.startAt))
      .toEqual(["2026-10-12T08:00:00.000Z"]);
  });

  it("publishes every overlapping period running at the same instant", async () => {
    stubOfficialCalendar([
      { title: "Long Seasonal", start: "2026-09-05", end: "2026-09-25" },
      { title: "Short Overlap", start: "2026-09-11", end: "2026-09-13" },
      { title: "Starts Later", start: "2026-09-14", end: "2026-09-18" },
    ]);
    const result = await fetchEventContent(new Date("2026-09-12T12:00:00Z"));
    expect(result.activeEvents.map((event) => event.title).sort()).toEqual(["Long Seasonal", "Short Overlap"]);
    expect(result.upcomingEvents.map((event) => event.title)).toEqual(["Starts Later"]);
  });

  it("falls back to the Tibia client event schedule when the official page is challenged", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (input: string) => {
      if (input.startsWith("https://www.tibia.com/")) return { ok: false, status: 403 };
      return { ok: true, json: async () => ({}) };
    }));
    const result = await fetchEventContent(new Date("2026-11-01T12:00:00Z"));
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("Tibia client event schedule"), expect.stringContaining("HTTP 403"));
    expect(result.activeEvents).toEqual([expect.objectContaining({ title: "Halloween Event", scheduledStartAt: "2026-10-31T09:00:00.000Z", endAt: "2026-11-03T09:00:00.000Z", source: "tibia.com" })]);
    expect(result.upcomingEvents.map((event) => event.title)).toEqual(["Christmas", "New Year", "Tibia Anniversary", "Valentine's Day"]);
    expect(result.upcomingEvents.every((event) => event.source === "tibia.com" && event.certainty === "confirmed")).toBe(true);
  });

  it("falls back when the calendar parses but a relevant period cannot be closed", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    stubOfficialCalendar([{ title: "Clipped", start: "2026-08-01", end: "2026-12-20" }]);
    const result = await fetchEventContent(new Date("2026-11-01T12:00:00Z"));
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("Tibia client event schedule"), expect.stringMatching(/Incomplete/));
    expect(result.activeEvents.map((event) => event.title)).toEqual(["Halloween Event"]);
  });

  it("does not fall back for a genuinely empty official calendar", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    stubOfficialCalendar([]);
    // 2026-10-31 is inside the fallback's Halloween period, so a fallback here would show.
    await expect(fetchEventContent(new Date("2026-11-01T12:00:00Z"))).resolves.toEqual({ activeEvents: [], upcomingEvents: [] });
    expect(warning).not.toHaveBeenCalled();
  });

  it("never contacts a third-party source for event data", async () => {
    const fetcher = stubOfficialCalendar();
    await fetchEventContent(new Date("2026-09-12T12:00:00Z"));
    expect(fetcher.mock.calls.some(([input]) => /fandom|tibiawiki/i.test(input as string))).toBe(false);
  });
});
