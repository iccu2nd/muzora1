import { NextRequest, NextResponse } from "next/server";
import { searchSongs } from "@/lib/ytmusic/search";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ songs: [] });
  }
  try {
    const songs = await searchSongs(q);
    return NextResponse.json({ songs });
  } catch (err) {
    console.error("search failed", err);
    return NextResponse.json({ songs: [], error: "search_failed" }, { status: 502 });
  }
}
