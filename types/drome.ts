/**
 * Sourced at build time from TibiaWiki's Tibiadrome/Rotation gadget page, which computes
 * the current rotation number and countdown from Tibiadrome's fixed, publicly documented
 * bi-weekly schedule (every other Wednesday at server save). Not user-editable.
 */
export interface DromeRotationInfo {
  rotationNumber: string | null;
  startedAgo: string | null;
  nextRotationIn: string | null;
}
