import type {
  MiniWorldChangeDefinition,
  MiniWorldChangeValue,
} from "@/types/miniWorldChange";

/**
 * The Mini World Changes, verified entry by entry against TibiaWiki's "Mini World Changes"
 * list, "The World Board" message catalog, "Towncryer" shout catalog, each change's own
 * article, and — for the changes the English wiki does not cover — TibiaWiki BR's
 * "Mini World Changes" page (https://www.tibiawiki.com.br/wiki/Mini_World_Changes),
 * which is more current and marks the *silent* ones explicitly.
 *
 * 26 are modelled as cards here. **Oriental Trader** is Yasir's travelling shop — it feeds
 * the merchant card instead of getting a duplicate card of its own (see
 * lib/parser/boardMessages.ts and components/dashboard/MerchantCard.tsx), while following
 * exactly the same evidence rules as everything else.
 *
 * Three changes are NOT announced by any source, and getting this wrong is dangerous: if
 * they were modelled as announced, a complete World Board reading would "prove" they are
 * not running, when in truth the board could never have mentioned them.
 *
 * - **Beaver Breakout** (silent) and **Shipwrecked** (silent) — TibiaWiki BR states plainly
 *   that each is a "mini world change silenciosa, portanto é necessário checar pessoalmente
 *   se ela está ocorrendo em seu servidor". Shipwrecked has one documented alternative: a
 *   Krailos map fully revealed by the Measuring Tibia Quest shows when the pirate respawns
 *   are active on the Krailos Steppe.
 * - **Forsaken** (always-active) — a different shape again. The Forsaken Mine south of
 *   Ab'Dendriel rotates its creature set at every server save between four possibilities,
 *   so it is never "off"; the only open question is which set is down there, answered by
 *   looking from the first floor before descending.
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

/**
 * The three hunting grounds behind a Spirit Gate, which do not follow the gate: TibiaWiki says
 * outright that "although there are 3 portals and 3 hunting grounds, they do not correspond".
 * Named by their creatures rather than by "easy/hard", because the creature set is what a
 * player is deciding about.
 */
export const SPIRIT_GROUND_SETS = [
  { id: "ghosts", creatures: ["Ghost", "Ghoul", "Bonelord", "Mummy"] },
  { id: "nightstalkers", creatures: ["Nightstalker", "Banshee", "Souleater", "Braindeath"] },
  { id: "nightmares", creatures: ["Nightmare", "Nightmare Scion", "Spectre", "Phantasm"] },
] as const;

