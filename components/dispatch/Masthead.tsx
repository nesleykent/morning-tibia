"use client";

import Image from "next/image";
import type { BoostedEntity } from "@/types/boosted";
import type { WorldDetail } from "@/types/world";

/**
 * What is special today, at the size that claim deserves.
 *
 * The boosted pair is the one thing every player checks and the only real artwork the product
 * owns; it was previously two 44px thumbnails weighted identically to a market price. Here the
 * creatures are the masthead — they sit above the fold at a size you actually look at, and the
 * date and world read as a publication line beneath them.
 */
export function Masthead({
  dateLabel,
  world,
  detail,
  creature,
  boss,
  loading,
}: {
  dateLabel: string;
  world: string;
  detail: WorldDetail | null;
  creature: BoostedEntity | null;
  boss: BoostedEntity | null;
  loading: boolean;
}) {
  return (
    <header className="relative">
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
            {dateLabel}
          </p>
          <h1 className="prose-serif mt-2 text-[38px] font-normal leading-[1.05] tracking-[-0.02em] text-[hsl(var(--foreground))] sm:text-[52px]">
            {world || "…"}
          </h1>
          {detail && (
            <p className="mt-2.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-[hsl(var(--muted-foreground))]">
              <span className="tnum text-[hsl(var(--foreground))]">
                {detail.playersOnline.toLocaleString("pt-BR")}
              </span>
              <span>online</span>
              <Dot /> <span>{detail.pvpType}</span>
              <Dot /> <span>{detail.location}</span>
              {detail.battlEyeProtected && (
                <>
                  <Dot /> <span className="text-[hsl(var(--gold))]">BattlEye</span>
                </>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-7 sm:grid-cols-2 sm:gap-5">
        <Boosted label="Boosted creature" entity={creature} loading={loading} />
        <Boosted label="Boosted boss" entity={boss} loading={loading} />
      </div>
    </header>
  );
}

function Boosted({
  label,
  entity,
  loading,
}: {
  label: string;
  entity: BoostedEntity | null;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3.5 py-4 ring-1 ring-inset ring-white/[0.06] sm:gap-4 sm:px-5 sm:py-5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center sm:h-[72px] sm:w-[72px]">
        {loading ? (
          <div className="skeleton h-full w-full" />
        ) : entity?.imageUrl ? (
          // Lit from the left, like everything else on this page.
          <Image
            src={entity.imageUrl}
            alt=""
            width={80}
            height={80}
            unoptimized
            className="h-full w-full object-contain drop-shadow-[0_6px_14px_hsl(38_60%_10%/0.6)]"
          />
        ) : (
          <span className="text-2xl text-[hsl(var(--muted-foreground))]">?</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
          {label}
        </p>
        {loading ? (
          <div className="skeleton mt-2 h-5 w-28" />
        ) : (
          <p className="prose-serif mt-0.5 text-pretty text-[17px] leading-tight text-[hsl(var(--foreground))] sm:text-[20px]">
            {entity?.name || "—"}
          </p>
        )}
      </div>
    </div>
  );
}

function Dot() {
  return <span aria-hidden="true" className="text-[hsl(var(--muted-foreground))]/70">·</span>;
}
