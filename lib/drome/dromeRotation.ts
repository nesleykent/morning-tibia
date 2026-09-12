import type { DromeRotationInfo } from "@/types/drome";
import { toTibiaDayKey } from "@/lib/utils/date";
import { getNextServerSave } from "@/lib/utils/serverSave";

const DAY_MS = 86_400_000;
const ROTATION_DAYS = 14;
// Rotation #2 started on Wednesday July 28, 2021. The first rotation was the
// exceptional 16-day launch period (July 12–28), not a regular two-week cycle.
// https://www.tibia.com/forum/?action=thread&postid=39214437
// Cross-checked against the official leaderboard on 2026-09-12: rotation #135
// ends September 16, 2026, 10:00 CEST; #134 ended September 2, 10:00 CEST.
// https://www.tibia.com/community/?subtopic=leaderboards
const REGULAR_ROTATION_EPOCH = Date.UTC(2021, 6, 28);
const FIRST_ROTATION_START = "2021-07-12";

/** Fixed calendar schedule, independent of fetching, build time and viewer zone.
 * Count Tibia calendar days rather than elapsed 24-hour periods: a rotation
 * spanning Berlin's DST change lasts 335 or 337 hours, rather than always 336.
 * The supplied instant belongs to the new rotation exactly at its server save.
 */
export function getDromeRotation(now: Date): DromeRotationInfo | null {
  if (!Number.isFinite(now.getTime())) return null;
  const dayKey = toTibiaDayKey(now);
  if (dayKey < FIRST_ROTATION_START) return null;

  const elapsedDays = (Date.parse(dayKey) - REGULAR_ROTATION_EPOCH) / DAY_MS;
  const cycleIndex = Math.floor(elapsedDays / ROTATION_DAYS);
  const rotationNumber = elapsedDays < 0 ? 1 : cycleIndex + 2;
  const endDateMs = elapsedDays < 0
    ? REGULAR_ROTATION_EPOCH
    : REGULAR_ROTATION_EPOCH + (cycleIndex + 1) * ROTATION_DAYS * DAY_MS;
  // Resolve the offset on the ending date itself, not on `now`, so the deadline
  // stays at 10:00 Berlin when the next rotation is across a DST transition.
  const endsAt = getNextServerSave(new Date(endDateMs + 6 * 60 * 60 * 1000));

  return { rotationNumber: `#${rotationNumber}`, endsAt: endsAt.toISOString() };
}
