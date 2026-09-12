import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTibiaCalendarEvents } from "./tibiaCalendarClient";
import { calendarFixture, OFFICIAL_AUTUMN_EVENTS } from "@/lib/testing/tibiaCalendarFixture";

afterEach(() => vi.unstubAllGlobals());

/** Serve the requested month from a fixture calendar, as Tibia.com would. */
function stubCalendar(events = OFFICIAL_AUTUMN_EVENTS) {
  const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    return { ok: true, text: async () => calendarFixture(Number(url.searchParams.get("calendaryear")), Number(url.searchParams.get("calendarmonth")), events), init };
  });
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

function requestedMonths(fetcher: ReturnType<typeof stubCalendar>): string[] {
  return fetcher.mock.calls.map(([input]) => {
    const url = new URL(input as string);
    return `${url.searchParams.get("calendaryear")}-${url.searchParams.get("calendarmonth")}`;
  });
}

describe("official calendar fetching", () => {
  it("requests only the Tibia.com event calendar, with a timeout", async () => {
    const fetcher = vi.fn(async (input: string, init: RequestInit) => {
      const url = new URL(input);
      expect(url.origin).toBe("https://www.tibia.com");
      expect(url.pathname + url.search).toContain("subtopic=eventcalendar");
      expect(init.signal).toBeInstanceOf(AbortSignal);
      return { ok: true, text: async () => calendarFixture(Number(url.searchParams.get("calendaryear")), Number(url.searchParams.get("calendarmonth"))) };
    });
    vi.stubGlobal("fetch", fetcher);
    await expect(fetchTibiaCalendarEvents(new Date("2026-09-12T12:00:00Z"))).resolves.toEqual([]);
    expect(fetcher).toHaveBeenCalledTimes(5);
  });

  it("fetches the adjacent months around the reference month", async () => {
    const fetcher = stubCalendar([]);
    await fetchTibiaCalendarEvents(new Date("2026-09-12T12:00:00Z"));
    expect(requestedMonths(fetcher)).toEqual(["2026-7", "2026-8", "2026-9", "2026-10", "2026-11"]);
  });

  it("crosses the year rollover in both directions", async () => {
    const december = stubCalendar([]);
    await fetchTibiaCalendarEvents(new Date("2026-12-29T12:00:00Z"));
    expect(requestedMonths(december)).toEqual(["2026-10", "2026-11", "2026-12", "2027-1", "2027-2"]);

    vi.unstubAllGlobals();
    const january = stubCalendar([]);
    await fetchTibiaCalendarEvents(new Date("2027-01-05T12:00:00Z"));
    expect(requestedMonths(january)).toEqual(["2026-11", "2026-12", "2027-1", "2027-2", "2027-3"]);
  });

  it("resolves an event that spans the December/January boundary", async () => {
    stubCalendar([{ title: "New Year", start: "2026-12-27", end: "2027-01-03" }]);
    const events = await fetchTibiaCalendarEvents(new Date("2026-12-29T12:00:00Z"));
    expect(events).toEqual([expect.objectContaining({ title: "New Year", startAt: "2026-12-27T09:00:00.000Z", endAt: "2027-01-03T09:00:00.000Z" })]);
  });

  it("keeps complete future periods and discards expired occurrences", async () => {
    stubCalendar();
    const events = await fetchTibiaCalendarEvents(new Date("2026-09-12T07:59:00Z"));
    expect(events).toHaveLength(8);
    expect(events[0]!.title).toBe("Full Moon");
    expect(events[0]!.startAt).toBe("2026-09-12T08:00:00.000Z");
    // Rise of Devovorga and the XP/Skill Event both ended on 2026-09-07.
    expect(events.some((event) => Date.parse(event.endAt) <= Date.parse("2026-09-12T07:59:00Z"))).toBe(false);
  });

  it("reads overlapping periods on the same days as separate events", async () => {
    stubCalendar();
    const events = await fetchTibiaCalendarEvents(new Date("2026-10-13T12:00:00Z"));
    // 2026-10-13 sits inside Orcsoberfest, Full Moon and the second Autumn Vintage window.
    const running = events.filter((event) => event.startAt <= "2026-10-13T12" && event.endAt > "2026-10-13T12");
    expect(running.map((event) => event.title).sort()).toEqual(["Full Moon", "Orcsoberfest"]);
    expect(events.filter((event) => event.title === "Annual Autumn Vintage")).toHaveLength(1);
  });

  it("rejects incomplete relevant periods instead of silently returning no events", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => calendarFixture(2026, 9, [{ title: "Clipped", start: "2026-08-01", end: "2026-09-20" }]) }));
    await expect(fetchTibiaCalendarEvents(new Date("2026-09-12T12:00:00Z"))).rejects.toThrow(/Incomplete/);
  });

  it("rejects clamped pages that do not cover the complete upcoming window", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => calendarFixture(2026, 9) }));
    await expect(fetchTibiaCalendarEvents(new Date("2026-09-30T12:00:00Z"))).rejects.toThrow(/coverage/);
  });

  it("accepts a genuinely empty calendar as a complete answer", async () => {
    stubCalendar([]);
    await expect(fetchTibiaCalendarEvents(new Date("2026-09-12T12:00:00Z"))).resolves.toEqual([]);
  });

  it.each([403, 429, 500])("surfaces HTTP %i without treating it as an empty calendar", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status }));
    await expect(fetchTibiaCalendarEvents(new Date("2026-09-12T12:00:00Z"))).rejects.toThrow(`HTTP ${status}`);
  });

  it("surfaces network timeouts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Timed out", "TimeoutError")));
    await expect(fetchTibiaCalendarEvents(new Date("2026-09-12T12:00:00Z"))).rejects.toThrow("Timed out");
  });

  it("surfaces a bot challenge served with HTTP 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => "<html><h1>Just a moment...</h1></html>" }));
    await expect(fetchTibiaCalendarEvents(new Date("2026-09-12T12:00:00Z"))).rejects.toThrow(/Unrecognized/);
  });
});