/** "Ghost, Ghoul, Bonelord and Mummy" — the set's creatures, as an English label. */
function englishList(items: readonly string[]): string {
  return items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

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
    briefingLocations: ["Fury Dungeon"],
    variants: toVariants(FURY_GATE_CITIES),
    variantKind: "location",
    detection: "announced",
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description:
      "A fiery gate to the Fury Dungeon opens near one of ten cities. Neither the World Board nor the Towncryer says which one. You find out by going to look.",
  },
  {
    id: "hive-outpost",
    name: "Hive Outpost",
    shortLabel: "Hive Outpost",
    emoji: "👾",
    location: "Hive Outpost (Vandura), south-west of Liberty Bay",
    briefingLocations: ["Vandura"],
    variants: [],
    variantKind: null,
    detection: "announced",
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
    briefingLocations: ["Jakundaf Desert", "Carlin", "Femor Hills"],
    variants: toVariants(WARPATH_LOCATIONS),
    variantKind: "location",
    detection: "announced",
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
    detection: "announced",
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
    briefingLocations: ["Tiquanda, Port Hope"],
    variants: [],
    variantKind: null,
    detection: "announced",
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
    briefingLocations: ["Darama", "Ghostlands", "Vengoth"],
    variants: toVariants(["Darama", "Ghostlands", "Vengoth"]),
    variantKind: "location",
    variantIsBriefingLocation: true,
    // Built from the creature arrays rather than typed out again, so the picker, the catalog
    // page, the bulletin's sentence and the opportunity entries all name the same creatures.
    contents: SPIRIT_GROUND_SETS.map((set) => ({
      id: set.id,
      label: englishList(set.creatures),
    })),
    contentKind: "creature-set",
    detection: "announced",
    boardNamesVariant: true,
    towncryerNamesVariant: true,
    howToCheck:
      "Step through the gate and look at what is in there; no source names which of the three hunting grounds it is.",
    description:
      "A gate to the spirit grounds opens in one of three regions, and one of three undead hunting grounds is behind it. Both the board and the Towncryer name the region. Neither names the hunting ground, which does not follow the region.",
  },
  {
    id: "nightmare-isles",
    name: "Nightmare Isles",
    shortLabel: "Nightmare Isles",
    emoji: "🌑",
    location: "Nightmare Isles, via Kha'labal or Devourer",
    briefingLocations: ["Kha'labal"],
    variants: toVariants([
      "Darama's northernmost coast",
      "The river near Drefia",
      "The Ankrahmun tar pits",
    ]),
    variantKind: "location",
    detection: "announced",
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
    detection: "announced",
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
    briefingLocations: ["Kha'labal"],
    variants: toVariants(NOMAD_CAMPS),
    variantKind: "location",
    detection: "announced",
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
    detection: "announced",
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "The witch Wyda is bored and worth visiting. She may have a surprise.",
  },
  {
    id: "noodles-is-gone",
    name: "Noodles is Gone",
    shortLabel: "Noodles",
    emoji: "🐕",
    location: "Thais and its surroundings",
    briefingLocations: ["Thais"],
    variants: [],
    variantKind: null,
    detection: "announced",
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description:
      "The king's dog has left the castle. He wanders the whole Thaian peninsula, so there is no fixed spot to record. Get a leash from King Tibianus and go find him.",
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
    detection: "announced",
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
    detection: "announced",
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
    briefingLocations: ["Venore"],
    variants: [],
    variantKind: null,
    detection: "announced",
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
    briefingLocations: ["Green Claw Swamp"],
    variants: [
      { id: "game", label: "Wild animals dominate" },
      { id: "poachers", label: "Poachers dominate" },
      { id: "ghost-wolves", label: "Vengeful ghost wolves dominate" },
    ],
    variantKind: "phase",
    detection: "announced",
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
    briefingLocations: ["Tiquanda"],
    variants: [
      { id: "hunters", label: "Hunters dominate" },
      { id: "dworcs", label: "Dworcs dominate" },
    ],
    variantKind: "faction",
    detection: "announced",
    boardNamesVariant: false,
    towncryerNamesVariant: true,
    description:
      "Hunters and dworcs fight over Trapwood's holy grounds; the winner decides the creatures and the possible boss (Arthom the Hunter or Oodok Witchmaster). The World Board doesn't say who is winning. The Towncryer does.",
  },
  {
    id: "grimvale",
    name: "Grimvale",
    shortLabel: "Grimvale",
    emoji: "🌲",
    location: "Grimvale",
    variants: [],
    variantKind: null,
    detection: "announced",
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
    detection: "announced",
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
    briefingLocations: ["Ab'Dendriel", "Carlin", "Thais", "Venore"],
    variants: [],
    variantKind: null,
    detection: "announced",
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description:
      "Banks in the main coastal towns are robbed at the same time. The thieves hide out in the Dwarf Mines, the Ghostlands, the Ancient Temple and Shadowthorn respectively.",
  },
  {
    id: "river-runs-deep",
    name: "River Runs Deep",
    shortLabel: "River Runs Deep",
    emoji: "🎣",
    location: "Zao Steppe",
    variants: [],
    variantKind: null,
    detection: "announced",
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
    briefingLocations: ["Fields of Glory"],
    variants: [],
    variantKind: null,
    detection: "announced",
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
    detection: "announced",
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "The river south of the outlaw camp floods, making a small island reachable.",
  },
  {
    id: "beaver-breakout",
    name: "Beaver Breakout",
    // No English TibiaWiki article — only TibiaWiki BR documents this silent change.
    wikiTitle: null,
    shortLabel: "Beaver Breakout",
    emoji: "🦫",
    location: "Silvertides, Marapur",
    variants: [],
    variantKind: null,
    detection: "silent",
    howToCheck:
      "Go to Silvertides in Marapur and look at the beaver pen.",
    // TibiaWiki BR illustrates this change with exactly these two pictures, captioned
    // "Giant Beavers presos no cercado" and "Giant Beavers soltos". They are the only two
    // things there are to see, which is why the change needs no state beyond them.
    // Source: tibiawiki.com.br/wiki/Mini_World_Changes § Beaver Breakout.
    observations: [
      { id: "loose", label: "The beavers are out of the pen", establishes: "active" },
      { id: "penned", label: "The beavers are still penned", establishes: "inactive" },
    ],
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description:
      "The Giant Beavers break out of their pen at Silvertides. Nothing announces this. The World Board and the Towncryer are both silent on it, so a complete board reading says nothing either way.",
  },
  {
    id: "shipwrecked",
    name: "Shipwrecked",
    // No English TibiaWiki article — only TibiaWiki BR documents this silent change.
    wikiTitle: null,
    shortLabel: "Shipwrecked",
    emoji: "🏝️",
    location: "North coast of Krailos",
    briefingLocations: ["Krailos"],
    variants: [],
    variantKind: null,
    detection: "silent",
    howToCheck:
      "Look at the north coast of Krailos. With Krailos fully revealed by the Measuring Tibia Quest you can read it off the map, without travelling.",
    // Either the wreck is on the coast with pirates all over the steppe, or it is not; the
    // wiki documents no stage between them. The second way of looking is real and worth
    // keeping in the instruction: a player who has finished the Measuring Tibia Quest reads
    // the answer off their map instead of sailing to Krailos.
    // Source: tibiawiki.com.br/wiki/Mini_World_Changes § Shipwrecked.
    observations: [
      { id: "wrecked-ship", label: "A wrecked ship, pirates on the steppe", establishes: "active" },
      { id: "clear-coast", label: "The coast is clear, no pirates", establishes: "inactive" },
    ],
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description:
      "A wrecked pirate ship washes up on Krailos' north coast, filling the steppe with pirates. The game's best Pirate Corsair respawn while it lasts. Neither announcement source reports it.",
  },
  {
    id: "forsaken",
    name: "Forsaken",
    // Not documented as a Mini World Change; the mine itself is the article.
    wikiTitle: "Forsaken Mine",
    shortLabel: "Forsaken",
    emoji: "⛏️",
    location: "Forsaken Mine, south of Ab'Dendriel",
    briefingLocations: ["Forsaken Mine"],
    variants: [
      { id: "rorcs", label: "Rorcs" },
      { id: "leaf-golems", label: "Leaf Golems & Forest Furies" },
      { id: "cyclopes", label: "Cyclopes" },
      { id: "lost-dwarves", label: "Drillworms & Lost Dwarves" },
    ],
    variantKind: "phase",
    detection: "always-active",
    howToCheck:
      "Enter the mine and look down from the first floor before descending. The second floor's creatures tell you which rotation is in effect.",
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description:
      "The Forsaken Mine's inhabitants rotate at every server save between four creature sets. It is never 'off'. The only question is which set is down there, and only looking answers it. The Drillworm/Lost Dwarf rotation is far harder than the other three.",
  },
  {
    id: "chyllfroest",
    name: "Chyllfroest",
    shortLabel: "Chyllfroest",
    emoji: "🥶",
    location: "Chyllfroest",
    variants: [],
    variantKind: null,
    detection: "announced",
    boardNamesVariant: false,
    towncryerNamesVariant: false,
    description: "An ice bridge connects Svargrond to the frosty island of Chyllfroest.",
  },
];

