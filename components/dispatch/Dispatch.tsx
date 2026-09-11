"use client";

import { Blank } from "./Blank";
import { OpportunityList } from "./OpportunityList";
import type { DispatchStanza, Segment } from "@/lib/dispatch/composeDispatch";
import type { Merchant } from "@/types/merchant";
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

/** The visual daily dashboard. All copy/share formatting stays in the briefing renderer. */
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
  /** First-run instructions, displayed before the change entries. */
  invitation: React.ReactNode;
}) {
  return (
    <article className="dispatch-dashboard">
      <nav
        aria-label="Daily information"
        className={cn(
          "mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-soft",
          !stanzas.some((stanza) => ["happening", "guides"].includes(stanza.id)) && opportunities.length === 0 && "min-[1200px]:hidden",
        )}
      >
        {stanzas.filter((stanza) => ["happening", "guides"].includes(stanza.id)).map((stanza) => (
          <a key={stanza.id} href={`#daily-${stanza.id}`} className="underline decoration-line-strong underline-offset-4 hover:text-ink">
            {stanza.heading}
          </a>
        ))}
        {opportunities.length > 0 && (
          <a href="#daily-opportunities" className="underline decoration-line-strong underline-offset-4 hover:text-ink">
            Worth doing before it ends
          </a>
        )}
        <a href="#dashboard-tools" className="min-[1200px]:hidden underline decoration-line-strong underline-offset-4 hover:text-ink">Game log &amp; copy</a>
      </nav>
      <Numbers
        {...numbers}
        stanzas={stanzas}
        onPick={onPick}
      />
      {invitation}

      <div className="dispatch-sections">
        {stanzas.filter((stanza) => !["merchants", "boosted-region"].includes(stanza.id)).map((stanza) => (
          <StanzaView key={stanza.id} stanza={stanza} onPick={onPick} />
        ))}
      </div>

      {opportunities.length > 0 && <OpportunityList opportunities={opportunities} />}
    </article>
  );
}

function StanzaView({
  stanza,
  onPick,
}: {
  stanza: DispatchStanza;
  onPick: (target: string, optionId: string) => void;
}) {
  const grouped = ["happening", "guides", "silent"].includes(stanza.id);
  return (
    <section id={`daily-${stanza.id}`} data-section={stanza.id} className="settle dispatch-section">
      {stanza.heading && (
        <h2 className="dispatch-section-title">
          {stanza.heading}
        </h2>
      )}
      <div className={cn("text-[13px] leading-[1.5] text-ink-soft", grouped ? "dispatch-entries" : "space-y-1.5")}>
        {stanza.lines.map((line, index) => (
          <div
            key={stanza.lineLabels?.[index] ?? index}
            className={stanza.lineLabels || stanza.id === "silent" ? "dispatch-entry" : undefined}
          >
            {stanza.lineLabels?.[index] ? (
              <h3 className="dispatch-item-title">{stanza.lineLabels[index]}</h3>
            ) : stanza.id === "silent" && line[0] ? (
              <h3 className="dispatch-item-title"><SegmentView segment={line[0]} onPick={onPick} /></h3>
            ) : null}
            <p>
              {/* The unresolved picker already ends in a question mark. */}
              {line
                .slice(stanza.id === "silent" ? 2 : 0)
                .filter((segment, i, segments) => {
                  if (segment.kind !== "text" || segment.text !== ".") return true;
                  const previous = segments[i - 1];
                  return !(previous?.kind === "blank" && previous.value === null);
                })
                .map((segment, i) => (
                  <SegmentView key={i} segment={segment} onPick={onPick} />
                ))}
            </p>
          </div>
        ))}
      </div>
    </section>
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
  merchants: Record<string, Merchant>;
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
 * A compact daily overview keeps schedules, market values, region and merchants
 * available before the longer change and opportunity sections.
 */
function Numbers({
  warzones,
  prices,
  marketBasis,
  onMarketBasisChange,
  marketUnavailable,
  merchants,
  stanzas,
  onPick,
}: NumbersProps & { stanzas: DispatchStanza[]; onPick: (target: string, optionId: string) => void }) {
  const region = stanzas.find((s) => s.id === "boosted-region")?.lines.flat().find((s) => s.kind === "blank");
  const yasir = stanzas.find((s) => s.id === "merchants")?.lines.flat().find((s) => s.kind === "blank" && s.target === "merchant:yasir");
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
    <section aria-label="Daily numbers" className="dispatch-numbers">
      <div className="sheet p-3">
      {warzones.length > 0 && (
        <div>
          <h2 className="dispatch-section-title">
            Warzones
          </h2>
          <p className="tnum flex flex-wrap gap-x-3.5 gap-y-1 text-[14px] text-ink">
            {warzones.map((w) => (
              <span key={w.id} className="whitespace-nowrap">
                {w.time}{w.sequence ? ` (${w.sequence})` : ""}
              </span>
            ))}
          </p>
        </div>
      )}

        <h2 className="dispatch-section-title dispatch-facts-heading">Today’s details</h2>
        <dl className="dispatch-facts">
          <dt>Rashid</dt><dd>{merchants.rashid?.location || "Not verified"}</dd>
          <dt>Yasir</dt><dd>{yasir ? <SegmentView segment={yasir} onPick={onPick} /> : merchants.yasir?.activityState === "inactive" ? "Not trading today" : "Not verified"}</dd>
          <dt>Boosted region</dt><dd>{region ? <SegmentView segment={region} onPick={onPick} /> : "Not verified"}</dd>
          <dt>Server save</dt><dd><ServerSaveLine /></dd>
        </dl>
      </div>

      {(priceEntries.length > 0 || marketUnavailable) && (
        <div className="sheet p-3">
          <div className="dispatch-market-heading">
            <h2 className="dispatch-section-title">
              Market
            </h2>
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
              <div className="dispatch-market-assets grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] items-start gap-x-4 gap-y-3">
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
                <p className="dispatch-market-source">
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

    </section>
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
    <span title="Everything here resets at server save">
      <span className="tnum">{formatCountdownClock(msLeft)}</span><span className="text-ink-faint"> · daily reset</span>
    </span>
  );
}

const MARKET_ASSETS: { name: string; ids: MarketPriceId[] }[] = [
  { name: "Tibia Coin", ids: ["tibiaCoinSell", "tibiaCoinBuy"] },
  { name: "Gold Token", ids: ["goldTokenSell"] },
  { name: "Silver Token", ids: ["silverTokenSell"] },
];
