/**
 * Factual links between the world state Morning Tibia tracks and the achievements that
 * state makes obtainable *today*.
 *
 * These are researched relationships, not thematic guesses. The rule applied throughout is
 * that a link must be justified by an authoritative statement — usually TibiaWiki's own
 * achievement spoiler naming the enabling change ("during the Stampede Mini World Change"),
 * or a creature page stating the creature only spawns under that condition. An achievement
 * that merely happens to involve a creature or place associated with the same content is
 * NOT a link.
 */

/** Which tracked condition unlocks the opportunity. */
export type AchievementTriggerRef =
  | { kind: "mini-world-change"; changeId: string; variantId?: string }
  | { kind: "world-change"; changeId: string; stateIds: readonly string[] }
  | { kind: "merchant"; merchantId: string };

/**
 * How strongly the condition and the achievement are tied.
 *
 * - `required` — the achievement genuinely cannot be obtained or progressed unless the
 *   condition is active. Killing 5 Terrified Elephants is impossible when Stampede isn't
 *   running, because that creature only exists then.
 * - `useful` — the achievement is not gated by the condition, but today's state makes it
 *   meaningfully easier or is the natural moment to do it. Held to the same evidence bar;
 *   "useful" is not a place to file weak guesses.
 */
export type AchievementLinkStrength = "required" | "useful";

export interface AchievementOpportunityDefinition {
  /** Stable id, independent of display name. */
  id: string;
  /** Exact achievement name as it appears in game. */
  achievement: string;
  grade: 1 | 2 | 3 | 4;
  points: number;
  premium: boolean;
  /** What the player must actually do, in one imperative sentence. */
  task: string;
  /** Why today's world state is what makes this possible or worthwhile. */
  whyToday: string;
  strength: AchievementLinkStrength;
  trigger: AchievementTriggerRef;
  /**
   * Anything that must already be true of the character. Surfaced so the app never implies
   * an achievement is one click away when it needs a quest line first.
   */
  prerequisites?: readonly string[];
  /**
   * A limit the UI must not paper over — a multi-day grind, a per-server-save cap, a
   * one-incarnation-per-visit rule. Shown so an "opportunity" is never oversold.
   */
  caveat?: string;
  /** Where the relationship was verified. */
  source: string;
}

/**
 * A definition plus the live evidence that its trigger is actually satisfied right now.
 * Only produced when the enabling condition is *established* — never from an unchecked or
 * merely-possible state.
 */
export interface AchievementOpportunity {
  definition: AchievementOpportunityDefinition;
  /** Player-facing description of the established condition, e.g. "Stampede is running". */
  evidence: string;
  /** Just the condition's name, for briefing lines that must stay short and localizable. */
  conditionName: string;
  /** Emoji of the condition, so the opportunity can be traced back to its source at a glance. */
  emoji: string;
}
