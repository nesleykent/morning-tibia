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
    <article className="sheet px-5 py-6 sm:px-9 sm:py-8">
      {invitation}

      {stanzas.map((stanza) => (
        <section key={stanza.id} className="settle mb-7 last:mb-0">
          {stanza.heading && (
            <h2 className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint">
              {stanza.heading}
            </h2>
          )}
          <div className="prose-serif flex flex-col gap-2.5 text-[16.5px] leading-[1.62] text-ink sm:text-[17.5px]">
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
        <section className="settle mb-7 border-t border-line pt-6">
          <h2 className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint">
            Worth doing before it ends
          </h2>
          <ul className="flex flex-col gap-3.5">
            {opportunities.map(({ definition, conditionName, conditionState }) => (
              <li key={definition.id}>
                <p className="prose-serif text-[16.5px] leading-snug text-ink sm:text-[17.5px]">
                  <a
                    href={definition.sources[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-line-strong underline-offset-[3px] transition-colors hover:decoration-gold"
                  >
                    {definition.subject}
                  </a>
                  <Meta>{opportunityMeta(definition)}</Meta>
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">
                  {definition.detail.en}{" "}
                  <span className="text-ink-faint">
                    Because {conditionName}
                    {conditionState ? `: ${conditionState}` : " is running"}.
                  </span>
                  {definition.prerequisites?.length ? (
                    <span className="text-ink-faint">
                      {" "}Needs first: {definition.prerequisites.join(", ")}.
                    </span>
                  ) : null}
                </p>
                {/* Never omitted. A caveat is the difference between "you can finish this
                    today" and "today moves this one step of five" — leaving it out is how an
                    opportunity gets oversold. */}
                {definition.caveat && (
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-faint">
                    Note: {definition.caveat.en}
                  </p>
                )}
                {/* Marked as a tip, never folded into the facts above: a recommended level is
                    somebody's judgement, and the reader is entitled to know which is which. */}
                {definition.advisory && (
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-faint">
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
    parts.push(`${label}${points} ${points === 1 ? "pt" : "pts"}${premium ? ", Premium" : ""}`);
  }
  if (definition.bosstiary) parts.push(definition.bosstiary);
  if (definition.exclusive) parts.push("only in this state");
  if (definition.availability === "progressable-today") parts.push("progress only");
  if (definition.availability === "unlocks-future") parts.push("after server save");
  return parts.join(", ");
}

/** Small trailing metadata on a line of prose — present, precise, visually subordinate. */
function Meta({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-2 align-[0.15em] text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
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
    return <span className="text-ink-soft">{segment.text}</span>;
  if (segment.kind === "link")
    return (
      <a
        href={segment.href}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-line-strong underline-offset-[3px] transition-colors hover:decoration-gold"
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
  up: { glyph: "↑", tone: "text-live" },
  down: { glyph: "↓", tone: "text-danger" },
  unchanged: { glyph: "→", tone: "text-ink-faint" },
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
    <footer className="mt-7 grid grid-cols-1 gap-y-5 border-t border-line pt-5">
      {warzones.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint">
            Warzones
          </h3>
          <p className="tnum flex flex-wrap gap-x-3.5 gap-y-1 text-[14px] text-ink">
            {warzones.map((w) => (
              <span key={w.id} className="whitespace-nowrap">
                {w.time}{w.sequence ? ` (${w.sequence})` : ""}
              </span>
            ))}
          </p>
        </div>
      )}

      {(priceEntries.length > 0 || marketUnavailable) && (
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint">
              Market
            </h3>
            {priceEntries.length > 0 && (
              <div
                className="inline-flex items-center rounded-md border border-line p-0.5"
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
                        ? "bg-gold-tint text-gold"
                        : "text-ink-faint hover:bg-accent hover:text-ink",
                    )}
                  >
                    {BASIS_LABEL[basis]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {marketUnavailable && priceEntries.length === 0 ? (
            <p className="text-[12.5px] text-ink-soft">
              Market data couldn&apos;t be loaded.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] items-start gap-x-8 gap-y-3">
                {MARKET_ASSETS.map(({ name, ids }) => {
                  const entries = priceEntries.filter(([id]) => ids.includes(id));
                  if (entries.length === 0) return null;
                  return (
                    <section key={name} aria-label={name} className="min-w-max">
                      <h4 className="mb-1 whitespace-nowrap text-[13.5px] font-semibold text-ink">
                        {name}
                      </h4>
                      <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1">
                        {entries.map(([id, price]) => {
                          const trend = TREND[computeTrendForBasis(price.history, entryCount)];
                          const shown = averageOfLastEntries(price.history, entryCount) ?? price.value!;
                          return (
                            <div key={id} className="contents">
                              <dt className="whitespace-nowrap text-[12.5px] text-ink-soft">
                                {id === "tibiaCoinBuy" ? "Compra" : "Venda"}
                              </dt>
                              <dd className="tnum whitespace-nowrap text-right text-[13.5px] text-ink">
                                {Math.round(shown).toLocaleString("pt-BR")}
                                <span className={cn("ml-1", trend.tone)}>{trend.glyph}</span>
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    </section>
                  );
                })}
              </div>
              {ageLabel && (
                <p className="mt-1.5 text-[11px] text-ink-faint">
                  tibiamarket.top, {ageLabel}
                  {isStale && (
                    <span title="Market prices are more than two days old">
                      {" · stale"}
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
    <p className="text-[12.5px] text-ink-faint">
      Everything here resets at server save, in{" "}
      <span className="tnum">{formatCountdownClock(msLeft)}</span>.
    </p>
  );
}

const MARKET_ASSETS: { name: string; ids: MarketPriceId[] }[] = [
  { name: "Tibia Coin", ids: ["tibiaCoinSell", "tibiaCoinBuy"] },
  { name: "Gold Token", ids: ["goldTokenSell"] },
  { name: "Silver Token", ids: ["silverTokenSell"] },
];
