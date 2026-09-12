import { MorningTibiaDashboard } from "@/components/dashboard/MorningTibiaDashboard";
import { fetchEventContent } from "@/lib/data/eventContentClient";

export default async function HomePage() {
  const buildTime = new Date();
  const { activeEvents, upcomingEvents } = await fetchEventContent(buildTime);

  return (
    <MorningTibiaDashboard activeEvents={activeEvents} upcomingEvents={upcomingEvents} />
  );
}
