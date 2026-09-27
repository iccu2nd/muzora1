import { IOS, buildContext, innerTubeFetch } from "./client";
import type { StreamInfo } from "./types";

// v1 stream resolution strategy (see README "Known limitations"):
// The IOS InnerTube client is handed back adaptive audio formats with a
// plain `url` field (no `signatureCipher` to decrypt), unlike the WEB/WEB_REMIX
// clients. SimpMusic's real scraper (kotlinYtmusicScraper) supports every
// client plus a full signature/n-parameter cipher solver (cipher/*.kt) driven
// by a community-maintained remote config, for when Google locks the IOS
// client down further. That solver is the next thing to port here — this
// file is intentionally the simple path so search+playback works end to end
// first.
export async function resolveStream(videoId: string): Promise<StreamInfo> {
  const body = buildContext(IOS, {
    videoId,
    contentCheckOk: true,
    racyCheckOk: true,
  });
  const json = await innerTubeFetch("player", IOS, body);

  const status = json?.playabilityStatus?.status;
  if (status && status !== "OK") {
    throw new Error(`Video not playable: ${status} — ${json?.playabilityStatus?.reason ?? ""}`);
  }

  const adaptiveFormats: any[] = json?.streamingData?.adaptiveFormats ?? [];
  const audioFormats = adaptiveFormats.filter((f) => typeof f.mimeType === "string" && f.mimeType.startsWith("audio/"));
  if (audioFormats.length === 0) {
    throw new Error("No audio-only format returned for this video");
  }

  // Highest bitrate audio-only stream.
  const best = audioFormats.reduce((a, b) => ((b.bitrate ?? 0) > (a.bitrate ?? 0) ? b : a));
  if (!best.url) {
    throw new Error("Selected format has no direct url (would require cipher solving — not yet ported)");
  }

  const expireSecondsParam = new URL(best.url).searchParams.get("expire");
  const expiresInSeconds = expireSecondsParam
    ? Number(expireSecondsParam) - Math.floor(Date.now() / 1000)
    : 6 * 60 * 60;

  return {
    url: best.url,
    mimeType: best.mimeType,
    bitrate: best.bitrate ?? 0,
    itag: best.itag,
    expiresInSeconds,
  };
}
