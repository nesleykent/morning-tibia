/**
 * Rashid follows a fixed, publicly documented weekday rotation (unlike the Mini World
 * Changes, this one is a known constant pattern, not something read off in-game text).
 * Always overridable in the UI.
 */
const RASHID_WEEKDAY_LOCATIONS: readonly string[] = [
  "Carlin", // Sunday
  "Svargrond", // Monday
  "Liberty Bay", // Tuesday
  "Port Hope", // Wednesday
  "Ankrahmun", // Thursday
  "Darashia", // Friday
  "Edron", // Saturday
];

const SERVER_SAVE_HOUR = 10; // Tibia's day rolls over at 10:00 CET/CEST, not local midnight.
const WEEKDAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Resolves which weekday it currently is in Tibia's own clock: Europe/Berlin time,
 * rolled back a day until the 10:00 server save has passed. Pure and DST-safe — reads
 * the "Europe/Berlin" zone explicitly via Intl rather than the runtime's local timezone.
 */
function getTibiaWeekdayIndex(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hourStr = parts.find((p) => p.type === "hour")?.value ?? "00";
  const hour = hourStr === "24" ? 0 : Number(hourStr);

  const index = WEEKDAY_ORDER.indexOf(weekday);
  const dayIndex = index === -1 ? 0 : index;
  return hour < SERVER_SAVE_HOUR ? (dayIndex + 6) % 7 : dayIndex;
}

export function getRashidLocation(date: Date): string {
  return RASHID_WEEKDAY_LOCATIONS[getTibiaWeekdayIndex(date)] ?? RASHID_WEEKDAY_LOCATIONS[0]!;
}

export function getRashidRotationCities(): readonly string[] {
  return RASHID_WEEKDAY_LOCATIONS;
}
