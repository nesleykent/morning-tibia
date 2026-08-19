import { MorningTibiaDashboard } from "@/components/dashboard/MorningTibiaDashboard";
import { fetchActiveEvents, fetchDromeRotation, fetchUpcomingEvents } from "@/lib/data/wikiContentClient";

export default async function HomePage() {
  const buildTime = new Date();
  const [activeEvents, upcomingEvents, drome] = await Promise.all([
    fetchActiveEvents(buildTime),
    fetchUpcomingEvents(buildTime),
    fetchDromeRotation(buildTime),
  ]);

  return (
    <MorningTibiaDashboard activeEvents={activeEvents} upcomingEvents={upcomingEvents} drome={drome} />
  );
}
