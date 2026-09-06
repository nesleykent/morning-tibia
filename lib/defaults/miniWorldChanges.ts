import type {
  MiniWorldChangeDefinition,
  MiniWorldChangeValue,
} from "@/types/miniWorldChange";

/**
 * The 24 Mini World Changes, verified entry by entry against TibiaWiki's "Mini World
 * Changes" list, "The World Board" message catalog, "Towncryer" shout catalog, and each
 * change's own article.
 *
 * 23 are modelled as cards here. The 24th, **Oriental Trader**, is Yasir's travelling
 * shop — it feeds the merchant card instead of getting a duplicate card of its own (see
 * lib/parser/boardMessages.ts and components/dashboard/MerchantCard.tsx), while following
 * exactly the same evidence rules as everything else.
 *
 * Names are TibiaWiki's canonical MWC names. Two were previously wrong and are corrected
 * here: what the app called "Bibby's Bloodbath" is the **Warpath** MWC (Bibby Bloodbath is
 * the boss it spawns), and "Spirit Gate" is the **Spirit Grounds** MWC ("Spirit Gate" is
 * only the wording inside the board message).
 *
 * `variants` is the closed set of forms a change can take, and it exists ONLY where the
 * game really has one. Most MWCs are plain on/off. The ones that aren't:
 *
 * - Fury Gates — opens near exactly one of 10 named cities. The board says "near one of the
 *   major cities somewhere in Tibia" and never names it, so the board can confirm it is
 *   open but not where. (Previously modelled as a plain toggle, which lost the entire
 *   point of the change.)
 * - Nomads — exactly one of 4 camps in Kha'labal is up ("only one Nomad Camp out of four
 *   possible camps can be found when it's active"). The board says only "There must be a
 *   camp somewhere." (Previously modelled as a fixed single spot.)
 * - Warpath — the orc camp appears at one of 3 places; the board names none of them.
 * - Jungle Camp — either the Hunters or the Dworcs dominate, which decides both the
 *   creatures and the possible boss (Arthom the Hunter vs Oodok Witchmaster). The World
 *   Board does not say which; the **Towncryer does**. (Previously a plain toggle.)
 * - Poacher Caves — three dominance phases, and here the board text itself names the phase.
 * - Nightmare Isles / Spirit Grounds — the board names the location outright.
 *
 * Noodles deliberately has no variants: the board doesn't name a spot, the dog wanders the
 * whole Thaian peninsula, and the wiki's list is only where he *spawns at server save*.
 * Those spots are kept as `reference` so they show as a hint, never as a state the app
 * claims to know.
 */

const FURY_GATE_CITIES = [
  "Ab'Dendriel",
  "Ankrahmun",
  "Carlin",
  "Darashia",
  "Edron",
  "Kazordoon",
  "Liberty Bay",
  "Port Hope",
  "Thais",
  "Venore",
] as const;

const NOMAD_CAMPS = [
  "Northeast of the Shadow Tomb",
  "South of the Tarpit Tomb",
  "South of the Ancient Ruins Tomb",
  "Northeast of the Ancient Ruins Tomb",
] as const;

const WARPATH_LOCATIONS = [
  "North of the Jakundaf Desert",
  "North of Carlin",
  "East of the Femor Hills",
] as const;

/** Where Noodles is known to spawn at server save (TibiaWiki, "Noodles is Gone"). */
const NOODLES_SPAWN_POINTS = [
  "Inside the castle kitchen",
  "Around the Rain Castle",
  "North-west of Thais, behind the castle river",
  "North-west of Thais",
  "West of Greenshore",
  "North-west of Greenshore",
  "South of Thais, near the Wolf Dungeon",
  "South of Thais, near the Minotaur Camp",
  "The southern peninsula with the Cyclops Camp",
  "Near the White Flower Temple",
  "North-east of the Snake Tower guildhall",
  "East of Thais",
] as const;

function toVariants(labels: readonly string[]) {
  return labels.map((label) => ({
    id: label
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    label,
  }));
}

