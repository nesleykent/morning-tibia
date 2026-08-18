import { NextResponse } from "next/server";
import { fetchWarzoneSchedule } from "@/lib/data/warzoneScheduleClient";

export async function GET(request: Request) {
  const world = new URL(request.url).searchParams.get("world");
  if (!world) {
    return NextResponse.json({ error: "Missing ?world= query parameter" }, { status: 400 });
  }
  try {
    const schedule = await fetchWarzoneSchedule(world);
    return NextResponse.json({ schedule });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load warzone schedule" },
      { status: 502 },
    );
  }
}
