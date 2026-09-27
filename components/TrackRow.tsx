"use client";

import Image from "next/image";
import type { Track } from "@/lib/ytmusic/types";
import { usePlayer } from "@/context/PlayerContext";

function formatDuration(seconds?: number | null): string {
  if (!seconds && seconds !== 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function TrackRow({ track, queue }: { track: Track; queue: Track[] }) {
  const { playTrack, current, isPlaying } = usePlayer();
  const isActive = current?.videoId === track.videoId;

  return (
    <button
      onClick={() => playTrack(track, queue)}
      className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface2 ${
        isActive ? "bg-surface2" : ""
      }`}
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded bg-surface2">
        {track.thumbnail && (
          <Image src={track.thumbnail} alt="" fill sizes="44px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`truncate text-sm ${isActive ? "text-accent" : "text-text"}`}>
          {track.title}
          {isActive && isPlaying ? " ♫" : ""}
        </div>
        <div className="truncate text-xs text-subtext">{track.artists.join(", ")}</div>
      </div>
      <div className="shrink-0 text-xs text-subtext">{formatDuration(track.durationSeconds)}</div>
    </button>
  );
}
