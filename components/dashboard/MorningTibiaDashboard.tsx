"use client";

import { useCallback, useMemo, useState } from "react";
import { Share2, Check, Copy as CopyIcon, RefreshCw, RotateCcw, AlertTriangle, Sunrise } from "lucide-react";
import { useBriefingState, type UseBriefingStateProps } from "@/hooks/useBriefingState";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useIsClient } from "@/hooks/useIsClient";
import { Masthead } from "@/components/dispatch/Masthead";
import { Dispatch } from "@/components/dispatch/Dispatch";
import { UNFILLED_BLANK_SELECTOR } from "@/components/dispatch/Blank";
import { EvidenceBar } from "@/components/dispatch/EvidenceBar";
import { Reference } from "@/components/dispatch/Reference";
import { WorldSelector } from "./WorldSelector";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";
import { buildDailyDigest } from "@/lib/dashboard/dailyDigest";
import { deriveAchievementOpportunities } from "@/lib/achievements/opportunities";
import { composeDispatch } from "@/lib/dispatch/composeDispatch";
import { convertTimeBetweenZones } from "@/lib/utils/timezone";
import { toBriefingDate, toTibiaDayKey } from "@/lib/utils/date";
import { useNowMs } from "@/lib/utils/clock";
import { BRIEFING_LANGUAGES, type BriefingLanguage } from "@/lib/formatter/translations";
import type { MarketTrendBasis } from "@/types/market";

/**
 * Morning Tibia.
 *
 * The product object is *my Tibia world today*, and the page is that object: a dispatch you
 * read, with the handful of facts the game can't tell the app left as gaps you fill. There is
 * no dashboard, no card grid and no permanent briefing pane — the briefing is what you take
 * away at the end, so it is an action, not a region.
 *
 * The complete catalog lives on a second view because it answers a different question. That is
 * navigation between two purposes, not a disclosure hiding content from the first one.
 */
