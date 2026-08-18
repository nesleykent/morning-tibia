export type WorldLocation = "Europe" | "North America" | "South America" | "Oceania";

export type PvpType =
  | "Open PvP"
  | "Optional PvP"
  | "Hardcore PvP"
  | "Retro Open PvP"
  | "Retro Hardcore PvP";

export type TransferType = "regular" | "blocked" | "locked";

export interface World {
  name: string;
  location: WorldLocation | string;
  pvpType: PvpType | string;
  transferType: TransferType | string;
  battlEyeProtected: boolean;
  premiumOnly: boolean;
  isOnline: boolean;
  playersOnline: number;
}

export interface WorldDetail extends World {
  recordPlayers: number;
  recordDate: string | null;
  creationDate: string | null;
}
