const DAY_MS = 24 * 60 * 60 * 1000;

/** "DD/MM" using the date's own UTC calendar fields — matches how event dates are
 * computed (referenceDate + N days, in UTC), avoiding any viewer-timezone day-shift. */
export function formatShortDateUTC(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function partsInZone(date: Date, timeZone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { timeZone, ...options }).formatToParts(date);
}

function partValue(parts: Intl.DateTimeFormatPart[], type: string): string {
  return parts.find((p) => p.type === type)?.value ?? "00";
}

/** "DD/MM" in a specific IANA timezone's calendar. */
export function formatShortDateInZone(date: Date, timeZone: string): string {
  const parts = partsInZone(date, timeZone, { day: "2-digit", month: "2-digit" });
  return `${partValue(parts, "day")}/${partValue(parts, "month")}`;
}

/** "HH:MM" (24h) in a specific IANA timezone. */
export function formatTimeInZone(date: Date, timeZone: string): string {
  const parts = partsInZone(date, timeZone, { hour: "2-digit", minute: "2-digit", hour12: false });
  const hour = partValue(parts, "hour");
  // Intl can format midnight as "24" with hour12:false in some environments — normalize.
  return `${hour === "24" ? "00" : hour}:${partValue(parts, "minute")}`;
}

function calendarDateKeyInZone(date: Date, timeZone: string): string {
  const parts = partsInZone(date, timeZone, { year: "numeric", month: "2-digit", day: "2-digit" });
  return `${partValue(parts, "year")}-${partValue(parts, "month")}-${partValue(parts, "day")}`;
}

function dateKeyToUTC(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y!, m! - 1, d!);
}

/** Whole calendar days between `from` and `to` as seen in `timeZone` (to - from). */
export function calendarDayDiff(from: Date, to: Date, timeZone: string): number {
  const fromUTC = dateKeyToUTC(calendarDateKeyInZone(from, timeZone));
  const toUTC = dateKeyToUTC(calendarDateKeyInZone(to, timeZone));
  return Math.round((toUTC - fromUTC) / DAY_MS);
}

/** "3h 24min" / "3h" / "24min" — omits a zero-valued unit instead of showing "0h 24min". */
export function formatDuration(totalMinutes: number): string {
  const clamped = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

/** "HH:MM:SS", or "Dd HH:MM:SS" past 24h — a live ticking countdown clock. */
export function formatCountdownClock(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
  return days > 0 ? `${days}d ${clock}` : clock;
}

/** "2026-09-10" in UTC — the bulletin's own dateline, unambiguous in any locale. */
export function formatIsoDateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Month names, capitalised, for a date a reader is meant to remember rather than compute.
 *
 * Written out rather than taken from `Intl`: `toLocaleDateString` lower-cases months in
 * pt-BR and es-ES, and the bulletin sets an event's date as its own line where a lower-case
 * month reads as a typo. Four languages, twelve words each, and no locale-data surprises.
 */
const MONTH_NAMES: Record<string, readonly string[]> = {
  pt: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  pl: ["Stycznia", "Lutego", "Marca", "Kwietnia", "Maja", "Czerwca", "Lipca", "Sierpnia", "Września", "Października", "Listopada", "Grudnia"],
};

/** "12 de Setembro" / "12 September" — a date said the way a person says it. */
export function formatLongDateUTC(date: Date, language: string): string {
  const months = MONTH_NAMES[language] ?? MONTH_NAMES.en!;
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()]!;
  return language === "en" ? `${day} ${month}` : `${day} de ${month}`;
}

const WEEKDAY_NAMES: Record<string, readonly string[]> = {
  pt: ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  pl: ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"],
};

/**
 * How a deadline inside the coming week is actually said: "terça que vem", not "16/09".
 *
 * Only within the week, and only from two days out. A day named more than seven days ahead is
 * ambiguous about which week it means, and "amanhã" beats naming tomorrow's weekday, so those
 * cases fall back to the caller's short date.
 */
export function formatRelativeWeekday(
  date: Date,
  dayDiff: number,
  timeZone: string,
  language: string,
): string | null {
  if (dayDiff < 2 || dayDiff > 7) return null;
  const weekdayIndex = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" })
      .formatToParts(date)
      .find((part) => part.type === "weekday")?.value
      .replace(/Sun|Mon|Tue|Wed|Thu|Fri|Sat/, (match) =>
        String(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(match)),
      ) ?? "0",
  );
  const name = (WEEKDAY_NAMES[language] ?? WEEKDAY_NAMES.en!)[weekdayIndex]!;
  if (language === "pt") return `${name} que vem`;
  if (language === "es") return `el ${name} que viene`;
  if (language === "pl") return `w ${name}`;
  return `next ${name}`;
}
