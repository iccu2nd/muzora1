// Ported from core/service/kotlinYtmusicScraper (models/YouTubeClient.kt).
// These are the same public InnerTube client identities SimpMusic uses to
// talk to music.youtube.com's internal API. WEB_REMIX is used for browsing
// and search; IOS is used for player/stream resolution because Google's iOS
// client is handed back direct (non-ciphered) playback URLs, which lets us
// skip porting the full signature-cipher solver for this first iteration.
// See README.md "Known limitations" for the tradeoff.

export const USER_AGENT_WEB =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
export const USER_AGENT_IOS =
  "com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1_0 like Mac OS X;)";

export const WEB_REMIX = {
  clientName: "WEB_REMIX",
  clientVersion: "1.20260304.03.00",
  apiKey: "AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30",
  userAgent: USER_AGENT_WEB,
  referer: "https://music.youtube.com/",
};

export const IOS = {
  clientName: "IOS",
  clientVersion: "19.45.4",
  apiKey: "AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc",
  userAgent: USER_AGENT_IOS,
  deviceMake: "Apple",
  deviceModel: "iPhone16,2",
  referer: undefined as string | undefined,
};

type ClientConfig = typeof WEB_REMIX | typeof IOS;

export function buildContext(client: ClientConfig, extra?: Record<string, unknown>) {
  return {
    context: {
      client: {
        clientName: client.clientName,
        clientVersion: client.clientVersion,
        hl: "en",
        gl: "US",
        userAgent: client.userAgent,
        ...("deviceMake" in client ? { deviceMake: client.deviceMake, deviceModel: client.deviceModel } : {}),
      },
      ...extra,
    },
  };
}

export async function innerTubeFetch(
  endpoint: string,
  client: ClientConfig,
  body: Record<string, unknown>,
) {
  const url = `https://music.youtube.com/youtubei/v1/${endpoint}?key=${client.apiKey}&prettyPrint=false`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": client.userAgent,
      "X-Goog-Api-Format-Version": "1",
      "X-YouTube-Client-Name": client.clientName === "WEB_REMIX" ? "67" : "5",
      "X-YouTube-Client-Version": client.clientVersion,
      ...(client.referer ? { Referer: client.referer } : {}),
    },
    body: JSON.stringify(body),
    // Player/search responses are per-request; never cache at the fetch layer.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`InnerTube ${endpoint} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
