# Mobile App Task Tracker — Brixlore

## Project Rules
- No push unless explicitly approved.
- No secrets in chat. Env vars go in `mobile/.env` / EAS Secrets.
- Scope: Expo SDK 54, React Native 0.81, expo-router v6, Zustand, RevenueCat.
- Full implementation plan and tech debt: see [mobile-todo.md](mobile-todo.md).

## Status
- Current phase: Core complete — polish + missing features
- Platform: Android (primary), iOS (partially untested)
- Last updated: 2026-06-01
- Branch: main (mobile changes committed)

---

## Video Player — expo-video

- Library: `expo-video ^3.0.16`
- Replaced: `expo-av` (fully removed — uninstalled from `mobile/package.json`)
- Player hook: `useVideoPlayer(source, setup?)` — create player, set loop/muted/playbackRate
- Player component: `<VideoView ref={...} player={player} contentFit="cover" />`
- Events: `useEventListener(player, 'statusChange' | 'timeUpdate' | 'playingChange' | 'playToEnd', handler)`
- Fullscreen: `videoViewRef.current?.enterFullscreen()` / `exitFullscreen()`
- Migrated files:
  - `app/video/[id].tsx` — main watch screen (HLS via Cloudflare Stream)
  - `screens/VideoPlayerScreen.tsx` — standalone offline player
  - `screens/WelcomeScreen.tsx` — background looping banner video
- Migration guide: `mobile/VIDEO_PLAYER_MIGRATION_GUIDE.md`
- **Requires new EAS native build** before testing on device

---

## Background Audio — expo-audio

- Library: `expo-audio ~1.1.1`
- Replaced: `expo-av Audio.Sound` (removed)
- Player factory: `createAudioPlayer({ uri })` — starts loading immediately
- Methods: `player.play()`, `player.pause()`, `player.seekTo(seconds)`, `player.remove()`
- Properties: `player.currentTime` (seconds), `player.isLoaded`, `player.playing`
- Audio mode: `setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' })`
- Service file: `src/services/playbackService.ts`
  - Exports: `preloadAudioFromUrl`, `playAudioFromUrl`, `getAudioPosition`, `pauseAudio`, `resumeAudio`, `stopAudio`
  - Consumed by: `app/video/[id].tsx` (AppState handler), `src/services/notificationSetup.ts`
- Plugin added to `mobile/app.json` plugins array: `"expo-audio"`

---

## AdButler — Implemented (Mobile)

- Config source: `GET /ad-config` — public endpoint, no auth. Returns `AdConfigDto`.
- All behavior is admin-controlled via `/admin/settings/ads`. Nothing is hardcoded in the app.
- Skip is controlled by `*Skippable` + `*SkipAfterSeconds` — subscription tier has no effect.

### Files

| File | Role |
|---|---|
| `mobile/types/adConfig.ts` | `AdConfigDto` type — exact mirror of the web type |
| `mobile/services/adConfigService.ts` | `adConfigService.getPublicAdConfig()` — axios `GET /ad-config` |
| `mobile/src/services/vastService.ts` | VAST XML parser (regex, no `DOMParser`); `fetchVastMediaInfo(url, timeoutMs)`; `fireImpressions(urls)` |
| `mobile/hooks/useAdPlayer.ts` | Ad lifecycle hook — fetches config, tracks pre/mid/post-roll state in refs, exposes stable callbacks |
| `mobile/components/AdOverlay.tsx` | Fullscreen ad player — expo-video `VideoView`, skip countdown, mute, "Learn More" CTA |

### VAST flow

1. `adConfigService.getPublicAdConfig()` fetches config on mount (once per screen)
2. `triggerPreRoll()` / `triggerPostRoll()` return Promises that resolve when the ad ends or fails
3. `onTimeUpdate(ct)` is called on every `timeUpdate` tick; fires mid-roll when trigger point is crossed
4. `fetchVastMediaInfo(tagUrl, timeoutMs)` — `fetch` with `AbortController` timeout → regex parse XML → prefer MP4 `<MediaFile>` → return `VastMediaInfo | null`
5. Impression pixels fired via fire-and-forget `fetch` calls (no `sendBeacon` in RN)
6. `<AdOverlay>` mounts; its own `useVideoPlayer` plays the ad creative
7. `onAdDone()` resolves the Promise, unmounts overlay, resumes content

### Mid-roll trigger modes

- `INTERVAL`: fires every N minutes (`midRollIntervalMinutes * 60`), up to `midRollMaxPerVideo`
- `FIXED_TIMESTAMPS`: fires when `currentTime >= tsSec` for each `HH:MM:SS` in `midRollTimestamps`
- All trigger tracking is in refs — safe to call on every 250 ms timeUpdate tick

### Admin gates respected

