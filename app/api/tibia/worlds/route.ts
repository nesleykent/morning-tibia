import { NextResponse } from "next/server";
import { fetchWorlds } from "@/lib/data/tibiaDataClient";

export async function GET() {
  try {
    const worlds = await fetchWorlds();
    return NextResponse.json({ worlds });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load worlds" },
      { status: 502 },
    );
  }
}
