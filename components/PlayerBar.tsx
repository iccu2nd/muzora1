"use client";

import Image from "next/image";
import { usePlayer } from "@/context/PlayerContext";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function PlayerBar() {
  const { current, isPlaying, progressSeconds, durationSeconds, volume, togglePlay, next, prev, seekTo, setVolume } =
    usePlayer();

  if (!current) {
    return null; // no persistent-but-empty bar taking up space before first play
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-surface px-3 py-2 md:px-4">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-surface2">
            {current.thumbnail && <Image src={current.thumbnail} alt="" fill sizes="48px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm text-text">{current.title}</div>
            <div className="truncate text-xs text-subtext">{current.artists.join(", ")}</div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <button onClick={prev} aria-label="Previous" className="text-subtext hover:text-text">
              ⏮
            </button>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-text text-bg"
            >
              {isPlaying ? "❚❚" : "▶"}
            </button>
            <button onClick={next} aria-label="Next" className="text-subtext hover:text-text">
              ⏭
            </button>
          </div>
          <div className="flex w-full items-center gap-2 text-[11px] text-subtext">
            <span className="w-9 text-right">{formatTime(progressSeconds)}</span>
            <input
              type="range"
              min={0}
              max={durationSeconds || 0}
              value={Math.min(progressSeconds, durationSeconds || 0)}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-9">{formatTime(durationSeconds)}</span>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-end gap-2 md:flex">
          <span className="text-xs text-subtext">🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
