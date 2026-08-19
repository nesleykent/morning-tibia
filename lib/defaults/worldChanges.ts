import type { WorldChangeDefinition, WorldChangeValue } from "@/types/worldChange";

/**
 * World Changes — a larger, longer-running mechanic checked in-game by asking a Guide NPC
 * one of a fixed set of keywords, per TibiaWiki's "World Changes" article. Distinct from
 * "Mini World Changes" (lib/defaults/miniWorldChanges.ts), which are announced on the
 * World Board instead — do not merge the two lists. Every entry here has at least one
 * documented, verbatim Guide NPC reply (lib/parser/guideMessages.ts) and is source:
 * "guide-npc" — populated only by pasting a chat log (several only have partial state
 * coverage documented — see their description).
 *
 * "Insectoid Invasion" is deliberately NOT listed here even though TibiaWiki files it
 * under the "World Changes" article: it has no Guide NPC keyword at all — confirmed both
 * by Guide Elena's own in-game keyword list and by players who tried and failed to find
 * one (see e.g. tibiaqa.com/11906). It's a legacy, pre-Mini-World-Changes-era mechanic
 * (Version 9.10) that behaves like an MWC (random, unannounced) but isn't in Tibiopedia's
 * official 24-item MWC catalog either — it doesn't fit either category, so it's left out
 * rather than misfiled under one with an implied check method it doesn't have.
 */
export const WORLD_CHANGE_DEFINITIONS: WorldChangeDefinition[] = [
  {
    id: "horestis",
    label: "Horestis (The Mummy's Curse)",
    shortLabel: "Horestis",
    emoji: "🏺",
    controlType: "stage",
    source: "guide-npc",
    description:
      "Horestis cycle near Ankrahmun: Inactive slumbering, Stage 1 risen (killable), Stage 2 killed/desecrated, Stage 3 curse ending.",
  },
  {
    id: "mage-tower",
    label: "The Mage's Tower",
    shortLabel: "Mage Tower",
    emoji: "🗼",
    controlType: "toggle",
    source: "guide-npc",
    description: "Whether the Raging Mage's portal is currently active in Zao Steppe.",
  },
  {
    id: "masters-voice",
    label: "Their Master's Voice",
    shortLabel: "Master's Voice",
    emoji: "📯",
    controlType: "toggle",
    source: "guide-npc",
    description:
      "Whether the Mad Mage Dungeon in Edron is accessible. Only the \"unavailable\" reply is documented, so only that state auto-detects.",
  },
  {
    id: "swamp-fever",
    label: "Swamp Fever",
    shortLabel: "Swamp Fever",
    emoji: "🦟",
    controlType: "toggle",
    source: "guide-npc",
    description:
      "Whether the swamp fever near Venore is under control. Only the calm \"under control\" reply is documented, so only that state auto-detects.",
  },
  {
    id: "thornfire",
    label: "Thornfire",
    shortLabel: "Thornfire",
    emoji: "🌵",
    controlType: "stage",
    source: "guide-npc",
    description:
      "Shadowthorn firestarter containment: Stage 1 guarded, Stage 2 breaking out, Stage 3 burning, Stage 2 (recovering) once the fire is being fought back.",
  },
  {
    id: "twisted-waters",
    label: "Twisted Waters",
    shortLabel: "Twisted Waters",
    emoji: "💧",
    controlType: "stage",
    source: "guide-npc",
    description: "Cleanliness of the great lake near Port Hope — Inactive clean, Stage 3 dirty & exhausted.",
  },
  {
    id: "awash",
    label: "Awash",
    shortLabel: "Awash",
    emoji: "⛏️",
    controlType: "stage",
    source: "guide-npc",
    description: "Kazordoon mine-tunnel drainage cycle (Deepling Scouts access).",
  },
  {
    id: "steamship",
    label: "Steamship",
    shortLabel: "Steamship",
    emoji: "🚢",
    controlType: "stage",
    source: "guide-npc",
    description: "Thais–Kazordoon steamship service status.",
  },
  {
    id: "horse-station",
    label: "Horse Station",
    shortLabel: "Horse Station",
    emoji: "🐴",
    controlType: "toggle",
    source: "guide-npc",
    description:
      "Whether horses have escaped near Thais and rental is on hold. Only the \"escaped\" reply is documented, so only that state auto-detects.",
  },
  {
    id: "overhunting-deer",
    label: "Overhunting — White Deer",
    shortLabel: "White Deer",
    emoji: "🦌",
    controlType: "stage",
    source: "guide-npc",
    description: "White Deer / starving wolves population cycle near Ab'Dendriel.",
  },
  {
    id: "demon-war",
    label: "Demon War",
    shortLabel: "Demon War",
    emoji: "😈",
    controlType: "stage",
    source: "guide-npc",
    description:
      "Shaburak vs. Askarak control of the Hero Cave complex — the winning faction goes in the detail note.",
  },
  {
    id: "sea-serpent",
    label: "The Fire-Feathered Serpent",
    shortLabel: "Sea Serpent",
    emoji: "🐍",
    controlType: "stage",
    source: "guide-npc",
    description: "Current stage of the Fire-Feathered Serpent event at Seacrest Grounds.",
  },
  {
    id: "deeplings",
    label: "Deeplings",
    shortLabel: "Deeplings",
    emoji: "🐙",
    controlType: "stage",
    source: "guide-npc",
    description: "Current stage of the Deeplings invasion at Quirefang.",
  },
  {
    id: "hive-born",
    label: "Hive Born",
    shortLabel: "Hive Born",
    emoji: "👾",
    controlType: "stage",
    source: "guide-npc",
    description: "Current stage of the Hive Born invasion cycle at Quirefang.",
  },
];

export function createDefaultWorldChangeValues(): Record<string, WorldChangeValue> {
  const values: Record<string, WorldChangeValue> = {};
  for (const def of WORLD_CHANGE_DEFINITIONS) {
    values[def.id] = {
      id: def.id,
      state: "unknown",
      detail: "",
      updatedAt: null,
    };
  }
  return values;
}
