import { getTimezoneOffsetMinutes } from "./timezone";

const SERVER_SAVE_HOUR = 10; // Tibia's server save is 10:00 CET/CEST, every day.
const SERVER_SAVE_TIME_ZONE = "Europe/Berlin";

/**
 * The next instant Tibia's server save happens (10:00 Europe/Berlin, DST-safe via Intl —
 * same technique as lib/rashid/rashidRotation.ts). Pure and testable: takes "now"
 * explicitly rather than reading the clock itself.
 */
export function getNextServerSave(now: Date): Date {
  const offsetMin = getTimezoneOffsetMinutes(SERVER_SAVE_TIME_ZONE, now);
  const berlinNowMs = now.getTime() + offsetMin * 60_000;
  const berlinNow = new Date(berlinNowMs);
  const berlinTodaySave = new Date(
    Date.UTC(berlinNow.getUTCFullYear(), berlinNow.getUTCMonth(), berlinNow.getUTCDate(), SERVER_SAVE_HOUR, 0, 0),
  );
  const berlinNextSave =
    berlinNow.getTime() >= berlinTodaySave.getTime()
      ? new Date(berlinTodaySave.getTime() + 24 * 60 * 60 * 1000)
      : berlinTodaySave;
  return new Date(berlinNextSave.getTime() - offsetMin * 60_000);
}
