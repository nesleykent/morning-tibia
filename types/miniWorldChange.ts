/**
 * A Mini World Change: the small daily/rotating world states announced on the World
 * Board at the Adventurer's Guild (Adventurer's Island). Tibia exposes none of these
 * through a public API — the World Board's own text is the only source, so every value
 * here is manual/local, seeded to "unknown" until the user fills it in (either by hand or
 * by pasting the board's server log into the import panel — see lib/parser/boardMessages.ts).
 *
 * This is a distinct game mechanic from "World Changes" (types/worldChange.ts), which are
 * checked via a Guide NPC instead — see World_Changes vs Mini_World_Changes on TibiaWiki.
 * Do not merge the two lists.
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
  suggestions?: readonly string[];
  /**
   * "full" — the World Board's own text always gives the complete state (which stage, or
   * which of a known set of locations), so this is read-only, populated only by pasting
   * the board log. "partial" — the board only confirms the change is active without the
   * exact detail (a stage, or an unlisted location), so the detail stays user-editable
   * after import.
   */
  coverage: "full" | "partial";
}

export interface MiniWorldChangeValue {
  id: string;
  state: MiniWorldChangeState;
  /** Free-text detail — a place name, creature name, or extra note depending on controlType. */
  detail: string;
  updatedAt: string | null;
}
