"use client";

import Image from "next/image";
import type { BoostedEntity } from "@/types/boosted";
import type { WorldDetail } from "@/types/world";
import { creatureWikiUrl } from "@/lib/utils/tibiaWiki";

/**
 * What is special today, at the size that claim deserves.
 *
 * The boosted pair is the one thing every player checks and the only real artwork the product
 * owns, so it sits beside the world's name rather than under it: on a desktop the whole
 * masthead is one band — who and when on the left, the two creatures on the right — and the
 * dispatch begins immediately below the fold line instead of a screen further down.
 *
 * Nothing here is boxed except the two tiles. The masthead reads as a publication line printed
 * on the field itself; the surfaces start with the document.
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
    <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-6 lg:gap-8">
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
          {dateLabel}
        </p>
        <h1 className="prose-serif mt-1 text-[32px] font-normal leading-[1.04] tracking-[-0.02em] text-ink sm:text-[42px]">
          {world || "…"}
        </h1>
        {detail ? (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-ink-soft">
            <span className="tnum font-medium text-ink">
              {detail.playersOnline.toLocaleString("pt-BR")}
            </span>
            <span>online</span>
            <Separator /> <span>{detail.pvpType}</span>
            <Separator /> <span>{detail.location}</span>
            {detail.battlEyeProtected && (
              <>
                <Separator /> <span className="font-medium text-gold">BattlEye</span>
              </>
            )}
          </p>
        ) : (
          // Silence here used to be indistinguishable from a world with no players: the
          // whole line simply vanished when the fetch failed.
          worldDetailFailed && (
            <p className="mt-1.5 text-[12.5px] text-ink-soft">World status unavailable</p>
          )
        )}
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2.5 sm:gap-3 md:w-[376px] lg:w-[408px]">
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
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-line bg-surface px-2 py-2.5 sm:gap-3 sm:px-3 shadow-card">
      <div className="flex h-8 w-8 shrink-0 sm:h-11 sm:w-11 items-center justify-center">
        {loading ? (
          <div className="skeleton h-full w-full" />
        ) : entity?.imageUrl ? (
          // Lit from above-left, like everything else on this page.
          <Image
            src={entity.imageUrl}
            alt=""
            width={80}
            height={80}
            unoptimized
            className="h-full w-full object-contain drop-shadow-[0_3px_6px_hsl(30_40%_25%/0.28)]"
          />
        ) : (
          <span className="text-xl text-ink-faint" aria-hidden="true">
            {failed ? "!" : "?"}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
          {label}
        </p>
        {loading ? (
          <div className="skeleton mt-1.5 h-4 w-20" />
        ) : (
          <p className="prose-serif mt-0.5 break-words text-pretty text-[16px] leading-tight text-ink">
            {entity?.name ? (
              href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-line-strong underline-offset-[3px] transition-colors hover:decoration-gold"
                >
                  {entity.name}
                </a>
              ) : (
                entity.name
              )
            ) : (
              <span className="text-[14px] text-ink-faint">
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
  return <span aria-hidden="true" className="-ml-2 text-ink-faint">,</span>;
}
