import "server-only";
import { load } from "cheerio";
import type { OfficialCalendarEvent } from "@/types/event";
import { getNextServerSave } from "@/lib/utils/serverSave";

const DAY_MS = 86_400_000;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const TIBIA_CALENDAR_URL = "https://www.tibia.com/news/?subtopic=eventcalendar";

export interface CalendarDayEvent {
  title: string;
  description: string | null;
  boundary: boolean;
  seasonal: boolean;
}

export interface CalendarDay {
  date: string;
  events: CalendarDayEvent[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}

export function calendarMonthUrl(year: number, month: number): string {
  return `${TIBIA_CALENDAR_URL}&calendarmonth=${month}&calendaryear=${year}`;
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Read the tooltip's literal HTML without ever evaluating its JavaScript handler. */
function tooltipEntries(handler: string): { title: string; description: string | null }[] {
  const fragment = handler.match(/<div\b[\s\S]*<\/div>/i)?.[0];
  if (!fragment) return [];
  const $ = load(fragment.replace(/\\(['"\\])/g, "$1"), null, false);
  $("script, style").remove();
  const divs = $.root().children("div").toArray();
  const entries = [];
  for (let index = 0; index + 1 < divs.length; index += 2) {
    const title = cleanText($(divs[index]!).text()).replace(/:$/, "");
    const description = cleanText($(divs[index + 1]!).text()).replace(/^[•\s]+/, "");
    if (title) entries.push({ title, description: description || null });
  }
  return entries;
}

/** The displayed month is authoritative: Tibia may clamp a requested past month. */
export function parseCalendarMonth(html: string): CalendarMonth {
  const $ = load(html);
  const header = cleanText($(".eventscheduleheaderdateblock").text());
  const match = header.match(new RegExp(`(${MONTHS.join("|")})\\s+(\\d{4})`));
  const table = $("#eventscheduletable");
  if (!match || table.length !== 1) throw new Error("Unrecognized Tibia event calendar HTML (possibly a bot challenge)");
  const year = Number(match[2]);
  const month = MONTHS.indexOf(match[1]!) + 1;
  const first = new Date(Date.UTC(year, month - 1, 1));
  const gridStart = first.getTime() - ((first.getUTCDay() + 6) % 7) * DAY_MS;
  const cells = table.find("td").toArray();
  if (cells.length < 28 || cells.length > 42 || cells.length % 7 !== 0) {
    throw new Error("Invalid Tibia event calendar grid");
  }
  const days = cells.map((cell, index): CalendarDay => {
    const date = new Date(gridStart + index * DAY_MS);
    const dayLabel = $(cell).children("div").first().find("span").first().text().trim();
    if (Number(dayLabel) !== date.getUTCDate()) throw new Error("Unexpected Tibia calendar day sequence");
    const events: CalendarDayEvent[] = [];
    $(cell).find(".HelperDivIndicator").each((_, helper) => {
      const entries = tooltipEntries($(helper).attr("onmouseover") ?? "");
      const bars = $(helper).children("div");
      if (bars.length > 0) {
        bars.each((_, bar) => {
          const label = cleanText($(bar).text());
          const title = label.replace(/^\*\s*/, "");
          if (!title) throw new Error("Empty Tibia calendar event title");
          events.push({ title, description: entries.find((entry) => entry.title === title)?.description ?? null, boundary: label.startsWith("*"), seasonal: false });
        });
      } else if ($(helper).find('img[src*="icon-seasonal"]').length > 0) {
        for (const entry of entries) events.push({ ...entry, boundary: false, seasonal: true });
      }
    });
    return { date: date.toISOString().slice(0, 10), events };
  });
  return { year, month, days };
}

function serverSave(dateKey: string): string {
  // 06:00 UTC is before the save but after Berlin's DST transition. Midnight would
  // make getNextServerSave use the pre-transition offset on the two changeover days.
  return getNextServerSave(new Date(`${dateKey}T06:00:00Z`)).toISOString();
}

/** Join overlapping grids before pairing boundaries; a clipped edge is not a date. */
export function assembleCalendarEvents(months: CalendarMonth[]): OfficialCalendarEvent[] {
  const days = new Map<string, CalendarDay>();
  for (const month of months) {
    for (const day of month.days) {
      // Prefer the month's own cells over its neighbours' spillover cells.
      if (!days.has(day.date) || day.date.startsWith(`${month.year}-${String(month.month).padStart(2, "0")}`)) days.set(day.date, day);
    }
  }
  const byTitle = new Map<string, { date: string; event: CalendarDayEvent }[]>();
  for (const day of [...days.values()].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const event of day.events) {
      const key = `${event.seasonal}:${event.title}`;
      const entries = byTitle.get(key) ?? [];
      const previous = entries.at(-1);
      // One bar per day is the rule; the exception is a day carrying two marked bars of
      // the same title, which is one occurrence ending at that save and the next
      // beginning at it. Collapsing those two would fuse both into one long period.
      const sameDayHandover = previous?.date === day.date && previous.event.boundary && event.boundary;
      if (previous?.date !== day.date || sameDayHandover) entries.push({ date: day.date, event });
      byTitle.set(key, entries);
    }
  }
  const result: OfficialCalendarEvent[] = [];
  for (const entries of byTitle.values()) {
    let start = 0;
    for (let index = 0; index < entries.length; index++) {
      const last = entries[index]!;
      const next = entries[index + 1];
      if (next && Date.parse(next.date) - Date.parse(last.date) === DAY_MS &&
          (last.event.seasonal || !last.event.boundary || index === start)) continue;
      const first = entries[start]!;
      // Seasonal icons have no asterisk: require both adjacent empty days as
      // evidence of their boundaries, including the icon on the ending save day.
      const before = new Date(Date.parse(first.date) - DAY_MS).toISOString().slice(0, 10);
      const after = new Date(Date.parse(last.date) + DAY_MS).toISOString().slice(0, 10);
      const complete = first.event.seasonal
        ? days.has(before) && days.has(after)
        : first.event.boundary && last.event.boundary && index > start;
      if (complete) {
        const startAt = serverSave(first.date);
        const endAt = serverSave(last.date);
        const title = first.event.title;
        result.push({
          id: `tibia-${encodeURIComponent(title)}-${first.date}`,
          title,
          description: entries.slice(start, index + 1).find((entry) => entry.event.description)?.event.description ?? null,
          startAt,
          endAt,
          url: calendarMonthUrl(Number(first.date.slice(0, 4)), Number(first.date.slice(5, 7))),
          source: "tibia.com",
        });
      }
      start = index + 1;
    }
  }
  return result.sort((a, b) => a.startAt.localeCompare(b.startAt) || a.title.localeCompare(b.title));
}
