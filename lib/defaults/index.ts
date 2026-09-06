import type { BriefingOverrides } from "@/types/briefing";
import type { MarketPrice } from "@/types/market";
import type { Merchant, MerchantActivityState } from "@/types/merchant";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import type { WorldChangeValue } from "@/types/worldChange";
import { toDateKey } from "@/lib/utils/date";
import { createDefaultMiniWorldChangeValues, MINI_WORLD_CHANGES_BY_ID } from "./miniWorldChanges";
import { createDefaultWorldChangeValues, WORLD_CHANGES_BY_ID } from "./worldChanges";
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

/**
 * Saves written before the World/Mini World Change model was corrected used a different
 * shape entirely: `{ state, detail }` where `state` was one of
 * unknown/active/inactive/stage1..3/location, and several change ids have since been
 * renamed to their canonical TibiaWiki names.
 *
 * Rather than guess, this migration keeps only what the old save could actually justify:
 *
 * - `unknown`   → unchecked (no evidence then, none now).
 * - `inactive`  → inactive.
 * - everything else was some flavour of "active", so → active. The old `detail` string is
 *   matched against the change's variant labels, and kept ONLY on an exact match; a
 *   free-typed spot from the old model (or a stage number, which no longer means anything
 *   for a Mini World Change) is dropped back to "running, variant unknown" instead of being
 *   forced onto a variant it may not correspond to.
 *
 * The old ids that changed name are mapped so a save from yesterday still loads.
 */
const RENAMED_MINI_WORLD_CHANGE_IDS: Record<string, string> = {
  "fury-gate": "fury-gates",
  "bibbys-bloodbath": "warpath",
  "devovorga-essence": "devovorgas-essence",
  "big-iceberg": "chakoya-iceberg",
  "spirit-gate": "spirit-grounds",
  "goroma-volcano": "fire-from-the-earth",
  "darama-nomads": "nomads",
  "bored-witch": "bored",
  noodles: "noodles-is-gone",
  "thais-kingsday": "kingsday",
  "spiders-nest": "spider-nest",
};

function migrateMiniWorldChanges(
  defaults: Record<string, MiniWorldChangeValue>,
  saved: Record<string, unknown> | undefined,
): Record<string, MiniWorldChangeValue> {
  if (!saved) return defaults;
  const merged: Record<string, MiniWorldChangeValue> = { ...defaults };

  for (const [savedId, raw] of Object.entries(saved)) {
    if (!raw || typeof raw !== "object") continue;
    const id = RENAMED_MINI_WORLD_CHANGE_IDS[savedId] ?? savedId;
    const defaultValue = defaults[id];
    const def = MINI_WORLD_CHANGES_BY_ID.get(id);
    if (!defaultValue || !def) continue;

    const value = raw as Partial<MiniWorldChangeValue> & { state?: string; detail?: string };

    let status: MiniWorldChangeValue["status"];
    if (value.status === "unchecked" || value.status === "inactive" || value.status === "active") {
      status = value.status;
    } else if (value.state === "inactive") {
      status = "inactive";
    } else if (value.state && value.state !== "unknown") {
      status = "active";
    } else {
      status = "unchecked";
    }

    let variantId: string | null = null;
    if (status === "active") {
      const candidate =
        typeof value.variantId === "string" ? value.variantId : undefined;
      const legacyDetail = typeof value.detail === "string" ? value.detail.trim() : "";
      variantId =
        def.variants.find((variant) => variant.id === candidate)?.id ??
        def.variants.find((variant) => variant.label === legacyDetail)?.id ??
        null;
    }

    merged[id] = {
      id,
      status,
      variantId,
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : defaultValue.updatedAt,
    };
  }
  return merged;
}

/**
 * World Change saves moved from `{ state, detail }` to a single documented `stateId`. The
 * old states were generic (stage1..3) and can't be mapped back to a specific documented
 * state without guessing which one was meant, so an old save's World Changes are reset to
 * "not asked" — the honest outcome, and one paste of a Guide log restores them.
 */
function migrateWorldChanges(
  defaults: Record<string, WorldChangeValue>,
  saved: Record<string, unknown> | undefined,
): Record<string, WorldChangeValue> {
  if (!saved) return defaults;
  const merged: Record<string, WorldChangeValue> = { ...defaults };

  for (const [id, raw] of Object.entries(saved)) {
    if (!raw || typeof raw !== "object") continue;
    const def = WORLD_CHANGES_BY_ID.get(id);
    const defaultValue = defaults[id];
    if (!def || !defaultValue) continue;

    const value = raw as Partial<WorldChangeValue>;
    const stateId =
      typeof value.stateId === "string" &&
      def.states.some((state) => state.id === value.stateId)
        ? value.stateId
        : null;

    merged[id] = {
      id,
      stateId,
      updatedAt: stateId ? (value.updatedAt ?? null) : null,
    };
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
    worldChanges: migrateWorldChanges(
      defaults.worldChanges,
      partial.worldChanges as Record<string, unknown>,
    ),
    merchants: migrateMerchants(defaults.merchants, partial.merchants as Record<string, unknown>),
    marketPrices: migrateMarketPrices(defaults.marketPrices, partial.marketPrices as Record<string, unknown>),
  };
}

export * from "./miniWorldChanges";
export * from "./worldChanges";
export * from "./merchants";
export * from "./marketPrices";
