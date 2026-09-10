"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { BriefingPanel } from "./BriefingPanel";
import { formatList } from "./formatList";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";
import { buildDailyDigest } from "@/lib/dashboard/dailyDigest";
import { deriveOpportunities } from "@/lib/opportunities/deriveOpportunities";
import { composeDispatch } from "@/lib/dispatch/composeDispatch";
import { convertTimeBetweenZones } from "@/lib/utils/timezone";
import { toBriefingDate, toTibiaDayKey } from "@/lib/utils/date";
import { useNowMs } from "@/lib/utils/clock";
import type { MarketTrendBasis } from "@/types/market";

/**
 * Morning Tibia.
 *
 * The product object is *my Tibia world today*, and the page is that object: a dispatch you
 * read, with the handful of facts the game can't tell the app left as gaps you fill.
 *
 * On a desktop it is two columns. The left one is the document — the masthead and the dispatch,
 * the things you read. The right one is the ritual — paste what the game said, then take the
 * briefing away — and it is sticky, because both ends of that ritual have to be reachable
 * without scrolling a two-screen document to find them. Below 960px the same three pieces
 * stack in the order the morning happens in: what's special today, what the game told you,
 * what you send, then the detail behind it.
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
  const [briefingPanelOnScreen, watchBriefingPanel] = useOnScreen();

  const digest = useMemo(
    () => buildDailyDigest(state.overrides.miniWorldChanges, state.overrides.worldChanges),
    [state.overrides.miniWorldChanges, state.overrides.worldChanges],
  );

  const opportunities = useMemo(
    () =>
      deriveOpportunities({
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
      <Shell>
        <div className="skeleton h-9 w-48" />
        <div className="mt-8 grid gap-6 rail:grid-cols-[minmax(0,1fr)_312px] xl:grid-cols-[minmax(0,1fr)_352px] xl:gap-7">
          <div className="skeleton h-24 rail:col-span-2" />
          <div className="skeleton h-[420px] rounded-xl" />
          <div className="skeleton h-[420px] rounded-xl" />
        </div>
      </Shell>
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
        await navigator.share({ title: `Morning Tibia: ${state.world}`, text: briefing });
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
    <TooltipProvider delayDuration={250}>
      <Shell>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <ViewSwitch value={view} onChange={setView} />

          <div className="flex items-center gap-1.5">
            <WorldSelector
              value={state.world}
              worlds={state.worldsQuery.data ?? []}
              isLoading={state.worldsQuery.isLoading}
              onChange={state.setWorld}
            />
            <IconAction label="Refresh live data" onClick={state.refreshLiveData}>
              <RefreshCw className={cn("h-4 w-4", state.boostedQuery.isLoading && "animate-spin")} />
            </IconAction>
            <Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Reset today">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Reset today</TooltipContent>
              </Tooltip>
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
          <Notice tone="danger" icon={<AlertTriangle className="h-4 w-4 shrink-0 text-danger" />}>
            <span>
              Couldn&apos;t load {formatList(state.liveData.failures)}. Everything you recorded
              yourself is unaffected.
            </span>
            <Button variant="outline" size="sm" onClick={state.refreshLiveData}>
              Retry
            </Button>
          </Notice>
        )}

        {view === "today" ? (
          <div className="grid gap-6 rail:grid-cols-[minmax(0,1fr)_312px] rail:gap-6 xl:grid-cols-[minmax(0,1fr)_352px] xl:gap-7">
            <div className="rail:col-span-2">
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
            </div>

            {/* Before the dispatch in the DOM so the stacked order is the order of the
                morning, and placed into the second column on a desktop. Sticky needs
                `self-start`, and nothing between here and the viewport may clip overflow. */}
            <aside className="grid items-start gap-4 sm:grid-cols-2 rail:grid-cols-1 rail:col-start-2 rail:row-start-2 rail:sticky rail:top-[calc(var(--appbar-h)+1.25rem)] rail:max-h-[calc(100dvh-var(--appbar-h)-2.5rem)] rail:self-start rail:overflow-y-auto rail:overscroll-contain thin-scroll">
              <EvidenceBar
                onApply={state.applyParsedEvidence}
                onUndo={state.undoLastEvidence}
                canUndo={state.canUndoEvidence}
                hasEvidence={hasEvidence}
                unresolvedCount={unresolvedCount}
                onJumpToUnresolved={jumpToUnresolved}
              />
              <BriefingPanel
                briefing={briefing}
                copied={copied}
                copyFailed={copyFailed}
                onCopy={() => runCopy(briefing)}
                onShare={handleShare}
                language={state.briefingLanguage}
                onLanguageChange={state.setBriefingLanguage}
                plainText={state.preferredFormat === "plain"}
                onPlainTextChange={(on) => state.setPreferredFormat(on ? "plain" : "rich")}
                includeQuiet={state.overrides.includeAllChanges}
                onIncludeQuietChange={state.setIncludeAllChanges}
                unavailable={state.liveData.failures}
                panelRef={watchBriefingPanel}
              />
            </aside>

            <div className="min-w-0 rail:col-start-1 rail:row-start-2">
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
          </div>
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

        {/* Phones only, and only once the real panel has scrolled away.
            From 640px up the rail holds the briefing in view, so the bar is hidden there
            outright; on a phone the panel now sits near the top of the page, so showing both
            at once put two identical gold buttons a finger's width apart. */}
        {view === "today" && !briefingPanelOnScreen && (
          <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-surface px-4 py-3 shadow-elevated sm:hidden">
            <Button onClick={() => runCopy(briefing)} className="flex-1">
              {copied ? <Check className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              {copied ? "Copied" : "Copy briefing"}
            </Button>
            <Button variant="outline" onClick={handleShare} aria-label="Share briefing">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Shell>
    </TooltipProvider>
  );
}

/**
 * Whether the watched element is currently within the viewport.
 *
 * Hands back a *callback* ref rather than taking a RefObject, because the thing being watched
 * does not exist on the first render: the page withholds its real tree until hydration, so an
 * effect keyed on a stable ref object ran once against `null` and never again, and the observer
 * was simply never attached. A callback ref fires the moment the node arrives.
 *
 * Starts as `true` so the phone-sized copy bar never flashes on during the first paint, before
 * the observer has anything to report.
 */
function useOnScreen(): [boolean, (node: HTMLElement | null) => void] {
  const [onScreen, setOnScreen] = useState(true);
  const [node, setNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) setOnScreen(entry.isIntersecting);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return [onScreen, setNode];
}

/**
 * One measure for the whole application, matching the chrome above it.
 *
 * `overflow` is deliberately untouched: an `overflow: hidden` anywhere on this path would
 * silently kill the take-away rail's stickiness.
 */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 pb-24 pt-6 sm:pb-14 lg:px-7">{children}</div>
  );
}

