import { MorningTibiaDashboard } from "@/components/dashboard/MorningTibiaDashboard";
import { fetchActiveEvents, fetchDromeRotation, fetchUpcomingEvents } from "@/lib/data/wikiContentClient";

export default async function HomePage() {
  const [activeEvents, upcomingEvents, drome] = await Promise.all([
    fetchActiveEvents(),
    fetchUpcomingEvents(),
    fetchDromeRotation(),
  ]);

  return (
    <MorningTibiaDashboard activeEvents={activeEvents} upcomingEvents={upcomingEvents} drome={drome} />
  );
}
