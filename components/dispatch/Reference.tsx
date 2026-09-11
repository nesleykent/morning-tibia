"use client";

import { useState } from "react";
import { Check, ChevronRight, Copy as CopyIcon, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { cn } from "@/lib/utils/cn";
import type { MiniWorldChangeDefinition, MiniWorldChangeValue } from "@/types/miniWorldChange";
import type { WorldChangeDefinition, WorldChangeValue } from "@/types/worldChange";
import type { DailyDigest } from "@/lib/dashboard/dailyDigest";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import { eventEmoji } from "@/lib/formatter/eventEmoji";
import { formatActiveEventLine, formatUpcomingEventLine } from "@/lib/formatter/phrases";
import { UPCOMING_EVENTS_WINDOW_OPTIONS } from "@/lib/storage/briefingRepository";
import { GUIDE_KEYWORDS } from "@/lib/defaults/worldChanges";
import { miniWorldChangeWikiUrl, worldChangeWikiUrl } from "@/lib/utils/tibiaWiki";

/**
 * The complete catalog, for when the dispatch isn't enough.
 *
 * This is reference, and reference earns a different surface: every tracked change with its
 * exact state, editable, in one dense list. It is a separate view rather than a section because
 * it answers a different question ("what is the app tracking?") from the one the dispatch
 * answers ("what is true today?"), and merging them is what produced forty rows of "Not
 * checked" on the main screen in the first place.
 *
 * Lists, not cards. Forty entries whose whole content is a name and a state are a table, and a
 * card apiece would turn one screen of scanning into four screens of scrolling. Each row does
 * expand — the catalogs carry researched location, description, how-to-check and
 * alternative-source text for every entry — but the collapsed row stays exactly as dense as it
 * was and the detail is one click away.
 */
export function Reference({
  digest,
  onMiniChange,
  onWorldChange,
  activeEvents,
  upcomingEvents,
  windowDays,
  onWindowDaysChange,
}: {
  digest: DailyDigest;
  onMiniChange: (id: string, patch: Partial<MiniWorldChangeValue>) => void;
  onWorldChange: (id: string, patch: Partial<WorldChangeValue>) => void;
  activeEvents: ActiveEvent[];
  upcomingEvents: UpcomingEvent[];
  windowDays: number;
  onWindowDaysChange: (days: number) => void;
}) {
  const mini = [
    ...digest.mini.needsVariant,
    ...digest.mini.silent,
    ...digest.mini.running,
    ...digest.mini.allSilent,
    ...digest.mini.unchecked,
    ...digest.mini.notRunning,
  ].filter((e, i, all) => all.findIndex((x) => x.definition.id === e.definition.id) === i);

  const world = [...digest.world.noteworthy, ...digest.world.quiet, ...digest.world.unasked];
  const visibleEvents = upcomingEvents.filter((e) => e.daysUntil <= windowDays);

  return (
    /* Two columns from 768px, not 960px like the Today view. The catalog splits earlier
       because its rows are two words wide: at 820px in one column the name sits hard left,
       its state hard right and ~500px of nothing lies between them. Two columns cut that gap
       to ~120px, and the page from 2.3 screens to 1.46. The dispatch can't split that early —
       it is prose, and prose needs the width.

       Not three columns at `xl` — tried and measured. The gap improves, but the columns hold
       26, 14 and 3 rows, so the third renders ~80% empty. An even margin outside the content
       beats a hollow column inside it. */
    <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2 xl:gap-x-7">
      <Column title="Mini World Changes" count={`${mini.length} tracked`}>
        {mini.map(({ definition: d, value }) => {
          const variant = d.variants.find((v) => v.id === value.variantId);
          const pending = value.status === "active" && d.variants.length > 0 && !value.variantId;
          // A silent change nobody has looked at yet is outstanding work, and gets the dot.
          const silentOpen = d.detection === "silent" && value.status === "unchecked";
          return (
            <Row
              key={d.id}
              name={d.name}
              emoji={d.emoji}
              dim={value.status === "inactive" || value.status === "unchecked"}
              accent={pending || silentOpen}
              details={<MiniDetails definition={d} />}
            >
              {d.observations?.length ? (
                // What the player can see, in their words, and always revisable — a silent
                // change is settled by somebody's eyes and eyes make mistakes. "Running" and
                // "No" were the app asking for its own answer instead of their observation.
                <Inline
                  value={
                    d.observations.find((o) => o.establishes === value.status)?.id ?? null
                  }
                  placeholder="not looked yet"
                  accent={value.status === "unchecked"}
                  options={d.observations.map((o) => ({ id: o.id, label: o.label }))}
                  onChange={(observationId) => {
                    const seen = d.observations!.find((o) => o.id === observationId);
                    if (seen) onMiniChange(d.id, { status: seen.establishes, variantId: null });
                  }}
                  label={`What you saw at ${d.name}`}
                />
              ) : value.status === "active" && d.variants.length > 0 ? (
                <Inline
                  value={value.variantId}
                  placeholder={pending ? "choose" : ""}
                  accent={pending}
                  options={d.variants.map((v) => ({ id: v.id, label: v.label }))}
                  onChange={(variantId) => onMiniChange(d.id, { variantId })}
                  label={`${d.name} detail`}
                />
              ) : (
                <span
                  className={cn(
                    "text-[12.5px]",
                    value.status === "active" ? "font-medium text-live" : "text-ink-faint",
                  )}
                >
                  {value.status === "active"
                    ? variant?.label ?? "running"
                    : value.status === "inactive"
                      ? "not running"
                      : "not checked"}
                </span>
              )}
            </Row>
          );
        })}
      </Column>

      {/* Guide NPC and Events stay stacked in the second column: together they roughly match
          the 26-row Mini World Change list, so the two columns end up close to even. */}
      <div className="flex flex-col gap-6">
        <Column
          title="World Changes"
          count={
            <span className="flex items-center gap-2">
              <span className="text-[12px] text-ink-faint">{world.length} tracked</span>
              <CopyAllKeywords />
            </span>
          }
        >
          {/* The keyword is the single most operational fact in this catalog — it is literally
              what you type into the game. It used to be a placeholder that vanished the moment
              a state was recorded, so the app hid the words that unlock its own data source. */}
          {world.map(({ definition: d, value, stateLabel }) => (
            <Row
              key={d.id}
              name={d.name}
              emoji={d.emoji}
              dim={!stateLabel}
              accent={!stateLabel}
              aside={<KeywordChip keyword={d.guideKeyword} changeName={d.name} />}
              details={<WorldDetails definition={d} />}
            >
              <Inline
                value={value.stateId}
                placeholder="not asked"
                accent={!stateLabel}
                options={d.states.map((s) => ({ id: s.id, label: s.label }))}
                onChange={(stateId) => onWorldChange(d.id, { stateId })}
                label={`${d.name} state`}
              />
            </Row>
          ))}
        </Column>

        <Column
          title="Events"
          count={
            <Select value={String(windowDays)} onValueChange={(v) => onWindowDaysChange(Number(v))}>
              <SelectTrigger className="h-7 w-[92px] text-[12px]" aria-label="Days ahead">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {UPCOMING_EVENTS_WINDOW_OPTIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        >
          {activeEvents.length === 0 && visibleEvents.length === 0 && (
            <p className="px-3 py-2.5 text-[12.5px] text-ink-faint">Nothing in this window.</p>
          )}
          {/* Every event already arrives with its own wiki URL from the build-time fetch. */}
          {activeEvents.map((e) => (
            <Row key={e.id} name={e.title} emoji={eventEmoji(e.title)} accent href={e.url}>
              <span className="text-[12.5px] font-medium text-live">
                {formatActiveEventLine(e, "en")}
              </span>
            </Row>
          ))}
          {visibleEvents.map((e) => (
            <Row key={e.id} name={e.title} emoji={eventEmoji(e.title)} dim href={e.url}>
              <span className="text-[12.5px] text-ink-faint">{formatUpcomingEventLine(e, "en")}</span>
            </Row>
          ))}
        </Column>
      </div>
    </div>
  );
}

function Column({
  title, count, children,
}: { title: string; count: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="surface min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-surface-2 px-3 py-2">
        <h2 className="prose-serif text-[16px] font-semibold leading-tight text-ink">
          {title}
        </h2>
        <span className="text-[12px] text-ink-faint">{count}</span>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Row({
  name, emoji, children, dim, accent, details, aside, href,
}: {
  name: string;
  emoji: string;
  children: React.ReactNode;
  dim?: boolean;
  accent?: boolean;
  /** Researched context, revealed on demand. When absent the row doesn't expand. */
  details?: React.ReactNode;
  /** Always-visible extra between the name and the state control. */
  aside?: React.ReactNode;
  /** Makes the name itself a link (events, which carry their own URL). */
  href?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const nameNode = (
    <>
      <span aria-hidden="true" className="mr-1.5">{emoji}</span>
      {name}
    </>
  );

  return (
    <div
      className={cn(
        "border-b border-line-soft last:border-0",
        open && "bg-surface-2",
      )}
    >
      {/* Flex, not grid, and it wraps.
          A three-track grid gave the state column `auto`, which never shrinks — so at a
          376px column the name absorbed the entire squeeze and collapsed to "Ho…", or to
          nothing at all. Here the name keeps a 13rem floor and the state drops to its own
          right-aligned line the moment both no longer fit. Wide columns are unaffected: the
          name simply grows, which is also what stopped "The Fire-Feathered Serpent" from
          truncating at 1440. */}
      <div className="flex flex-wrap items-center gap-x-2.5 px-3 py-[5px] transition-colors hover:bg-surface-2">
        <span
          aria-hidden="true"
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            accent ? "bg-gold-bright ring-1 ring-gold-line" : "bg-transparent",
          )}
        />
        <span className="flex min-w-0 flex-[1_1_13rem] flex-wrap items-center gap-1.5">
          {details ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              title={name}
              className={cn(
                "-ml-1 flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-left text-[13px] transition-colors hover:text-ink",
                dim ? "text-ink-soft" : "font-medium text-ink",
              )}
            >
              <ChevronRight
                aria-hidden="true"
                className={cn(
                  "h-3 w-3 shrink-0 text-ink-faint transition-transform",
                  open && "rotate-90",
                )}
              />
              <span>{nameNode}</span>
            </button>
          ) : href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              title={name}
              className={cn(
                "min-w-0 text-[13px] underline decoration-line-strong underline-offset-[3px] transition-colors hover:decoration-gold",
                dim ? "text-ink-soft" : "font-medium text-ink",
              )}
            >
              {nameNode}
            </a>
          ) : (
            <span
              className={cn(
                "min-w-0 text-[13px]",
                dim ? "text-ink-soft" : "font-medium text-ink",
              )}
            >
              {nameNode}
            </span>
          )}
          {aside}
        </span>
        <span className="ml-auto min-w-0 max-w-full py-[1px]">{children}</span>
      </div>
      {open && details && <div className="pb-3 pl-[34px] pr-3">{details}</div>}
    </div>
  );
}

/** Everything the catalog knows about a Mini World Change beyond its current state. */
function MiniDetails({ definition }: { definition: MiniWorldChangeDefinition }) {
  const href = miniWorldChangeWikiUrl(definition);
  return (
    <dl className="flex flex-col gap-1.5 text-[12.5px] leading-relaxed">
      <Detail term="Where">{definition.location}</Detail>
      <Detail term="What">{definition.description}</Detail>
      {definition.detection !== "announced" && definition.howToCheck && (
        <Detail term={definition.detection === "silent" ? "No source announces it" : "Rotates each save"}>
          {definition.howToCheck}
        </Detail>
      )}
      {definition.reference?.length ? (
        // Deliberately a hint, never a claim — the board never says where Noodles is.
        <Detail term="Known spots">{definition.reference.join("; ")}</Detail>
      ) : null}
      <WikiLink href={href} />
    </dl>
  );
}

function WorldDetails({ definition }: { definition: WorldChangeDefinition }) {
  return (
    <dl className="flex flex-col gap-1.5 text-[12.5px] leading-relaxed">
      <Detail term="Where">{definition.location}</Detail>
      <Detail term="What">{definition.description}</Detail>
      <Detail term="Ask a guide">
        Greet any Guide, say <span className="font-mono text-[12px]">world change</span>, then{" "}
        <span className="font-mono text-[12px] font-medium text-ink">{definition.guideKeyword}</span>.
      </Detail>
      {definition.alternativeSource && (
        <Detail term="Also reported by">{definition.alternativeSource}</Detail>
      )}
      <WikiLink href={worldChangeWikiUrl(definition)} />
    </dl>
  );
}

function Detail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-3">
      <dt className="text-ink-faint">{term}</dt>
      <dd className="text-ink-soft">{children}</dd>
    </div>
  );
}

