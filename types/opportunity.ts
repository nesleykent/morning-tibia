import type { MerchantId } from "./merchant";
import type { BestiaryProfile } from "@/lib/defaults/bestiary";
import type { BriefingLanguage } from "@/lib/formatter/translations";

/**
 * One fact, in every language the briefing speaks.
 *
 * It lives on the definition rather than in a separate narrative catalog on purpose: the
 * previous design had the same domain fact written twice, once as structured data and once as
 * formatter prose, and the two drifted — the prose claimed "Boss disponível: Raging Mage" for
 * a state in which the boss cannot be fought at all.
 */
export type LocalizedText = Record<BriefingLanguage, string>;

/**
 * Something today's world state makes unusually worth doing.
 *
 * The model that matters here is **change → state → opportunity**, not change → opportunity.
 * Overhunting is the clearest case: in the deer states it offers White Deer bestiary kills and
 * the Kingly Deer mount; in the starving-wolf state those are impossible and it offers
 * Starving Wolf bestiary kills and wolf trapping instead. A catalog keyed only on the change
 * would have to pick one of those and be wrong half the time — which is exactly what the
 * previous achievement-only catalog did.
 *
 * The old model was narrower still: every entry was an *achievement*. That is one kind of
 * thing a world state can be good for, and not the most common one. A mount you can only tame
 * today, a bestiary entry whose creature exists nowhere else, a boss that is only reachable in
 * this phase, an NPC service that is switched off — none of those are achievements, and all of
 * them are the reason someone reads a morning briefing.
 */

/** Which tracked condition creates the opportunity. */
export type OpportunityTrigger =
  | {
      kind: "mini-world-change";
      changeId: string;
      /**
       * Restrict to particular variants. Omitted means "any variant, including none named" —
       * correct for changes whose variant is only a location. Present means the opportunity
       * genuinely depends on which variant is running (which faction holds Trapwood), and an
       * unknown variant therefore does NOT satisfy it.
       */
      variantIds?: readonly string[];
      /**
       * Restrict to particular `contents` of the change, for one that has a second axis.
       * Same rule as `variantIds`: an unknown value does NOT satisfy it, which is what keeps
       * the briefing from offering Phantasms on a day nobody has looked behind the gate.
       */
      contentIds?: readonly string[];
    }
  | { kind: "world-change"; changeId: string; stateIds: readonly string[] }
  | { kind: "merchant"; merchantId: MerchantId };

/**
 * What the opportunity *is*, so the briefing can label it in one word and the reader can tell
 * a grind apart from a one-off at a glance.
 */
/**
 * `timing` is the odd one out and is deliberate: it is not a thing to get, it is the moment a
 * state changes into another. The bulletin has always been able to say that as a *consequence*
 * of an errand (the ⏳ line under "deliver the coal"), but some stages have nothing to do and
 * only a transition to report, and those used to be forced through the errand marker. A portal
 * closing after a boss dies is not an errand.
 */
export type OpportunityKind =
  | "bestiary"
  | "boss"
  | "mount"
  | "achievement"
  | "outfit"
  | "timing"
  | "quest"
  | "item"
  /**
   * The item that tames something: a Four-Leaf Clover, a Sugar Oat, a Giant Shrimp. Separate
   * from `item` because getting one is not an errand in its own right, it is the first half of
   * a mount, and the bulletin's errand marker said the wrong thing about it.
   */
  | "taming-item"
  | "access"
  | "service"
  | "hunting"
  | "progress";

/**
 * When the player can actually have the thing. Getting this wrong is the failure mode the
 * whole catalog exists to avoid: telling someone a boss is available when today only earns
 * them the ticket to fight it next week.
 *
 * - `available-today`    — the current state lets them do/get/farm/access it now.
 * - `progressable-today` — real progress is possible now, but finishing needs more days, more
 *                          kills across days, or a later state.
 * - `unlocks-future`     — what they do today changes what exists after a server save. Nothing
 *                          is obtainable now; the value is entirely in the next state.
 */
export type OpportunityAvailability =
  | "available-today"
  | "progressable-today"
  | "unlocks-future";

/** Bosstiary category, which decides how often a boss can be re-killed for points. */
export type BosstiaryClass = "Bane" | "Archfoe" | "Nemesis";

