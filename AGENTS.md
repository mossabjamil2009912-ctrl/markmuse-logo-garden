<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules

- READ `HANDOFF.md` first when present; product-video generation is retired.
- Fonts are self-hosted in `public/fonts/` via `/fonts/fonts.css` in `src/routes/__root.tsx` — no external font requests.
- All runtime media resolves to local paths (`/videos`, `/media`, `/catalogs`, `/fonts`, `/brand`) — never `/__l5e/` CDN or remote hosts, so the desktop app runs offline.
- Repo files stay under 10 MB; large desktop archives belong in Files, not the repository.
- Windows desktop distribution uses only the offline Electron shell; never restore the remote-only Neutralino download because it cannot start without internet.
- Products catalog (`src/lib/products-data.ts` + `src/components/products-catalog.tsx`) is information-only: no pricing, ordering or quote flows linked into it.
- Product descriptions use photos and shared narration helpers; video modules are retired.
- Specs, compatibility and images come only from bundled catalogs or the manufacturer's official sources — never guess or reuse a similar model's image.
- Except solar panels, every showroom product sits on the standard white podium at catalog-documented proportions.
- SLD cable-size edits are presentation-only overrides passed into calculation helpers; the quote-derived system model stays immutable.

- Catalog viewer shows pre-rendered WebP pages from public/catalogs/pages/ (manifest.json) and falls back to pdf.js; regenerate pages whenever a catalog PDF changes — mobile loads instantly.

- Offline Windows build: Electron + local node-server (vite.electron.config.ts, electron/main.cjs); packaged zip is delivered via Files, not the repo (too large). Why: full offline media.
- Fixed Arabic voice lines are pre-generated to public/audio (tools/voice/gen.ts, index.json) and played before calling /api/tts. Why: voice works offline.
- Desktop narration uses bundled multilingual phrases only and never calls live TTS; preserve this boundary to avoid connection delays.
- Electron keeps a stable loopback port per installation to preserve browser storage across restarts.
- Desktop client output and final Nitro output use separate directories to prevent duplicate public assets in packages.

- Explicitly language-rendered catalog labels opt out of DOM translation; translate shared payloads before sending them, because DOM translation cannot cover clipboard or sharing data.
- Render shared brand identity through TamkeenBrand with the original emblem and live lettering, so it remains legible at every screen size.
- Keep the existing workflow state machine and API routes intact; visual screen variants use data-screen and shared semantic tokens, so presentation changes cannot mutate engineering or order data.
- Desktop always uses a stable loopback proxy and checksum-verified atomic public release snapshots; this preserves local storage and keeps the latest complete release offline without distributing server secrets.
- Publish builds emit a public desktop-release.json inventory through tools/desktop-release-plugin.ts; only public media and client assets can enter downloadable snapshots.

- Android app is a PWABuilder TWA (package tech.tamkeen.app) of the published site, signed with the persistent key in Files private metadata and linked via public/.well-known/assetlinks.json. Why: modern Chrome engine avoids old-WebView white screens; same key keeps upgrades installable.
- Offline web support uses vite-plugin-pwa generateSW written to dist/client, registered only from src/lib/pwa-register.ts on the published host. Why: never caches preview/dev or the desktop loopback shell.