import "server-only";
import type { OfficialCalendarEvent } from "@/types/event";
import { tibiaDayDiff } from "@/lib/utils/date";
import { reconcileEventServerSaveBoundaries, type ReconciledEvents } from "@/lib/events/reconcileEventServerSave";
import { fetchTibiaCalendarEvents } from "./tibiaCalendarClient";
import { getStoredOfficialCalendar, OFFICIAL_CALENDAR_CAPTURED_AT } from "./officialCalendarStore";
import { getEventScheduleFallback } from "./eventScheduleFallback";

/** Every source already speaks the canonical period shape, so classification is shared. */
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
 * Tibia.com's official Event Schedule is the primary and default source, always. Every
 * source below it is CipSoft data too; no third party is ever consulted for events.
 *
 *   1. The live page (lib/data/tibiaCalendarClient.ts).
 *   2. The committed capture of that same page (lib/data/officialCalendar.json), refreshed
 *      by `npm run calendar:refresh`. This tier is not a nicety: the calendar sits behind
 *      a Cloudflare challenge that answers unattended requests with HTTP 403 in CI and
 *      locally alike, so without it the primary source contributes nothing to a real build.
 *   3. The Tibia client's own `eventschedule.json`, which lists the major seasonal events
 *      only, as the last resort when the capture has run out of coverage.
 *
 * A calendar that parsed cleanly and contains no events in range is a valid answer and is
 * published as-is; falling through there would replace a true empty list with a stale one.
 */
export async function fetchEventContent(referenceDate: Date): Promise<ReconciledEvents> {
  try {
    return classify(await fetchTibiaCalendarEvents(referenceDate), referenceDate);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown fetch error";
    const stored = getStoredOfficialCalendar(referenceDate);
    if (stored.length > 0) {
      console.warn(`[events] Live Tibia calendar unavailable (${reason}); using the committed official capture from ${OFFICIAL_CALENDAR_CAPTURED_AT ?? "an unknown date"}. Run \`npm run calendar:refresh\` to update it.`);
      return classify(stored, referenceDate);
    }
    console.warn(`[events] Live Tibia calendar unavailable (${reason}) and the committed official capture has run out of coverage (last taken ${OFFICIAL_CALENDAR_CAPTURED_AT ?? "unknown"}); falling back to the Tibia client event schedule. Run \`npm run calendar:refresh\`.`);
    return classify(getEventScheduleFallback(referenceDate), referenceDate);
  }
}
