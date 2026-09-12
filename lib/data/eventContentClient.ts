import "server-only";
import { tibiaDayDiff } from "@/lib/utils/date";
import { reconcileEventServerSaveBoundaries, type ReconciledEvents } from "@/lib/events/reconcileEventServerSave";
import { fetchTibiaCalendarEvents } from "./tibiaCalendarClient";
import { getOfficialCalendarSnapshot } from "./tibiaCalendarSnapshot";

/** Fetch official periods; use only the last verified official snapshot if the
 * unattended runner is temporarily challenged by Tibia.com. */
export async function fetchEventContent(referenceDate: Date): Promise<ReconciledEvents> {
  try {
    const events = await fetchTibiaCalendarEvents(referenceDate);
    return reconcileEventServerSaveBoundaries([], events.map((event) => ({
      ...event,
      daysUntil: Math.max(0, tibiaDayDiff(referenceDate, new Date(event.startAt))),
      certainty: "confirmed" as const,
      occurrenceIndex: 0,
      occurrenceCount: 1,
    })), referenceDate, "Europe/Berlin");
  } catch (error) {
    console.warn("[events] Official Tibia calendar unavailable; using verified official snapshot.", error instanceof Error ? error.message : "Unknown fetch error");
    const events = getOfficialCalendarSnapshot(referenceDate);
    return reconcileEventServerSaveBoundaries([], events.map((event) => ({
      ...event,
      daysUntil: Math.max(0, tibiaDayDiff(referenceDate, new Date(event.startAt))),
      certainty: "confirmed" as const,
      occurrenceIndex: 0,
      occurrenceCount: 1,
    })), referenceDate, "Europe/Berlin");
  }
}
