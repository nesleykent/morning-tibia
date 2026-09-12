import type { OfficialCalendarEvent } from "@/types/event";
import store from "./officialCalendar.json";

/**
 * Events previously read from Tibia.com's official Event Schedule and committed to the
 * repository, so a build can publish official data without re-reading the page.
 *
 * This exists because the live fetch is unreliable by design on CipSoft's side: the
 * calendar sits behind a Cloudflare challenge that answers every unattended request,
 * in CI and locally alike, with HTTP 403. Without a persisted copy the primary source
 * contributes nothing to any real build, and the app shows no events at all.
 *
 * This is not a second source. It is the same source, read earlier and written down:
 * every field here was produced by lib/data/tibiaCalendarMapping.ts from the real page.
 * Refresh it with `npm run calendar:refresh` (see scripts/refreshOfficialCalendar.ts),
 * which overwrites the file only when a fetch actually succeeds, so a challenged run
 * leaves the last good capture in place. Do not hand-edit it.
 */
export interface OfficialCalendarStore {
  capturedAt: string;
  coversFrom: string;
  coversTo: string;
  source: string;
  events: OfficialCalendarEvent[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIsoInstant(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

/** Validate on the way in: a malformed entry is dropped rather than shown as a date. */
function readEvents(raw: unknown): OfficialCalendarEvent[] {
  if (!isRecord(raw) || !Array.isArray(raw.events)) return [];
  const events: OfficialCalendarEvent[] = [];
  for (const entry of raw.events) {
    if (!isRecord(entry)) continue;
    const { id, title, description, startAt, endAt, url } = entry;
    if (typeof id !== "string" || typeof title !== "string" || !title) continue;
    if (!isIsoInstant(startAt) || !isIsoInstant(endAt)) continue;
    if (Date.parse(endAt) <= Date.parse(startAt)) continue;
    events.push({
      id,
      title,
      description: typeof description === "string" && description.trim() ? description : null,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      url: typeof url === "string" && url ? url : "https://www.tibia.com/news/?subtopic=eventcalendar",
      source: "tibia.com",
    });
  }
  return events.sort((a, b) => a.startAt.localeCompare(b.startAt) || a.title.localeCompare(b.title));
}

const STORED_EVENTS = readEvents(store);

/** When the committed capture was taken, for the staleness warning at build time. */
export const OFFICIAL_CALENDAR_CAPTURED_AT: string | null =
  isRecord(store) && isIsoInstant(store.capturedAt) ? store.capturedAt : null;

/** Periods that have not yet ended at `referenceDate`, matching the live client's filter. */
export function getStoredOfficialCalendar(referenceDate: Date): OfficialCalendarEvent[] {
  return STORED_EVENTS.filter((event) => Date.parse(event.endAt) > referenceDate.getTime());
}
