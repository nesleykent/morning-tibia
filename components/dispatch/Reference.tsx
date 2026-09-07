"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import type { WorldChangeValue } from "@/types/worldChange";
import type { DailyDigest } from "@/lib/dashboard/dailyDigest";
import type { ActiveEvent, UpcomingEvent } from "@/types/event";
import { eventEmoji } from "@/lib/formatter/eventEmoji";
import { formatActiveEventLine, formatUpcomingEventLine } from "@/lib/formatter/phrases";
import { UPCOMING_EVENTS_WINDOW_OPTIONS } from "@/lib/storage/briefingRepository";

/**
 * The complete catalog, for when the dispatch isn't enough.
 *
 * This is reference, and reference earns a different surface: every tracked change with its
 * exact state, editable, in one dense table. It is a separate view rather than a section
 * because it answers a different question ("what is the app tracking?") from the one the
 * dispatch answers ("what is true today?"), and merging them is what produced forty rows of
 * "Not checked" on the main screen in the first place.
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
            >
              {silentOpen ? (
                <span className="flex gap-1">
                  <Tiny onClick={() => onMiniChange(d.id, { status: "active" })}>Running</Tiny>
                  <Tiny onClick={() => onMiniChange(d.id, { status: "inactive", variantId: null })}>
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
        <Column title="Guide NPC" count={`${world.length} tracked`}>
          {world.map(({ definition: d, value, stateLabel }) => (
            <Row key={d.id} name={d.name} emoji={d.emoji} dim={!stateLabel} accent={!stateLabel}>
              <Inline
                value={value.stateId}
                placeholder={d.guideKeyword}
                accent={!stateLabel}
                mono={!stateLabel}
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
          {activeEvents.map((e) => (
            <Row key={e.id} name={e.title} emoji={eventEmoji(e.title)} accent>
              <span className="text-[12.5px] text-[hsl(var(--live))]">
                {formatActiveEventLine(e, "en")}
              </span>
            </Row>
          ))}
          {visibleEvents.map((e) => (
            <Row key={e.id} name={e.title} emoji={eventEmoji(e.title)} dim>
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
  name, emoji, children, dim, accent,
}: {
  name: string; emoji: string; children: React.ReactNode; dim?: boolean; accent?: boolean;
}) {
  return (
    <div className="grid grid-cols-[8px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-white/[0.05] py-[7px] last:border-0">
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 rounded-full", accent ? "bg-[hsl(var(--gold))]" : "bg-transparent")}
      />
      <span
        className={cn(
          "min-w-0 truncate text-[13px]",
          dim ? "text-[hsl(var(--muted-foreground))]" : "text-[hsl(var(--foreground))]",
        )}
      >
        <span aria-hidden="true" className="mr-1.5">{emoji}</span>
        {name}
      </span>
      <span className="justify-self-end">{children}</span>
    </div>
  );
}

function Inline({
  value, options, onChange, label, placeholder, accent, mono,
}: {
  value: string | null;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  label: string;
  placeholder: string;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-auto w-auto shrink-0 gap-1 whitespace-nowrap border-0 bg-transparent px-0 py-0 text-right text-[12.5px] shadow-none focus:ring-0",
          accent ? "text-[hsl(var(--gold))]" : "text-[hsl(var(--foreground))]",
          mono && "font-mono",
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

function Tiny({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[30px] rounded bg-white/[0.07] px-2 text-[12px] text-[hsl(var(--muted-foreground))] transition-colors hover:bg-white/[0.14] hover:text-[hsl(var(--foreground))]"
    >
      {children}
    </button>
  );
}
