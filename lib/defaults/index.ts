import type { BriefingOverrides } from "@/types/briefing";
import type { MarketPrice } from "@/types/market";
import type { Merchant, MerchantActivityState } from "@/types/merchant";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import { toDateKey } from "@/lib/utils/date";
import { createDefaultMiniWorldChangeValues, MINI_WORLD_CHANGE_DEFINITIONS } from "./miniWorldChanges";
import { createDefaultWorldChangeValues } from "./worldChanges";
import { createDefaultMerchants } from "./merchants";
import { createDefaultMarketPrices } from "./marketPrices";

const VALID_ACTIVITY_STATES: MerchantActivityState[] = [
  "not-verified",
  "inactive",
  "pending-location",
  "location-known",
];

/** Older saves predate Merchant.activityState entirely. Backfill it from the current
 * default (Rashid's is always "location-known"; Yasir's is "not-verified" unless the
 * save already has one of the four valid values). */
function migrateMerchants(
  defaults: Record<string, Merchant>,
  saved: Record<string, unknown> | undefined,
): Record<string, Merchant> {
  if (!saved) return defaults;
  const merged: Record<string, Merchant> = { ...defaults };
  for (const [id, value] of Object.entries(saved)) {
    if (!value || typeof value !== "object") continue;
    const defaultMerchant = defaults[id];
    if (!defaultMerchant) continue;
    const merchant = { ...defaultMerchant, ...value } as Merchant;
    if (!VALID_ACTIVITY_STATES.includes(merchant.activityState)) {
      merchant.activityState = defaultMerchant.activityState;
    }
    merged[id] = merchant;
  }
  return merged;
}

/** Bibby's Bloodbath and Noodles gained closed location lists — an older save's free-typed
 * detail might not be one of the now-valid spots. Drop it back to "active, pending" rather
 * than keep displaying a place the board could never actually report. */
function migrateMiniWorldChanges(
  defaults: Record<string, MiniWorldChangeValue>,
  saved: Record<string, unknown> | undefined,
): Record<string, MiniWorldChangeValue> {
  if (!saved) return defaults;
  const merged: Record<string, MiniWorldChangeValue> = { ...defaults };
  const defByCid = new Map(MINI_WORLD_CHANGE_DEFINITIONS.map((def) => [def.id, def]));
  for (const [id, value] of Object.entries(saved)) {
    if (!value || typeof value !== "object") continue;
    const defaultValue = defaults[id];
    const def = defByCid.get(id);
    if (!defaultValue || !def) continue;
    const mwc = { ...defaultValue, ...value, id } as MiniWorldChangeValue;
    if (def.suggestions && mwc.state === "location" && !def.suggestions.includes(mwc.detail)) {
      mwc.state = "active";
      mwc.detail = "";
    }
    merged[id] = mwc;
  }
  return merged;
}

/**
 * Older saves had `previousValue` instead of a `history` array. Since the top-level merge
 * below replaces a price entry wholesale when the save has one, a save from before that
 * schema change would otherwise ship without `history` and crash the first time something
 * reads it (averaging, trend). Backfill a single-entry history from the saved value.
 *
 * `label` is always taken from the current defaults rather than the save — it's a static
 * catalog string, never user-edited, so an older save's stale wording (e.g. before a
 * relabel) should never stick around instead of the current one.
 *
 * `trend` used to be a stored field, recomputed and persisted on every update; it's now
 * always derived on the fly from `history` and the selected MarketTrendBasis (see
 * lib/utils/priceTrend.ts), so an older save's stale value is dropped rather than kept.
 */
function migrateMarketPrices(
  defaults: Record<string, MarketPrice>,
  saved: Record<string, unknown> | undefined,
): Record<string, MarketPrice> {
  if (!saved) return defaults;
  const merged: Record<string, MarketPrice> = { ...defaults };
  for (const [id, value] of Object.entries(saved)) {
    if (!value || typeof value !== "object") continue;
    const defaultPrice = defaults[id];
    if (!defaultPrice) continue; // a price id that no longer exists — drop it
    const price = { ...defaultPrice, ...value, label: defaultPrice.label } as MarketPrice & {
      previousValue?: unknown;
      trend?: unknown;
    };
    if (!Array.isArray(price.history)) {
      price.history =
        price.value !== null && price.value !== undefined && price.sourceTimestamp !== null
          ? [{ value: price.value, timestamp: price.sourceTimestamp ?? Date.now() }]
          : [];
    }
    delete price.previousValue;
    delete price.trend;
    merged[id] = price;
  }
  return merged;
}

export function createDefaultOverrides(world: string, referenceDate: Date): BriefingOverrides {
  return {
    world,
    date: toDateKey(referenceDate),
    miniWorldChanges: createDefaultMiniWorldChangeValues(),
    worldChanges: createDefaultWorldChangeValues(),
    merchants: createDefaultMerchants(referenceDate),
    marketPrices: createDefaultMarketPrices(),
    boostedRegions: [],
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

  // Older saves had a single `boostedRegion: string` field — migrate it into the new array.
  const legacyRegion = (partial as { boostedRegion?: unknown }).boostedRegion;
  const boostedRegions = Array.isArray(partial.boostedRegions)
    ? partial.boostedRegions.filter((region): region is string => typeof region === "string")
    : typeof legacyRegion === "string" && legacyRegion.trim().length > 0
      ? [legacyRegion]
      : defaults.boostedRegions;

  return {
    ...defaults,
    boostedRegions,
    includeAllChanges:
      typeof partial.includeAllChanges === "boolean" ? partial.includeAllChanges : defaults.includeAllChanges,
    miniWorldChanges: migrateMiniWorldChanges(
      defaults.miniWorldChanges,
      partial.miniWorldChanges as Record<string, unknown>,
    ),
    worldChanges: { ...defaults.worldChanges, ...(partial.worldChanges ?? {}) },
    merchants: migrateMerchants(defaults.merchants, partial.merchants as Record<string, unknown>),
    marketPrices: migrateMarketPrices(defaults.marketPrices, partial.marketPrices as Record<string, unknown>),
  };
}

export * from "./miniWorldChanges";
export * from "./worldChanges";
export * from "./merchants";
export * from "./marketPrices";
