import type { OfficialCalendarEvent } from "@/types/event";
import { getLastServerSave, getNextServerSave } from "@/lib/utils/serverSave";
import { calendarMonthUrl } from "./tibiaCalendarMapping";

/**
 * The Tibia client's own `eventschedule.json`, the same schedule CipSoft renders in
 * the game's event calendar. It is the fallback for lib/data/tibiaCalendarClient.ts,
 * used only when the Tibia.com page cannot be fetched, parsed or validated — never
 * to add to, override or second-guess a calendar page that did load.
 *
 * Observed schema (verified against the file in lib/data/eventschedule.json):
 *
 *   { "eventlist": [ { "name", "description", "startdate", "enddate",
 *                      "isseasonal", "displaypriority",
 *                      "colordark", "colorlight" } ],
 *     "lastupdatetimestamp": <unix seconds> }
 *
 * `startdate` and `enddate` are Unix timestamps in **seconds**, and every one of them
 * lands exactly on a 10:00 Europe/Berlin server save — the same instants the website's
 * asterisk markers denote. They are therefore taken as the period's real boundaries
 * rather than re-derived from a calendar day. The presentation-only fields
 * (`colordark`, `colorlight`, `displaypriority`, `isseasonal`) are the client's bar
 * styling and carry no scheduling meaning, so they are read but not mapped.
 */
export interface EventScheduleEntry {
  name: string;
  description?: string | null;
  startdate: number;
  enddate: number;
  isseasonal?: boolean;
  displaypriority?: number;
  colordark?: string;
  colorlight?: string;
}

export interface EventScheduleFile {
  eventlist: EventScheduleEntry[];
  lastupdatetimestamp?: number;
}

const DAY_MS = 86_400_000;
/** Guards against a timestamp in milliseconds, or a placeholder 0, reaching the UI as a date. */
const PLAUSIBLE_RANGE_SECONDS = { min: Date.UTC(2000, 0, 1) / 1000, max: Date.UTC(2100, 0, 1) / 1000 };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function plausibleSeconds(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) &&
    value >= PLAUSIBLE_RANGE_SECONDS.min && value <= PLAUSIBLE_RANGE_SECONDS.max;
}

/**
 * The server save nearest to `instant`. The observed timestamps already sit exactly on
 * one, so this is normally the identity; it exists so a future file that rounded a
 * boundary to midnight still produces a real Tibia boundary instead of a half-day error.
 */
function snapToServerSave(instant: Date): Date {
  const previous = getLastServerSave(instant);
  const next = getNextServerSave(instant);
  return instant.getTime() - previous.getTime() <= next.getTime() - instant.getTime() ? previous : next;
}

function berlinDateKey(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(instant);
}

/**
 * Map the client schedule into the same canonical shape the website parser produces, so
 * every downstream consumer — classification, countdowns, the dashboard — is source-agnostic.
 * Malformed entries are skipped rather than published as an invented period.
 */
export function mapEventSchedule(raw: unknown): OfficialCalendarEvent[] {
  if (!isRecord(raw) || !Array.isArray(raw.eventlist)) {
    throw new Error("Unrecognized eventschedule.json: missing eventlist");
  }
  const events: OfficialCalendarEvent[] = [];
  for (const entry of raw.eventlist) {
    if (!isRecord(entry)) continue;
    const title = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!title) continue;
    if (!plausibleSeconds(entry.startdate) || !plausibleSeconds(entry.enddate)) continue;
    const startAt = snapToServerSave(new Date(entry.startdate * 1000));
    const endAt = snapToServerSave(new Date(entry.enddate * 1000));
    // A period that does not advance is not a period; a zero-length entry would
    // otherwise expire the moment it began.
    if (endAt.getTime() - startAt.getTime() < DAY_MS) continue;
    const startKey = berlinDateKey(startAt);
    const description = typeof entry.description === "string" ? entry.description.trim() : "";
    events.push({
      id: `tibia-${encodeURIComponent(title)}-${startKey}`,
      title,
      description: description || null,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      url: calendarMonthUrl(Number(startKey.slice(0, 4)), Number(startKey.slice(5, 7))),
      source: "tibia.com",
    });
  }
  return events.sort((a, b) => a.startAt.localeCompare(b.startAt) || a.title.localeCompare(b.title));
}
