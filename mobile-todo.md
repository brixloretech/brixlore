# Mobile App — Implementation Plan & Tech Debt

> Reference file for integrations: [track-task-mobile.md](track-task-mobile.md)
> Last updated: 2026-06-01

---

## What Is Already Working

| Area | Status | Notes |
|---|---|---|
| Auth — Login / Signup / Logout | ✅ Done | JWT, Zustand store, token refresh |
| Auth — Email verification pending screen | ✅ Done | Intercepts post-signup flow |
| Auth — Forgot password | ✅ Done | Sends reset link via backend |
| Home Screen — Hero carousel + sections | ✅ Done | Auto-scroll, continue watching row |
| Explore Screen — Browse by type | ✅ Done | Fetches all content, client-side filter |
| My List — Save / remove | ✅ Done | MyListContext + backend sync |
| Profile Screen — Menu | ✅ Done | Basic info, plan name, nav to sub-screens |
| Settings — Profile edit (name/phone/bio) | ✅ Done | PATCH /users/profile |
| Settings — Password change | ✅ Done | |
| Settings — Device management | ✅ Done | Lists active devices |
| Settings — Account export + delete | ✅ Done | PDF export, soft delete |
| Plans Screen — Plan list | ✅ Done | Fetches from backend |
| Plans Screen — RevenueCat Android billing | ✅ Done | react-native-purchases v9 |
| Watch Screen — Content detail + seasons | ✅ Done | app/video/[id].tsx |
| Watch Screen — Episode selector | ✅ Done | Season tabs + episode list |
| Watch Screen — Playback via expo-video | ✅ Done | HLS via Cloudflare Stream |
| Watch Screen — Guest/free-tier limits | ✅ Done | LimitedAccessStore, modal on exceed |
| Watch Screen — Progress reporting | ✅ Done | Reports to backend every 10 s |
| Downloads — HLS segment downloader | ✅ Done | Max 2 concurrent, queued |
| Downloads — Pause / Resume / Cancel | ✅ Done | Persistent across app restarts |
| Downloads — Offline playback | ✅ Done | Rewrites m3u8 to local paths |
| Downloads — Download notifications | ✅ Done | Android channel, action buttons |
| Notifications — Push setup | ✅ Done | expo-notifications, token register |
| Notifications — Notification store | ✅ Done | SQLite-backed |
| Continue Watching — API sync | ✅ Done | streamingService.getContinueWatching |

---

## Phase 1 — Critical Bugs (Blocking Production Quality)

- [x] **Migrate video player from `expo-av` → `expo-video`**
  - `expo-video` is now used in `app/video/[id].tsx`, `screens/VideoPlayerScreen.tsx`, `screens/WelcomeScreen.tsx`
  - `expo-av` fully removed — uninstalled from `mobile/package.json`
  - Background audio migrated to `expo-audio` in `src/services/playbackService.ts`
  - Migration guide: `mobile/VIDEO_PLAYER_MIGRATION_GUIDE.md`
  - **Requires new EAS native build before testing on device**

- [ ] **Implement `app/video-detail.tsx` or remove the route**
  - Current state: placeholder only — "Video detail screen implementation goes here"
  - Check if `/video-detail?videoId=...` is still navigated to anywhere, or if `app/video/[id].tsx` fully replaces it
  - Either wire it up or delete the file to avoid a dead route

- [ ] **Enable Downloads tab in nav bar**
  - `mobile/app/(tabs)/_layout.tsx` has `href: null` on the downloads tab — completely hidden
  - DownloadsScreen is fully built but unreachable from main nav
  - Decision: add Downloads as a visible tab OR add a "Downloads" link in the Profile menu

---

## Phase 2 — High Priority Features

