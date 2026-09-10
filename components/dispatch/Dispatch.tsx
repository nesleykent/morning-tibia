"use client";

import { Blank } from "./Blank";
import type { DispatchStanza, Segment } from "@/lib/dispatch/composeDispatch";
import type { Opportunity } from "@/types/opportunity";
import type { MarketPrice, MarketPriceId, MarketTrendBasis } from "@/types/market";
import { computeTrendForBasis, ENTRIES_BY_BASIS, averageOfLastEntries } from "@/lib/utils/priceTrend";
import { MARKET_TREND_BASIS_OPTIONS } from "@/lib/storage/briefingRepository";
import { formatTimeAgo } from "@/lib/utils/timeAgo";
import { getNextServerSave } from "@/lib/utils/serverSave";
import { formatCountdownClock } from "@/lib/formatter/dateFormat";
import { useNowMs } from "@/lib/utils/clock";
import { cn } from "@/lib/utils/cn";

/** Older than this and a "current" market price is not current enough to show plainly. */
const STALE_PRICE_MS = 2 * 24 * 60 * 60 * 1000;

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
  invitation,
}: {
  stanzas: DispatchStanza[];
  opportunities: Opportunity[];
  numbers: NumbersProps;
  onPick: (target: string, optionId: string) => void;
  /** Rendered above everything when the reader has told the app nothing yet. */
  invitation: React.ReactNode;
}) {
  return (
    <article className="page-sheet rounded-xl px-6 py-8 sm:px-12 sm:py-12">
      {invitation}

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
            {opportunities.map(({ definition, conditionName, conditionState }) => (
              <li key={definition.id}>
                <p className="prose-serif text-[18px] leading-snug text-[hsl(var(--ink))]">
                  <a
                    href={definition.sources[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-[hsl(var(--ink-faint))]/40 underline-offset-[3px] transition-colors hover:decoration-[hsl(var(--ink))]"
                  >
                    {definition.subject}
                  </a>
                  <Meta>{opportunityMeta(definition)}</Meta>
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-[hsl(var(--ink-soft))]">
                  {definition.detail.en}{" "}
                  <span className="text-[hsl(var(--ink-faint))]">
                    Because {conditionName}
                    {conditionState ? `: ${conditionState}` : " is running"}.
                  </span>
                  {definition.prerequisites?.length ? (
                    <span className="text-[hsl(var(--ink-faint))]">
                      {" "}Needs first: {definition.prerequisites.join(", ")}.
                    </span>
                  ) : null}
                </p>
                {/* Never omitted. A caveat is the difference between "you can finish this
                    today" and "today moves this one step of five" — leaving it out is how an
                    opportunity gets oversold. */}
                {definition.caveat && (
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[hsl(var(--ink-faint))]">
                    Note: {definition.caveat.en}
                  </p>
                )}
                {/* Marked as a tip, never folded into the facts above: a recommended level is
                    somebody's judgement, and the reader is entitled to know which is which. */}
                {definition.advisory && (
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[hsl(var(--ink-faint))]">
                    Tip: {definition.advisory.en}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Numbers {...numbers} />
    </article>
  );
}

/**
 * The typed facts behind an opportunity, in the order a player weighs them: what kind of thing
 * it is, what it costs, and — always — when they can actually have it. `available-today` is the
 * only case with no availability chip, because an unqualified line already means today.
 */
function opportunityMeta(definition: Opportunity["definition"]): string {
  const parts: string[] = [definition.kind];
  if (definition.bestiary) {
    parts.push(`${definition.bestiary.kills} kills`, `${definition.bestiary.charmPoints} charm`);
  }
  if (definition.achievement) {
    const { name, points, premium } = definition.achievement;
    // Name it unless the subject already is the achievement — a bare "1 pt" hanging off
    // "Mamma Longlegs" tells the reader a point exists without saying what earns it.
    const label = definition.kind === "achievement" ? "" : `${name}, `;
    parts.push(`${label}${points} ${points === 1 ? "pt" : "pts"}${premium ? " · Premium" : ""}`);
  }
  if (definition.bosstiary) parts.push(definition.bosstiary);
  if (definition.exclusive) parts.push("only in this state");
  if (definition.availability === "progressable-today") parts.push("progress only");
  if (definition.availability === "unlocks-future") parts.push("after server save");
  return parts.join(" · ");
}

/** Small trailing metadata on a line of prose — present, precise, visually subordinate. */
function Meta({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-2 align-[0.15em] text-[10px] font-semibold uppercase tracking-[0.1em] text-[hsl(var(--ink-faint))]">
      {children}
    </span>
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
  if (segment.kind === "link")
    return (
      <a
        href={segment.href}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-[hsl(var(--ink-faint))]/35 underline-offset-[3px] transition-colors hover:decoration-[hsl(var(--ink))]"
      >
        {segment.text}
      </a>
    );
  return <Blank segment={segment} onPick={onPick} />;
}

export interface NumbersProps {
  warzones: { id: string; time: string; sequence?: string | null }[];
  prices: Record<string, MarketPrice>;
  marketBasis: MarketTrendBasis;
  onMarketBasisChange: (basis: MarketTrendBasis) => void;
  /** True when the market feed itself failed — the block says so rather than showing nothing. */
  marketUnavailable: boolean;
}

const TREND = {
  up: { glyph: "↑", tone: "text-[hsl(var(--live-ink))]" },
  down: { glyph: "↓", tone: "text-[hsl(var(--danger-ink))]" },
  unchanged: { glyph: "→", tone: "text-[hsl(var(--ink-faint))]" },
} as const;

const BASIS_LABEL: Record<MarketTrendBasis, string> = {
  last: "Last",
  avg3: "3",
  avg7: "7",
  avg14: "14",
};

/**
 * Numbers do not want to be prose. Times and prices are a small tabular footer to the
 * dispatch — present, precise, and visually subordinate to the sentences above them.
 */
function Numbers({
  warzones,
  prices,
  marketBasis,
  onMarketBasisChange,
  marketUnavailable,
}: NumbersProps) {
  const nowMs = useNowMs();
  const priceEntries = (Object.entries(prices) as [MarketPriceId, MarketPrice][]).filter(
    ([, p]) => p.value !== null,
  );
  const entryCount = ENTRIES_BY_BASIS[marketBasis];

  // Freshness of the feed as a whole: the newest observation across the tracked prices.
  const newestTimestamp = priceEntries.reduce<number | null>((newest, [, price]) => {
    const stamp = price.sourceTimestamp ?? price.history[price.history.length - 1]?.timestamp ?? null;
    if (stamp === null) return newest;
    return newest === null || stamp > newest ? stamp : newest;
  }, null);
  const ageLabel =
    newestTimestamp !== null && nowMs > 0 ? formatTimeAgo(newestTimestamp, nowMs) : null;
  const isStale = newestTimestamp !== null && nowMs > 0 && nowMs - newestTimestamp > STALE_PRICE_MS;

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

      {(priceEntries.length > 0 || marketUnavailable) && (
        <div>
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--ink-faint))]">
              Market
            </h3>
            {priceEntries.length > 0 && (
              <div
                className="flex items-center gap-0.5"
                role="group"
                aria-label="Market average basis"
              >
                {MARKET_TREND_BASIS_OPTIONS.map((basis) => (
                  <button
                    key={basis}
                    type="button"
                    onClick={() => onMarketBasisChange(basis)}
                    aria-pressed={marketBasis === basis}
                    title={
                      basis === "last"
                        ? "Show the latest entry"
                        : `Average the last ${ENTRIES_BY_BASIS[basis]} entries`
                    }
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
                      marketBasis === basis
                        ? "bg-[hsl(var(--gold)/0.28)] text-[hsl(var(--ink))]"
                        : "text-[hsl(var(--ink-faint))] hover:bg-[hsl(var(--gold)/0.14)] hover:text-[hsl(var(--ink))]",
                    )}
                  >
                    {BASIS_LABEL[basis]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {marketUnavailable && priceEntries.length === 0 ? (
            <p className="text-[12.5px] text-[hsl(var(--ink-soft))]">
              Market data couldn&apos;t be loaded.
            </p>
          ) : (
            <>
              <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-1", isStale && "opacity-60")}>
                {priceEntries.map(([id, price]) => {
                  const trend = TREND[computeTrendForBasis(price.history, entryCount)];
                  // The shown figure follows the selected basis, so "Avg 7" reads the
                  // 7-entry average rather than the newest tick with a 7-entry arrow.
                  const shown = averageOfLastEntries(price.history, entryCount) ?? price.value!;
                  return (
                    <div key={id} className="flex items-baseline justify-between gap-2">
                      <dt className="truncate text-[12.5px] text-[hsl(var(--ink-soft))]">
                        {shortPriceLabel(id)}
                      </dt>
                      <dd className="tnum shrink-0 text-[13.5px] text-[hsl(var(--ink))]">
                        {Math.round(shown).toLocaleString("en-US")}
                        <span className={cn("ml-1", trend.tone)}>{trend.glyph}</span>
                      </dd>
                    </div>
                  );
                })}
              </dl>
              {ageLabel && (
                <p className="mt-1.5 text-[11px] text-[hsl(var(--ink-faint))]">
                  tibiamarket.top · {ageLabel}
                  {isStale && (
                    <span className="ml-1.5 font-semibold uppercase tracking-[0.08em]">
                      · stale
                    </span>
                  )}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <ServerSaveLine />
    </footer>
  );
}

/**
 * Its own component, subscribing to the shared clock directly, for two reasons: it stays in
 * step with the top bar's countdown to the same instant (they used to disagree by minutes,
 * because this one was frozen at page load), and only this line re-renders each second
 * instead of the whole dispatch.
 */
function ServerSaveLine() {
  const nowMs = useNowMs();
  if (nowMs === 0) return null;
  const msLeft = getNextServerSave(new Date(nowMs)).getTime() - nowMs;
  return (
    <p className="text-[12.5px] text-[hsl(var(--ink-faint))] sm:col-span-2">
      Everything here resets at server save, in{" "}
      <span className="tnum">{formatCountdownClock(msLeft)}</span>.
    </p>
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
