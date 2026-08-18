import type { World, WorldDetail } from "@/types/world";
import type { BoostedEntity } from "@/types/boosted";

export interface RawWorldSummary {
  name: string;
  status: string;
  players_online: number;
  location: string;
  pvp_type: string;
  premium_only: boolean;
  transfer_type: string;
  battleye_protected: boolean;
}

export interface RawWorldsResponse {
  worlds: {
    regular_worlds: RawWorldSummary[];
  };
}

export interface RawWorldDetailResponse {
  world: RawWorldSummary & {
    record_players: number;
    record_date: string | null;
    creation_date: string | null;
  };
}

export interface RawBoostedBossResponse {
  boostable_bosses: {
    boosted: { name: string; image_url: string; featured: boolean } | null;
  };
}

export interface RawBoostedCreatureResponse {
  creatures: {
    boosted: { name: string; race: string; image_url: string; featured: boolean } | null;
  };
}

export function mapWorldSummary(raw: RawWorldSummary): World {
  return {
    name: raw.name,
    location: raw.location,
    pvpType: raw.pvp_type,
    transferType: raw.transfer_type,
    battlEyeProtected: raw.battleye_protected,
    premiumOnly: raw.premium_only,
    isOnline: raw.status === "online",
    playersOnline: raw.players_online,
  };
}

export function mapWorldDetail(raw: RawWorldDetailResponse["world"]): WorldDetail {
  return {
    ...mapWorldSummary(raw),
    recordPlayers: raw.record_players,
    recordDate: raw.record_date,
    creationDate: raw.creation_date,
  };
}

export function mapBoostedBoss(data: RawBoostedBossResponse): BoostedEntity | null {
  const boosted = data.boostable_bosses.boosted;
  if (!boosted) return null;
  return { kind: "boss", name: boosted.name, imageUrl: boosted.image_url || null };
}

export function mapBoostedCreature(data: RawBoostedCreatureResponse): BoostedEntity | null {
  const boosted = data.creatures.boosted;
  if (!boosted) return null;
  return { kind: "creature", name: boosted.name, imageUrl: boosted.image_url || null };
}
