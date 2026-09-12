import "server-only";
import { calendarDayDiff } from "@/lib/formatter/dateFormat";
import { reconcileEventServerSaveBoundaries, type ReconciledEvents } from "@/lib/events/reconcileEventServerSave";
import { fetchTibiaCalendarEvents } from "./tibiaCalendarClient";
import { fetchActiveEvents, fetchUpcomingEvents } from "./wikiContentClient";

/** Prefer the official source; preserve availability when Tibia challenges the
 * build runner. Never mix partially fetched official periods with wiki estimates. */
export async function fetchEventContent(referenceDate: Date): Promise<ReconciledEvents> {
  try {
    const events = await fetchTibiaCalendarEvents(referenceDate);
    return reconcileEventServerSaveBoundaries([], events.map((event) => ({
      ...event,
      daysUntil: Math.max(0, calendarDayDiff(referenceDate, new Date(event.startAt), "Europe/Berlin")),
      certainty: "confirmed" as const,
      occurrenceIndex: 0,
      occurrenceCount: 1,
    })), referenceDate, "Europe/Berlin");
  } catch (error) {
    console.warn("[events] Official Tibia calendar unavailable; using TibiaWiki fallback.", error instanceof Error ? error.message : "Unknown fetch error");
    const [activeEvents, upcomingEvents] = await Promise.all([
      fetchActiveEvents(referenceDate), fetchUpcomingEvents(referenceDate),
    ]);
    return {
      activeEvents: activeEvents.map((event) => ({ ...event, source: "tibiawiki" })),
      upcomingEvents: upcomingEvents.map((event) => ({ ...event, source: "tibiawiki" })),
    };
  }
}
