import { getLastServerSave } from "./serverSave";

/**
 * The Tibia day `now` falls in, as a yyyy-mm-dd storage key.
 *
 * A Tibia day runs from one 10:00 CET/CEST server save to the next, not from local
 * midnight to local midnight — everything Morning Tibia records (which changes are running,
 * which the board ruled out, which city Yasir is in) is only true of that window, and all
 * of it is rebuilt the moment the save happens.
 *
 * Keying saved state on the device's calendar date got this wrong twice a day in opposite
 * directions: two sessions either side of the save shared one bucket, so pre-save state was
 * silently served as current after the world had already moved on. The key is the Berlin
 * calendar date of the save that *started* the current day, so it advances exactly when the
 * world does.
 *
 * The briefing dateline uses this same key, so it advances with the game world rather than
 * at the viewer's local midnight.
 */
export function toTibiaDayKey(now: Date): string {
  const save = getLastServerSave(now);
  // getLastServerSave returns a real instant; format it in Berlin terms so the key names
  // the save's own calendar day rather than the viewer's.
  const berlin = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA renders exactly yyyy-mm-dd.
  return berlin.format(save);
}

/** dd/mm/yyyy, matching the reference briefing format. */
export function toBriefingDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${d}/${m}/${y}`;
}

/** dd/mm/yyyy for the Tibia day containing `now` (the period since the last server save). */
export function toTibiaBriefingDate(now: Date): string {
  const [year, month, day] = toTibiaDayKey(now).split("-");
  return `${day}/${month}/${year}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole Tibia days between two instants, using server-save boundaries. */
export function tibiaDayDiff(from: Date, to: Date): number {
  const fromKey = toTibiaDayKey(from);
  const toKey = toTibiaDayKey(to);
  const fromUTC = Date.parse(`${fromKey}T00:00:00Z`);
  const toUTC = Date.parse(`${toKey}T00:00:00Z`);
  return Math.round((toUTC - fromUTC) / DAY_MS);
}

/** Return the Tibia calendar key after a number of server-save periods. */
export function addTibiaDays(now: Date, days: number): string {
  const [year, month, day] = toTibiaDayKey(now).split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day! + days)).toISOString().slice(0, 10);
}

/** Whole days elapsed between two dates, ignoring time-of-day. */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((b - a) / DAY_MS);
}
