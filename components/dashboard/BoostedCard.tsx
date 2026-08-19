"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils/cn";
import { TIBIA_LOCATIONS } from "@/lib/defaults/tibiaLocations";
import type { BoostedEntity } from "@/types/boosted";

interface BoostedCardProps {
  creature: BoostedEntity | null;
  boss: BoostedEntity | null;
  isLoading: boolean;
  error: string | null;
  boostedRegions: string[];
  onBoostedRegionsChange: (regions: string[]) => void;
}

function BoostedEntry({
  emoji,
  label,
  entity,
  isLoading,
}: {
  emoji: string;
  label: string;
  entity: BoostedEntity | null;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-2.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-background">
        {isLoading ? (
          <div className="skeleton h-full w-full" />
        ) : entity?.imageUrl ? (
          <Image src={entity.imageUrl} alt={entity.name} width={36} height={36} unoptimized />
        ) : (
          <span className="text-lg" aria-hidden="true">
            {emoji}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">
          {isLoading ? "Loading…" : (entity?.name ?? "—")}
        </p>
      </div>
    </div>
  );
}

function BoostedRegionPicker({
  regions,
  onChange,
}: {
  regions: string[];
  onChange: (regions: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (region: string) => {
    onChange(regions.includes(region) ? regions.filter((r) => r !== region) : [...regions, region]);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label>🗺️ Boosted region</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            <span className="truncate text-left font-normal">
              {regions.length > 0 ? regions.join(", ") : "Select region(s)…"}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search location…" />
            <CommandList>
              <CommandEmpty>No location found.</CommandEmpty>
              <CommandGroup>
                {TIBIA_LOCATIONS.map((location) => (
                  <CommandItem key={location} value={location} onSelect={() => toggle(location)}>
                    <Check className={cn("h-3.5 w-3.5", regions.includes(location) ? "opacity-100" : "opacity-0")} />
                    {location}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {regions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {regions.map((region) => (
            <Badge key={region} variant="gold" className="gap-1 pr-1">
              {region}
              <button
                type="button"
                onClick={() => toggle(region)}
                aria-label={`Remove ${region}`}
                className="rounded-full p-0.5 hover:bg-gold/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function BoostedCard({
  creature,
  boss,
  isLoading,
  error,
  boostedRegions,
  onBoostedRegionsChange,
}: BoostedCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden="true">⭐</span> Boosted today
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <BoostedEntry emoji="👾" label="Creature" entity={creature} isLoading={isLoading} />
          <BoostedEntry emoji="👹" label="Boss" entity={boss} isLoading={isLoading} />
        </div>
        {error && !isLoading && (
          <p className="text-xs text-destructive">
            Couldn&apos;t load boosted data live ({error}). Try refreshing.
          </p>
        )}
        <BoostedRegionPicker regions={boostedRegions} onChange={onBoostedRegionsChange} />
      </CardContent>
    </Card>
  );
}
