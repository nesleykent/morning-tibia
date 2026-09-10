import { getTimezoneOffsetMinutes } from "./timezone";

const SERVER_SAVE_HOUR = 10; // Tibia's server save is 10:00 CET/CEST, every day.
const SERVER_SAVE_TIME_ZONE = "Europe/Berlin";
const DAY_MS = 24 * 60 * 60 * 1000;

/** The 10:00 Berlin wall-clock instant on the Berlin calendar day containing `now`, plus
 * that day's parts — the shared arithmetic behind both the next and the previous save. */
function berlinSaveContext(now: Date) {
  const offsetMin = getTimezoneOffsetMinutes(SERVER_SAVE_TIME_ZONE, now);
  const berlinNow = new Date(now.getTime() + offsetMin * 60_000);
  const berlinTodaySaveMs = Date.UTC(
    berlinNow.getUTCFullYear(),
    berlinNow.getUTCMonth(),
    berlinNow.getUTCDate(),
    SERVER_SAVE_HOUR,
    0,
    0,
  );
  return { offsetMin, berlinNowMs: berlinNow.getTime(), berlinTodaySaveMs };
}

/**
 * The next instant Tibia's server save happens (10:00 Europe/Berlin, DST-safe via Intl —
 * same technique as lib/rashid/rashidRotation.ts). Pure and testable: takes "now"
 * explicitly rather than reading the clock itself.
 */
export function getNextServerSave(now: Date): Date {
  const { offsetMin, berlinNowMs, berlinTodaySaveMs } = berlinSaveContext(now);
  const berlinNextSaveMs =
    berlinNowMs >= berlinTodaySaveMs ? berlinTodaySaveMs + DAY_MS : berlinTodaySaveMs;
  return new Date(berlinNextSaveMs - offsetMin * 60_000);
}

/**
 * The most recent server save at or before `now` — the instant the world Morning Tibia is
 * describing was last rebuilt. This, not local midnight, is where one Tibia day ends and
 * the next begins: everything the app records is only true of the window between two saves.
 */
export function getLastServerSave(now: Date): Date {
  const { offsetMin, berlinNowMs, berlinTodaySaveMs } = berlinSaveContext(now);
  const berlinLastSaveMs =
    berlinNowMs >= berlinTodaySaveMs ? berlinTodaySaveMs : berlinTodaySaveMs - DAY_MS;
  return new Date(berlinLastSaveMs - offsetMin * 60_000);
}
