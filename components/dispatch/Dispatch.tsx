"use client";

import { Blank } from "./Blank";
import type { DispatchStanza, Segment } from "@/lib/dispatch/composeDispatch";
import type { AchievementOpportunity } from "@/types/achievement";
import type { MarketPrice, MarketPriceId, MarketTrendBasis } from "@/types/market";
import { computeTrendForBasis, ENTRIES_BY_BASIS } from "@/lib/utils/priceTrend";
import { cn } from "@/lib/utils/cn";

/**
 * The dispatch: the product, rendered as the thing the reader came for.
 *
 * There is no dashboard here because there is nothing a dashboard would add. Every fact the
 * app is sure of is a sentence; every fact it is missing is a gap in one. Reading the page top
 * to bottom answers "what is special today", "what is happening", "what needs me" and "what
 * can I do about it" in that order, without the reader ever meeting the words "Mini World
 * Change" or learning which of two Tibia mechanics a fact belongs to.
 */
export function Dispatch({
  stanzas,
  opportunities,
  numbers,
  onPick,
  emptyInvitation,
}: {
  stanzas: DispatchStanza[];
  opportunities: AchievementOpportunity[];
  numbers: NumbersProps;
  onPick: (target: string, optionId: string) => void;
  emptyInvitation: boolean;
}) {
  return (
    <article className="page-sheet rounded-xl px-6 py-8 sm:px-12 sm:py-12">
      {emptyInvitation && (
        <p className="prose-serif text-[19px] leading-[1.65] text-[hsl(var(--ink-soft))]">
          Nothing has been checked yet today. Read the world board at the Adventurer&apos;s Guild,
          ask a guide about a world change, then paste what they told you below — this page will
          write itself.
        </p>
      )}

      {stanzas.map((stanza) => (
        <section key={stanza.id} className="settle mb-8 last:mb-0">
          {stanza.heading && (
            <h2 className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--ink-faint))]">
              {stanza.heading}
            </h2>
          )}
          <div className="prose-serif flex flex-col gap-2.5 text-[18px] leading-[1.6] text-[hsl(var(--ink))] sm:text-[19px]">
            {stanza.lines.map((line, index) => (
              <p key={index} className="text-pretty">
                {/* An unfilled blank already ends the sentence with "?", so the clause's own
                    full stop is dropped until the fact arrives — otherwise every open question
                    reads "…which city?.". */}
                {line
                  .filter((segment, i) => {
                    if (segment.kind !== "text" || segment.text !== ".") return true;
                    const previous = line[i - 1];
                    return !(previous?.kind === "blank" && previous.value === null);
                  })
                  .map((segment, i) => (
                    <SegmentView key={i} segment={segment} onPick={onPick} />
                  ))}
              </p>
            ))}
          </div>
        </section>
      ))}

      {opportunities.length > 0 && (
        <section className="settle mb-8 border-t border-[hsl(var(--page-edge))] pt-7">
          <h2 className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--ink-faint))]">
            Worth doing before it ends
          </h2>
          <ul className="flex flex-col gap-3.5">
            {opportunities.map(({ definition, evidence }) => (
              <li key={definition.id}>
                <p className="prose-serif text-[18px] leading-snug text-[hsl(var(--ink))]">
                  <a
                    href={definition.source}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-[hsl(var(--ink-faint))]/40 underline-offset-[3px] transition-colors hover:decoration-[hsl(var(--ink))]"
                  >
                    {definition.achievement}
                  </a>
                  {definition.premium && (
                    <span className="ml-2 align-[0.15em] text-[10px] font-semibold uppercase tracking-[0.1em] text-[hsl(var(--ink-faint))]">
                      Premium
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-[hsl(var(--ink-soft))]">
                  {definition.task}{" "}
                  <span className="text-[hsl(var(--ink-faint))]">Because {evidence}.</span>
                  {definition.prerequisites?.length ? (
                    <span className="text-[hsl(var(--ink-faint))]">
                      {" "}Needs first: {definition.prerequisites.join(", ")}.
                    </span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Numbers {...numbers} />
    </article>
  );
}

function SegmentView({
  segment,
  onPick,
}: {
  segment: Segment;
  onPick: (target: string, optionId: string) => void;
}) {
  if (segment.kind === "text") return <>{segment.text}</>;
  if (segment.kind === "em")
    return <span className="text-[hsl(var(--ink-soft))]">{segment.text}</span>;
  return <Blank segment={segment} onPick={onPick} />;
}

export interface NumbersProps {
  rashid: string | null;
  warzones: { id: string; time: string; sequence?: string | null }[];
  prices: Record<string, MarketPrice>;
  marketBasis: MarketTrendBasis;
  serverSaveLabel: string | null;
}

const TREND = {
  up: { glyph: "↑", tone: "text-[hsl(var(--live))]" },
  down: { glyph: "↓", tone: "text-[hsl(var(--danger))]" },
  unchanged: { glyph: "→", tone: "text-[hsl(var(--ink-faint))]" },
} as const;

/**
 * Numbers do not want to be prose. Times and prices are a small tabular footer to the
 * dispatch — present, precise, and visually subordinate to the sentences above them.
 */
function Numbers({ warzones, prices, marketBasis, serverSaveLabel }: NumbersProps) {
  const priceEntries = (Object.entries(prices) as [MarketPriceId, MarketPrice][]).filter(
    ([, p]) => p.value !== null,
  );

  return (
    <footer className="mt-8 grid grid-cols-1 gap-x-10 gap-y-5 border-t border-[hsl(var(--page-edge))] pt-6 sm:grid-cols-2">
      {warzones.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-faint))]">
            Warzones
          </h3>
          <p className="tnum flex flex-wrap gap-x-3.5 gap-y-1 text-[14px] text-[hsl(var(--ink))]">
            {warzones.map((w) => (
              <span key={w.id}>
                {w.time}
                {w.sequence && (
                  <span className="ml-1 text-[11px] text-[hsl(var(--ink-faint))]">{w.sequence}</span>
                )}
              </span>
            ))}
          </p>
        </div>
      )}

      {priceEntries.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-faint))]">
            Market
          </h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
            {priceEntries.map(([id, price]) => {
              const trend = TREND[computeTrendForBasis(price.history, ENTRIES_BY_BASIS[marketBasis])];
              return (
                <div key={id} className="flex items-baseline justify-between gap-2">
                  <dt className="truncate text-[12.5px] text-[hsl(var(--ink-soft))]">
                    {shortPriceLabel(id)}
                  </dt>
                  <dd className="tnum shrink-0 text-[13.5px] text-[hsl(var(--ink))]">
                    {Math.round(price.value!).toLocaleString("en-US")}
                    <span className={cn("ml-1", trend.tone)}>{trend.glyph}</span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}

      {serverSaveLabel && (
        <p className="text-[12.5px] text-[hsl(var(--ink-faint))] sm:col-span-2">
          Everything here resets at server save, in {serverSaveLabel}.
        </p>
      )}
    </footer>
  );
}

function shortPriceLabel(id: MarketPriceId): string {
  switch (id) {
    case "tibiaCoinSell": return "Tibia Coin sell";
    case "tibiaCoinBuy": return "Tibia Coin buy";
    case "goldTokenSell": return "Gold token";
    case "silverTokenSell": return "Silver token";
    default: return id;
  }
}