- [x] **AdButler ads in mobile player — all formats, admin-controlled**
  - Config source: `GET /ad-config` — public endpoint, no auth required
  - All ad behavior driven by admin panel (`/admin/settings/ads`) — nothing hardcoded
  - **Files created:**
    - `mobile/types/adConfig.ts` — `AdConfigDto` type (mirrors web)
    - `mobile/services/adConfigService.ts` — `getPublicAdConfig()` via axios
    - `mobile/src/services/vastService.ts` — VAST XML parser (regex, no DOMParser); fires impression pixels
    - `mobile/hooks/useAdPlayer.ts` — full ad lifecycle hook; pre/mid/post-roll state machine; all tracking in refs
    - `mobile/components/AdOverlay.tsx` — fullscreen ad player: expo-video, skip countdown, mute, "Learn More" CTA
  - **`app/video/[id].tsx` changes:**
    - Pre-roll: awaited before `player.play()` on every source load
    - Mid-roll: `onTimeUpdate(ct)` called on every timeUpdate tick; supports both INTERVAL and FIXED_TIMESTAMPS modes; respects `midRollMaxPerVideo`
    - Post-roll: fired in `playToEnd` handler
    - Episode change: `resetAdState()` called so all slots re-fire on the new episode
    - VAST fetch shows a loading spinner; ad overlay mounts only when creative is ready
  - Includes mobile fullscreen ad transition persistence and buffering spinner stabilization
  - Skip controlled by `*Skippable` + `*SkipAfterSeconds` — subscription tier has **no effect**
  - Respects all admin gates: `adsEnabled`, `adFailureBehavior` (RETRY_ONCE), `adLoadTimeoutSeconds`, geo + age restrictions
  - Zero TypeScript errors

- [x] **Matomo analytics instrumentation** ✅ Complete
  - HTTP Tracking API (no SDK) — fire-and-forget `fetch` to `matomo.php`
  - Events: `Video/play`, `Video/resume`, `Video/pause`, `Video/complete`, `Video/card_click`, `Ad/ad_impression`, `Ad/ad_click`, `Download/download_start`
  - Ad-driven play/pause correctly suppressed via `adActiveRef` + `adJustResumedRef`
  - Files: `src/services/matomoService.ts`, `hooks/useMatomo.ts` (new); `[id].tsx`, `HomeScreen.tsx`, `explore.tsx`, `DownloadButton.tsx`, `AdOverlay.tsx`, `useAdPlayer.ts` (modified)
  - See [track-task-mobile.md](track-task-mobile.md) → Matomo Analytics section

- [ ] **Autoplay next episode**
  - When episode `playToEnd` fires, automatically load and play next episode in list
  - `autoplayNext` field exists in Preferences store — respect it
  - Show 5-second countdown overlay with a "Cancel" button (Netflix style)
  - Only auto-advance within same season; prompt at season boundary

- [ ] **iOS RevenueCat configuration**
  - `playBillingService.ts` only reads `EXPO_PUBLIC_RC_ANDROID_API_KEY`
  - No iOS key configured, no `Purchases.configure` branch for iOS
  - Add `EXPO_PUBLIC_RC_IOS_API_KEY` env var and conditional `configure` call
  - Test on iOS simulator / device before App Store release

- [ ] **Server-side content search**
  - Explore screen fetches all content and filters client-side — breaks at scale
  - Add `GET /content/search?q=...` call (or pass `q` param to existing `/content`)
  - Replace local filter with debounced API call as user types

---

## Phase 3 — Medium Priority

- [ ] **Playback quality selector in mobile player**
  - Web `HLSVideoPlayer.tsx` has a quality selector (Auto / 360p / 720p / 1080p)
  - `expo-video` does not natively expose HLS quality levels
  - Implement by switching to a specific variant stream URL if backend provides them; otherwise surface "Auto" only

- [ ] **Picture-in-Picture (PiP)**
  - `expo-video` supports native PiP on Android and iOS
  - Not wired up yet — add PiP button to player controls bar

- [ ] **Deep links / Universal Links**
  - `expo-linking` is installed but no deep link routing is configured
  - Push notifications carry `videoId` in data — tapping should open `app/video/[id].tsx`
  - Configure `app.json` `scheme` + expo-router deep link handling
  - Support `brixlore://video/<id>` and HTTPS universal links on `brixlore.tv`

- [ ] **Offline / network state banner**
  - App silently fails with no internet — API calls reject, screens show nothing
  - Install `@react-native-community/netinfo` and show a banner when offline
  - Downloads tab should still function fully offline (local files only)

