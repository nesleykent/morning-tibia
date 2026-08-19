"use client";

import { Share2 } from "lucide-react";
import { useBriefingState, type UseBriefingStateProps } from "@/hooks/useBriefingState";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useIsClient } from "@/hooks/useIsClient";
import { DailyHeader } from "./DailyHeader";
import { ImportGameTextCard } from "./ImportGameTextCard";
import { BoostedCard } from "./BoostedCard";
import { WarzoneScheduleCard } from "./WarzoneScheduleCard";
import { MerchantCard } from "./MerchantCard";
import { MarketPriceCard } from "./MarketPriceCard";
import { EventsCard } from "./EventCard";
import { MiniWorldChangeGrid } from "./MiniWorldChangeGrid";
import { WorldChangeGrid } from "./WorldChangeGrid";
import { BriefingPreview } from "./BriefingPreview";
import { CopyButton } from "./CopyButton";
import { Button } from "@/components/ui/button";

function DashboardSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <div className="skeleton h-24 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function MorningTibiaDashboard(props: UseBriefingStateProps) {
  const mounted = useIsClient();
  const state = useBriefingState(props);
  const { copy } = useCopyToClipboard();

  if (!mounted) return <DashboardSkeleton />;

  const isRefreshing =
    state.worldsQuery.isLoading || state.worldDetailQuery.isLoading || state.boostedQuery.isLoading;

  const handleMobileShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Morning Tibia — ${state.world}`, text: state.richBriefing });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await copy(state.richBriefing);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 pb-24 sm:pb-4">
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

      <ImportGameTextCard
        onApplyMiniWorldChange={state.updateMiniWorldChange}
        onApplyWorldChange={state.updateWorldChange}
        onApplyMerchant={(id, location) => state.updateMerchant(id, { location })}
      />

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        <BoostedCard
          creature={state.boostedQuery.data?.creature ?? null}
          boss={state.boostedQuery.data?.boss ?? null}
          isLoading={state.boostedQuery.isLoading}
          error={state.boostedQuery.error}
          boostedRegions={state.overrides.boostedRegions}
          onBoostedRegionsChange={state.setBoostedRegions}
        />
        <WarzoneScheduleCard
          schedule={state.warzoneQuery.data}
          isLoading={state.warzoneQuery.isLoading}
          error={state.warzoneQuery.error}
          viewerTimeZone={state.viewerTimeZone}
        />
        <MerchantCard merchants={state.overrides.merchants} onChange={state.updateMerchant} />
        <MarketPriceCard prices={state.overrides.marketPrices} onChange={state.updateMarketPrice} />
        <EventsCard
          activeEvents={state.activeEvents}
          upcomingEvents={state.upcomingEvents}
          windowDays={state.upcomingEventsWindowDays}
          onWindowDaysChange={state.setUpcomingEventsWindowDays}
        />
      </div>

      <MiniWorldChangeGrid
        values={state.overrides.miniWorldChanges}
        onChange={state.updateMiniWorldChange}
        includeAll={state.overrides.includeAllChanges}
        onIncludeAllChange={state.setIncludeAllChanges}
      />

      <WorldChangeGrid values={state.overrides.worldChanges} onChange={state.updateWorldChange} />

      <BriefingPreview
        richBriefing={state.richBriefing}
        plainBriefing={state.plainBriefing}
        preferredFormat={state.preferredFormat}
        onPreferredFormatChange={state.setPreferredFormat}
        language={state.briefingLanguage}
        onLanguageChange={state.setBriefingLanguage}
        worldName={state.world}
      />

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-border bg-card/95 p-3 backdrop-blur sm:hidden">
        <CopyButton text={state.richBriefing} label="Copy briefing" className="flex-1" />
        <Button variant="outline" size="default" onClick={handleMobileShare} className="flex-1">
          <Share2 /> Share
        </Button>
      </div>
    </div>
  );
}
