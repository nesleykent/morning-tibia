import type { BriefingOverrides } from "@/types/briefing";
import { toDateKey } from "@/lib/utils/date";
import { createDefaultMiniWorldChangeValues } from "./miniWorldChanges";
import { createDefaultWorldChangeValues } from "./worldChanges";
import { createDefaultMerchants } from "./merchants";
import { createDefaultMarketPrices } from "./marketPrices";

export function createDefaultOverrides(world: string, referenceDate: Date): BriefingOverrides {
  return {
    world,
    date: toDateKey(referenceDate),
    miniWorldChanges: createDefaultMiniWorldChangeValues(),
    worldChanges: createDefaultWorldChangeValues(),
    merchants: createDefaultMerchants(referenceDate),
    marketPrices: createDefaultMarketPrices(),
    boostedRegion: "",
    includeAllChanges: false,
  };
}

/**
 * Backfills a value loaded from localStorage against the current defaults, field by
 * field — so an older save from before a schema change (a renamed Mini World Change id,
 * a newly split `worldChanges` record, a new market price) never crashes the app with a
 * missing key. Ids no longer present in the current definitions are dropped; ids present
 * now but absent in the save get their default value.
 */
export function mergeOverridesWithDefaults(
  saved: unknown,
  world: string,
  referenceDate: Date,
): BriefingOverrides {
  const defaults = createDefaultOverrides(world, referenceDate);
  if (!saved || typeof saved !== "object") return defaults;
  const partial = saved as Partial<BriefingOverrides>;

  return {
    ...defaults,
    boostedRegion: typeof partial.boostedRegion === "string" ? partial.boostedRegion : defaults.boostedRegion,
    includeAllChanges:
      typeof partial.includeAllChanges === "boolean" ? partial.includeAllChanges : defaults.includeAllChanges,
    miniWorldChanges: { ...defaults.miniWorldChanges, ...(partial.miniWorldChanges ?? {}) },
    worldChanges: { ...defaults.worldChanges, ...(partial.worldChanges ?? {}) },
    merchants: { ...defaults.merchants, ...(partial.merchants ?? {}) },
    marketPrices: { ...defaults.marketPrices, ...(partial.marketPrices ?? {}) },
  };
}

export * from "./miniWorldChanges";
export * from "./worldChanges";
export * from "./merchants";
export * from "./marketPrices";