- `adsEnabled` — master switch
- `adFailureBehavior` — `RETRY_ONCE` retries the VAST fetch once before skipping
- `adLoadTimeoutSeconds` — clamped to 3–30 s via `AbortController`
- `geoRestrictionsEnabled` / `geoBlockedCountries` — checked in `useAdPlayer` before fetch
- `ageRestrictionEnabled` / `minAge` — checked in `useAdPlayer` before fetch

---

## Matomo Analytics — Implemented (Mobile)

- Site ID: `1`
- Base URL: `https://brixloretv.matomo.cloud`
- Approach: HTTP Tracking API (no SDK) — fire-and-forget `fetch` to `matomo.php`
- Env overrides: `EXPO_PUBLIC_MATOMO_URL`, `EXPO_PUBLIC_MATOMO_SITE_ID` (both optional, hardcoded defaults)

### Files

| File | Role |
|---|---|
| `mobile/src/services/matomoService.ts` | Singleton HTTP client — `trackEvent(category, action, name?, value?)`, `trackPageView(title?)` |
| `mobile/hooks/useMatomo.ts` | React hook — stable `useCallback` wrappers around `matomoService`; mirrors web `useMatomo` API |

### Events implemented

| Category | Action | Name | Where |
|---|---|---|---|
| `Video` | `play` | Show — Episode title | `[id].tsx` `playingChange` (first play per source) |
| `Video` | `resume` | Show — Episode title | `[id].tsx` `playingChange` (subsequent user resumes) |
| `Video` | `pause` | Show — Episode title | `[id].tsx` `playingChange` (user pause, skips ad-driven + end) |
| `Video` | `complete` | Show — Episode title | `[id].tsx` `playToEnd` |
| `Video` | `card_click` | Content title | `HomeScreen.tsx` + `explore.tsx` |
| `Ad` | `ad_impression` | slot name (pre-roll / mid-roll / post-roll) | `[id].tsx` via `useEffect` watching `adOverlay` |
| `Ad` | `ad_click` | slot name | `[id].tsx` via `AdOverlay.onLearnMoreClick` |
| `Download` | `download_start` | Content title | `DownloadButton.tsx` `handleDownload` |

### Ad-driven play suppression

`adJustResumedRef` (ref in `[id].tsx`) is set inside `resumeContent()` when the ad system actually restarts the content player. The `playingChange` listener checks this ref and skips tracking the resulting `nowPlaying=true` event, preventing spurious `resume` events during mid-roll recovery.

### Files modified

- `mobile/hooks/useAdPlayer.ts` — `adActiveRef` added to `UseAdPlayerReturn` interface + return value
- `mobile/components/AdOverlay.tsx` — `onLearnMoreClick?: () => void` prop added; called in `handleLearnMore`
- `mobile/app/video/[id].tsx` — full tracking integration (see table above)
- `mobile/screens/HomeScreen.tsx` — `card_click` via `handleItemPress(id, episodeId?, title?)`
- `mobile/app/(tabs)/explore.tsx` — `card_click`; `BrowseRowSection.onItemPress` updated to pass title
- `mobile/components/DownloadButton.tsx` — `download_start` in `handleDownload`

---

## Change Log

### 2026-06-01
- Fixed mobile ad fullscreen transition: persisted the AdOverlay player across normal/fullscreen toggles so pre-roll/mid-roll/post-roll creatives do not restart.
- Debounced ad buffering state during fullscreen transitions to avoid false spinner flashes.
- Polished mobile ad overlay behavior around skip timer pause/resume and simplified mobile controls for the mobile player.

### 2026-05-31
- Created `track-task-mobile.md` — full audit of mobile app codebase
- Completed expo-video migration: `app/video/[id].tsx`, `screens/VideoPlayerScreen.tsx`, `screens/WelcomeScreen.tsx`
- Migrated background audio service `playbackService.ts` from `expo-av` → `expo-audio`
- Removed `expo-av` from `mobile/package.json`; added `expo-audio` plugin to `app.json`
- Moved implementation phases + tech debt to `mobile-todo.md`
- Implemented AdButler VAST ad system for mobile:
  - Created `types/adConfig.ts`, `services/adConfigService.ts`, `src/services/vastService.ts`, `hooks/useAdPlayer.ts`, `components/AdOverlay.tsx`
  - Integrated pre-roll, mid-roll, and post-roll into `app/video/[id].tsx`
  - Zero TypeScript errors across all new files
- Implemented Matomo analytics for mobile:
  - Created `src/services/matomoService.ts` (HTTP client singleton) and `hooks/useMatomo.ts` (React hook)
  - Tracks: `Video/play`, `Video/resume`, `Video/pause`, `Video/complete`, `Video/card_click`, `Ad/ad_impression`, `Ad/ad_click`, `Download/download_start`
  - Ad-driven play/pause correctly suppressed via `adActiveRef` + `adJustResumedRef`
  - Zero TypeScript errors across all modified files