export interface OpportunityDefinition {
  /** Stable id, independent of display name. */
  id: string;
  kind: OpportunityKind;
  /**
   * The subject, in canonical English game wording — a creature, boss, mount, achievement,
   * service or place. Official names stay official in every language; only the surrounding
   * prose is translated.
   */
  subject: string;
  availability: OpportunityAvailability;
  trigger: OpportunityTrigger;
  /**
   * The heading this line carries in the bulletin, when the sentence alone would not say what
   * the errand is.
   *
   * `subject` is the thing in canonical English ("Deepling Scout"); a `progress` entry's
   * sentence normally stands on its own, because it describes the doing rather than a thing to
   * go after. A few errands need a name in front of them anyway - "Keep the mine open",
   * "Restart the Steamship" - and calling them by their `subject` would be wrong, because the
   * subject is the creature you kill, not the errand. This is that name, and it is the only
   * thing the renderer bolds for such a line.
   */
  label?: LocalizedText;
  /**
   * One short sentence: what to actually do, or the fact that makes today the moment. Where a
   * limit decides whether the thing is possible *at all* today, it belongs here rather than in
   * `caveat` — the briefing shows this line and must not read as a promise it can't keep.
   */
  detail: LocalizedText;
  /**
   * True when this state is the *only* way to get the thing at all, as opposed to merely the
   * convenient moment. Used for ordering, and never as decoration — an entry claiming
   * exclusivity has to have a source that says so.
   */
  exclusive?: boolean;
  /** Set for `kind: "bestiary"`. Derived, never hand-typed — see lib/defaults/bestiary.ts. */
  bestiary?: BestiaryProfile;
  /**
   * Set for `kind: "achievement"`, and for any other kind that also grants one.
   *
   * `requirement` is what earns it, in one clause, and it is a field of its own rather than a
   * reuse of `qualifier`. The bulletin prints an achievement as `Name: requirement, N
   * achievement points.`, so the clause has to be the achievement's own wording - and when the
   * achievement rides along with a boss or a mount, `qualifier` is already spoken for by that
   * other thing. Sharing one field between the two produced lines like "Groam: achievement Eye
   * of the Deep, 1 achievement point", with a monster standing where the achievement's name
   * belongs.
   */
  achievement?: {
    name: string;
    grade: 1 | 2 | 3 | 4;
    points: number;
    premium: boolean;
    requirement: LocalizedText;
  };
  /** Set for `kind: "boss"` when the boss is in the Bosstiary. */
  bosstiary?: BosstiaryClass;
  /**
   * A secondary limit — a multi-day grind, a per-server-save cap, a one-per-visit rule. Shown
   * on the catalog page, kept out of the briefing to keep it short; anything that decides
   * whether today is useful at all goes in `detail` instead.
   */
  caveat?: LocalizedText;
  /**
   * The one condition a reader must know before setting out, in six or seven words.
   *
   * `detail` and `caveat` are written for the catalog page, where there is room for a
   * sentence. The bulletin has room for a clause, and dropping the clause is not neutral:
   * "Tanjis, Obujos or Jaul — boss · Bane" reads as an invitation, and the player arrives to
   * find the teleporter shut because access had to be earned two stages ago. Set this only
   * where its absence would mislead; most entries need nothing.
   */
  qualifier?: LocalizedText;
  /**
   * Community judgement rather than game mechanic — a recommended level, "the best respawn in
   * the game", which creature is the most efficient source of a drop.
   *
   * It is a separate field, and rendered with its own marker, precisely because it is *not* a
   * fact. "Recommended from level 250" sat inside a `detail` line next to real spawn data and
   * read exactly like it: nothing in the game enforces 250, and a reader has no way to tell
   * which half of the sentence CipSoft guarantees. `detail` is only ever things the game does;
   * anything a person concluded lives here.
   */
  advisory?: LocalizedText;
  /** Anything that must already be true of the character before today helps at all. English:
   * these are quest and item names, and they are only rendered on the English catalog page. */
  prerequisites?: readonly string[];
  /**
   * The id of the opportunity this one is a step towards, when two entries are one errand.
   *
   * The Ladybug is the case: a Gooey Mass gives a Four-Leaf Clover and the clover tames the
   * mount. Both deserve their own line, and the ordering rules put the mount first because it
   * is the thing that exists only in this stage, which left the bulletin telling a reader to
   * use an item two lines before saying where the item comes from. A feeder sorts immediately
   * ahead of what it feeds, and is otherwise ordered normally.
   */
  leadsTo?: string;
  /** Where every claim above was verified. At least one URL. */
  sources: readonly string[];
}

/**
 * A definition plus the live evidence that its trigger is satisfied right now. Only produced
 * when the enabling condition is *established* — never from an unchecked state, and never from
 * a state a complete reading ruled out.
 */
export interface Opportunity {
  definition: OpportunityDefinition;
  /** The condition's own name, for lines that must stay short and localizable. */
  conditionName: string;
  /** The recognised state/variant label, or null when the source didn't name one. */
  conditionState: string | null;
  /** Emoji of the enabling change, so an opportunity traces back to its source at a glance. */
  emoji: string;
}
