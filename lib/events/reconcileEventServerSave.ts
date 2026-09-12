import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import { tibiaDayDiff } from "@/lib/utils/date";

export interface ReconciledEvents {
  activeEvents: ActiveEvent[];
  upcomingEvents: UpcomingEvent[];
}

function utcDateKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Tibia calendar events begin and end at a server save, never at midnight.
 *
 * Classify complete official periods against the current instant: an event is active
 * from its starting save until its ending save, upcoming before that, and gone after.
 * The build bakes one classification in; this runs again in the browser on every render,
 * so a page left open across a 10:00 Berlin save promotes and expires events on time
 * without a rebuild. Events are independent, so any number may overlap.
 *
 * This function contains no event-name and no source exceptions. An event whose start
 * boundary is missing or unparseable is dropped rather than published as a guess.
 */
export function reconcileEventServerSaveBoundaries(
  activeEvents: ActiveEvent[],
  upcomingEvents: UpcomingEvent[],
  now: Date,
  _viewerTimeZone: string,
): ReconciledEvents {
  const correctedActive: ActiveEvent[] = [];

  const correctedUpcoming: UpcomingEvent[] = [];
  for (const event of upcomingEvents) {
    const endAt = event.endAt ? new Date(event.endAt) : null;
    if (endAt && Number.isFinite(endAt.getTime())) {
      if (now.getTime() >= endAt.getTime()) continue;
      if (now.getTime() >= Date.parse(event.startAt)) {
        correctedActive.push({
          id: event.id, title: event.title, url: event.url,
          source: event.source, description: event.description,
          scheduledStartAt: event.startAt, endAt: event.endAt!,
          daysRemaining: Math.max(0, tibiaDayDiff(now, endAt)),
        });
        continue;
      }
    }
    correctedUpcoming.push({
      ...event,
      daysUntil: Math.max(0, tibiaDayDiff(now, new Date(event.startAt))),
    });
  }

  for (const event of activeEvents) {
    // The ending save is an exact instant, so the comparison is exact too.
    if (now.getTime() >= Date.parse(event.endAt)) continue;
    const scheduledStartAt = event.scheduledStartAt
      ? new Date(event.scheduledStartAt)
      : null;

    const hasValidBoundary =
      scheduledStartAt !== null &&
      Number.isFinite(scheduledStartAt.getTime());

    // Fail closed: an active snapshot with no validated starting save cannot be placed
    // in the current Tibia day, and announcing it would be stating an unverified fact.
    if (!hasValidBoundary) continue;

    if (now.getTime() >= scheduledStartAt.getTime()) {
      correctedActive.push({
        ...event,
        daysRemaining: Math.max(0, tibiaDayDiff(now, new Date(event.endAt))),
      });
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
        source: event.source,
        description: event.description,
        endAt: event.endAt,
        startAt,
        daysUntil: Math.max(
          0,
          tibiaDayDiff(now, scheduledStartAt),
        ),
        certainty: "confirmed",
        occurrenceIndex: 0,
        occurrenceCount: 1,
      });
    }
  }

  correctedUpcoming.sort(
    (a, b) =>
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime() ||
      a.title.localeCompare(b.title),
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