- [ ] **Social sharing — content cards and player**
  - `expo-sharing` is installed but never used for content
  - Add share button to content detail (WatchScreen) and player controls
  - Share deep link: `https://brixlore.tv/watch/<id>`

- [ ] **Avatar / profile image upload**
  - Profile screen shows an icon placeholder — no photo
  - Add image picker (`expo-image-picker`) + upload to R2 via backend
  - Display uploaded avatar in Profile tab, Settings, and user-facing components

- [ ] **Watch history screen**
  - No dedicated screen for viewing history
  - Add `/history` route or a section in Profile that calls `streamingService.getContinueWatching` with a higher limit

- [ ] **Subtitles / closed captions**
  - `subtitlesDefault` field exists in Preferences store but is unused on mobile or web
  - Implement if Cloudflare Stream provides VTT tracks; otherwise defer

---

## Phase 4 — Build & Release

- [ ] **New EAS native build (required — native libraries changed)**
  - `expo-av` removed, `expo-video` and `expo-audio` are now native dependencies
  - Run a clean EAS build and confirm Android APK installs, plays video, and background audio works
  - Reference build logs: `b977-log-*.txt`, `d2-log-*.txt`, `f376-log-*.txt`, `fail394-log-*.txt`, `newbuild-log-*.txt`
  - Confirm `eas.json` has `development`, `preview`, and `production` profiles configured correctly

- [ ] **iOS production build**
  - Current testing is Android-only
  - Configure iOS bundle identifier, signing certificates, and provisioning profiles in EAS
  - Test Plans screen on iOS with App Store billing (not RevenueCat Android key)
  - Verify push notifications on iOS (APNs keys needed in EAS secrets)

- [ ] **Environment variable audit for EAS**
  - Verify all `EXPO_PUBLIC_*` vars are set in EAS Secrets for each build profile
  - Required: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_RC_ANDROID_API_KEY`, `EXPO_PUBLIC_RC_IOS_API_KEY`, `EXPO_PUBLIC_RC_ENTITLEMENT_ID`, `EXPO_PUBLIC_RC_PLAN_PACKAGE_MAP`, `EXPO_PUBLIC_R2_WORKER_BASE_URL`
  - Confirm `app.config.js` reads these correctly for all profiles

---

## Phase 5 — Future / Nice-to-Have

- [ ] **Chromecast / AirPlay casting**
  - Requires `react-native-google-cast` (Android) + native AirPlay (iOS)

- [ ] **Download quality selection**
  - HLS downloader always fetches master playlist (auto quality)
  - Allow user to pick quality tier before starting a download

- [ ] **Parental controls / PIN lock**
  - No parental controls implemented; relevant for higher age-rated content

- [ ] **Watchlist sync across devices**
  - My List persists to backend on add/remove — verify multi-device sync (mobile → web)

- [ ] **Subscription management portal on Android**
  - `subscriptionService.createPortalSession` generates a Stripe web portal URL
  - On Android with Play Billing, redirect to Play Store subscriptions instead
  - Platform-aware: Android → `Linking.openURL('https://play.google.com/store/account/subscriptions')`, iOS → App Store subscriptions

---

## Known Technical Debt

| Item | Location | Risk |
|---|---|---|
| expo-video migration not yet verified on physical device | `app/video/[id].tsx`, `screens/VideoPlayerScreen.tsx` | Medium — validate seek/fullscreen/background after native rebuild |
| `video-detail.tsx` is a dead stub | `app/video-detail.tsx` | Low — unused route |
| Client-side search with 120-item cap | `app/(tabs)/explore.tsx` | Medium — breaks with more content |
| Downloads hidden from nav | `app/(tabs)/_layout.tsx` | Medium — feature invisible to users |
| ~~No Matomo analytics on any user action~~ | ~~All screens~~ | ~~Medium — blind to usage data~~ | **Resolved — see Matomo section** |
| ~~No ads on mobile~~ | ~~Player screens~~ | ~~Medium — revenue gap vs web~~ — **DONE** |
| iOS RevenueCat billing not wired | `services/playBillingService.ts` | High if iOS launch planned |
| No deep link handling | `app.json`, expo-router | Medium — push notification taps go nowhere |