/** Omitted entirely when no English article exists — see lib/utils/tibiaWiki.ts. */
function WikiLink({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-3">
      <dt className="text-ink-faint">Read more</dt>
      <dd>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-gold underline-offset-[3px] hover:underline"
        >
          TibiaWiki <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </dd>
    </div>
  );
}

/** The exact word to say, always visible, one click to copy. */
function KeywordChip({ keyword, changeName }: { keyword: string; changeName: string }) {
  const { copy, copied } = useCopyToClipboard(1200);
  return (
    <button
      type="button"
      onClick={() => copy(keyword)}
      aria-label={`Copy the guide keyword ${keyword} for ${changeName}`}
      title={`Copy "${keyword}"`}
      className="inline-flex shrink-0 items-center gap-1 rounded border border-line bg-surface-2 px-1 py-[1px] font-mono text-[10.5px] text-ink-soft transition-colors hover:border-gold-line hover:bg-gold-tint hover:text-gold"
    >
      {keyword}
      {copied ? (
        <Check className="h-2.5 w-2.5" aria-hidden="true" />
      ) : (
        <CopyIcon className="h-2.5 w-2.5 opacity-50" aria-hidden="true" />
      )}
    </button>
  );
}

function CopyAllKeywords() {
  const { copy, copied } = useCopyToClipboard();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copy(GUIDE_KEYWORDS.join("\n"))}
      className="h-6 px-1.5 text-[12px]"
    >
      {copied ? <Check className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
      {copied ? "Copied" : "Copy all"}
    </Button>
  );
}

function Inline({
  value, options, onChange, label, placeholder, accent,
}: {
  value: string | null;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  label: string;
  placeholder: string;
  accent?: boolean;
}) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-auto w-auto max-w-full gap-1 whitespace-normal [&>span]:whitespace-normal [&>span]:overflow-visible [&>span]:text-clip rounded border-transparent bg-transparent px-1 py-0.5 text-right text-[12.5px] shadow-none hover:border-line hover:bg-surface focus:ring-0",
          accent ? "font-medium text-gold" : "text-ink-soft",
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
