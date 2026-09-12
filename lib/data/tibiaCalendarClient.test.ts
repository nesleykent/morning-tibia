import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTibiaCalendarEvents } from "./tibiaCalendarClient";
import { calendarFixture, OFFICIAL_AUTUMN_EVENTS } from "@/lib/testing/tibiaCalendarFixture";

afterEach(() => vi.unstubAllGlobals());

describe("official calendar fetching", () => {
  it("fetches each required month once and handles the year rollover", async () => {
    const fetcher = vi.fn(async (input: string, init: RequestInit) => {
      const url = new URL(input);
      expect(url.origin).toBe("https://www.tibia.com");
      expect(init.signal).toBeInstanceOf(AbortSignal);
      return { ok: true, text: async () => calendarFixture(Number(url.searchParams.get("calendaryear")), Number(url.searchParams.get("calendarmonth"))) };
    });
    vi.stubGlobal("fetch", fetcher);
    await expect(fetchTibiaCalendarEvents(new Date("2026-12-29T12:00:00Z"))).resolves.toEqual([]);
    expect(fetcher.mock.calls.map(([input]) => { const url = new URL(input); return [url.searchParams.get("calendaryear"), url.searchParams.get("calendarmonth")]; })).toEqual([["2026", "11"], ["2026", "12"], ["2027", "1"], ["2027", "2"]]);
  });

  it("keeps complete future periods and discards expired occurrences", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: string) => {
      const url = new URL(input);
      return { ok: true, text: async () => calendarFixture(Number(url.searchParams.get("calendaryear")), Number(url.searchParams.get("calendarmonth")), OFFICIAL_AUTUMN_EVENTS) };
    }));
    const events = await fetchTibiaCalendarEvents(new Date("2026-09-12T07:59:00Z"));
    expect(events).toHaveLength(8);
    expect(events[0]!.title).toBe("Full Moon");
    expect(events[0]!.startAt).toBe("2026-09-12T08:00:00.000Z");
  });

  it("rejects incomplete relevant periods instead of silently returning no events", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => calendarFixture(2026, 9, [{ title: "Clipped", start: "2026-08-01", end: "2026-09-20" }]) }));
    await expect(fetchTibiaCalendarEvents(new Date("2026-09-12T12:00:00Z"))).rejects.toThrow(/Incomplete/);
  });

  it("rejects clamped pages that do not cover the complete upcoming window", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => calendarFixture(2026, 9) }));
    await expect(fetchTibiaCalendarEvents(new Date("2026-09-30T12:00:00Z"))).rejects.toThrow(/coverage/);
  });

  it.each([403, 429, 500])("surfaces HTTP %i without treating it as an empty calendar", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status }));
    await expect(fetchTibiaCalendarEvents(new Date("2026-09-12T12:00:00Z"))).rejects.toThrow(`HTTP ${status}`);
  });

  it("surfaces network timeouts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Timed out", "TimeoutError")));
    await expect(fetchTibiaCalendarEvents(new Date("2026-09-12T12:00:00Z"))).rejects.toThrow("Timed out");
  });
});
