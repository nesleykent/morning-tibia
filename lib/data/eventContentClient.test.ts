import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchEventContent } from "./eventContentClient";
import { calendarFixture, OFFICIAL_AUTUMN_EVENTS } from "@/lib/testing/tibiaCalendarFixture";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("event source integration", () => {
  it("provides active/upcoming official data to the existing dashboard contract", async () => {
    const fetcher = vi.fn(async (input: string) => {
      const url = new URL(input);
      return { ok: true, text: async () => calendarFixture(Number(url.searchParams.get("calendaryear")), Number(url.searchParams.get("calendarmonth")), OFFICIAL_AUTUMN_EVENTS) };
    });
    vi.stubGlobal("fetch", fetcher);
    const result = await fetchEventContent(new Date("2026-09-12T08:00:00Z"));
    expect(result.activeEvents).toEqual([expect.objectContaining({ title: "Full Moon", scheduledStartAt: "2026-09-12T08:00:00.000Z", endAt: "2026-09-15T08:00:00.000Z", daysRemaining: 3, source: "tibia.com", description: expect.stringContaining("werewolves") })]);
    expect(result.upcomingEvents[0]).toMatchObject({ title: "Colours of Magic", daysUntil: 3, certainty: "confirmed", endAt: "2026-09-23T08:00:00.000Z" });
    expect(result.upcomingEvents.filter((event) => event.title === "Annual Autumn Vintage").map((event) => [event.occurrenceIndex, event.occurrenceCount])).toEqual([[0, 2], [1, 2]]);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("logs an official failure and uses only the verified official snapshot", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (input: string) => {
      if (input.startsWith("https://www.tibia.com/")) return { ok: false, status: 403 };
      return { ok: true, json: async () => ({}) };
    }));
    const result = await fetchEventContent(new Date("2026-09-11T12:00:00Z"));
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("verified official snapshot"), expect.stringContaining("HTTP 403"));
    expect(result.activeEvents).toEqual([]);
    expect(result.upcomingEvents[0]).toMatchObject({ title: "Full Moon", source: "tibia.com", startAt: "2026-09-12T08:00:00.000Z" });
    expect(result.upcomingEvents.every((event) => event.source === "tibia.com")).toBe(true);
  });

  it("does not fall back for a genuinely empty official calendar", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => calendarFixture(2026, 9) }));
    await expect(fetchEventContent(new Date("2026-09-12T12:00:00Z"))).resolves.toEqual({ activeEvents: [], upcomingEvents: [] });
    expect(warning).not.toHaveBeenCalled();
  });
});
