/**
 * Tibia's Bestiary cost table, transcribed from TibiaWiki's own templates rather than from
 * prose: `Template:Kills to Unlock` and `Template:Charm Points`, which are the templates every
 * creature infobox on the wiki calls to render those two numbers.
 *
 * Both are a pure function of the creature's difficulty and whether its occurrence is
 * "Very Rare"; every other occurrence (Common, Uncommon, Rare) behaves identically. Deriving
 * the numbers here rather than typing them into each opportunity means a creature entry can
 * only ever be wrong about *which creature it is*, never about arithmetic — and the two facts
 * a player actually plans around, "how many kills" and "how many charm points", cannot drift
 * apart from each other.
 *
 * Sources:
 * - https://tibia.fandom.com/wiki/Template:Kills_to_Unlock
 * - https://tibia.fandom.com/wiki/Template:Charm_Points
 * - https://tibia.fandom.com/wiki/Bestiary/Difficulties
 */

export type BestiaryDifficulty =
  | "Harmless"
  | "Trivial"
  | "Easy"
  | "Medium"
  | "Hard"
  | "Challenging";

/** TibiaWiki's `occurrence` field. Only "Very Rare" changes the numbers. */
export type BestiaryOccurrence = "Common" | "Uncommon" | "Rare" | "Very Rare";

interface BestiaryTier {
  /** Kills for the final detail stage — the number that completes the entry. */
  kills: number;
  charmPoints: number;
}

const ORDINARY: Record<BestiaryDifficulty, BestiaryTier> = {
  Harmless: { kills: 25, charmPoints: 1 },
  Trivial: { kills: 250, charmPoints: 5 },
  Easy: { kills: 500, charmPoints: 15 },
  Medium: { kills: 1000, charmPoints: 25 },
  Hard: { kills: 2500, charmPoints: 50 },
  Challenging: { kills: 5000, charmPoints: 100 },
};

/** Every Very Rare creature completes in 5 kills; only the charm payout differs. */
const VERY_RARE_CHARM: Record<BestiaryDifficulty, number> = {
  Harmless: 5,
  Trivial: 10,
  Easy: 30,
  Medium: 50,
  Hard: 100,
  Challenging: 200,
};

export interface BestiaryProfile {
  difficulty: BestiaryDifficulty;
  occurrence: BestiaryOccurrence;
  /** Kills needed to fully unlock the entry. */
  kills: number;
  /** Charm Points awarded on completion. */
  charmPoints: number;
}

export function bestiaryProfile(
  difficulty: BestiaryDifficulty,
  occurrence: BestiaryOccurrence,
): BestiaryProfile {
  if (occurrence === "Very Rare") {
    return { difficulty, occurrence, kills: 5, charmPoints: VERY_RARE_CHARM[difficulty] };
  }
  const tier = ORDINARY[difficulty];
  return { difficulty, occurrence, kills: tier.kills, charmPoints: tier.charmPoints };
}
