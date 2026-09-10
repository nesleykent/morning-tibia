"use client";

import Image from "next/image";
import type { BoostedEntity } from "@/types/boosted";
import type { WorldDetail } from "@/types/world";
import { creatureWikiUrl } from "@/lib/utils/tibiaWiki";

/**
 * What is special today, at the size that claim deserves.
 *
 * The boosted pair is the one thing every player checks and the only real artwork the product
 * owns; it was previously two 44px thumbnails weighted identically to a market price. Here the
 * creatures are the masthead — they sit above the fold at a size you actually look at, and the
 * date and world read as a publication line beneath them.
 *
 * The two tiles sit side by side at every width. Stacked, they pushed the dispatch's first
 * sentence past the bottom of a phone screen, so the reader scrolled a full viewport before
 * the page told them anything about their world.
 */
export function Masthead({
  dateLabel,
  world,
  detail,
  creature,
  boss,
  loading,
  boostedFailed,
  worldDetailFailed,
}: {
  dateLabel: string;
  world: string;
  detail: WorldDetail | null;
  creature: BoostedEntity | null;
  boss: BoostedEntity | null;
  loading: boolean;
  boostedFailed: boolean;
  worldDetailFailed: boolean;
}) {
  return (
    <header className="relative">
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
            {dateLabel}
          </p>
          <h1 className="prose-serif mt-1.5 text-[34px] font-normal leading-[1.05] tracking-[-0.02em] text-[hsl(var(--foreground))] sm:mt-2 sm:text-[52px]">
            {world || "…"}
          </h1>
          {detail ? (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[12.5px] text-[hsl(var(--muted-foreground))]">
              <span className="tnum text-[hsl(var(--foreground))]">
                {detail.playersOnline.toLocaleString("pt-BR")}
              </span>
              <span>online</span>
              <Separator /> <span>{detail.pvpType}</span>
              <Separator /> <span>{detail.location}</span>
              {detail.battlEyeProtected && (
                <>
                  <Separator /> <span className="text-[hsl(var(--gold))]">BattlEye</span>
                </>
              )}
            </p>
          ) : (
            // Silence here used to be indistinguishable from a world with no players: the
            // whole line simply vanished when the fetch failed.
            worldDetailFailed && (
              <p className="mt-2 text-[12.5px] text-[hsl(var(--muted-foreground))]">
                World status unavailable
              </p>
            )
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-7 sm:gap-5">
        <Boosted label="Boosted creature" entity={creature} loading={loading} failed={boostedFailed} />
        <Boosted label="Boosted boss" entity={boss} loading={loading} failed={boostedFailed} />
      </div>
    </header>
  );
}

function Boosted({
  label,
  entity,
  loading,
  failed,
}: {
  label: string;
  entity: BoostedEntity | null;
  loading: boolean;
  failed: boolean;
}) {
  const href = creatureWikiUrl(entity?.name);

  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] px-3 py-3.5 ring-1 ring-inset ring-white/[0.06] sm:gap-4 sm:px-5 sm:py-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center sm:h-[72px] sm:w-[72px]">
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
          <span className="text-2xl text-[hsl(var(--muted-foreground))]" aria-hidden="true">
            {failed ? "!" : "?"}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] sm:text-[10.5px] sm:tracking-[0.14em]">
          {label}
        </p>
        {loading ? (
          <div className="skeleton mt-2 h-5 w-24" />
        ) : (
          <p className="prose-serif mt-0.5 text-pretty text-[15px] leading-tight text-[hsl(var(--foreground))] sm:text-[20px]">
            {entity?.name ? (
              href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-[hsl(var(--muted-foreground))]/40 underline-offset-[3px] transition-colors hover:decoration-[hsl(var(--gold))]"
                >
                  {entity.name}
                </a>
              ) : (
                entity.name
              )
            ) : (
              <span className="text-[hsl(var(--muted-foreground))]">
                {failed ? "Couldn't load" : "Not announced today"}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * A comma, not a middle dot.
 *
 * The strip is a list of facts about one world — "342 online, Optional PvP, South America" —
 * and reading it aloud is the test: ordinary punctuation is what a person writes, and a dot
 * separator is what a template emits. It stays `aria-hidden` because a screen reader gets the
 * separation from the element boundaries already.
 */
function Separator() {
  return <span aria-hidden="true" className="-ml-2 text-[hsl(var(--muted-foreground))]/70">,</span>;
}