export function MorningTibiaDashboard(props: UseBriefingStateProps) {
  const isClient = useIsClient();
  const state = useBriefingState(props);
  const { copy, copied } = useCopyToClipboard();
  const [copyFailed, setCopyFailed] = useState(false);
  const [view, setView] = useState<"today" | "everything">("today");

  const digest = useMemo(
    () => buildDailyDigest(state.overrides.miniWorldChanges, state.overrides.worldChanges),
    [state.overrides.miniWorldChanges, state.overrides.worldChanges],
  );

  const opportunities = useMemo(
    () =>
      deriveAchievementOpportunities({
        miniWorldChanges: state.overrides.miniWorldChanges,
        worldChanges: state.overrides.worldChanges,
        merchants: state.overrides.merchants,
      }),
    [state.overrides.miniWorldChanges, state.overrides.worldChanges, state.overrides.merchants],
  );

  const stanzas = useMemo(
    () => composeDispatch(digest, state.overrides.merchants, state.overrides.boostedRegions),
    [digest, state.overrides.merchants, state.overrides.boostedRegions],
  );

  /** Exactly what the reader can still answer — counted off the rendered document itself. */
  const unresolvedCount = useMemo(
    () =>
      stanzas.reduce(
        (total, stanza) =>
          total +
          stanza.lines.reduce(
            (lineTotal, line) =>
              lineTotal + line.filter((s) => s.kind === "blank" && s.value === null).length,
            0,
          ),
        0,
      ),
    [stanzas],
  );

  /** One writer for every gap in the dispatch, whatever kind of fact it is. */
  const handlePick = useCallback(
    (target: string, optionId: string) => {
      const [kind, id] = target.split(":");
      if (kind === "region") {
        // Multi-select: several regions can be boosted at once, so a pick toggles.
        const current = state.overrides.boostedRegions;
        state.setBoostedRegions(
          current.includes(optionId)
            ? current.filter((region) => region !== optionId)
            : [...current, optionId],
        );
        return;
      }
      if (!id) return;
      if (kind === "mwc") state.updateMiniWorldChange(id, { variantId: optionId });
      if (kind === "merchant") {
        state.updateMerchant("yasir", { location: optionId, activityState: "location-known" });
      }
    },
    [state],
  );

  const jumpToUnresolved = useCallback(() => {
    const first = document.querySelector<HTMLElement>(UNFILLED_BLANK_SELECTOR);
    if (!first) return;
    first.scrollIntoView({ behavior: "smooth", block: "center" });
    first.focus();
  }, []);

  if (!isClient) {
    return (
      <div className="mx-auto max-w-[760px] px-5 py-14">
        <div className="skeleton h-12 w-64" />
        <div className="skeleton mt-6 h-28" />
        <div className="skeleton mt-8 h-[420px] rounded-xl" />
      </div>
    );
  }

  const hasEvidence = digest.mini.checked || digest.world.checked;
  const briefing = state.preferredFormat === "plain" ? state.plainBriefing : state.richBriefing;

  const runCopy = async (text: string) => {
    const ok = await copy(text);
    // The hook has always reported whether the write actually landed, and nobody looked —
    // so a browser that denies clipboard access produced a button that did nothing at all.
    setCopyFailed(!ok);
    return ok;
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `Morning Tibia — ${state.world}`, text: briefing });
        setCopyFailed(false);
        return;
      } catch { /* cancelled, or unavailable — fall through to the clipboard */ }
    }
    await runCopy(briefing);
  };

  const warzones = (state.warzoneQuery.data?.executions ?? []).map((e) => ({
    id: String(e.executionId),
    time: state.warzoneQuery.data?.timezone
      ? convertTimeBetweenZones(
          e.scheduleTime,
          state.warzoneQuery.data.timezone,
          state.viewerTimeZone,
          state.referenceDate,
        )
      : e.scheduleTime,
    sequence: e.warzoneSequence,
  }));

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "mx-auto px-5 pb-32 pt-8 transition-[max-width] duration-300 sm:px-8 sm:pb-16 sm:pt-14",
          // Today keeps its 760px measure at every width — it is prose. The catalog stops at
          // 1060px for a related reason: past ~480px per column, the gap between a row's name
          // and its state grows faster than the extra width helps.
          view === "today" ? "max-w-[760px]" : "max-w-[1060px]",
        )}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
          <nav className="flex gap-1 rounded-lg bg-white/[0.05] p-0.5" aria-label="View">
            {(["today", "everything"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-current={view === v ? "page" : undefined}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-[6px] px-3.5 py-1.5 text-[13px] font-medium capitalize transition-colors",
                  view === v
                    ? "bg-white/[0.1] text-[hsl(var(--foreground))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
                )}
              >
                {v}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <WorldSelector
              value={state.world}
              worlds={state.worldsQuery.data ?? []}
              isLoading={state.worldsQuery.isLoading}
              onChange={state.setWorld}
            />
            <Button variant="ghost" size="icon" onClick={state.refreshLiveData} aria-label="Refresh data">
              <RefreshCw className={cn("h-4 w-4", state.boostedQuery.isLoading && "animate-spin")} />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Reset today">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset today&apos;s dispatch for {state.world}?</DialogTitle>
                  {/* Says exactly what it does, because it now does exactly this. */}
                  <DialogDescription>
                    Clears the board reading, guide answers, boosted region and anything else
                    you filled in for {state.world} on {toBriefingDate(state.referenceDate)}.
                    Other worlds, other days and your settings are left alone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="destructive" onClick={state.resetOverrides}>Reset</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <DayRolloverBanner
          currentDayKey={state.dateKey}
          onStartNewDay={() => {
            state.startNewDay();
            // The boosted pair, the world's status and the schedule are all rebuilt by the
            // save that just ran, so the new day starts from fresh data, not yesterday's.
            state.refreshLiveData();
          }}
        />

        {state.liveData.hasFailure && (
          <div
            role="status"
            className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-[hsl(var(--danger))]/10 px-4 py-3 text-[12.5px] text-[hsl(var(--foreground))] ring-1 ring-inset ring-[hsl(var(--danger))]/30"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-[hsl(var(--danger))]" aria-hidden="true" />
            <span>
              Couldn&apos;t load {formatList(state.liveData.failures)}. Everything you recorded
              yourself is unaffected.
            </span>
            <Button variant="outline" size="sm" onClick={state.refreshLiveData}>
              Retry
            </Button>
          </div>
        )}

        {view === "today" ? (
          <>
            <Masthead
              dateLabel={toBriefingDate(state.referenceDate)}
              world={state.world}
              detail={state.worldDetailQuery.data}
              creature={state.boostedQuery.data?.creature ?? null}
              boss={state.boostedQuery.data?.boss ?? null}
              loading={state.boostedQuery.isLoading}
              boostedFailed={state.liveData.boostedFailed}
              worldDetailFailed={state.liveData.worldDetailFailed}
            />

            <div className="mt-7 sm:mt-8">
              <Dispatch
                stanzas={stanzas}
                opportunities={opportunities}
                onPick={handlePick}
                invitation={!hasEvidence ? <Invitation /> : null}
                numbers={{
                  warzones,
                  prices: state.overrides.marketPrices,
                  marketBasis: state.marketTrendBasis,
                  onMarketBasisChange: (basis: MarketTrendBasis) => state.setMarketTrendBasis(basis),
                  marketUnavailable: state.liveData.marketFailed,
                }}
              />
            </div>

            <EvidenceBar
              onApply={state.applyParsedEvidence}
              onUndo={state.undoLastEvidence}
              canUndo={state.canUndoEvidence}
              hasEvidence={hasEvidence}
              unresolvedCount={unresolvedCount}
              onJumpToUnresolved={jumpToUnresolved}
            />

            {/* Take-away. The briefing is the end of the ritual, not a permanent fixture. */}
            <section className="mt-8 border-t border-white/[0.08] pt-6" aria-label="Share today">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => runCopy(briefing)} className="min-w-[7.5rem]">
                  {copied ? <Check className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy briefing"}
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4" /> Share
                </Button>
                <Select
                  value={state.briefingLanguage}
                  onValueChange={(v) => state.setBriefingLanguage(v as BriefingLanguage)}
                >
                  <SelectTrigger className="h-9 w-[124px] text-[13px]" aria-label="Briefing language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BRIEFING_LANGUAGES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <LabelledSwitch
                  label="Plain text"
                  checked={state.preferredFormat === "plain"}
                  onCheckedChange={(on) => state.setPreferredFormat(on ? "plain" : "rich")}
                />
                <LabelledSwitch
                  label="Include quiet items"
                  checked={state.overrides.includeAllChanges}
                  onCheckedChange={state.setIncludeAllChanges}
                />
              </div>

              <div role="status" aria-live="polite" className="mt-2 empty:mt-0">
                {copyFailed && (
                  <p className="text-[12.5px] text-[hsl(var(--danger))]">
                    Couldn&apos;t copy — select the text below and copy it manually.
                  </p>
                )}
                {copied && !copyFailed && (
                  <p className="text-[12.5px] text-[hsl(var(--muted-foreground))]">
                    Briefing copied.
                  </p>
                )}
                {state.liveData.hasFailure && (
                  <p className="text-[12.5px] text-[hsl(var(--muted-foreground))]">
                    This briefing leaves out {formatList(state.liveData.failures)} — the app
                    couldn&apos;t load {state.liveData.failures.length === 1 ? "it" : "them"}, so
                    nothing is claimed about {state.liveData.failures.length === 1 ? "it" : "them"}.
                  </p>
                )}
              </div>

              {/* Shown outright rather than behind a toggle: the reader is about to paste
                  this into a chat, and the dispatch above is in English while this is in their
                  chosen language, so it is genuinely different content. */}
              <pre className="mt-4 max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-white/[0.03] p-4 font-mono text-[12.5px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                {briefing}
              </pre>
            </section>

            {/* Mobile only: the primary output action, without scrolling the whole dispatch. */}
            <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-white/10 bg-[hsl(var(--background))] px-4 py-3 sm:hidden">
              <Button onClick={() => runCopy(briefing)} className="flex-1">
                {copied ? <Check className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                {copied ? "Copied" : "Copy briefing"}
              </Button>
              <Button variant="outline" onClick={handleShare} aria-label="Share briefing">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <Reference
            digest={digest}
            onMiniChange={state.updateMiniWorldChange}
            onWorldChange={state.updateWorldChange}
            activeEvents={state.activeEvents}
            upcomingEvents={state.upcomingEvents}
            windowDays={state.upcomingEventsWindowDays}
            onWindowDaysChange={state.setUpcomingEventsWindowDays}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * What a first-time reader sees instead of a half-written document.
 *
 * The condition used to also require the dispatch to be empty, which it never is — an
 * always-active change, Rashid's computed location and the silent changes all produce
 * sentences before anyone has told the app anything. So this text existed but could not be
 * reached, and a new visitor got no explanation of what the page wanted from them.
 */
function Invitation() {
  return (
    <div className="mb-8 border-b border-[hsl(var(--page-edge))] pb-7">
      <p className="prose-serif text-[19px] leading-[1.65] text-[hsl(var(--ink))]">
        This page writes your world&apos;s morning briefing — but only from what you can prove.
        Nothing has been checked yet today.
      </p>
      <ol className="mt-4 flex flex-col gap-2 text-[13.5px] leading-relaxed text-[hsl(var(--ink-soft))]">
        <Step n={1}>
          Read the <strong className="font-medium text-[hsl(var(--ink))]">world board</strong> at
          the Adventurer&apos;s Guild, first floor up, near Charos. It lists every mini world
          change running right now.
        </Step>
        <Step n={2}>
          Greet any <strong className="font-medium text-[hsl(var(--ink))]">guide</strong>, say{" "}
          <span className="font-mono text-[12.5px]">world change</span>, then a keyword — the
          Everything view lists all fourteen.
        </Step>
        <Step n={3}>
          Paste whatever they told you into the box below. The dispatch fills itself in, and
          anything still missing shows up as a gap you can click.
        </Step>
      </ol>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[hsl(var(--gold)/0.25)] text-[10.5px] font-semibold text-[hsl(var(--ink))]">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

/**
 * Watches for the server save passing while the tab is open.
 *
 * Subscribes to the shared clock on its own so only this banner re-renders each second. The
 * app's whole promise is that it never presents yesterday's facts as today's, and a tab left
 * open across 10:00 CET was the last place it still did.
 */
function DayRolloverBanner({
  currentDayKey,
  onStartNewDay,
}: {
  currentDayKey: string;
  onStartNewDay: () => void;
}) {
  const nowMs = useNowMs();
  if (nowMs === 0) return null;
  const liveDayKey = toTibiaDayKey(new Date(nowMs));
  if (liveDayKey === currentDayKey) return null;

  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-[hsl(var(--gold))]/10 px-4 py-3 text-[12.5px] text-[hsl(var(--foreground))] ring-1 ring-inset ring-[hsl(var(--gold))]/30"
    >
      <Sunrise className="h-4 w-4 shrink-0 text-[hsl(var(--gold))]" aria-hidden="true" />
      <span>
        Server save has passed — the world reset, so everything below is from before it.
      </span>
      <Button variant="outline" size="sm" onClick={onStartNewDay}>
        Start today&apos;s dispatch
      </Button>
    </div>
  );
}

/**
 * A Radix Switch renders a `<button role="switch">`, and a wrapping `<label>` gives a button
 * no accessible name — so both of these toggles were announced as "switch, not pressed" with
 * no indication of what they controlled.
 */
function LabelledSwitch({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <span className="flex items-center gap-2 text-[12.5px] text-[hsl(var(--muted-foreground))]">
      <Switch aria-label={label} checked={checked} onCheckedChange={onCheckedChange} />
      <span aria-hidden="true">{label}</span>
    </span>
  );
}

/** "the world list", "boosted creature and boss and market prices" — for a sentence. */
function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
