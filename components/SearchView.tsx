"use client";

import { useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/ytmusic/types";
import { TrackRow } from "./TrackRow";

// Small in-memory cache so re-searching the same query (e.g. going back)
// doesn't re-hit the API — mirrors point 8's "caching hasil yang relevan".
const resultCache = new Map<string, Track[]>();

export function SearchView() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (resultCache.has(q)) {
      setResults(resultCache.get(q)!);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = await res.json();
        resultCache.set(q, data.songs ?? []);
        setResults(data.songs ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-4">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search songs..."
        className="w-full rounded-full border border-border bg-surface2 px-4 py-2.5 text-sm text-text placeholder:text-subtext focus:outline-none focus:ring-1 focus:ring-accent"
      />

      {loading && <div className="px-2 text-sm text-subtext">Searching…</div>}

      {!loading && query.trim() && results.length === 0 && (
        <div className="px-2 text-sm text-subtext">No results.</div>
      )}

      <div className="flex flex-col gap-0.5">
        {results.map((track) => (
          <TrackRow key={track.videoId} track={track} queue={results} />
        ))}
      </div>
    </div>
  );
}
