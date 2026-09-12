/**
 * Computed locally by lib/drome/dromeRotation.ts from Tibiadrome's fixed schedule:
 * every other Wednesday at 10:00 Europe/Berlin. No network or build-time snapshot.
 */
export interface DromeRotationInfo {
  rotationNumber: string | null;
  /** ISO timestamp for when the current rotation ends (== when the next one starts). */
  endsAt: string | null;
}
