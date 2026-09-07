"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Section, Eyebrow } from "@/components/ui/section";
import { Stat } from "@/components/ui/stat";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { TIBIA_LOCATIONS } from "@/lib/defaults/tibiaLocations";
import { convertTimeBetweenZones } from "@/lib/utils/timezone";
import { computeTrendForBasis, ENTRIES_BY_BASIS } from "@/lib/utils/priceTrend";
import { eventEmoji } from "@/lib/formatter/eventEmoji";
import { formatActiveEventLine } from "@/lib/formatter/phrases";
import type { BoostedEntity } from "@/types/boosted";
import type { WarzoneSchedule } from "@/types/warzone";
import type { Merchant, MerchantId } from "@/types/merchant";
import type { MarketPrice, MarketPriceId } from "@/types/market";
import type { ActiveEvent } from "@/types/event";
import type { MarketTrendBasis } from "@/types/market";

const YASIR_CITIES = ["Carlin", "Liberty Bay", "Ankrahmun"] as const;

const TREND_SYMBOL = { up: "↑", down: "↓", unchanged: "→" } as const;
const TREND_TONE = {
  up: "text-emerald-400",
  down: "text-rose-400",
  unchanged: "text-muted-foreground",
} as const;

interface TodayOverviewProps {
  creature: BoostedEntity | null;
  boss: BoostedEntity | null;
  boostedLoading: boolean;
  boostedError: string | null;
  boostedRegions: string[];
  onBoostedRegionsChange: (regions: string[]) => void;
  warzone: WarzoneSchedule | null;
  warzoneLoading: boolean;
  viewerTimeZone: string;
  merchants: Record<string, Merchant>;
  onMerchantChange: (id: MerchantId, patch: Partial<Merchant>) => void;
  prices: Record<string, MarketPrice>;
  activeEvents: ActiveEvent[];
  marketBasis: MarketTrendBasis;
}

/**
 * The morning scan.
 *
 * This replaces five equal-height cards in a rigid grid. That grid was the source of the
 * overview's worst problem: Warzone (four short times) and Market (four numbers) were forced
 * to the same height as Boosted (two illustrated entries) and Events, so half the row was
 * empty container. Here each fact takes the room its content actually needs — the two
 * boosted entries get real estate because they are the day's headline, and everything else
 * is a compact labelled value.
 */
