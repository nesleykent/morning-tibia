export type DromeStatus = "open" | "closed" | "unknown";

export interface DromeRotation {
  status: DromeStatus;
  rotationLabel: string;
  notes: string;
}
