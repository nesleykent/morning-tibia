"use client";

import { useMemo, useState } from "react";
import { Share2, Check, Copy as CopyIcon, RefreshCw, RotateCcw } from "lucide-react";
import { useBriefingState, type UseBriefingStateProps } from "@/hooks/useBriefingState";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useIsClient } from "@/hooks/useIsClient";
import { Masthead } from "@/components/dispatch/Masthead";
import { Dispatch } from "@/components/dispatch/Dispatch";
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
import { toBriefingDate } from "@/lib/utils/date";
import { getNextServerSave } from "@/lib/utils/serverSave";
import { formatCountdownClock } from "@/lib/formatter/dateFormat";
import { BRIEFING_LANGUAGES, type BriefingLanguage } from "@/lib/formatter/translations";

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
  const [view, setView] = useState<"today" | "everything">("today");
  const [referenceDate] = useState(() => new Date());

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
    () => composeDispatch(digest, state.overrides.merchants),
    [digest, state.overrides.merchants],
  );

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
  const saveMs = getNextServerSave(referenceDate).getTime() - referenceDate.getTime();

  /** One writer for every gap in the dispatch, whatever kind of fact it is. */
  const handlePick = (target: string, optionId: string) => {
    const [kind, id] = target.split(":");
    if (!id) return;
    if (kind === "mwc") state.updateMiniWorldChange(id, { variantId: optionId });
    if (kind === "merchant") state.updateMerchant("yasir", { location: optionId, activityState: "location-known" });
  };

  const warzones = (state.warzoneQuery.data?.executions ?? []).map((e) => ({
    id: String(e.executionId),
    time: state.warzoneQuery.data?.timezone
      ? convertTimeBetweenZones(e.scheduleTime, state.warzoneQuery.data.timezone, state.viewerTimeZone, referenceDate)
      : e.scheduleTime,
    sequence: e.warzoneSequence,
  }));

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `Morning Tibia — ${state.world}`, text: briefing });
        return;
      } catch { /* cancelled */ }
    }
    await copy(briefing);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "mx-auto px-5 pb-32 pt-10 transition-[max-width] duration-300 sm:px-8 sm:pb-16 sm:pt-14",
          view === "today" ? "max-w-[760px]" : "max-w-[1060px]",
        )}
      >
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex gap-1 rounded-lg bg-white/[0.05] p-0.5" aria-label="View">
            {(["today", "everything"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-current={view === v}
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
                  <DialogTitle>Reset today&apos;s dispatch?</DialogTitle>
                  <DialogDescription>
                    Everything you pasted or filled in for {state.world} today will be cleared.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="destructive" onClick={state.resetOverrides}>Reset</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {view === "today" ? (
          <>
            <Masthead
              dateLabel={toBriefingDate(state.referenceDate)}
              world={state.world}
              detail={state.worldDetailQuery.data}
              creature={state.boostedQuery.data?.creature ?? null}
              boss={state.boostedQuery.data?.boss ?? null}
              loading={state.boostedQuery.isLoading}
            />

            <div className="mt-8">
              <Dispatch
                stanzas={stanzas}
                opportunities={opportunities}
                onPick={handlePick}
                emptyInvitation={!hasEvidence && stanzas.length === 0}
                numbers={{
                  rashid: state.overrides.merchants.rashid?.location ?? null,
                  warzones,
                  prices: state.overrides.marketPrices,
                  marketBasis: state.marketTrendBasis,
                  serverSaveLabel: formatCountdownClock(saveMs),
                }}
              />
            </div>

            <EvidenceBar
              onApplyMiniWorldChange={state.updateMiniWorldChange}
              onApplyWorldChange={state.updateWorldChange}
              onApplyMerchant={state.updateMerchant}
              hasEvidence={hasEvidence}
            />

            {/* Take-away. The briefing is the end of the ritual, not a permanent fixture. */}
            <section className="mt-8 border-t border-white/[0.08] pt-6" aria-label="Share today">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => copy(briefing)} className="min-w-[7.5rem]">
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
                <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[hsl(var(--muted-foreground))]">
                  <Switch
                    checked={state.preferredFormat === "plain"}
                    onCheckedChange={(on) => state.setPreferredFormat(on ? "plain" : "rich")}
                  />
                  Plain text
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[hsl(var(--muted-foreground))]">
                  <Switch
                    checked={state.overrides.includeAllChanges}
                    onCheckedChange={state.setIncludeAllChanges}
                  />
                  Include quiet items
                </label>
              </div>
              {/* Shown outright rather than behind a toggle: the reader is about to paste
                  this into a chat, and the dispatch above is in English while this is in their
                  chosen language, so it is genuinely different content. */}
              <pre className="mt-4 max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-white/[0.03] p-4 font-mono text-[12.5px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                {briefing}
              </pre>
            </section>
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
