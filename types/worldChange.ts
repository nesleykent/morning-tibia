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
