import type { WorldChangeDefinition, WorldChangeValue } from "@/types/worldChange";

/**
 * The 14 World Changes a player can check in game, one per official Guide NPC keyword.
 *
 * The keyword list is not invented: greet any Guide NPC and say "world change" (or
 * "keyword") and they answer with it verbatim — "Valid keywords are: Horestis, Mage Tower,
 * Master's Voice, Swamp Fever, Thornfire, Twisted Waters, Awash, Steamship, Horses,
 * Overhunting, Demon War, Sea Serpent, Deepling or Hive." TibiaWiki's World Changes
 * article quotes the same 14 and links CipSoft's original announcement.
 *
 * TibiaWiki's article lists a 15th World Change, **Insectoid Invasion** (Greenshore,
 * version 9.10). It is deliberately not tracked here: it has no Guide keyword, so there is
 * no way for a player to check it remotely, and a card that can only ever read "unchecked"
 * would be noise. It is not a Mini World Change either (it isn't in the 24-item MWC list
 * and has no World Board or Towncryer message), so it is documented in the README rather
 * than misfiled under a mechanic whose check method it doesn't have.
 *
 * `states` is each change's documented cycle, in order. Every state listed here has real
 * Guide reply text behind it in lib/parser/guideMessages.ts — the catalog and the parser
 * are kept in step by a test. A World Change is always in exactly one of these states;
 * there is no separate "active/inactive" flag, because the game has no such thing (see the
 * modelling note in types/worldChange.ts).
 */
