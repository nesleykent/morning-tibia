import { describe, expect, it } from "vitest";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import { reconcileEventServerSaveBoundaries } from "./reconcileEventServerSave";

function activeEvent(
  title: string,
  scheduledStartAt: string,
): ActiveEvent {
  return {
    id: `active-${title}`,
    title,
    url: null,
    endAt: "2026-08-25T08:00:00.000Z",
    daysRemaining: 5,
    scheduledStartAt,
  };
}

describe("reconcileEventServerSaveBoundaries", () => {
  const officialUpcoming: UpcomingEvent = {
    id: "tibia-full-moon", title: "Full Moon", url: "https://www.tibia.com/news/?subtopic=eventcalendar",
    source: "tibia.com", description: "The moon is full!", startAt: "2026-09-12T08:00:00.000Z", endAt: "2026-09-15T08:00:00.000Z",
    daysUntil: 1, certainty: "confirmed", occurrenceIndex: 0, occurrenceCount: 1,
  };

  it("promotes a build-time upcoming event exactly at its start, preserving metadata", () => {
    const before = reconcileEventServerSaveBoundaries([], [officialUpcoming], new Date("2026-09-12T07:59:59Z"), "Europe/Berlin");
    expect(before.activeEvents).toEqual([]);
    expect(before.upcomingEvents).toHaveLength(1);
    const at = reconcileEventServerSaveBoundaries([], [officialUpcoming], new Date(officialUpcoming.startAt), "Europe/Berlin");
    expect(at.upcomingEvents).toEqual([]);
    expect(at.activeEvents[0]).toMatchObject({ source: "tibia.com", description: "The moon is full!", scheduledStartAt: officialUpcoming.startAt, endAt: officialUpcoming.endAt, daysRemaining: 3 });
  });

  it("expires both upcoming and active snapshots exactly at the ending save", () => {
    const active = reconcileEventServerSaveBoundaries([], [officialUpcoming], new Date(officialUpcoming.startAt), "Europe/Berlin").activeEvents;
    const now = new Date(officialUpcoming.endAt!);
    expect(reconcileEventServerSaveBoundaries(active, [], now, "Europe/Berlin")).toEqual({ activeEvents: [], upcomingEvents: [] });
    expect(reconcileEventServerSaveBoundaries([], [officialUpcoming], now, "Europe/Berlin")).toEqual({ activeEvents: [], upcomingEvents: [] });
  });

  it("does not expire a wiki fallback's approximate zero-day countdown as an exact boundary", () => {
    const now = new Date("2026-09-15T07:00:00Z");
    const event: ActiveEvent = { id: "wiki-moon", title: "Grimvale", url: null, source: "tibiawiki", scheduledStartAt: officialUpcoming.startAt, endAt: now.toISOString(), daysRemaining: 0 };
    expect(reconcileEventServerSaveBoundaries([event], [], now, "Europe/Berlin").activeEvents).toHaveLength(1);
  });

  it("recomputes remaining days and retains full metadata when moving back to upcoming", () => {
    const active = reconcileEventServerSaveBoundaries([], [officialUpcoming], new Date(officialUpcoming.startAt), "Europe/Berlin").activeEvents;
    expect(reconcileEventServerSaveBoundaries(active, [], new Date("2026-09-14T12:00:00Z"), "Europe/Berlin").activeEvents[0]!.daysRemaining).toBe(1);
    expect(reconcileEventServerSaveBoundaries(active, [], new Date("2026-09-11T12:00:00Z"), "Europe/Berlin").upcomingEvents[0]).toMatchObject({ source: "tibia.com", description: officialUpcoming.description, endAt: officialUpcoming.endAt });
  });
  it("moves every prematurely-active event back to upcoming before server save", () => {
    const now = new Date("2026-08-20T01:30:00.000Z");

    const result = reconcileEventServerSaveBoundaries(
      [
        activeEvent(
          "First Generic Event",
          "2026-08-20T08:00:00.000Z",
        ),
        activeEvent(
          "Second Generic Event",
          "2026-08-21T08:00:00.000Z",
        ),
      ],
      [],
      now,
      "America/Sao_Paulo",
    );

    expect(result.activeEvents).toHaveLength(0);

    expect(result.upcomingEvents.map((event) => event.title)).toEqual([
      "First Generic Event",
      "Second Generic Event",
    ]);

    expect(result.upcomingEvents[0]!.daysUntil).toBe(1);
    expect(result.upcomingEvents[1]!.daysUntil).toBe(2);
  });

  it("keeps an event active once its server-save boundary has passed", () => {
    const now = new Date("2026-08-20T08:01:00.000Z");

    const event = activeEvent(
      "Generic Event",
      "2026-08-20T08:00:00.000Z",
    );

    const result = reconcileEventServerSaveBoundaries(
      [event],
      [],
      now,
      "America/Sao_Paulo",
    );

    expect(result.activeEvents).toEqual([event]);
    expect(result.upcomingEvents).toHaveLength(0);
  });

  it("recomputes upcoming countdowns in the selected viewer timezone", () => {
    const now = new Date("2026-08-20T01:30:00.000Z");

    const upcoming: UpcomingEvent = {
      id: "upcoming-generic",
      title: "Generic Upcoming",
      url: null,
      startAt: "2026-08-21T08:00:00.000Z",
      daysUntil: 999,
      certainty: "confirmed",
      occurrenceIndex: 0,
      occurrenceCount: 1,
    };

    const result = reconcileEventServerSaveBoundaries(
      [],
      [upcoming],
      now,
      "America/Sao_Paulo",
    );

    expect(result.upcomingEvents[0]!.daysUntil).toBe(2);
  });
});
