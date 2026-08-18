import type { MiniWorldChangeControlType, MiniWorldChangeState } from "./miniWorldChange";

/**
 * A World Change: a larger, longer-running Tibia game mechanic checked in-game by asking
 * a Guide NPC one of a fixed set of keywords (Horestis, Mage Tower, Awash, Hive, …) —
 * distinct from the smaller "Mini World Changes" announced on the World Board
 * (types/miniWorldChange.ts). Do not merge the two lists; they're different game
 * mechanics with different in-game sources (see TibiaWiki's World_Changes article).
 *
 * "guide-npc" items have a documented, exact Guide NPC reply for every state (see
 * lib/parser/guideMessages.ts) and are populated only by pasting a chat log in the import
 * panel — read-only in the grid. "manual" items have no such documented text (TibiaWiki
 * doesn't quote a verbatim Guide reply for them) and stay directly editable.
 */
export type WorldChangeControlType = MiniWorldChangeControlType;
export type WorldChangeState = MiniWorldChangeState;
export type WorldChangeSource = "manual" | "guide-npc";

export interface WorldChangeDefinition {
  id: string;
  label: string;
  shortLabel: string;
  emoji: string;
  controlType: WorldChangeControlType;
  source: WorldChangeSource;
  description: string;
  suggestions?: string[];
}

export interface WorldChangeValue {
  id: string;
  state: WorldChangeState;
  detail: string;
  updatedAt: string | null;
}
