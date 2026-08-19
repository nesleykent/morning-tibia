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
