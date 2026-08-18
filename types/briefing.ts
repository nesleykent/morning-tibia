import type { ActiveEvent, UpcomingEvent } from "./event";
import type { DromeRotation } from "./drome";
import type { Merchant } from "./merchant";
import type { MarketPrice } from "./market";
import type { MiniWorldChangeValue } from "./miniWorldChange";

/**
 * Everything the briefing formatter needs for one world, on one day. Live fields
 * (world/boosted/warzone) are merged in separately by useBriefingState; this is the
 * part that gets persisted to localStorage.
 */
export interface BriefingOverrides {
  world: string;
  date: string;
  miniWorldChanges: Record<string, MiniWorldChangeValue>;
  merchants: Record<string, Merchant>;
  marketPrices: Record<string, MarketPrice>;
  activeEvents: ActiveEvent[];
  upcomingEvents: UpcomingEvent[];
  drome: DromeRotation;
  boostedRegion: string;
  includeAllMiniWorldChanges: boolean;
}
