import { WEB_REMIX, buildContext, innerTubeFetch } from "./client";
import type { Track } from "./types";

// Params value YT Music uses to restrict search results to the "Songs" filter.
// (Same constant SimpMusic's SearchBody/Ytmusic.kt uses for song-only search.)
const SONGS_FILTER_PARAMS = "EgWKAQIIAWoKEAMQBBAJEAoQBQ%3D%3D";

function pickThumbnail(thumbnails: Array<{ url: string; width: number }> | undefined): string | null {
  if (!thumbnails || thumbnails.length === 0) return null;
  return thumbnails[thumbnails.length - 1].url;
}

function durationToSeconds(label: string | undefined): number | null {
  if (!label) return null;
  const parts = label.split(":").map((p) => parseInt(p, 10));
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

// Walks a musicResponsiveListItemRenderer's flexColumns to pull out title /
// artist / album text runs. This is a deliberately loose port of
// YtItemParser.kt — good enough to render a song list; revisit if YT Music
// changes its renderer shape.
function parseListItem(item: any): Track | null {
  const renderer = item?.musicResponsiveListItemRenderer;
  if (!renderer) return null;

  const videoId =
    renderer.playlistItemData?.videoId ??
    renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint
      ?.watchEndpoint?.videoId;
  if (!videoId) return null;

  const columns = renderer.flexColumns ?? [];
  const runsOf = (colIndex: number) =>
    columns[colIndex]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ?? [];

  const titleRuns = runsOf(0);
  const title = titleRuns.map((r: any) => r.text).join("") || "Untitled";

  const subtitleRuns = runsOf(1);
  const artists = subtitleRuns
    .filter((r: any) => r.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs
      ?.browseEndpointContextMusicConfig?.pageType === "MUSIC_PAGE_TYPE_ARTIST")
    .map((r: any) => r.text as string);
  const fallbackArtist = subtitleRuns.find((r: any) => r.text && r.text !== " • ")?.text;

  const durationLabel = renderer.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text;

  return {
    videoId,
    title,
    artists: artists.length > 0 ? artists : fallbackArtist ? [fallbackArtist] : ["Unknown artist"],
    thumbnail: pickThumbnail(renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails),
    durationSeconds: durationToSeconds(durationLabel),
  };
}

export async function searchSongs(query: string): Promise<Track[]> {
  const body = buildContext(WEB_REMIX, { query, params: SONGS_FILTER_PARAMS });
  const json = await innerTubeFetch("search", WEB_REMIX, body);

  const shelves: any[] =
    json?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ?? [];

  const tracks: Track[] = [];
  for (const shelf of shelves) {
    const items =
      shelf?.musicShelfRenderer?.contents ?? shelf?.musicCardShelfRenderer?.contents ?? [];
    for (const item of items) {
      const track = parseListItem(item);
      if (track) tracks.push(track);
    }
  }
  return tracks;
}
