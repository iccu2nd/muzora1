import { NextRequest } from "next/server";
import { resolveStream } from "@/lib/ytmusic/player";

export const runtime = "nodejs";

// Progressive-playback proxy (brief point 6): we never download the whole
// file before playing. The browser's <audio> element issues byte-range
// requests as the user seeks/buffers; we forward the same Range header
// upstream to googlevideo.com and pipe its response straight back without
// buffering it in memory, preserving 206 Partial Content semantics.
//
// We proxy (rather than redirecting the browser straight to the googlevideo
// URL) for two reasons: it keeps the expiring, signed URL off the client,
// and it sidesteps CORS variance on googlevideo's edge depending on referrer.
//
// Note: this lives at /api/stream?videoId=... (a plain route, not a
// /api/stream/[videoId] dynamic segment) on purpose — a literal "[videoId]"
// folder name trips up some Windows shells/zip tools when people poke around
// the project by hand, so a query param sidesteps that entirely.
export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return new Response("Missing videoId", { status: 400 });
  }

  let stream;
  try {
    stream = await resolveStream(videoId);
  } catch (err) {
    console.error("resolveStream failed", err);
    return new Response("Could not resolve audio stream", { status: 502 });
  }

  const range = req.headers.get("range") ?? undefined;
  const upstream = await fetch(stream.url, {
    headers: range ? { Range: range } : {},
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response("Upstream fetch failed", { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", stream.mimeType);
  headers.set("Accept-Ranges", "bytes");
  const contentRange = upstream.headers.get("content-range");
  const contentLength = upstream.headers.get("content-length");
  if (contentRange) headers.set("Content-Range", contentRange);
  if (contentLength) headers.set("Content-Length", contentLength);
  headers.set("Cache-Control", "no-store");

  return new Response(upstream.body, {
    status: upstream.status === 206 ? 206 : 200,
    headers,
  });
}
