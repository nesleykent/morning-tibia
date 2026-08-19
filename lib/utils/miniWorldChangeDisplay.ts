import type { MiniWorldChangeControlType, MiniWorldChangeState } from "@/types/miniWorldChange";

const STAGE_ORDINAL: Partial<Record<MiniWorldChangeState, string>> = {
  stage1: "Stage 1",
  stage2: "Stage 2",
  stage3: "Stage 3",
};

export type StatusBadgeVariant =
  | "active"
  | "inactive"
  | "stage1"
  | "stage2"
  | "stage3"
  | "unknown"
  | "gold";

export function stateBadgeVariant(state: MiniWorldChangeState): StatusBadgeVariant {
  if (state === "active") return "active";
  if (state === "inactive") return "inactive";
  if (state === "stage1" || state === "stage2" || state === "stage3") return state;
  if (state === "location" || state === "creature" || state === "boss") return "gold";
  return "unknown";
}

export function stateBadgeLabel(
  state: MiniWorldChangeState,
  controlType: MiniWorldChangeControlType,
  detail: string,
): string {
  if (state === "unknown") return "Unknown";
  if (state === "active") {
    // "active" on a location/creature/boss entry means confirmed active but the exact
    // detail isn't known yet — distinct from a plain toggle's "active", and never the
    // same badge as "unknown" (no evidence at all).
    if (controlType === "location") return "Active — pending location";
    if (controlType === "creature") return "Active — pending creature";
    if (controlType === "boss") return "Active — pending boss";
    return "Active";
  }
  if (state === "inactive") return "Inactive";
  if (state === "stage1" || state === "stage2" || state === "stage3") return STAGE_ORDINAL[state]!;
  if (controlType === "location") return detail.trim() || "Location set";
  if (controlType === "creature") return detail.trim() || "Creature set";
  if (controlType === "boss") return detail.trim() || "Boss set";
  return "Unknown";
}

export function stateForDetailValue(
  controlType: MiniWorldChangeControlType,
  detail: string,
): MiniWorldChangeState {
  if (detail.trim().length === 0) return "unknown";
  if (controlType === "location") return "location";
  if (controlType === "creature") return "creature";
  if (controlType === "boss") return "boss";
  return "unknown";
}
