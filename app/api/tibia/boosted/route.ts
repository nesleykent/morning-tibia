import { NextResponse } from "next/server";
import { fetchBoostedBoss, fetchBoostedCreature } from "@/lib/data/tibiaDataClient";

export async function GET() {
  const [creatureResult, bossResult] = await Promise.allSettled([
    fetchBoostedCreature(),
    fetchBoostedBoss(),
  ]);

  return NextResponse.json({
    creature: creatureResult.status === "fulfilled" ? creatureResult.value : null,
    boss: bossResult.status === "fulfilled" ? bossResult.value : null,
    errors: {
      creature: creatureResult.status === "rejected" ? String(creatureResult.reason) : null,
      boss: bossResult.status === "rejected" ? String(bossResult.reason) : null,
    },
  });
}
