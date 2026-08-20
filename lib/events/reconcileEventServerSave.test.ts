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