export function TodayOverview({
  creature,
  boss,
  boostedLoading,
  boostedError,
  boostedRegions,
  onBoostedRegionsChange,
  warzone,
  warzoneLoading,
  viewerTimeZone,
  merchants,
  onMerchantChange,
  prices,
  marketBasis,
  activeEvents,
}: TodayOverviewProps) {
  const [referenceDate] = useState(() => new Date());
  const [regionOpen, setRegionOpen] = useState(false);

  const yasir = merchants.yasir;
  const rashid = merchants.rashid;
  const yasirEditable =
    yasir?.activityState === "pending-location" || yasir?.activityState === "location-known";

  const warzoneTimes = (warzone?.executions ?? []).map((execution) => ({
    id: execution.executionId,
    time: warzone?.timezone
      ? convertTimeBetweenZones(execution.scheduleTime, warzone.timezone, viewerTimeZone, referenceDate)
      : execution.scheduleTime,
    sequence: execution.warzoneSequence,
  }));

  return (
    <Section eyebrow="Today" className="gap-4">
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        {/* Boosted — the day's headline, so it gets scale and imagery. */}
        <div className="grid grid-cols-2 gap-3">
          <BoostedEntry label="Boosted creature" entity={creature} loading={boostedLoading} />
          <BoostedEntry label="Boosted boss" entity={boss} loading={boostedLoading} />
          {boostedError && (
            <p className="col-span-2 text-xs text-destructive">
              Couldn&apos;t load boosted data ({boostedError}).
            </p>
          )}

          {/* Boosted region sits with the other two boosted facts rather than in the
              right-hand column: it belongs to them semantically, and it fills what was
              otherwise dead space under the two illustrated entries. */}
          <div className="col-span-2 min-w-0">
            <Eyebrow>Boosted region</Eyebrow>
            <Popover open={regionOpen} onOpenChange={setRegionOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="mt-0.5 flex min-h-[36px] w-full items-center justify-between gap-2 text-left text-[13.5px] text-foreground hover:text-gold sm:min-h-0"
                >
                  <span className="truncate">
                    {boostedRegions.length > 0 ? (
                      boostedRegions.join(", ")
                    ) : (
                      <span className="text-muted-foreground">Not set — no source, pick manually</span>
                    )}
                  </span>
                  <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search region…" />
                  <CommandList>
                    <CommandEmpty>No region found.</CommandEmpty>
                    <CommandGroup>
                      {TIBIA_LOCATIONS.map((location) => {
                        const selected = boostedRegions.includes(location);
                        return (
                          <CommandItem
                            key={location}
                            value={location}
                            onSelect={() =>
                              onBoostedRegionsChange(
                                selected
                                  ? boostedRegions.filter((r) => r !== location)
                                  : [...boostedRegions, location],
                              )
                            }
                          >
                            <Check
                              className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")}
                            />
                            {location}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {boostedRegions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {boostedRegions.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => onBoostedRegionsChange(boostedRegions.filter((r) => r !== region))}
                    className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {region}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Everything else: labelled values, no boxes. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-2">
          <Stat label="Rashid" emphasis="strong">
            {rashid?.location || "—"}
          </Stat>

          <div className="min-w-0">
            <Eyebrow>Yasir</Eyebrow>
            {yasirEditable ? (
              <Select
                value={yasir?.location || undefined}
                onValueChange={(value) =>
                  onMerchantChange("yasir", { location: value, activityState: "location-known" })
                }
              >
                <SelectTrigger
                  aria-label="Yasir's city"
                  className="mt-0.5 h-auto min-h-0 justify-start gap-1.5 whitespace-normal border-0 bg-transparent px-0 py-0 text-left text-[15px] font-medium leading-snug text-foreground shadow-none focus:ring-0"
                >
                  <SelectValue placeholder="Trading — pick city" />
                </SelectTrigger>
                <SelectContent>
                  {YASIR_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p
                className={cn(
                  "mt-0.5 text-[15px] font-medium",
                  yasir?.activityState === "inactive" ? "text-muted-foreground" : "text-muted-foreground",
                )}
              >
                {yasir?.activityState === "inactive" ? "Not trading today" : "Not checked"}
              </p>
            )}
          </div>

          <div className="col-span-2 min-w-0 sm:col-span-1 lg:col-span-2">
            <Eyebrow>Warzones</Eyebrow>
            {warzoneLoading ? (
              <div className="skeleton mt-1 h-4 w-40 rounded" />
            ) : warzoneTimes.length === 0 ? (
              <p className="mt-0.5 text-[13px] text-muted-foreground">Not tracked for this world.</p>
            ) : (
              <p className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[13.5px] tabular-nums">
                {warzoneTimes.map((entry) => (
                  <span key={entry.id} className="text-foreground">
                    {entry.time}
                    {entry.sequence && (
                      <span className="ml-1 text-[11px] text-muted-foreground">{entry.sequence}</span>
                    )}
                  </span>
                ))}
              </p>
            )}
          </div>

          <div className="col-span-2 min-w-0 sm:col-span-3 lg:col-span-2">
            <Eyebrow>Market</Eyebrow>
            <dl className="mt-0.5 grid grid-cols-2 gap-x-6 gap-y-0.5 text-[13px] tabular-nums sm:grid-cols-4 lg:grid-cols-2">
              {(Object.entries(prices) as [MarketPriceId, MarketPrice][])
                .filter(([, price]) => price.value !== null)
                .map(([id, price]) => {
                  const trend = computeTrendForBasis(price.history, ENTRIES_BY_BASIS[marketBasis]);
                  return (
                    <div key={id} className="flex items-baseline justify-between gap-2">
                      <dt className="truncate text-muted-foreground">{shortPriceLabel(id)}</dt>
                      <dd className="shrink-0 text-foreground">
                        {Math.round(price.value!).toLocaleString("en-US")}
                        <span className={cn("ml-1", TREND_TONE[trend])}>{TREND_SYMBOL[trend]}</span>
                      </dd>
                    </div>
                  );
                })}
            </dl>
          </div>

        </div>
      </div>

      {activeEvents.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/50 pt-3">
          <Eyebrow className="shrink-0">Active events</Eyebrow>
          {activeEvents.map((event) => (
            <span key={event.id} className="text-[13px] text-foreground">
              <span aria-hidden="true">{eventEmoji(event.title)}</span> {event.title}
              <span className="ml-1.5 text-[11px] text-muted-foreground">
                {formatActiveEventLine(event, "en")}
              </span>
            </span>
          ))}
        </div>
      )}
    </Section>
  );
}

function shortPriceLabel(id: MarketPriceId): string {
  switch (id) {
    case "tibiaCoinSell":
      return "TC sell";
    case "tibiaCoinBuy":
      return "TC buy";
    case "goldTokenSell":
      return "Gold token";
    case "silverTokenSell":
      return "Silver token";
    default:
      return id;
  }
}

function BoostedEntry({
  label,
  entity,
  loading,
}: {
  label: string;
  entity: BoostedEntity | null;
  loading: boolean;
}) {
  return (
    <div className="min-w-0">
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-1.5 flex items-center gap-2.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/40">
          {loading ? (
            <div className="skeleton h-full w-full" />
          ) : entity?.imageUrl ? (
            <Image src={entity.imageUrl} alt="" width={40} height={40} className="object-contain" unoptimized />
          ) : (
            <span className="text-lg" aria-hidden="true">
              ❔
            </span>
          )}
        </div>
        <p className="min-w-0 flex-1 text-pretty text-[15px] font-medium leading-snug text-foreground">
          {loading ? <span className="skeleton block h-4 w-24 rounded" /> : entity?.name || "—"}
        </p>
      </div>
    </div>
  );
}
