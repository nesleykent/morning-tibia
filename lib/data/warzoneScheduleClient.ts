import "server-only";
import type { WarzoneSchedule, WarzoneHealthMark } from "@/types/warzone";

const WARZONE_SCHEDULE_URL = "https://nesleykent.github.io/tibia-warzones-schedule/data/worlds.json";
const REVALIDATE_SECONDS = 600;

interface RawWarzoneExecution {
  execution_id: number;
  schedule_time: string;
  warzone_sequence: string;
}

interface RawMarketItem {
  supply_price: number | null;
  demand_price: number | null;
  mid_price: number | null;
}

interface RawWarzoneWorld {
  name: string;
  timezone?: string;
  tracks_warzone_service?: boolean;
  mark?: string;
  warzone_executions?: RawWarzoneExecution[];
  warzone_economic_ranking?: {
    market?: {
      tibia_coin?: RawMarketItem;
    };
  };
}

function normalizeMark(mark: string | undefined): WarzoneHealthMark {
  if (mark === "healthy" || mark === "inconclusive" || mark === "degraded") return mark;
  return "unknown";
}

/**
 * Fetches nesleykent/tibia-warzones-schedule's published worlds.json (a static file on
 * GitHub Pages, ~420KB for all worlds) and returns just the slice for one world. Next's
 * fetch cache means the full file is only actually downloaded once per revalidate window,
 * regardless of how many worlds are requested from our route handler.
 */
export async function fetchWarzoneSchedule(worldName: string): Promise<WarzoneSchedule | null> {
  const res = await fetch(WARZONE_SCHEDULE_URL, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Warzone schedule request failed (${res.status})`);
  }
  const all = (await res.json()) as RawWarzoneWorld[];
  const match = all.find((w) => w.name.toLowerCase() === worldName.toLowerCase());
  if (!match) return null;

  const tibiaCoin = match.warzone_economic_ranking?.market?.tibia_coin;

  return {
    world: match.name,
    timezone: match.timezone ?? null,
    tracksWarzoneService: Boolean(match.tracks_warzone_service),
    mark: normalizeMark(match.mark),
    executions: (match.warzone_executions ?? []).map((execution) => ({
      executionId: execution.execution_id,
      scheduleTime: execution.schedule_time,
      warzoneSequence: execution.warzone_sequence,
    })),
    tibiaCoin: tibiaCoin
      ? {
          supplyPrice: tibiaCoin.supply_price ?? null,
          demandPrice: tibiaCoin.demand_price ?? null,
          midPrice: tibiaCoin.mid_price ?? null,
        }
      : null,
  };
}
