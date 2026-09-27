export interface Track {
  videoId: string;
  title: string;
  artists: string[];
  album?: string | null;
  durationSeconds?: number | null;
  thumbnail?: string | null;
  isExplicit?: boolean;
}

export interface SearchResult {
  songs: Track[];
}

export interface StreamInfo {
  url: string;
  mimeType: string;
  bitrate: number;
  itag: number;
  expiresInSeconds: number;
}
