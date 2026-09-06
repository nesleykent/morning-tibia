import type {
  MiniWorldChangeDefinition,
  MiniWorldChangeStatus,
  MiniWorldChangeValue,
  MiniWorldChangeVariantKind,
} from "@/types/miniWorldChange";

export type StatusBadgeVariant = "active" | "inactive" | "unknown" | "gold";

export function statusBadgeVariant(
  definition: MiniWorldChangeDefinition,
  value: MiniWorldChangeValue,
): StatusBadgeVariant {
  if (value.status === "inactive") return "inactive";
  if (value.status === "unchecked") return "unknown";
  // Active but the variant that decides where/what is still open — worth its own colour so
  // it doesn't read as a finished answer.
  if (definition.variants.length > 0 && value.variantId === null) return "gold";
  return "active";
}

/** What a missing variant should be called, in the words the mechanic actually uses. */
export function pendingVariantLabel(kind: MiniWorldChangeVariantKind | null): string {
  if (kind === "location") return "where?";
  if (kind === "faction") return "who?";
  if (kind === "phase") return "which phase?";
  return "";
}

export function statusBadgeLabel(
  definition: MiniWorldChangeDefinition,
  value: MiniWorldChangeValue,
): string {
  if (value.status === "unchecked") return "Not checked";
  if (value.status === "inactive") return "Not running";

  const variant = definition.variants.find((v) => v.id === value.variantId);
  if (variant) return variant.label;
  if (definition.variants.length > 0) return `Running — ${pendingVariantLabel(definition.variantKind)}`;
  return "Running";
}

/** Ordering for the grid: what needs the player's attention first. */
export function miniWorldChangeSortWeight(
  definition: MiniWorldChangeDefinition,
  value: MiniWorldChangeValue,
): number {
  if (value.status === "active") {
    return definition.variants.length > 0 && value.variantId === null ? 0 : 1;
  }
  if (value.status === "unchecked") return 2;
  return 3;
}

export const STATUS_ORDER: MiniWorldChangeStatus[] = ["active", "unchecked", "inactive"];
