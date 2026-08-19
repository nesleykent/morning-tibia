import type { MiniWorldChangeDefinition, MiniWorldChangeValue } from "@/types/miniWorldChange";

/**
 * Bibby's Bloodbath ship event only ever anchors at one of these 3 spots (TibiaWiki,
 * "Bibby Bloodbath"). A closed list, not the general-purpose COMMON_LOCATIONS catalog —
 * anywhere else is not a valid reading of the board text.
 */
export const BIBBY_BLOODBATH_LOCATIONS = ["Carlin", "Femor Hills", "Jakundaf Desert"] as const;

/**
 * Every spot Noodles the pig has ever been documented fleeing to (TibiaWiki, "Noodles").
 * Closed for the same reason as Bibby's list above.
 */
export const NOODLES_LOCATIONS = [
  "West of Greenshore",
  "Northwest of Thais",
  "Around Royal Castle",
  "Royal Castle Kitchen",
  "West of Royal Castle",
  "East of Thais, near Hoggle's house",
  "East of Thais",
  "Northeast of Snake Tower",
  "South Thais exit",
  "South of Thais, near Wolf Dungeon",
  "White Flower Temple",
  "South of Thais, near Minotaur Camp",
  "Cyclops Camp",
] as const;

/**
 * Mini World Changes — announced on the World Board at the Adventurer's Guild, floor +1,
 * near Charos (see lib/parser/boardMessages.ts for the verbatim board text catalog, from
 * TibiaWiki's "The World Board" article). Distinct from "World Changes"
 * (lib/defaults/worldChanges.ts), which are a different mechanic checked via Guide NPC —
 * do not merge the two lists.
 *
 * Every entry's board text is either `coverage: "full"` (the board always gives the
 * complete state — which stage, or which of a known, finite set of locations — so the
 * card is read-only, populated only via the import panel) or `coverage: "partial"` (the
 * board only confirms the change is active, without the exact stage/location, so that
 * detail stays user-editable after import).
 *
 * Three entries that were previously here are deliberately NOT Mini World Changes and
 * have been removed after verifying against TibiaWiki:
 * - "Roshamuul" is a permanent town unlocked by a quest, not a Board-announced or
 *   Guide-NPC-checked mechanic at all.
 * - "Overhunting Creature" is actually a *World Change* (Guide NPC keyword
 *   "Overhunting") — already correctly modeled as "overhunting-deer" in
 *   lib/defaults/worldChanges.ts.
 * - "Dream Courts Arena Boss" is a distinct "Boss of the Day" system with no Board text
 *   or Guide NPC keyword — not trackable by either mechanic.
 *
 * The 24th canonical Mini World Change, "Oriental Trader" (Yasir travels between Carlin,
 * Liberty Bay, and Ankrahmun), isn't modeled as its own card here — its board message is
 * parsed as a merchant hint straight into Yasir's location instead (see
 * lib/parser/boardMessages.ts and components/dashboard/MerchantCard.tsx), since that's the
 * field it actually feeds. It still follows the same evidence rules as every other entry
 * here: the board message means "active, city pending" until a candidate is picked, and a
 * complete board reading that omits the message means Yasir is confirmed not currently
 * trading (see Merchant.activityState in types/merchant.ts and parseBoardLog's
 * inactiveMerchantIds) — never rendered as merely "unknown" in either case.
 *
 * Devovorga Essence, Chakoya Iceberg, "Fire from the Earth" (Goroma Volcano), and Thawing
 * were previously modeled with `controlType: "stage"` / `coverage: "partial"`, assuming
 * multi-stage escalation like Horestis or Awash. Re-verified against TibiaWiki (current
 * pages + full revision history): none of the four actually has stages — each is a plain
 * active/inactive toggle at a fixed location, and the single board message per event
 * already gives the complete state. Only Bibby's Bloodbath and Noodles remain genuinely
 * `"partial"` — their board text confirms activity but never names a location, confirmed
 * across every revision the page has ever had.
 */
