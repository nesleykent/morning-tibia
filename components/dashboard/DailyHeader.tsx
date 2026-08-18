"use client";

import { Sunrise, Users, Shield, ArrowLeftRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WorldSelector } from "./WorldSelector";
import { ToolbarActions } from "./ToolbarActions";
import type { World, WorldDetail } from "@/types/world";
import { toBriefingDate } from "@/lib/utils/date";

interface DailyHeaderProps {
  world: string;
  referenceDate: Date;
  worlds: World[];
  worldsLoading: boolean;
  onWorldChange: (world: string) => void;
  worldDetail: WorldDetail | null;
  worldDetailLoading: boolean;
  onRefresh: () => void;
  onReset: () => void;
  isRefreshing: boolean;
}

export function DailyHeader({
  world,
  referenceDate,
  worlds,
  worldsLoading,
  onWorldChange,
  worldDetail,
  worldDetailLoading,
  onRefresh,
  onReset,
  isRefreshing,
}: DailyHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15 text-gold">
            <Sunrise className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">{toBriefingDate(referenceDate)}</p>
            <h1 className="text-lg font-semibold">
              Bom dia, <span className="text-gold">{world || "…"}</span>!
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WorldSelector
            value={world}
            worlds={worlds}
            isLoading={worldsLoading}
            onChange={onWorldChange}
          />
          <ToolbarActions onRefresh={onRefresh} onReset={onReset} isRefreshing={isRefreshing} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {worldDetailLoading ? (
          <>
            <div className="skeleton h-5 w-24 rounded-full" />
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-5 w-28 rounded-full" />
          </>
        ) : worldDetail ? (
          <>
            <Badge variant="secondary">
              <Users className="h-3 w-3" /> {worldDetail.playersOnline.toLocaleString("pt-BR")} online
            </Badge>
            <Badge variant="secondary">{worldDetail.pvpType}</Badge>
            <Badge variant="secondary">
              <MapPin className="h-3 w-3" /> {worldDetail.location}
            </Badge>
            <Badge variant="secondary">
              <ArrowLeftRight className="h-3 w-3" /> Transfer: {worldDetail.transferType}
            </Badge>
            {worldDetail.battlEyeProtected && (
              <Badge variant="gold">
                <Shield className="h-3 w-3" /> BattlEye
              </Badge>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Live world status unavailable right now — everything else below still works.
          </p>
        )}
      </div>
    </header>
  );
}
