/**
 * Rashid follows a fixed, publicly documented weekday rotation (unlike the Mini World
 * Changes, this one is a known constant pattern, not something read off in-game text).
 * This is a best-effort default — it does not account for the ~10:00 CET server-save
 * rollover, so it can be briefly wrong right around that boundary — and is always
 * overridable in the UI.
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

export function getRashidLocation(date: Date): string {
  return RASHID_WEEKDAY_LOCATIONS[date.getDay()] ?? RASHID_WEEKDAY_LOCATIONS[0]!;
}

export function getRashidRotationCities(): readonly string[] {
  return RASHID_WEEKDAY_LOCATIONS;
}