export const MINI_WORLD_CHANGE_DEFINITIONS: MiniWorldChangeDefinition[] = [
  {
    id: "fury-gate",
    label: "Fury Gate",
    shortLabel: "Fury Gate",
    emoji: "🔥",
    category: "gate",
    controlType: "toggle",
    coverage: "full",
    description: "Whether the Fury Gate in Feyrist is currently open.",
  },
  {
    id: "hive-outpost",
    label: "Hive Outpost",
    shortLabel: "Hive Outpost",
    emoji: "👾",
    category: "hive",
    controlType: "toggle",
    coverage: "full",
    description: "Whether a Hive infestation has been sighted south-west of Liberty Bay.",
  },
  {
    id: "bibbys-bloodbath",
    label: "Bibby's Bloodbath",
    shortLabel: "Bibby's",
    emoji: "🏴‍☠️",
    category: "rotation",
    controlType: "location",
    coverage: "partial",
    description: "Current location of the Bibby's Bloodbath ship event.",
    suggestions: BIBBY_BLOODBATH_LOCATIONS,
  },
  {
    id: "devovorga-essence",
    label: "Devovorga Essence",
    shortLabel: "Devovorga",
    emoji: "🧪",
    category: "rotation",
    controlType: "toggle",
    coverage: "full",
    description:
      "Whether Devovorga's essence is available at Vengoth to enter its lair (a genuine Mini World Change, distinct from the seasonal Rise of Devovorga event) — a single active/inactive toggle, no stages.",
  },
  {
    id: "big-iceberg",
    label: "Chakoya Iceberg",
    shortLabel: "Iceberg",
    emoji: "🧊",
    category: "rotation",
    controlType: "toggle",
    coverage: "full",
    description: "Whether the big iceberg is washed up at the coast north of Port Hope — a single active/inactive toggle, no stages.",
  },
  {
    id: "spirit-gate",
    label: "Spirit Gate",
    shortLabel: "Spirit Gate",
    emoji: "🌀",
    category: "gate",
    controlType: "location",
    coverage: "full",
    description: "Where the current Spirit Gate is open — Darama, Ghostlands, or Vengoth.",
    suggestions: ["Darama", "Ghostlands", "Vengoth"],
  },
  {
    id: "nightmare-isles",
    label: "Nightmare Isles",
    shortLabel: "Nightmare Isles",
    emoji: "🌑",
    category: "rotation",
    controlType: "location",
    coverage: "full",
    description: "Where the Nightmare Isles portal currently is, when accessible.",
    suggestions: [
      "Darama's northernmost coast",
      "River near Drefia",
      "Ankrahmun tar pits",
    ],
  },
  {
    id: "goroma-volcano",
    label: "Fire from the Earth (Goroma Volcano)",
    shortLabel: "Fire from the Earth",
    emoji: "🌋",
    category: "rotation",
    controlType: "toggle",
    coverage: "full",
    description:
      "Whether the Hellgore volcano on Goroma is erupting (canonical TibiaWiki name: \"Fire from the Earth\") — a single active/inactive toggle, no stages.",
  },
  {
    id: "darama-nomads",
    label: "Darama Nomads",
    shortLabel: "Darama",
    emoji: "🐫",
    category: "rotation",
    controlType: "toggle",
    coverage: "full",
    description: "Whether the nomad camp is active in Kha'labal, north of Ankrahmun's desert — a fixed spot, not a rotating one.",
  },
  {
    id: "bored-witch",
    label: "Bored Witch",
    shortLabel: "Bored Witch",
    emoji: "🧙",
    category: "rotation",
    controlType: "toggle",
    coverage: "full",
    description: "Whether Witch Wyda is currently bored (visitable) or not.",
  },
  {
    id: "noodles",
    label: "Noodles",
    shortLabel: "Noodles",
    emoji: "🍜",
    category: "rotation",
    controlType: "location",
    coverage: "partial",
    description: "Current location of the Noodles NPC.",
    suggestions: NOODLES_LOCATIONS,
  },
  {
    id: "thais-kingsday",
    label: "Thais Kingsday",
    shortLabel: "Kingsday",
    emoji: "👑",
    category: "seasonal",
    controlType: "toggle",
    coverage: "full",
    description: "Whether the Thais Kingsday festivities are currently active.",
  },
  {
    id: "thawing",
    label: "Thawing",
    shortLabel: "Thawing",
    emoji: "❄️",
    category: "seasonal",
    controlType: "toggle",
    coverage: "full",
    description:
      "Whether enough snow has melted near Svargrond to reveal Ice Flowers — a single active/inactive toggle (Ice Flowers are the reward, not a separate stage or mechanic).",
  },
  {
    id: "spiders-nest",
    label: "Spider's Nest",
    shortLabel: "Spider's Nest",
    emoji: "🕷️",
    category: "hunt",
    controlType: "toggle",
    coverage: "full",
    description: "Whether the Spider's Nest task area is currently active.",
  },
  {
    id: "poacher-caves",
    label: "Poacher Caves",
    shortLabel: "Poacher Caves",
    emoji: "🏹",
    category: "hunt",
    controlType: "stage",
    coverage: "full",
    description:
      "Dominance phase north of the Green Claw Swamp: Stage 1 game dominates, Stage 2 poachers dominate, Stage 3 vengeful ghost wolves dominate.",
  },
  {
    id: "jungle-camp",
    label: "Jungle Camp",
    shortLabel: "Jungle Camp",
    emoji: "🏕️",
    category: "hunt",
    controlType: "toggle",
    coverage: "full",
    description: "Whether hunters and dworcs are fighting over Trapwood's holy grounds.",
  },
  {
    id: "grimvale",
    label: "Grimvale",
    shortLabel: "Grimvale",
    emoji: "🌲",
    category: "seasonal",
    controlType: "toggle",
    coverage: "full",
    description: "Whether the full moon effect is active on the island of Grimvale.",
  },
  {
    id: "stampede",
    label: "Stampede",
    shortLabel: "Stampede",
    emoji: "🐘",
    category: "rotation",
    controlType: "toggle",
    coverage: "full",
    description: "Whether Tiquanda's elephants have been stirred into a stampede.",
  },
  {
    id: "bank-robbery",
    label: "Bank Robbery",
    shortLabel: "Bank Robbery",
    emoji: "💰",
    category: "rotation",
    controlType: "toggle",
    coverage: "full",
    description: "Whether banks in major coastal towns are currently being robbed.",
  },
  {
    id: "river-runs-deep",
    label: "River Runs Deep",
    shortLabel: "River Runs Deep",
    emoji: "🎣",
    category: "rotation",
    controlType: "toggle",
    coverage: "full",
    description: "Whether the Zao Steppe river currently has more fish than usual.",
  },
  {
    id: "lumberjack",
    label: "Lumberjack",
    shortLabel: "Lumberjack",
    emoji: "🪓",
    category: "rotation",
    controlType: "toggle",
    coverage: "full",
    description: "Whether the Queen's royal trees are currently being cut down.",
  },
  {
    id: "down-the-drain",
    label: "Down the Drain",
    shortLabel: "Down the Drain",
    emoji: "🌊",
    category: "rotation",
    controlType: "toggle",
    coverage: "full",
    description: "Whether the river south of the outlaw camp is flooding a reachable island.",
  },
  {
    id: "chyllfroest",
    label: "Chyllfroest",
    shortLabel: "Chyllfroest",
    emoji: "🥶",
    category: "rotation",
    controlType: "toggle",
    coverage: "full",
    description: "Whether the ice bridge from Svargrond to the frosty island is open.",
  },
];

export function createDefaultMiniWorldChangeValues(): Record<string, MiniWorldChangeValue> {
  const values: Record<string, MiniWorldChangeValue> = {};
  for (const def of MINI_WORLD_CHANGE_DEFINITIONS) {
    values[def.id] = {
      id: def.id,
      state: "unknown",
      detail: "",
      updatedAt: null,
    };
  }
  return values;
}
