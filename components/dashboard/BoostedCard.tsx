"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BoostedEntity } from "@/types/boosted";

interface BoostedCardProps {
  creature: BoostedEntity | null;
  boss: BoostedEntity | null;
  isLoading: boolean;
  error: string | null;
  boostedRegion: string;
  onBoostedRegionChange: (value: string) => void;
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

export function BoostedCard({
  creature,
  boss,
  isLoading,
  error,
  boostedRegion,
  onBoostedRegionChange,
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="boosted-region">🗺️ Boosted region</Label>
          <Input
            id="boosted-region"
            placeholder="e.g. Venore"
            value={boostedRegion}
            onChange={(e) => onBoostedRegionChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
