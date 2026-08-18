import "server-only";
import type { World, WorldDetail } from "@/types/world";
import type { BoostedEntity } from "@/types/boosted";

const TIBIADATA_BASE = "https://api.tibiadata.com/v4";
const WORLDS_REVALIDATE_SECONDS = 300;
const BOOSTED_REVALIDATE_SECONDS = 600;

interface RawWorldSummary {
  name: string;
  status: string;
  players_online: number;
  location: string;
  pvp_type: string;
  premium_only: boolean;
  transfer_type: string;
  battleye_protected: boolean;
}

interface RawWorldsResponse {
  worlds: {
    regular_worlds: RawWorldSummary[];
  };
}

interface RawWorldDetailResponse {
  world: RawWorldSummary & {
    record_players: number;
    record_date: string | null;
    creation_date: string | null;
  };
}

interface RawBoostedBossResponse {
  boostable_bosses: {
    boosted: { name: string; image_url: string; featured: boolean } | null;
  };
}

interface RawBoostedCreatureResponse {
  creatures: {
    boosted: { name: string; race: string; image_url: string; featured: boolean } | null;
  };
}

async function tibiaDataFetch<T>(path: string, revalidateSeconds: number): Promise<T> {
  const res = await fetch(`${TIBIADATA_BASE}${path}`, {
    next: { revalidate: revalidateSeconds },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`TibiaData request failed (${res.status}) for ${path}`);
  }
  return (await res.json()) as T;
}

function mapWorldSummary(raw: RawWorldSummary): World {
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

export async function fetchWorlds(): Promise<World[]> {
  const data = await tibiaDataFetch<RawWorldsResponse>("/worlds", WORLDS_REVALIDATE_SECONDS);
  return data.worlds.regular_worlds
    .map(mapWorldSummary)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchWorldDetail(name: string): Promise<WorldDetail | null> {
  try {
    const data = await tibiaDataFetch<RawWorldDetailResponse>(
      `/world/${encodeURIComponent(name)}`,
      WORLDS_REVALIDATE_SECONDS,
    );
    if (!data.world?.name) return null;
    return {
      ...mapWorldSummary(data.world),
      recordPlayers: data.world.record_players,
      recordDate: data.world.record_date,
      creationDate: data.world.creation_date,
    };
  } catch {
    return null;
  }
}

export async function fetchBoostedBoss(): Promise<BoostedEntity | null> {
  const data = await tibiaDataFetch<RawBoostedBossResponse>(
    "/boostablebosses",
    BOOSTED_REVALIDATE_SECONDS,
  );
  const boosted = data.boostable_bosses.boosted;
  if (!boosted) return null;
  return { kind: "boss", name: boosted.name, imageUrl: boosted.image_url || null };
}

export async function fetchBoostedCreature(): Promise<BoostedEntity | null> {
  const data = await tibiaDataFetch<RawBoostedCreatureResponse>(
    "/creatures",
    BOOSTED_REVALIDATE_SECONDS,
  );
  const boosted = data.creatures.boosted;
  if (!boosted) return null;
  return { kind: "creature", name: boosted.name, imageUrl: boosted.image_url || null };
}
