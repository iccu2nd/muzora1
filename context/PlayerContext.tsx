"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Track } from "@/lib/ytmusic/types";

interface PlayerState {
  queue: Track[];
  currentIndex: number;
  current: Track | null;
  isPlaying: boolean;
  progressSeconds: number;
  durationSeconds: number;
  volume: number;
}

interface PlayerApi extends PlayerState {
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (v: number) => void;
}

const PlayerContext = createContext<PlayerApi | null>(null);

// Mounted once in the root layout, so the <audio> element (and this context)
// survives client-side route changes instead of being torn down per page —
// this is what keeps playback alive when the user navigates around Muzora.
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    queue: [],
    currentIndex: -1,
    current: null,
    isPlaying: false,
    progressSeconds: 0,
    durationSeconds: 0,
    volume: 1,
  });

  // "latest ref" so the 'ended' listener (registered once, below) always
  // calls the current next(), not a stale closure from first mount.
  const nextRef = useRef<() => void>(() => {});

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata"; // don't force-download whole file before play
    audioRef.current = audio;

    const onTime = () => setState((s) => ({ ...s, progressSeconds: audio.currentTime }));
    const onDuration = () => setState((s) => ({ ...s, durationSeconds: audio.duration || 0 }));
    const onEnded = () => nextRef.current();
    const onPlay = () => setState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => setState((s) => ({ ...s, isPlaying: false }));

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  const loadAndPlay = useCallback((index: number, queue: Track[]) => {
    const track = queue[index];
    const audio = audioRef.current;
    if (!track || !audio) return;
    audio.src = `/api/stream?videoId=${encodeURIComponent(track.videoId)}`;
    audio.play().catch((e) => console.error("play() failed", e));
    setState((s) => ({ ...s, queue, currentIndex: index, current: track, progressSeconds: 0 }));
  }, []);

  const playTrack = useCallback(
    (track: Track, queue?: Track[]) => {
      const q = queue ?? [track];
      const idx = q.findIndex((t) => t.videoId === track.videoId);
      loadAndPlay(idx === -1 ? 0 : idx, q);
    },
    [loadAndPlay],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, []);

  const next = useCallback(() => {
    setState((s) => {
      if (s.currentIndex < s.queue.length - 1) {
        loadAndPlay(s.currentIndex + 1, s.queue);
      }
      return s;
    });
  }, [loadAndPlay]);

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const prev = useCallback(() => {
    setState((s) => {
      if (s.currentIndex > 0) {
        loadAndPlay(s.currentIndex - 1, s.queue);
      }
      return s;
    });
  }, [loadAndPlay]);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = seconds;
  }, []);

  const setVolume = useCallback((v: number) => {
    const audio = audioRef.current;
    if (audio) audio.volume = v;
    setState((s) => ({ ...s, volume: v }));
  }, []);

  const value = useMemo<PlayerApi>(
    () => ({ ...state, playTrack, togglePlay, next, prev, seekTo, setVolume }),
    [state, playTrack, togglePlay, next, prev, seekTo, setVolume],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
