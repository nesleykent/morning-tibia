import type { OfficialCalendarEvent } from "@/types/event";
import eventScheduleFile from "./eventschedule.json";
import { mapEventSchedule } from "./eventScheduleMapping";

/**
 * The official schedule shipped inside the Tibia client, kept with the application as the
 * single fallback for the Tibia.com event calendar (see lib/data/eventContentClient.ts).
 * It replaces the hand-maintained snapshot this file used to hold: both are CipSoft data,
 * but this one is copied verbatim from the client rather than transcribed by hand.
 *
 * Only reached when fetching, parsing or validating the website fails. A calendar page
 * that parsed cleanly and simply has no events in range is a valid answer, not a failure.
 */
const FALLBACK_EVENTS: OfficialCalendarEvent[] = mapEventSchedule(eventScheduleFile);

/** Periods that have not yet ended at `referenceDate`, matching the website client's filter. */
export function getEventScheduleFallback(referenceDate: Date): OfficialCalendarEvent[] {
  return FALLBACK_EVENTS.filter((event) => Date.parse(event.endAt) > referenceDate.getTime());
}
