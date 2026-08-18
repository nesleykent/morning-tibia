import type { DromeRotation } from "@/types/drome";

export function createDefaultDrome(): DromeRotation {
  return {
    status: "unknown",
    rotationLabel: "",
    notes: "",
  };
}
