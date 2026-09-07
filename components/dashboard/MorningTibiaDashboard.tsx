"use client";

import { useMemo } from "react";
import { Share2 } from "lucide-react";
import { useBriefingState, type UseBriefingStateProps } from "@/hooks/useBriefingState";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useIsClient } from "@/hooks/useIsClient";
import { DailyHeader } from "./DailyHeader";
import { ImportGameTextCard } from "./ImportGameTextCard";
import { TodayOverview } from "./TodayOverview";
import { NeedsAttentionSection } from "./NeedsAttentionSection";
import { OpportunitiesSection } from "./OpportunitiesSection";
import { WorldStateSection } from "./WorldStateSection";
import { EventsCard } from "./EventCard";
import { BriefingPreview } from "./BriefingPreview";
import { CopyButton } from "./CopyButton";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SectionDivider } from "@/components/ui/section";
import { buildDailyDigest } from "@/lib/dashboard/dailyDigest";
import { deriveAchievementOpportunities } from "@/lib/achievements/opportunities";

function DashboardSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4">
      <div className="skeleton h-16 rounded-lg" />
      <div className="skeleton h-28 rounded-lg" />
      <div className="skeleton h-64 rounded-lg" />
    </div>
  );
}

export function MorningTibiaDashboard(props: UseBriefingStateProps) {
  const isClient = useIsClient();
  const state = useBriefingState(props);
  const { copy } = useCopyToClipboard();

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

  if (!isClient) return <DashboardSkeleton />;

  const isRefreshing =
    state.boostedQuery.isLoading || state.warzoneQuery.isLoading || state.worldDetailQuery.isLoading;

  const hasImported = digest.mini.checked || digest.world.checked;

  const handleMobileShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: state.richBriefing });
        return;
      } catch {
        // Cancelled or unsupported — fall through to the clipboard.
      }
    }
    await copy(state.richBriefing);
  };

  return (
    // Radix tooltips need a provider in scope; the change rows use them for mechanic detail.
    <TooltipProvider delayDuration={200}>
      <div className="mx-auto flex max-w-6xl flex-col gap-7 p-4 pb-24 sm:pb-6">
        <DailyHeader
          world={state.world}
          referenceDate={state.referenceDate}
          worlds={state.worldsQuery.data ?? []}
          worldsLoading={state.worldsQuery.isLoading}
          onWorldChange={state.setWorld}
          worldDetail={state.worldDetailQuery.data}
          worldDetailLoading={state.worldDetailQuery.isLoading}
          onRefresh={state.refreshLiveData}
          onReset={state.resetOverrides}
          isRefreshing={isRefreshing}
        />

        {/* 1 — What is happening in my world today. */}
        <TodayOverview
          creature={state.boostedQuery.data?.creature ?? null}
          boss={state.boostedQuery.data?.boss ?? null}
          boostedLoading={state.boostedQuery.isLoading}
          boostedError={state.boostedQuery.error}
          boostedRegions={state.overrides.boostedRegions}
          onBoostedRegionsChange={state.setBoostedRegions}
          warzone={state.warzoneQuery.data ?? null}
          warzoneLoading={state.warzoneQuery.isLoading}
          viewerTimeZone={state.viewerTimeZone}
          merchants={state.overrides.merchants}
          onMerchantChange={state.updateMerchant}
          prices={state.overrides.marketPrices}
          marketBasis={state.marketTrendBasis}
          activeEvents={state.activeEvents}
        />

        <SectionDivider />

        {/* 2 — Tell the app what the game told you. */}
        <ImportGameTextCard
          onApplyMiniWorldChange={state.updateMiniWorldChange}
          onApplyWorldChange={state.updateWorldChange}
          onApplyMerchant={state.updateMerchant}
          hasImported={hasImported}
        />

        {/* 3 — The few things only the player can settle. Renders nothing when empty. */}
        <NeedsAttentionSection digest={digest} onMiniChange={state.updateMiniWorldChange} />

        {/* 4 — What today's confirmed conditions make possible. Renders nothing when empty. */}
        <OpportunitiesSection opportunities={opportunities} />

        <SectionDivider />

        {/* 5 — The output, ahead of the full reference catalog rather than buried under it. */}
        <BriefingPreview
          richBriefing={state.richBriefing}
          plainBriefing={state.plainBriefing}
          preferredFormat={state.preferredFormat}
          onPreferredFormatChange={state.setPreferredFormat}
          language={state.briefingLanguage}
          onLanguageChange={state.setBriefingLanguage}
          worldName={state.world}
        />

        <SectionDivider />

        {/* 6 — Reference: everything tracked, grouped so the state is readable at a glance. */}
        <WorldStateSection
          digest={digest}
          onMiniChange={state.updateMiniWorldChange}
          onWorldChange={state.updateWorldChange}
          includeAll={state.overrides.includeAllChanges}
          onIncludeAllChange={state.setIncludeAllChanges}
        />

        <EventsCard
          activeEvents={state.activeEvents}
          upcomingEvents={state.upcomingEvents}
          windowDays={state.upcomingEventsWindowDays}
          onWindowDaysChange={state.setUpcomingEventsWindowDays}
        />

        {/* Solid, not backdrop-blur — a fixed element with backdrop-filter has known Safari
            paint/hit-testing bugs; a solid surface is simpler and just as legible. */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-border bg-card p-3 sm:hidden">
          <CopyButton text={state.richBriefing} label="Copy briefing" className="flex-1" />
          <Button variant="outline" size="default" onClick={handleMobileShare} className="flex-1">
            <Share2 /> Share
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
