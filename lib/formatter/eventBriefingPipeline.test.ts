import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchEventContent } from "@/lib/data/eventContentClient";
import { reconcileEventServerSaveBoundaries } from "@/lib/events/reconcileEventServerSave";
import { buildBriefingModel, type BriefingInput } from "./briefingModel";
import { generateBriefingMessage, generatePlainTextBriefing } from "./generateBriefing";
import { createDefaultOverrides } from "@/lib/defaults";
import { calendarFixture, OFFICIAL_AUTUMN_EVENTS } from "@/lib/testing/tibiaCalendarFixture";

/**
 * The whole chain, end to end: official calendar HTML, through the build-time fetch that
 * app/page.tsx performs, through the runtime reclassification useBriefingState performs,
 * into the briefing a player actually pastes into guild chat.
 *
 * The unit suites each prove their own link. This proves the links are joined — a period
 * parsed correctly but never reaching the bulletin is the same bug to the reader as one
 * parsed wrong, and only a test that spans both ends can catch it.
 */
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function stubOfficialCalendar(events = OFFICIAL_AUTUMN_EVENTS) {
  vi.stubGlobal("fetch", vi.fn(async (input: string) => {
    const url = new URL(input);
    return { ok: true, text: async () => calendarFixture(Number(url.searchParams.get("calendaryear")), Number(url.searchParams.get("calendarmonth")), events) };
  }));
}

async function briefingAt(now: Date, upcomingEventsWindowDays = 14) {
  const build = await fetchEventContent(now);
  const live = reconcileEventServerSaveBoundaries(build.activeEvents, build.upcomingEvents, now, "America/Sao_Paulo");
  const input: BriefingInput = {
    world: "Ustebra",
    referenceDate: now,
    overrides: createDefaultOverrides("Ustebra", now),
    boostedCreature: { kind: "creature", name: "Gore Horn", imageUrl: null },
    boostedBoss: { kind: "boss", name: "Ratmiral", imageUrl: null },
    warzoneSchedule: null,
    activeEvents: live.activeEvents,
    upcomingEvents: live.upcomingEvents,
    drome: null,
    language: "pt",
    viewerTimeZone: "America/Sao_Paulo",
    upcomingEventsWindowDays,
    marketTrendBasis: "last",
  };
  return { model: buildBriefingModel(input), rich: generateBriefingMessage(input), plain: generatePlainTextBriefing(input) };
}

describe("official calendar to briefing", () => {
  it("prints the running event and the ones still ahead", async () => {
    stubOfficialCalendar();
    const { model, rich, plain } = await briefingAt(new Date("2026-09-12T12:00:00Z"));

    expect(model.activeEventLines.map((line) => line.title)).toEqual(["Full Moon"]);
    expect(model.activeEventLines[0]!.detail).toContain("15/09");
    expect(model.upcomingEventLines.map((line) => line.title)).toEqual(["Colours of Magic"]);

    for (const text of [rich, plain]) {
      expect(text).toContain("Full Moon");
      expect(text).toContain("Colours of Magic");
    }
  });

  it("moves an event from the upcoming list into the headline at its starting save", async () => {
    stubOfficialCalendar();
    const before = await briefingAt(new Date("2026-09-12T07:59:59.999Z"));
    expect(before.model.activeEventLines).toEqual([]);
    expect(before.model.upcomingEventLines.map((line) => line.title)).toContain("Full Moon");

    const after = await briefingAt(new Date("2026-09-12T08:00:00.000Z"));
    expect(after.model.activeEventLines.map((line) => line.title)).toEqual(["Full Moon"]);
    expect(after.model.upcomingEventLines.map((line) => line.title)).not.toContain("Full Moon");
  });

  it("hands the headline over to the next event at a single save", async () => {
    stubOfficialCalendar();
    const { model, plain } = await briefingAt(new Date("2026-09-15T08:00:00.000Z"));
    expect(model.activeEventLines.map((line) => line.title)).toEqual(["Colours of Magic"]);
    expect(plain).not.toContain("Full Moon");
  });

  it("prints every overlapping event running on the same day", async () => {
    stubOfficialCalendar([
      { title: "Rise of Devovorga", start: "2026-09-10", end: "2026-09-16" },
      { title: "Full Moon", start: "2026-09-12", end: "2026-09-15" },
      { title: "Colours of Magic", start: "2026-09-14", end: "2026-09-22" },
    ]);
    const { model, plain } = await briefingAt(new Date("2026-09-12T12:00:00Z"));
    expect(model.activeEventLines.map((line) => line.title).sort()).toEqual(["Full Moon", "Rise of Devovorga"]);
    expect(model.upcomingEventLines.map((line) => line.title)).toEqual(["Colours of Magic"]);
    expect(plain).toContain("Rise of Devovorga");
  });

  it("honours the viewer's upcoming window without losing the count of what it hid", async () => {
    stubOfficialCalendar();
    const narrow = await briefingAt(new Date("2026-09-12T12:00:00Z"), 7);
    expect(narrow.model.upcomingEventLines.map((line) => line.title)).toEqual(["Colours of Magic"]);
    expect(narrow.model.upcomingEventsHiddenCount).toBe(6);
  });

  it("prints the fallback's events when the official page is unreachable", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    const { model, plain } = await briefingAt(new Date("2026-11-01T12:00:00Z"));
    expect(model.activeEventLines.map((line) => line.title)).toEqual(["Halloween Event"]);
    expect(model.activeEventLines[0]!.detail).toContain("03/11");
    expect(plain).toContain("Halloween Event");
  });

  it("says nothing about events when the official calendar genuinely has none", async () => {
    stubOfficialCalendar([]);
    const { model, plain } = await briefingAt(new Date("2026-09-12T12:00:00Z"));
    expect(model.activeEventLines).toEqual([]);
    expect(model.upcomingEventLines).toEqual([]);
    expect(plain).not.toContain("Halloween");
  });
});
