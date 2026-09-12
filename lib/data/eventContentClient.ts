import "server-only";
import type { OfficialCalendarEvent } from "@/types/event";
import { tibiaDayDiff } from "@/lib/utils/date";
import { reconcileEventServerSaveBoundaries, type ReconciledEvents } from "@/lib/events/reconcileEventServerSave";
import { fetchTibiaCalendarEvents } from "./tibiaCalendarClient";
import { getEventScheduleFallback } from "./eventScheduleFallback";

/** Both sources already speak the canonical period shape, so classification is shared. */
function classify(events: OfficialCalendarEvent[], referenceDate: Date): ReconciledEvents {
  return reconcileEventServerSaveBoundaries([], events.map((event) => ({
    ...event,
    daysUntil: Math.max(0, tibiaDayDiff(referenceDate, new Date(event.startAt))),
    certainty: "confirmed" as const,
    occurrenceIndex: 0,
    occurrenceCount: 1,
  })), referenceDate, "Europe/Berlin");
}

/**
 * Tibia.com's official Event Schedule is the primary and default source, always.
 *
 * The Tibia client's own `eventschedule.json` is used only when that fetch, parse or
 * validation fails — a bot challenge, a changed layout, a grid that could not be read.
 * A calendar that parsed cleanly and contains no events in range is a valid answer and
 * is published as-is; falling back there would replace a true empty list with a stale one.
 */
export async function fetchEventContent(referenceDate: Date): Promise<ReconciledEvents> {
  try {
    return classify(await fetchTibiaCalendarEvents(referenceDate), referenceDate);
  } catch (error) {
    console.warn("[events] Official Tibia calendar unavailable; using the Tibia client event schedule.", error instanceof Error ? error.message : "Unknown fetch error");
    return classify(getEventScheduleFallback(referenceDate), referenceDate);
  }
}
