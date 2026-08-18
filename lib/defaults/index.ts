import type { BriefingOverrides } from "@/types/briefing";
import { toDateKey } from "@/lib/utils/date";
import { createDefaultMiniWorldChangeValues } from "./miniWorldChanges";
import { createDefaultMerchants } from "./merchants";
import { createDefaultMarketPrices } from "./marketPrices";
import { createDefaultActiveEvents, createDefaultUpcomingEvents } from "./events";
import { createDefaultDrome } from "./drome";

export function createDefaultOverrides(world: string, referenceDate: Date): BriefingOverrides {
  return {
    world,
    date: toDateKey(referenceDate),
    miniWorldChanges: createDefaultMiniWorldChangeValues(),
    merchants: createDefaultMerchants(referenceDate),
    marketPrices: createDefaultMarketPrices(),
    activeEvents: createDefaultActiveEvents(),
    upcomingEvents: createDefaultUpcomingEvents(),
    drome: createDefaultDrome(),
    boostedRegion: "",
    includeAllMiniWorldChanges: false,
  };
}

export * from "./miniWorldChanges";
export * from "./merchants";
export * from "./marketPrices";
export * from "./events";
export * from "./drome";
