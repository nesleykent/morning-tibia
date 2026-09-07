"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Section, Eyebrow, Note } from "@/components/ui/section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import type { WorldChangeValue } from "@/types/worldChange";
import type { DailyDigest, MiniWorldChangeEntry, WorldChangeEntry } from "@/lib/dashboard/dailyDigest";

interface WorldStateSectionProps {
  digest: DailyDigest;
  onMiniChange: (id: string, patch: Partial<MiniWorldChangeValue>) => void;
  onWorldChange: (id: string, patch: Partial<WorldChangeValue>) => void;
  includeAll: boolean;
  onIncludeAllChange: (value: boolean) => void;
}

/**
 * The full picture, once the actionable work is out of the way.
 *
 * The old version rendered every catalog entry as a card of equal weight — 26 Mini World
 * Changes and 14 World Changes, most of them saying "Not checked", which is how a page ends
 * up as a wall of identical status pills. Here the grouping carries the state: a heading
 * says "not running" once, and the twenty items under it don't each repeat it. Only the
 * running ones are expanded by default, because those are the only ones with anything to
 * say about today.
 */
export function WorldStateSection({
  digest,
  onMiniChange,
  onWorldChange,
  includeAll,
  onIncludeAllChange,
}: WorldStateSectionProps) {
  const { mini, world } = digest;

  // Silent changes have their own group; they must not also appear under the announced
  // headings, or the same row shows up twice with different framing.
  const announcedRunning = mini.running.filter((e) => e.definition.detection !== "silent");
  const announcedNotRunning = mini.notRunning.filter((e) => e.definition.detection !== "silent");

  return (
    <Section
      id="world-state"
      eyebrow="World state"
      title="Everything Morning Tibia is tracking"
      action={
        <label className="flex items-center gap-2">
          <Switch checked={includeAll} onCheckedChange={onIncludeAllChange} />
          <Label className="cursor-pointer text-[12px]">Include quiet items in briefing</Label>
        </label>
      }
    >
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Eyebrow>Mini World Changes · World Board &amp; Towncryer</Eyebrow>

          {announcedRunning.length > 0 && (
            <Group
              label="Running"
              tone="active"
              count={announcedRunning.length}
              defaultOpen
            >
              {announcedRunning.map((entry) => (
                <MiniRow key={entry.definition.id} entry={entry} onChange={onMiniChange} />
              ))}
            </Group>
          )}

          {mini.allSilent.length > 0 && (
            <Group
              label="Can't be checked from a log"
              tone="special"
              count={mini.allSilent.length}
              defaultOpen={mini.silent.length > 0}
            >
              <Note className="mb-1.5">
                No World Board line and no Towncryer shout exists for these, so no paste will
                ever settle them — and their absence from a complete board reading proves
                nothing. Go and look, then record what you saw.
              </Note>
              {mini.allSilent.map((entry) => (
                <MiniRow key={entry.definition.id} entry={entry} onChange={onMiniChange} showHowToCheck />
              ))}
            </Group>
          )}

          {announcedNotRunning.length > 0 && (
            <Group label="Not running" tone="quiet" count={announcedNotRunning.length}>
              <p className="mb-1.5 text-[12px] text-muted-foreground">
                Confirmed by a complete World Board reading.
              </p>
              <NameList entries={announcedNotRunning} />
            </Group>
          )}

          {mini.unchecked.length > 0 && (
            <Group label="Not checked" tone="quiet" count={mini.unchecked.length}>
              <p className="mb-1.5 text-[12px] text-muted-foreground">
                No evidence either way — paste a complete World Board reading to settle all of
                these at once.
              </p>
              <NameList entries={mini.unchecked} />
            </Group>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Eyebrow>World Changes · Guide NPC</Eyebrow>

          {world.noteworthy.length > 0 && (
            <Group label="Worth knowing" tone="active" count={world.noteworthy.length} defaultOpen>
              {world.noteworthy.map((entry) => (
                <WorldRow key={entry.definition.id} entry={entry} onChange={onWorldChange} />
              ))}
            </Group>
          )}

          {world.quiet.length > 0 && (
            <Group label="Asked — nothing happening" tone="quiet" count={world.quiet.length}>
              {world.quiet.map((entry) => (
                <WorldRow key={entry.definition.id} entry={entry} onChange={onWorldChange} />
              ))}
            </Group>
          )}

          {world.unasked.length > 0 && (
            <Group label="Not asked" tone="quiet" count={world.unasked.length}>
              <p className="mb-1.5 text-[12px] text-muted-foreground">
                Greet any Guide NPC, say <em>world change</em>, then the keyword.
              </p>
              <div className="flex flex-col">
                {world.unasked.map((entry) => (
                  <WorldRow key={entry.definition.id} entry={entry} onChange={onWorldChange} compact />
                ))}
              </div>
            </Group>
          )}
        </div>
      </div>
    </Section>
  );
}

/**
 * A collapsible group whose heading carries the state, so the rows inside don't have to
 * repeat it. Closed by default for the groups that are just reference.
 */
function Group({
  label,
  count,
  tone,
  defaultOpen = false,
  children,
}: {
  label: string;
  count: number;
  tone: "active" | "quiet" | "special";
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex min-h-[38px] w-full items-center gap-2 py-1 text-left sm:min-h-0"
        aria-expanded={open}
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            tone === "active" && "bg-emerald-400",
            tone === "special" && "bg-gold",
            tone === "quiet" && "bg-muted-foreground/40",
          )}
        />
        <span
          className={cn(
            "text-[12.5px] font-medium",
            tone === "quiet" ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {label}
        </span>
        <span className="text-[12px] tabular-nums text-muted-foreground">{count}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="pb-2 pl-3.5">{children}</div>}
    </div>
  );
}

/** Names only — for groups where the state is the heading and each item adds nothing more. */
function NameList({ entries }: { entries: MiniWorldChangeEntry[] }) {
  return (
    <p className="text-[12.5px] leading-relaxed text-muted-foreground">
      {entries.map((entry, index) => (
        <span key={entry.definition.id}>
          {index > 0 && <span className="text-muted-foreground/40"> · </span>}
          {entry.definition.name}
        </span>
      ))}
    </p>
  );
}

function MiniRow({
  entry,
  onChange,
  showHowToCheck = false,
}: {
  entry: MiniWorldChangeEntry;
  onChange: (id: string, patch: Partial<MiniWorldChangeValue>) => void;
  showHowToCheck?: boolean;
}) {
  const { definition, value } = entry;
  const variant = definition.variants.find((v) => v.id === value.variantId);

  return (
    <div className="border-b border-border/40 py-1.5 last:border-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-foreground">
          <span aria-hidden="true" className="mr-1">
            {definition.emoji}
          </span>
          {definition.name}
        </span>
        {variant ? (
          <span className="shrink-0 text-[12px] text-gold">{variant.label}</span>
        ) : definition.variants.length > 0 ? (
          <VariantPicker entry={entry} onChange={onChange} />
        ) : null}
      </div>
      {showHowToCheck && definition.howToCheck && (
        <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
          {definition.howToCheck}
        </p>
      )}
      {showHowToCheck && (
        <div className="mt-1.5 flex gap-1.5">
          <SmallButton
            active={value.status === "active"}
            onClick={() => onChange(definition.id, { status: "active" })}
          >
            I saw it — it&apos;s running
          </SmallButton>
          <SmallButton
            active={value.status === "inactive"}
            onClick={() => onChange(definition.id, { status: "inactive", variantId: null })}
          >
            Checked — not running
          </SmallButton>
        </div>
      )}
    </div>
  );
}

function SmallButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[36px] rounded px-2.5 py-1 text-[11.5px] transition-colors sm:min-h-0",
        active
          ? "bg-gold/15 text-gold"
          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function VariantPicker({
  entry,
  onChange,
}: {
  entry: MiniWorldChangeEntry;
  onChange: (id: string, patch: Partial<MiniWorldChangeValue>) => void;
}) {
  const { definition, value } = entry;
  if (value.status !== "active") return null;
  return (
    <Select
      value={value.variantId ?? undefined}
      onValueChange={(variantId) => onChange(definition.id, { variantId })}
    >
      <SelectTrigger
        aria-label={`${definition.name} detail`}
        className="h-auto w-auto shrink-0 gap-1 border-0 bg-transparent px-0 py-0 text-[12px] text-gold shadow-none focus:ring-0"
      >
        <SelectValue placeholder={promptFor(definition.variantKind)} />
      </SelectTrigger>
      <SelectContent align="end">
        {definition.variants.map((variant) => (
          <SelectItem key={variant.id} value={variant.id}>
            {variant.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function promptFor(kind: string | null): string {
  if (kind === "faction") return "Who?";
  if (kind === "phase") return "Which?";
  return "Where?";
}

function WorldRow({
  entry,
  onChange,
  compact = false,
}: {
  entry: WorldChangeEntry;
  onChange: (id: string, patch: Partial<WorldChangeValue>) => void;
  compact?: boolean;
}) {
  const { definition, value, stateLabel } = entry;
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-1.5 last:border-0">
      <span className="min-w-0 text-[13px] text-foreground">
        <span aria-hidden="true" className="mr-1">
          {definition.emoji}
        </span>
        {definition.name}
        {compact && (
          <span className="ml-1.5 text-[11px] text-muted-foreground">{definition.guideKeyword}</span>
        )}
      </span>
      <Select
        value={value.stateId ?? undefined}
        onValueChange={(stateId) => onChange(definition.id, { stateId })}
      >
        <SelectTrigger
          aria-label={`${definition.name} state`}
          className={cn(
            "h-auto w-auto max-w-[55%] shrink-0 gap-1 border-0 bg-transparent px-0 py-0 text-[12px] shadow-none focus:ring-0",
            stateLabel ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <SelectValue placeholder="Not asked" />
        </SelectTrigger>
        <SelectContent align="end">
          {definition.states.map((state) => (
            <SelectItem key={state.id} value={state.id}>
              {state.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
