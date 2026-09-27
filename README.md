# Muzora

Web music player, rebranded and re-platformed from **SimpMusic** (Kotlin
Multiplatform / Compose, Android + Desktop) into a **Next.js** web app for
Vercel. This is iteration 1: search + streaming playback working end to end,
built from analysis of the real SimpMusic + `core` sources (not a from-scratch
guess at the feature set).

## Why this had to become a web rewrite of the UI layer

SimpMusic's UI is Jetbrains Compose Multiplatform — there is no web/Wasm
target in the project, so Compose code cannot render in a browser DOM. The
UI (layout, navigation shape, player bar, search flow) is faithfully
re-implemented in React/Tailwind matching SimpMusic's structure and visual
language (dark, minimal, no dashboard/SaaS chrome), per your brief.

## What *is* ported logic, not a rewrite

`lib/ytmusic/*` is a direct architectural port of
`core/service/kotlinYtmusicScraper`:
- `client.ts` ports `models/YouTubeClient.kt` — the same public InnerTube
  client identities (WEB_REMIX, IOS) and API keys SimpMusic uses to talk to
  `music.youtube.com`.
- `search.ts` ports the shape of `Ytmusic.kt` search + `YtItemParser.kt`
  (simplified — see below).
- `player.ts` / `app/api/stream/[videoId]/route.ts` port the streaming path:
  resolve a playable format via the `player` InnerTube endpoint, then proxy
  it with HTTP Range passthrough so playback starts before the file finishes
  downloading (point 6 in your brief) — real progressive streaming, not a
  full-file download.

## Known limitations / what's simplified for this first pass

1. **Signature cipher solving is not ported yet.** SimpMusic's real scraper
   (`cipher/*.kt`: `ZemerCipherSolver`, `RemotePlayerConfigParser`, etc.)
   pulls per-player-version sig/n-transform JS from a community-maintained
   remote config and executes it in a JS engine to decrypt YouTube's
   ciphered stream URLs — this is the robust path and works for every
   InnerTube client. For v1, `player.ts` uses the **IOS** client instead,
   which YouTube currently hands back direct (unciphered) URLs for. This is
   simpler but more fragile long-term: if Google locks that down, playback
   breaks until the cipher solver is ported (it's a good next step — the
   Kotlin source is the exact spec to follow, and it's actually *easier* in
   Node than it was in Kotlin/JVM, since Node's `vm` module can just run the
   extracted JS directly instead of embedding a JS engine like the original
   QuickJS approach).
2. **Search result parsing is simplified.** `search.ts` walks
   `musicResponsiveListItemRenderer` for songs only. The real
   `YtItemParser.kt` also handles albums/artists/playlists/videos and many
   renderer edge cases — worth porting in full once song search is verified
   working.
3. **Library, playlists, queue persistence, favorites, lyrics, Spotify
   import, casting, AI/auto-EQ are not built yet** (they lived in `:data`,
   `:domain`, `:spotify`, `:lyricsService`, `:aiService`, `cast` in the
   original — all bigger scoped features than fit in one pass). Sidebar has
   a `Library` link stubbed for this.
4. **Player bar is v1**: play/pause, prev/next, seek, volume, persists
   across navigation (mounted once in `app/layout.tsx`, not per-page).
   Shuffle/repeat/queue-editing/expanded full-player view are next.

## Not tested against the live network

This environment has no outbound network access, so `npm install` and a real
`npm run build` / live InnerTube requests haven't been run here. The code is
written to compile cleanly under standard Next 14 + TypeScript, but please
run `npm install && npm run dev` locally before deploying, and watch the
server logs on your first few searches/plays — YouTube's internal API shapes
drift over time, and the search parser in particular may need small
field-path tweaks if a shelf renders differently than expected.

## Running locally

```bash
npm install
npm run dev
```

## Deploy ke Vercel

Tidak ada environment variable wajib untuk iterasi ini (lihat `.env.example`
untuk yang direservasi buat nanti). `vercel.json` sudah menegaskan framework
Next.js + perintah build/install-nya secara eksplisit.

**Lewat GitHub (disarankan):**
1. Push folder ini ke repo GitHub baru.
   ```bash
   git init
   git add .
   git commit -m "Muzora v1"
   git branch -M main
   git remote add origin <url-repo-kamu>
   git push -u origin main
   ```
2. Di [vercel.com/new](https://vercel.com/new), import repo tersebut.
3. Framework Preset otomatis terdeteksi "Next.js" — biarkan default, klik
   **Deploy**. Tidak perlu isi Environment Variables untuk iterasi ini.

**Lewat Vercel CLI (tanpa GitHub):**
```bash
npm i -g vercel
vercel login
vercel        # deploy preview
vercel --prod # deploy production
```

**Setelah deploy**, coba search sebuah lagu dan mainkan — kalau gagal play,
cek Vercel → Project → Logs (function `app/api/stream`) untuk pesan error
dari `resolveStream`, biasanya karena YouTube mengubah bentuk respons (lihat
"Known limitations" di atas).

## Suggested next iteration order

1. Verify search + playback against the live API, fix any renderer drift.
2. Port the full signature-cipher solver (removes the IOS-client fragility).
3. Library/playlists/queue (own module, own state — biggest remaining
   feature area).
4. Full-screen expanded player, shuffle/repeat, favorites.
5. Lyrics, Spotify import, the rest of `core/service/*`.
