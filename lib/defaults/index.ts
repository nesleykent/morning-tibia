import type { BriefingOverrides } from "@/types/briefing";
import { toDateKey } from "@/lib/utils/date";
import { createDefaultMiniWorldChangeValues } from "./miniWorldChanges";
import { createDefaultMerchants } from "./merchants";
import { createDefaultMarketPrices } from "./marketPrices";

export function createDefaultOverrides(world: string, referenceDate: Date): BriefingOverrides {
  return {
    world,
    date: toDateKey(referenceDate),
    miniWorldChanges: createDefaultMiniWorldChangeValues(),
    merchants: createDefaultMerchants(referenceDate),
    marketPrices: createDefaultMarketPrices(),
    boostedRegion: "",
    includeAllMiniWorldChanges: false,
  };
}

export * from "./miniWorldChanges";
export * from "./merchants";
export * from "./marketPrices";
