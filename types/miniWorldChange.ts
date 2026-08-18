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

export interface MiniWorldChangeDefinition {
  id: string;
  label: string;
  shortLabel: string;
  emoji: string;
  category: MiniWorldChangeCategory;
  controlType: MiniWorldChangeControlType;
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
