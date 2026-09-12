import { MorningTibiaDashboard } from "@/components/dashboard/MorningTibiaDashboard";
import { fetchDromeRotation } from "@/lib/data/wikiContentClient";
import { fetchEventContent } from "@/lib/data/eventContentClient";

export default async function HomePage() {
  const buildTime = new Date();
  const [{ activeEvents, upcomingEvents }, drome] = await Promise.all([
    fetchEventContent(buildTime),
    fetchDromeRotation(buildTime),
  ]);

  return (
    <MorningTibiaDashboard activeEvents={activeEvents} upcomingEvents={upcomingEvents} drome={drome} />
  );
}
