import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import { calendarDayDiff } from "@/lib/formatter/dateFormat";

export interface ReconciledEvents {
  activeEvents: ActiveEvent[];
  upcomingEvents: UpcomingEvent[];
}

function utcDateKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Tibia calendar events begin at the server save of their official start date.
 *
 * TibiaWiki can move an entry from Upcoming_Events to Active_Events before that
 * server save. Active events carrying a future scheduledStartAt are therefore
 * moved back to upcoming until the real in-game boundary is reached.
 *
 * This function contains no event-name exceptions.
 */
export function reconcileEventServerSaveBoundaries(
  activeEvents: ActiveEvent[],
  upcomingEvents: UpcomingEvent[],
  now: Date,
  viewerTimeZone: string,
): ReconciledEvents {
  const correctedActive: ActiveEvent[] = [];

  const correctedUpcoming: UpcomingEvent[] = upcomingEvents.map((event) => ({
    ...event,
    daysUntil: Math.max(
      0,
      calendarDayDiff(now, new Date(event.startAt), viewerTimeZone),
    ),
  }));

  for (const event of activeEvents) {
    const scheduledStartAt = event.scheduledStartAt
      ? new Date(event.scheduledStartAt)
      : null;

    const hasValidBoundary =
      scheduledStartAt !== null &&
      Number.isFinite(scheduledStartAt.getTime());

    if (
      !hasValidBoundary ||
      now.getTime() >= scheduledStartAt.getTime()
    ) {
      correctedActive.push(event);
      continue;
    }

    const startAt = scheduledStartAt.toISOString();
    const startDateKey = utcDateKey(startAt);

    const alreadyUpcoming = correctedUpcoming.some(
      (upcoming) =>
        upcoming.title === event.title &&
        utcDateKey(upcoming.startAt) === startDateKey,
    );

    if (!alreadyUpcoming) {
      correctedUpcoming.push({
        id: `server-save-${event.id}`,
        title: event.title,
        url: event.url,
        startAt,
        daysUntil: Math.max(
          0,
          calendarDayDiff(now, scheduledStartAt, viewerTimeZone),
        ),
        certainty: "confirmed",
        occurrenceIndex: 0,
        occurrenceCount: 1,
      });
    }
  }

  correctedUpcoming.sort(
    (a, b) =>
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );

  const counts = new Map<string, number>();
  for (const event of correctedUpcoming) {
    counts.set(event.title, (counts.get(event.title) ?? 0) + 1);
  }

  const seen = new Map<string, number>();

  const normalizedUpcoming = correctedUpcoming.map((event) => {
    const occurrenceIndex = seen.get(event.title) ?? 0;
    seen.set(event.title, occurrenceIndex + 1);

    return {
      ...event,
      occurrenceIndex,
      occurrenceCount: counts.get(event.title)!,
    };
  });

  return {
    activeEvents: correctedActive,
    upcomingEvents: normalizedUpcoming,
  };
}
