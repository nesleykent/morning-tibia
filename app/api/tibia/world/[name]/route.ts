import { NextResponse } from "next/server";
import { fetchWorldDetail } from "@/lib/data/tibiaDataClient";

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  try {
    const world = await fetchWorldDetail(name);
    if (!world) {
      return NextResponse.json({ error: `Unknown world: ${name}` }, { status: 404 });
    }
    return NextResponse.json({ world });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load world detail" },
      { status: 502 },
    );
  }
}
