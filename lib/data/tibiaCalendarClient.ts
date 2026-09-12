import "server-only";
import type { OfficialCalendarEvent } from "@/types/event";
import { tibiaDayDiff, toTibiaDayKey } from "@/lib/utils/date";
import { assembleCalendarEvents, calendarMonthUrl, parseCalendarMonth } from "./tibiaCalendarMapping";

/** The furthest ahead any consumer may look: the dashboard's largest upcoming window
 * is 14 days, and a period starting on that last day still needs its own ending marker. */
export const UPCOMING_WINDOW_DAYS = 14;

/** Months fetched around the reference month, as offsets from it.
 *
 * Two months back and two forward. Each page's grid already spills a partial week into
 * its neighbours, but spillover alone cannot close a period: a boundary is only real when
 * the asterisked day is present in a grid, so both ends of every relevant event must fall
 * inside the fetched range. Two trailing months cover the longest events Tibia runs (the
 * multi-week seasonal ones) reaching back before today, and two leading months keep the
 * 14-day upcoming window whole even when it starts on the last day of a month — including
 * across a year rollover, which is why offsets are applied to a UTC date rather than to
 * the month number. */
const MONTH_OFFSETS = [-2, -1, 0, 1, 2];

const DAY_MS = 86_400_000;

/** Build-time only. No persistent cache: each scheduled rebuild reads fresh HTML.
 * Active and upcoming events share this one batch of unique URLs. */
export async function fetchTibiaCalendarEvents(referenceDate: Date): Promise<OfficialCalendarEvent[]> {
  const [year, month] = toTibiaDayKey(referenceDate).split("-").map(Number);
  const months = await Promise.all(MONTH_OFFSETS.map(async (offset) => {
    const date = new Date(Date.UTC(year!, month! - 1 + offset, 1));
    const url = calendarMonthUrl(date.getUTCFullYear(), date.getUTCMonth() + 1);
    const response = await fetch(url, {
      headers: { "User-Agent": "MorningTibia/1.0 (static site build; +https://github.com/nesleykent/morning-tibia)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Tibia calendar HTTP ${response.status}: ${url}`);
    return parseCalendarMonth(await response.text());
  }));
  const events = assembleCalendarEvents(months);

  // Everything below distinguishes "the calendar says nothing is running" — a valid,
  // publishable answer — from "we did not read the calendar properly". Only the latter
  // may reach the caller as a failure, because only the latter warrants the fallback.
  const today = toTibiaDayKey(referenceDate);
  const coveredDates = new Set(months.flatMap((page) => page.days.map((day) => day.date)));
  // Tibia clamps a requested month it will not serve, so the pages returned are not
  // necessarily the pages asked for. Require every day the UI can display, plus one more
  // so a period starting on the last visible day still has room for its ending marker.
  for (let offset = 0; offset <= UPCOMING_WINDOW_DAYS + 1; offset++) {
    const day = new Date(Date.parse(today) + offset * DAY_MS).toISOString().slice(0, 10);
    if (!coveredDates.has(day)) throw new Error(`Incomplete official calendar coverage: ${day}`);
  }
  // A bar drawn on a relevant day whose period could not be closed means the grid was read
  // but not understood. Publishing the rest would silently drop a real event.
  for (const page of months) {
    for (const day of page.days) {
      if (day.date < today || tibiaDayDiff(referenceDate, new Date(`${day.date}T12:00:00Z`)) > UPCOMING_WINDOW_DAYS) continue;
      for (const entry of day.events) {
        if (!events.some((event) => event.title === entry.title && event.startAt.slice(0, 10) <= day.date && event.endAt.slice(0, 10) >= day.date)) {
          throw new Error(`Incomplete official calendar period: ${entry.title} on ${day.date}`);
        }
      }
    }
  }
  return events.filter((event) => Date.parse(event.endAt) > referenceDate.getTime());
}