/** Today and Everything answer different questions, so they are navigation, not a filter. */
function ViewSwitch({
  value,
  onChange,
}: {
  value: "today" | "everything";
  onChange: (view: "today" | "everything") => void;
}) {
  return (
    <nav
      className="flex gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5"
      aria-label="View"
    >
      {(["today", "everything"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-current={value === v ? "page" : undefined}
          onClick={() => onChange(v)}
          className={cn(
            "rounded-[7px] px-3.5 py-1.5 text-[13px] font-medium capitalize transition-colors",
            value === v
              ? "bg-surface text-ink shadow-card"
              : "text-ink-soft hover:text-ink",
          )}
        >
          {v}
        </button>
      ))}
    </nav>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" onClick={onClick} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** The two things that interrupt a morning: a feed is down, or the world reset under you. */
function Notice({
  tone,
  icon,
  children,
}: {
  tone: "danger" | "gold";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3.5 py-2.5 text-[12.5px] text-ink",
        tone === "danger" ? "border-[hsl(var(--danger)/0.3)] bg-danger-tint" : "border-gold-line bg-gold-tint",
      )}
    >
      {icon}
      {children}
    </div>
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
    <div className="mb-7 border-b border-line pb-6">
      <p className="prose-serif text-[17.5px] leading-[1.6] text-ink">
        This page writes your world&apos;s morning briefing, but only from what you can prove.
        Nothing has been checked yet today.
      </p>
      <ol className="mt-4 flex flex-col gap-2 text-[13px] leading-relaxed text-ink-soft">
        <Step n={1}>
          Read the <strong className="font-medium text-ink">world board</strong> at the
          Adventurer&apos;s Guild, first floor up, near Charos. It lists every mini world change
          running right now.
        </Step>
        <Step n={2}>
          Greet any <strong className="font-medium text-ink">guide</strong>, say{" "}
          <span className="font-mono text-[12px]">world change</span>, then a keyword. The
          Everything view lists all fourteen.
        </Step>
        <Step n={3}>
          Paste whatever they told you into the game log beside this document. The dispatch
          fills itself in, and anything still missing shows up as a gap you can click.
        </Step>
      </ol>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[2px] flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full bg-gold-tint text-[10px] font-semibold text-gold">
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
    <Notice tone="gold" icon={<Sunrise className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />}>
      <span>Server save has passed. The world reset, so everything below is from before it.</span>
      <Button variant="outline" size="sm" onClick={onStartNewDay}>
        Start today&apos;s dispatch
      </Button>
    </Notice>
  );
}
