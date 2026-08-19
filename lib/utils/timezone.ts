/**
 * Lightweight IANA-timezone conversion for "HH:MM today" style values (the warzone
 * schedule's shape), without pulling in a date-time library. Approximates by comparing
 * UTC offsets for the two zones on a single reference date — this can be off by a day
 * boundary or a DST transition mid-window in rare edge cases, which is an acceptable
 * trade-off for a "here's roughly your local time" convenience label.
 */

export function getTimezoneOffsetMinutes(timeZone: string, at: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    timeZoneName: "shortOffset",
  });
  const offsetPart = formatter.formatToParts(at).find((part) => part.type === "timeZoneName")?.value ?? "GMT+0";
  const match = offsetPart.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = match[3] ? Number(match[3]) : 0;
  return sign * (hours * 60 + minutes);
}

/**
 * Shifts a "HH:MM" wall-clock time by a number of minutes (positive or negative,
 * wrapping across midnight), appending "(+1d)"/"(-1d)" when it crosses a day boundary.
 */
export function shiftTimeByMinutes(timeStr: string, diffMinutes: number): string {
  const [hoursStr, minutesStr] = timeStr.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeStr;

  let totalMin = hours * 60 + minutes + diffMinutes;
  let dayShift = 0;
  while (totalMin < 0) {
    totalMin += 24 * 60;
    dayShift -= 1;
  }
  while (totalMin >= 24 * 60) {
    totalMin -= 24 * 60;
    dayShift += 1;
  }

  const hh = String(Math.floor(totalMin / 60)).padStart(2, "0");
  const mm = String(totalMin % 60).padStart(2, "0");
  const suffix = dayShift === 0 ? "" : dayShift > 0 ? " (+1d)" : " (-1d)";
  return `${hh}:${mm}${suffix}`;
}

/** Converts a "HH:MM" time from one IANA zone to another on the given reference date. */
export function convertTimeBetweenZones(
  timeStr: string,
  fromZone: string,
  toZone: string,
  referenceDate: Date,
): string {
  const diffMinutes = getTimezoneOffsetMinutes(toZone, referenceDate) - getTimezoneOffsetMinutes(fromZone, referenceDate);
  return shiftTimeByMinutes(timeStr, diffMinutes);
}
