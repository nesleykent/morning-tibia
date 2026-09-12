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

  it("keeps an event running up to the instant before its ending save", () => {
    const justBefore = new Date(Date.parse(officialUpcoming.endAt!) - 1);
    const result = reconcileEventServerSaveBoundaries([], [officialUpcoming], justBefore, "Europe/Berlin");
    // Still inside the final Tibia day, so one whole save period remains.
    expect(result.activeEvents).toEqual([expect.objectContaining({ title: "Full Moon", daysRemaining: 1 })]);
    expect(result.upcomingEvents).toEqual([]);
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

  it("recomputes upcoming countdowns in Tibia days", () => {
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

  it("does not label an event tomorrow when it starts after local midnight but before the next save", () => {
    const now = new Date("2026-09-11T22:00:00Z");
    const upcoming: UpcomingEvent = {
      id: "same-tibia-day",
      title: "Same Tibia Day Event",
      url: null,
      startAt: "2026-09-12T01:00:00.000Z",
      daysUntil: 999,
      certainty: "confirmed",
      occurrenceIndex: 0,
      occurrenceCount: 1,
    };

    const result = reconcileEventServerSaveBoundaries([], [upcoming], now, "America/Sao_Paulo");

    expect(result.upcomingEvents[0]!.daysUntil).toBe(0);
  });

  it("fails closed for an active event with no verified starting save", () => {
    const result = reconcileEventServerSaveBoundaries(
      [{
        id: "unbounded-event",
        title: "Event Without A Start Boundary",
        url: null,
        source: "tibia.com",
        endAt: "2026-09-15T08:00:00.000Z",
        daysRemaining: 4,
        scheduledStartAt: null,
      }],
      [],
      new Date("2026-09-11T22:00:00Z"),
      "America/Sao_Paulo",
    );

    expect(result.activeEvents).toEqual([]);
    expect(result.upcomingEvents).toEqual([]);
  });

  it("classifies overlapping periods independently at one instant", () => {
    const period = (title: string, startAt: string, endAt: string): UpcomingEvent => ({
      id: `tibia-${title}`, title, url: null, source: "tibia.com", description: null,
      startAt, endAt, daysUntil: 0, certainty: "confirmed", occurrenceIndex: 0, occurrenceCount: 1,
    });
    const result = reconcileEventServerSaveBoundaries([], [
      period("Ended Yesterday", "2026-09-05T08:00:00.000Z", "2026-09-12T08:00:00.000Z"),
      period("Started Earlier", "2026-09-09T08:00:00.000Z", "2026-09-20T08:00:00.000Z"),
      period("Starts This Save", "2026-09-12T08:00:00.000Z", "2026-09-15T08:00:00.000Z"),
      period("Starts Next Save", "2026-09-13T08:00:00.000Z", "2026-09-14T08:00:00.000Z"),
    ], new Date("2026-09-12T08:00:00.000Z"), "Europe/Berlin");

    expect(result.activeEvents.map((event) => event.title)).toEqual(["Started Earlier", "Starts This Save"]);
    expect(result.upcomingEvents.map((event) => event.title)).toEqual(["Starts Next Save"]);
  });

  it("counts occurrences of one title across a month boundary", () => {
    const occurrence = (index: number, startAt: string, endAt: string): UpcomingEvent => ({
      id: `tibia-vintage-${index}`, title: "Annual Autumn Vintage", url: null, source: "tibia.com",
      description: null, startAt, endAt, daysUntil: 0, certainty: "confirmed",
      occurrenceIndex: 0, occurrenceCount: 1,
    });
    const result = reconcileEventServerSaveBoundaries([], [
      occurrence(1, "2026-10-17T08:00:00.000Z", "2026-10-24T08:00:00.000Z"),
      occurrence(0, "2026-09-28T08:00:00.000Z", "2026-10-05T08:00:00.000Z"),
    ], new Date("2026-09-12T12:00:00Z"), "Europe/Berlin");

    expect(result.upcomingEvents.map((event) => [event.occurrenceIndex, event.occurrenceCount, event.daysUntil]))
      .toEqual([[0, 2, 16], [1, 2, 35]]);
  });
});
