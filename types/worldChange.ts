/**
 * A World Change: one of Tibia's longer-running, player-influenceable world states
 * (TibiaWiki, "World Changes"). Unlike Mini World Changes these are shaped by what players
 * do — draining the Kazordoon mines, killing deeplings, putting out the Shadowthorn fires
 * — and they are checked by greeting any Guide NPC and saying a keyword.
 *
 * The official keyword list (quoted by Guide NPCs themselves, and by TibiaWiki's World
 * Changes article) is exactly 14 keywords: Horestis, Mage Tower, Master's Voice, Swamp
 * Fever, Thornfire, Twisted Waters, Awash, Steamship, Horses, Overhunting, Demon War,
 * Sea Serpent, Deepling, Hive. Those 14 are what this catalog tracks.
 *
 * Modelling note: a World Change is ALWAYS in one of its documented states — there is no
 * "inactive" in the Mini-World-Change sense. Horestis is never "off"; he is either
 * slumbering or risen or desecrated. So a value here is simply "which documented state did
 * the Guide report", plus null for "we haven't asked". Reusing the Mini World Change's
 * active/inactive/stage union here (as this file used to) invented a distinction the game
 * does not have.
 */

export interface WorldChangeStateOption {
  id: string;
  /** Short, player-facing name for this state, in canonical English. */
  label: string;
  /**
   * True when this state is the "nothing interesting is happening" end of the cycle, so the
   * briefing can skip it unless the user asks for everything. Not the same as "inactive" —
   * it's still a real, confirmed state of the world.
   */
  quiet?: boolean;
  /**
   * Set when the game has this state but no Guide reply for it has ever been transcribed, so
   * lib/parser/guideMessages.ts cannot produce it and only a hand-set value ever will.
   *
   * It exists so the gap is declared rather than hidden. Every other state is backed by
   * verbatim Guide text, and a test enforces that; a state that quietly had none would look
   * identical in the catalog while being unreachable, and the opportunities hanging off it
   * would be researched facts silently switched off. Declared, the catalog can still model the
   * stage correctly, which is what keeps the other states honest: it gives a stage's own
   * creatures somewhere to live other than a state where they do not belong.
   */
  guideWordingUnknown?: boolean;
}

export interface WorldChangeDefinition {
  id: string;
  /** Canonical TibiaWiki World Change name. */
  name: string;
  /** Override for the TibiaWiki article title, when it isn't `<name> World Change`;
   * explicit `null` means no article exists. See lib/utils/tibiaWiki.ts. */
  wikiTitle?: string | null;
  shortLabel: string;
  emoji: string;
  /** The exact keyword to say to a Guide NPC, verbatim from the official list. */
  guideKeyword: string;
  /** Where it happens, per TibiaWiki's own Location field. */
  location: string;
  /**
   * The places the daily bulletin names, one entry per distinct place.
   *
   * `location` is written for the catalog page, where a full sentence of orientation is
   * welcome — "Reached via Darama, Ghostlands or Vengoth". In a bulletin the place rides on
   * the change's own name, read at a glance, and those English connectives are the one place
   * English prose leaks into a Portuguese message.
   *
   * Every entry is a strict shortening of `location`: the same places, with the orientation
   * removed. Never a place the catalog does not already name. Omitted wherever `location` is
   * already just a place, which the renderer falls back to as a single entry.
   *
   * A **list**, because the bulletin punctuates independent places and one place's own name
   * differently: the renderer joins these with semicolons, so Horse Station's two ends of the
   * Thaian road read `(Thais; Venore)` while the lake that a comma merely locates stays
   * `(Lake Equivocolao, Port Hope)`. A single string could not tell the two apart, and the
   * catalog is the only place that knows which it is.
   */
  briefingLocations?: readonly string[];
  /** Every state with documented Guide reply text, in cycle order. */
  states: readonly WorldChangeStateOption[];
  description: string;
  /**
   * Set when a source other than a Guide NPC also reports this change in game
   * (e.g. Pyro Peter in Venore for Thornfire). Informational only.
   */
  alternativeSource?: string;
}

export interface WorldChangeValue {
  id: string;
  /** A `WorldChangeStateOption.id`, or null when no Guide has been asked this session. */
  stateId: string | null;
  updatedAt: string | null;
}
