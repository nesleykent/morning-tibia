import "server-only";
import type { OfficialCalendarEvent } from "@/types/event";
import { tibiaDayDiff, toTibiaDayKey } from "@/lib/utils/date";
import { assembleCalendarEvents, calendarMonthUrl, parseCalendarMonth } from "./tibiaCalendarMapping";

/** Build-time only, like wikiContentClient. No persistent cache: each scheduled
 * rebuild reads fresh HTML. Active/upcoming share this one batch of unique URLs.
 * Fetch previous/current/next months plus a trailing month to close long events.
 * This covers the UI's largest (14-day) window even at month/year boundaries. */
export async function fetchTibiaCalendarEvents(referenceDate: Date): Promise<OfficialCalendarEvent[]> {
  const [year, month] = toTibiaDayKey(referenceDate).split("-").map(Number);
  const months = await Promise.all([-1, 0, 1, 2].map(async (offset) => {
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
  // A successful HTTP response with clipped periods must not quietly erase an
  // event from the supported 14-day window. Let the caller use its fallback.
  const today = toTibiaDayKey(referenceDate);
  const coveredDates = new Set(months.flatMap((page) => page.days.map((day) => day.date)));
  for (let offset = 0; offset <= 15; offset++) {
    const day = new Date(Date.parse(today) + offset * 86_400_000).toISOString().slice(0, 10);
    if (!coveredDates.has(day)) throw new Error(`Incomplete official calendar coverage: ${day}`);
  }
  for (const page of months) {
    for (const day of page.days) {
      if (day.date < today || tibiaDayDiff(referenceDate, new Date(`${day.date}T12:00:00Z`)) > 14) continue;
      for (const entry of day.events) {
        if (!events.some((event) => event.title === entry.title && event.startAt.slice(0, 10) <= day.date && event.endAt.slice(0, 10) >= day.date)) {
          throw new Error(`Incomplete official calendar period: ${entry.title} on ${day.date}`);
        }
      }
    }
  }
  return events.filter((event) => Date.parse(event.endAt) > referenceDate.getTime());
}