export const MINI_WORLD_CHANGE_DEFINITIONS: MiniWorldChangeDefinition[] = [
  {
    id: "fury-gates",
    name: "Fury Gates",
    shortLabel: "Fury Gates",
    emoji: "🔥",
    location: "Fury Dungeon, near one of ten cities",
    variants: toVariants(FURY_GATE_CITIES),
    variantKind: "location",
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description:
      "A fiery gate to the Fury Dungeon opens near one of ten cities. Neither the World Board nor the Towncryer says which one — you find out by going to look.",
  },
  {
    id: "hive-outpost",
    name: "Hive Outpost",
    shortLabel: "Hive Outpost",
    emoji: "👾",
    location: "Hive Outpost (Vandura), south-west of Liberty Bay",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "A hive infestation south-west of Liberty Bay, at a fixed spot.",
  },
  {
    id: "warpath",
    name: "Warpath",
    shortLabel: "Warpath",
    emoji: "🏴‍☠️",
    location: "Jakundaf Desert, Carlin or Femor Hills",
    variants: toVariants(WARPATH_LOCATIONS),
    variantKind: "location",
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description:
      "A travelling orc camp appears at one of three places; clearing it spawns Bibby Bloodbath. Neither source names which place.",
  },
  {
    id: "devovorgas-essence",
    name: "Devovorga's Essence",
    shortLabel: "Devovorga",
    emoji: "🧪",
    location: "Vengoth",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description:
      "Tentacle pieces can be used at Vengoth to enter a boss lair and fight Devovorga's incarnations.",
  },
  {
    id: "chakoya-iceberg",
    name: "Chakoya Iceberg",
    shortLabel: "Iceberg",
    emoji: "🧊",
    location: "Northern Tiquanda, coast north of Port Hope",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "An iceberg full of chakoyas washes up north of Port Hope, at a fixed spot.",
  },
  {
    id: "spirit-grounds",
    name: "Spirit Grounds",
    shortLabel: "Spirit Grounds",
    emoji: "🌀",
    location: "Reached via Darama, Ghostlands or Vengoth",
    variants: toVariants(["Darama", "Ghostlands", "Vengoth"]),
    variantKind: "location",
    boardNamesVariant: true,
    towncryerNamesVariant: true,
    description:
      "A gate to the spirit grounds opens in one of three regions. Both the board and the Towncryer name which one.",
  },
  {
    id: "nightmare-isles",
    name: "Nightmare Isles",
    shortLabel: "Nightmare Isles",
    emoji: "🌑",
    location: "Nightmare Isles, via Kha'labal or Devourer",
    variants: toVariants([
      "Darama's northernmost coast",
      "The river near Drefia",
      "The Ankrahmun tar pits",
    ]),
    variantKind: "location",
    boardNamesVariant: true,
    towncryerNamesVariant: true,
    description:
      "A sandstorm opens a portal to the Nightmare Isles at one of three spots. Both sources name which one.",
  },
  {
    id: "fire-from-the-earth",
    name: "Fire from the Earth",
    shortLabel: "Fire from the Earth",
    emoji: "🌋",
    location: "Goroma",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description:
      "The Hellgore volcano on Goroma erupts, flooding the land with lava and stronger creatures.",
  },
  {
    id: "nomads",
    name: "Nomads",
    shortLabel: "Nomads",
    emoji: "🐫",
    location: "Kha'labal, north of Ankrahmun",
    variants: toVariants(NOMAD_CAMPS),
    variantKind: "location",
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description:
      "Exactly one of four nomad camps is pitched somewhere in Kha'labal. Three of the four hold a claimable chest. Neither source says which camp is up.",
  },
  {
    id: "bored",
    name: "Bored",
    shortLabel: "Bored Witch",
    emoji: "🧙",
    location: "Green Claw Swamp",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "The witch Wyda is bored and worth visiting — she may have a surprise.",
  },
  {
    id: "noodles-is-gone",
    name: "Noodles is Gone",
    shortLabel: "Noodles",
    emoji: "🐕",
    location: "Thais and its surroundings",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description:
      "The king's dog has left the castle. He wanders the whole Thaian peninsula, so there is no fixed spot to record — get a leash from King Tibianus and go find him.",
    reference: NOODLES_SPAWN_POINTS,
  },
  {
    id: "kingsday",
    name: "Kingsday",
    shortLabel: "Kingsday",
    emoji: "👑",
    location: "Thais",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "Kingsday is being celebrated in Thais, with raids in the Knights Arena.",
  },
  {
    id: "thawing",
    name: "Thawing",
    shortLabel: "Thawing",
    emoji: "❄️",
    location: "Svargrond",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "Enough snow has melted near Svargrond to reveal Ice Flowers.",
  },
  {
    id: "spider-nest",
    name: "Spider Nest",
    shortLabel: "Spider Nest",
    emoji: "🕷️",
    location: "Thaian–Venorean road, close to Venore",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "Mamma Longlegs is on the loose and her nest can be exterminated.",
  },
  {
    id: "poacher-caves",
    name: "Poacher Caves",
    shortLabel: "Poacher Caves",
    emoji: "🏹",
    location: "Poacher Caves, north of the Green Claw Swamp",
    variants: [
      { id: "game", label: "Wild animals dominate" },
      { id: "poachers", label: "Poachers dominate" },
      { id: "ghost-wolves", label: "Vengeful ghost wolves dominate" },
    ],
    variantKind: "phase",
    boardNamesVariant: true,
    towncryerNamesVariant: true,
    description:
      "A three-way dominance cycle north of the Green Claw Swamp. Both the board and the Towncryer say which side currently holds the area.",
  },
  {
    id: "jungle-camp",
    name: "Jungle Camp",
    shortLabel: "Jungle Camp",
    emoji: "🏕️",
    location: "Hunter Camp / Dworc Camp, Tiquanda",
    variants: [
      { id: "hunters", label: "Hunters dominate" },
      { id: "dworcs", label: "Dworcs dominate" },
    ],
    variantKind: "faction",
    boardNamesVariant: false,
    towncryerNamesVariant: true,
    description:
      "Hunters and dworcs fight over Trapwood's holy grounds; the winner decides the creatures and the possible boss (Arthom the Hunter or Oodok Witchmaster). The World Board doesn't say who is winning — the Towncryer does.",
  },
  {
    id: "grimvale",
    name: "Grimvale",
    shortLabel: "Grimvale",
    emoji: "🌲",
    location: "Grimvale",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "The full moon is over Grimvale, enabling the Grimvale Quest.",
  },
  {
    id: "stampede",
    name: "Stampede",
    shortLabel: "Stampede",
    emoji: "🐘",
    location: "Tiquanda",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "The Ape God has stirred Tiquanda's elephants; tusks can be looted.",
  },
  {
    id: "bank-robbery",
    name: "Bank Robbery",
    shortLabel: "Bank Robbery",
    emoji: "💰",
    location: "Ab'Dendriel, Carlin, Thais and Venore",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description:
      "Banks in the main coastal towns are robbed at the same time — the thieves hide out in the Dwarf Mines, the Ghostlands, the Ancient Temple and Shadowthorn respectively.",
  },
  {
    id: "river-runs-deep",
    name: "River Runs Deep",
    shortLabel: "River Runs Deep",
    emoji: "🎣",
    location: "Zao Steppe",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "The Zao Steppe river runs deep and sandfish can be caught.",
  },
  {
    id: "lumberjack",
    name: "Lumberjack",
    shortLabel: "Lumberjack",
    emoji: "🪓",
    location: "Fields of Glory, north of Carlin",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "The Queen's royal trees are being cut down north of Carlin.",
  },
  {
    id: "down-the-drain",
    name: "Down the Drain",
    shortLabel: "Down the Drain",
    emoji: "🌊",
    location: "Outlaw Camp",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "The river south of the outlaw camp floods, making a small island reachable.",
  },
  {
    id: "chyllfroest",
    name: "Chyllfroest",
    shortLabel: "Chyllfroest",
    emoji: "🥶",
    location: "Chyllfroest",
    variants: [],
    variantKind: null,
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "An ice bridge connects Svargrond to the frosty island of Chyllfroest.",
  },
];

export const MINI_WORLD_CHANGES_BY_ID = new Map(
  MINI_WORLD_CHANGE_DEFINITIONS.map((def) => [def.id, def]),
);

export function createDefaultMiniWorldChangeValues(): Record<string, MiniWorldChangeValue> {
  const values: Record<string, MiniWorldChangeValue> = {};
  for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
    values[def.id] = {
      id: def.id,
      status: "unchecked",
      variantId: null,
      updatedAt: null,
    };
  }
  return values;
}
