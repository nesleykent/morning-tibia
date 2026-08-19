import type { Merchant } from "./merchant";
import type { MarketPrice } from "./market";
import type { MiniWorldChangeValue } from "./miniWorldChange";
import type { WorldChangeValue } from "./worldChange";

/**
 * Everything the briefing formatter needs for one world, on one day, that's actually
 * user-editable. Live/global fields (world status, boosted, warzone, events, Drome) are
 * merged in separately by useBriefingState from build-time or live queries — this is
 * only the part that gets persisted to localStorage.
 */
export interface BriefingOverrides {
  world: string;
  date: string;
  miniWorldChanges: Record<string, MiniWorldChangeValue>;
  worldChanges: Record<string, WorldChangeValue>;
  merchants: Record<string, Merchant>;
  marketPrices: Record<string, MarketPrice>;
  boostedRegions: string[];
  includeAllChanges: boolean;
}
