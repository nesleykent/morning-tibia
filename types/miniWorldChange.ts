/**
 * A Mini World Change is a small daily/rotating world state that Tibia does not expose
 * through any public API (fansites traditionally read it off in-game board text). Each
 * definition declares which kind of inline control should edit it; the value is always
 * manual/local, seeded with a sensible "unknown" default.
 */
export type MiniWorldChangeControlType = "toggle" | "stage" | "location" | "creature" | "boss";

export type MiniWorldChangeState =
  | "active"
  | "inactive"
  | "stage1"
  | "stage2"
  | "stage3"
  | "location"
  | "creature"
  | "boss"
  | "unknown";

export type MiniWorldChangeCategory =
  | "gate"
  | "hive"
  | "arena"
  | "rotation"
  | "hunt"
  | "seasonal";

/**
 * "guide-npc" items have a documented, exact Guide NPC reply for every state (see
 * lib/parser/guideMessages.ts) — those are populated by pasting a chat log above and are
 * read-only in the grid. "manual" items have no such source (no public API or
 * consistently-worded NPC/board text covers them) and stay directly editable.
 */
export type MiniWorldChangeSource = "manual" | "guide-npc";

export interface MiniWorldChangeDefinition {
  id: string;
  label: string;
  shortLabel: string;
  emoji: string;
  category: MiniWorldChangeCategory;
  controlType: MiniWorldChangeControlType;
  source: MiniWorldChangeSource;
  description: string;
  /** Suggested options for "location" / "creature" / "boss" control types, if any are known. */
  suggestions?: string[];
}

export interface MiniWorldChangeValue {
  id: string;
  state: MiniWorldChangeState;
  /** Free-text detail — a place name, creature name, or extra note depending on controlType. */
  detail: string;
  updatedAt: string | null;
}