export const WORLD_CHANGE_DEFINITIONS: WorldChangeDefinition[] = [
  {
    id: "horestis",
    name: "The Mummy's Curse",
    shortLabel: "Horestis",
    emoji: "🏺",
    guideKeyword: "Horestis",
    location: "Horestis Tomb, near Ankrahmun",
    description:
      "Pharaoh Horestis' cycle: he slumbers, rises to be killed, is desecrated, and his curse then fades.",
    states: [
      { id: "slumbering", label: "Slumbering in his tomb", quiet: true },
      { id: "risen", label: "Risen, killable" },
      { id: "desecrated", label: "Desecrated, curse over Ankrahmun" },
      { id: "curse-ended", label: "Curse ended, minions recovering" },
    ],
  },
  {
    id: "mage-tower",
    name: "The Mage's Tower",
    shortLabel: "Mage Tower",
    emoji: "🗼",
    guideKeyword: "Mage Tower",
    location: "Zao Steppe, and another dimension",
    description:
      "The Raging Mage holds the dimensional portal open while he lives; killing him collapses it until the next server save.",
    states: [
      { id: "portal-open", label: "Mage at his tower, portal open" },
      { id: "mage-slain", label: "Mage slain, portal closing", quiet: true },
    ],
  },
  {
    id: "masters-voice",
    name: "Their Master's Voice",
    shortLabel: "Master's Voice",
    emoji: "📯",
    guideKeyword: "Master's Voice",
    location: "Mad Mage Dungeon, Edron",
    description: "Whether the slime-covered servant tower on Edron can be entered.",
    states: [
      { id: "passable", label: "Covered in slime, passable" },
      { id: "impassable", label: "Severe slime outbreak, impassable", quiet: true },
    ],
  },
  {
    id: "swamp-fever",
    name: "Swamp Fever",
    shortLabel: "Swamp Fever",
    emoji: "🦟",
    guideKeyword: "Swamp Fever",
    location: "Venore",
    description:
      "Whether Venore's swamp fever is contained. Medicine pouches handed to Ottokar each day keep it under control.",
    states: [{ id: "under-control", label: "Under control, medicine for everyone", quiet: true }],
  },
  {
    id: "thornfire",
    name: "Thornfire",
    shortLabel: "Thornfire",
    emoji: "🌵",
    guideKeyword: "Thornfire",
    location: "Shadowthorn",
    description:
      "The Shadowthorn firestarters' containment cycle, from guarded cells to the village burning and back.",
    alternativeSource: "Pyro Peter in Venore also reports the state of Shadowthorn.",
    states: [
      { id: "guarded", label: "Firestarters safely guarded", quiet: true },
      { id: "breaking-out", label: "Guards slain, breaking out" },
      { id: "burning", label: "Shadowthorn burns" },
      { id: "being-fought", label: "Burning, but the fire is being fought back" },
    ],
  },
  {
    id: "twisted-waters",
    name: "Twisted Waters",
    shortLabel: "Twisted Waters",
    emoji: "💧",
    guideKeyword: "Twisted Waters",
    location: "Lake Equivocolao, north of Port Hope",
    description: "How polluted the great lake near Port Hope is, which decides whether shimmer swimmers appear.",
    states: [
      { id: "clean", label: "Clean", quiet: true },
      { id: "turning", label: "Corpses piling up, about to turn dirty" },
      { id: "dirty-swimmers", label: "Dirty, shimmer swimmers present" },
      { id: "dirty-exhausted", label: "Dirty, no shimmer swimmers left" },
    ],
  },
  {
    id: "awash",
    name: "Awash",
    shortLabel: "Awash",
    emoji: "⛏️",
    guideKeyword: "Awash",
    location: "Kazordoon",
    description:
      "Whether the Kazordoon mine tunnels are drained, which opens the Deepling Scout mines and the Kazordoon boat routes.",
    states: [
      { id: "flooded", label: "Flooded, coal needed", quiet: true },
      { id: "flooded-coal-delivered", label: "Flooded, coal delivered, pumps running" },
      { id: "drained-quota-met", label: "Drained, today's deepling quota met" },
      { id: "drained-quota-open", label: "Drained, deeplings trying to reflood" },
      { id: "overrun", label: "Overrun, the tunnels will flood" },
    ],
  },
  {
    id: "steamship",
    name: "Steamship",
    shortLabel: "Steamship",
    emoji: "🚢",
    guideKeyword: "Steamship",
    location: "Thais",
    description: "Whether the Thais–Kazordoon steamship is running.",
    states: [
      { id: "not-running", label: "Not running, coal needed", quiet: true },
      { id: "coal-delivered", label: "Coal delivered, starts tomorrow" },
    ],
  },
  {
    id: "horse-station",
    name: "Horse Station",
    shortLabel: "Horse Station",
    emoji: "🐴",
    guideKeyword: "Horses",
    location: "East of Thais, west of Venore",
    description:
      "Either the horses are confined and rentable, or they have escaped. While they are loose, wild horses spawn and can be tamed.",
    states: [
      { id: "normal", label: "Service running normally", quiet: true },
      { id: "escaped", label: "Horses on the loose, service on hold" },
    ],
  },
  {
    id: "overhunting",
    name: "Overhunting",
    shortLabel: "Overhunting",
    emoji: "🦌",
    guideKeyword: "Overhunting",
    location: "Forests around Ab'Dendriel, and near Carlin and the Orc Fortress",
    description:
      "The white deer population cycle. Overhunt them and they leave, and starving wolves take their place.",
    states: [
      { id: "stable", label: "White deer roaming, population stable" },
      { id: "dwindling", label: "Population dwindling" },
      { id: "leaving", label: "Overhunted, deer leaving the region" },
      { id: "wolves", label: "Starving wolves, no deer will return" },
    ],
  },
  {
    id: "demon-war",
    name: "Demon Wars",
    shortLabel: "Demon War",
    emoji: "😈",
    guideKeyword: "Demon War",
    location: "Hero Cave, Edron",
    description: "Which demon faction controls the Hero Cave complex, Shaburak or Askarak.",
    states: [
      { id: "stalemate", label: "Stalemate", quiet: true },
      { id: "shaburak-advantage", label: "Shaburak in advantage" },
      { id: "shaburak-dominant", label: "Shaburak dominate the complex" },
      { id: "askarak-advantage", label: "Askarak in advantage" },
      { id: "askarak-dominant", label: "Askarak dominate the complex" },
    ],
  },
  {
    id: "sea-serpent",
    name: "The Fire-Feathered Serpent",
    shortLabel: "Sea Serpent",
    emoji: "🐍",
    guideKeyword: "Sea Serpent",
    location: "Seacrest Grounds",
    description: "The Fire-Feathered Serpent's sleep cycle at the Seacrest Grounds.",
    states: [
      { id: "asleep", label: "Fast asleep", quiet: true },
      { id: "dreaming", label: "Dreaming, the earth bleeds lava" },
      { id: "awake", label: "Awake, Renegade Quara control sunken Oramond" },
    ],
  },
  {
    id: "deeplings",
    name: "Deeplings",
    shortLabel: "Deeplings",
    emoji: "🐙",
    guideKeyword: "Deepling",
    location: "Quirefang",
    description: "How far the assault into the deepling territory at Quirefang has reached.",
    states: [
      { id: "hiding", label: "Creatures of the deep hiding", quiet: true },
      { id: "floodgates-open", label: "Floodgates to the Drowned Library open" },
      { id: "arcanum-breached", label: "Inner arcanum breached" },
    ],
  },
  {
    id: "hive-born",
    name: "Hive Born",
    shortLabel: "Hive Born",
    emoji: "🐝",
    guideKeyword: "Hive",
    location: "Quirefang",
    description: "How far the hive's defences at Quirefang have been broken down.",
    states: [
      { id: "defended", label: "Hive well defended", quiet: true },
      { id: "breached", label: "Defences breached, east structure open" },
      { id: "fallen", label: "Defences fallen, all structures open" },
    ],
  },
];

export const WORLD_CHANGES_BY_ID = new Map(
  WORLD_CHANGE_DEFINITIONS.map((def) => [def.id, def]),
);

/** The official keyword list, in the order Guide NPCs recite it. */
export const GUIDE_KEYWORDS = WORLD_CHANGE_DEFINITIONS.map((def) => def.guideKeyword);

export function createDefaultWorldChangeValues(): Record<string, WorldChangeValue> {
  const values: Record<string, WorldChangeValue> = {};
  for (const def of WORLD_CHANGE_DEFINITIONS) {
    values[def.id] = { id: def.id, stateId: null, updatedAt: null };
  }
  return values;
}
