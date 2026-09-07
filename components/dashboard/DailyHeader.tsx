"use client";

import { Users, Shield, ArrowLeftRight, MapPin } from "lucide-react";
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
    // Not a card. This is the page's masthead: a greeting, the world picker, and the world's
    // vital signs. Boxing it made the first screen — on mobile, most of it — a container the
    // player has to scroll past before reaching anything about their morning.
    <header className="flex flex-col gap-2.5 border-b border-border/60 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {toBriefingDate(referenceDate)}
          </p>
          <h1 className="mt-0.5 text-[22px] font-medium leading-tight tracking-tight sm:text-2xl">
            Bom dia, <span className="text-gold">{world || "…"}</span>
          </h1>
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

      {/* World vitals as one quiet line of text rather than five pills — they are context,
          not status the player has to act on. */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-muted-foreground">
        {worldDetailLoading ? (
          <div className="skeleton h-4 w-64 rounded" />
        ) : worldDetail ? (
          <>
            <span className="inline-flex items-center gap-1 text-foreground">
              <Users className="h-3 w-3" />
              {worldDetail.playersOnline.toLocaleString("pt-BR")} online
            </span>
            <Dot />
            <span>{worldDetail.pvpType}</span>
            <Dot />
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {worldDetail.location}
            </span>
            <Dot />
            <span className="inline-flex items-center gap-1">
              <ArrowLeftRight className="h-3 w-3" />
              Transfer: {worldDetail.transferType}
            </span>
            {worldDetail.battlEyeProtected && (
              <>
                <Dot />
                <span className="inline-flex items-center gap-1 text-gold">
                  <Shield className="h-3 w-3" />
                  BattlEye
                </span>
              </>
            )}
          </>
        ) : (
          <span>Live world status unavailable right now — everything else below still works.</span>
        )}
      </div>
    </header>
  );
}

function Dot() {
  return (
    <span aria-hidden="true" className="text-muted-foreground/40">
      ·
    </span>
  );
}
