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
 * exact state, editable, in one dense table. It is a separate view rather than a section
 * because it answers a different question ("what is the app tracking?") from the one the
 * dispatch answers ("what is true today?"), and merging them is what produced forty rows of
 * "Not checked" on the main screen in the first place.
 *
 * Each row expands. The catalogs carry researched location, description, how-to-check and
 * alternative-source text for every entry, none of which had anywhere to appear — but putting
 * it inline would turn a scannable list into four hundred lines of prose, so the collapsed row
 * stays exactly as dense as it was and the detail is one click away.
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
    <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-2">
      <Column title="World board & towncryer" count={`${mini.length} tracked`}>
        {mini.map(({ definition: d, value }) => {
          const variant = d.variants.find((v) => v.id === value.variantId);
          const pending = value.status === "active" && d.variants.length > 0 && !value.variantId;
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
              {silentOpen ? (
                <span className="flex gap-1">
                  <Tiny
                    onClick={() => onMiniChange(d.id, { status: "active" })}
                    label={`Mark ${d.name} as running`}
                  >
                    Running
                  </Tiny>
                  <Tiny
                    onClick={() => onMiniChange(d.id, { status: "inactive", variantId: null })}
                    label={`Mark ${d.name} as not running`}
                  >
                    No
                  </Tiny>
                </span>
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
                    value.status === "active"
                      ? "text-[hsl(var(--live))]"
                      : "text-[hsl(var(--muted-foreground))]",
                  )}
                >
                  {value.status === "active"
                    ? variant?.label ?? "running"
                    : value.status === "inactive"
                      ? "not running"
                      : "—"}
                </span>
              )}
            </Row>
          );
        })}
      </Column>

      <div className="flex flex-col gap-10">
        <Column
          title="Guide NPC"
          count={
            <span className="flex items-center gap-2">
              <span className="text-[12px] text-[hsl(var(--muted-foreground))]">
                {world.length} tracked
              </span>
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
              <SelectTrigger className="h-7 w-[92px] border-white/10 bg-transparent text-[12px]" aria-label="Days ahead">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UPCOMING_EVENTS_WINDOW_OPTIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        >
          {activeEvents.length === 0 && visibleEvents.length === 0 && (
            <p className="py-2 text-[12.5px] text-[hsl(var(--muted-foreground))]">
              Nothing in this window.
            </p>
          )}
          {/* Every event already arrives with its own wiki URL from the build-time fetch. */}
          {activeEvents.map((e) => (
            <Row key={e.id} name={e.title} emoji={eventEmoji(e.title)} accent href={e.url}>
              <span className="text-[12.5px] text-[hsl(var(--live))]">
                {formatActiveEventLine(e, "en")}
              </span>
            </Row>
          ))}
          {visibleEvents.map((e) => (
            <Row key={e.id} name={e.title} emoji={eventEmoji(e.title)} dim href={e.url}>
              <span className="text-[12.5px] text-[hsl(var(--muted-foreground))]">
                {formatUpcomingEventLine(e, "en")}
              </span>
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
    <section className="min-w-0">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
          {title}
        </h2>
        <span className="text-[12px] text-[hsl(var(--muted-foreground))]">{count}</span>
      </div>
      <div className="mt-0.5">{children}</div>
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
    <div className="border-b border-white/[0.05] last:border-0">
      <div className="grid grid-cols-[8px_minmax(0,1fr)_auto] items-center gap-x-3 py-[7px]">
        <span
          aria-hidden="true"
          className={cn("h-1.5 w-1.5 rounded-full", accent ? "bg-[hsl(var(--gold))]" : "bg-transparent")}
        />
        <span className="flex min-w-0 items-center gap-2">
          {details ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className={cn(
                "flex min-w-0 items-center gap-1 truncate text-left text-[13px] transition-colors hover:text-[hsl(var(--foreground))]",
                dim ? "text-[hsl(var(--muted-foreground))]" : "text-[hsl(var(--foreground))]",
              )}
            >
              <ChevronRight
                aria-hidden="true"
                className={cn(
                  "h-3 w-3 shrink-0 text-[hsl(var(--muted-foreground))] transition-transform",
                  open && "rotate-90",
                )}
              />
              <span className="truncate">{nameNode}</span>
            </button>
          ) : href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "min-w-0 truncate text-[13px] underline decoration-white/20 underline-offset-[3px] transition-colors hover:decoration-[hsl(var(--gold))]",
                dim ? "text-[hsl(var(--muted-foreground))]" : "text-[hsl(var(--foreground))]",
              )}
            >
              {nameNode}
            </a>
          ) : (
            <span
              className={cn(
                "min-w-0 truncate text-[13px]",
                dim ? "text-[hsl(var(--muted-foreground))]" : "text-[hsl(var(--foreground))]",
              )}
            >
              {nameNode}
            </span>
          )}
          {aside}
        </span>
        <span className="justify-self-end">{children}</span>
      </div>
      {open && details && <div className="pb-3 pl-[19px] pr-1">{details}</div>}
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
        <Detail term="Known spots">{definition.reference.join(" · ")}</Detail>
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
        Greet any Guide, say <span className="font-mono">world change</span>, then{" "}
        <span className="font-mono text-[hsl(var(--foreground))]">{definition.guideKeyword}</span>.
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
    <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-x-3">
      <dt className="text-[hsl(var(--muted-foreground))]/80">{term}</dt>
      <dd className="text-[hsl(var(--muted-foreground))]">{children}</dd>
    </div>
  );
}

/** Omitted entirely when no English article exists — see lib/utils/tibiaWiki.ts. */
function WikiLink({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-x-3">
      <dt className="text-[hsl(var(--muted-foreground))]/80">Read more</dt>
      <dd>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[hsl(var(--gold))] underline-offset-[3px] hover:underline"
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
      className="inline-flex shrink-0 items-center gap-1 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-[hsl(var(--muted-foreground))] transition-colors hover:bg-white/[0.12] hover:text-[hsl(var(--foreground))]"
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
      className="h-7 px-2 text-[12px] text-[hsl(var(--muted-foreground))]"
    >
      {copied ? <Check className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
      {copied ? "Copied" : "Copy all keywords"}
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
          "h-auto w-auto shrink-0 gap-1 whitespace-nowrap border-0 bg-transparent px-0 py-0 text-right text-[12.5px] shadow-none focus:ring-0",
          accent ? "text-[hsl(var(--gold))]" : "text-[hsl(var(--foreground))]",
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

function Tiny({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="min-h-[30px] rounded bg-white/[0.07] px-2 text-[12px] text-[hsl(var(--muted-foreground))] transition-colors hover:bg-white/[0.14] hover:text-[hsl(var(--foreground))]"
    >
      {children}
    </button>
  );
}