export const MINI_WORLD_CHANGES_BY_ID = new Map(
  MINI_WORLD_CHANGE_DEFINITIONS.map((def) => [def.id, def]),
);

/**
 * The changes nothing in the game announces: Beaver Breakout, Shipwrecked and Forsaken.
 *
 * `silent` and `always-active` are different mechanics — the beavers and the wreck are either
 * there or not, while the Forsaken Mine is never off and only rotates — but they share the one
 * property the bulletin has to act on: **no source reports them.** The World Board never
 * mentioned them, so a complete board reading cannot rule them out, and the Towncryer never
 * shouts them. Somebody has to go and look, every day, at all three.
 *
 * That is why they are the section's permanent residents. For an announced change, absence
 * from the bulletin means the board would have said so and did not; for these three it would
 * mean nothing at all, and a reader cannot tell "nobody looked" from "nothing is happening"
 * unless the bulletin says which. So they get a line every day, and on a day nobody has looked
 * the line says exactly that.
 *
 * A predicate rather than a hardcoded list of three ids, so a fourth undocumented change added
 * to the catalog joins them the day it is added.
 */
export function isUnannounced(definition: MiniWorldChangeDefinition): boolean {
  return definition.detection !== "announced";
}

export function createDefaultMiniWorldChangeValues(): Record<string, MiniWorldChangeValue> {
  const values: Record<string, MiniWorldChangeValue> = {};
  for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
    values[def.id] = {
      id: def.id,
      // An always-active change starts out active, because that is simply true of the game
      // — the Forsaken Mine is always inhabited. What is unknown is which rotation, which
      // `variantId: null` says exactly. Calling it "unchecked" would imply the player might
      // discover it isn't happening, which can never occur.
      status: def.detection === "always-active" ? "active" : "unchecked",
      variantId: null,
      updatedAt: null,
    };
  }
  return values;
}
