# Video.js Integration Task Tracker

## Project Rules
- No push unless you explicitly approve.
- No secrets in chat. Keep secrets in [server/.env](server/.env).
- Scope: Cloudflare Stream + Video.js + AdButler + Matomo.

## Status
- Current phase: Phase C + Phase E completed, Phase D pending
- Branch: New-Features-(Videojs-Cloudflare-Stream-AdButler-Matomo)
- Last updated: 2026-05-25
- Video pipeline: Cloudflare Stream only
- Image pipeline: R2 retained for thumbnails/posters

## Required Inputs Checklist

### 1) Playback Field Decision
- [x] Choose one
- Option A: Reuse existing episode field
- Option B: Add dedicated streamUid field
- Selected: Option A

### 2) Upload Flow Decision
- [x] Choose one
- Option A: Direct upload from admin to Cloudflare Stream
- Option B: Backend proxy upload
- Selected: Option A

### 3) Primary Web Player Page
- [x] Confirm the first target page/route for full integration
- Selected route: frontend/src/app/(public)/watch/[id]/WatchPageClient.tsx

### 4) AdButler Test Tags
- [ ] Pre-roll tag
- [ ] Mid-roll tag
- [ ] Post-roll tag
- [ ] Outstream tag
- [ ] Banner tag

### 5) Matomo Setup
- [ ] Matomo base URL
- [ ] Site ID
- [ ] Confirm event list for first release
- Events: play, pause, complete, ad_impression, ad_click, card_click

### 6) Video Behavior Rules
- [ ] Autoplay: on/off
- [ ] Default quality: auto/fixed
- [ ] Resume from last progress: yes/no
- [ ] Skip intro button: yes/no

### 7) Admin Permissions
- [ ] Who can edit player config
- [ ] Who can edit ad mapping
- [ ] Who can view analytics/debug only

### 8) Test Content
- [ ] 2-3 sample videos
- [ ] Poster URLs (if available)
- [ ] One content + episode metadata sample

## Implementation Plan Checklist

### Phase A: Final Video.js Playback Wiring
- [x] Complete
- Notes: Added safe playback URL resolution for Cloudflare Stream UID and removed R2 fallback from video playback.

### Phase B: Stream UID Mapping + Upload-to-Play Flow
- [x] Complete
- Notes: Reused existing episode fields (videoUrl/hlsUrl) and enabled Cloudflare direct upload as the only video upload path.

### Phase C: AdButler Hook Points in Player (completed — merged with Phase E)
- [x] AdConfig data model in Prisma (singleton pattern)
- [x] NestJS AdConfigModule: service, controller, module
- [x] Registered AdConfigModule in app.module.ts
- [x] Public endpoint GET /ad-config (player reads, no auth)
- [x] Admin endpoints GET/PATCH /ad-config/admin (JWT required)
- [x] Frontend types: AdConfigDto, UpdateAdConfigDto, enums
- [x] Frontend service: adConfigService (getPublicAdConfig, getAdminAdConfig, updateAdConfig)
- [x] Admin UI: /admin/settings/ads — full dynamic form for all ad settings
- [x] Settings index page: added "Ad settings" card
- [x] Player hook: useAdConfig in WatchPageClient — fetch and pass config to player
- [x] Player hook: pre-roll request hook (behind adsEnabled gate)
- [x] Player hook: mid-roll timing hook (interval + fixed-timestamp modes)
- [x] Player hook: post-roll request hook
- [x] Player hook: skip-button UI overlay
- [x] Player hook: failure + timeout handling
- [x] Player hook: geo + age suppression check
- Notes: Phase C and Phase E are implemented together. All ad behaviour (trigger
  strategy, failure mode, skip settings, geo/age restrictions, adsEnabled toggle)
  is fully dynamic from the admin panel. No settings are hard-coded.
  See ADBUTLER_IMPLEMENTATION.md for full detail and migration steps.

### Phase D: Matomo Event Tracking
- [ ] Complete
- Notes: TBD

### Phase E: Admin Controls for Player + Ad Slots (merged into Phase C)
- [x] Complete — all ad settings are admin-panel controlled via /admin/settings/ads
- Notes: Phase E ad controls implemented within Phase C. Remaining Phase E work
  (general player config like autoplay, quality defaults) is still pending.

## Blockers
- None currently

## Change Log
- 2026-05-23: Tracker initialized and structured for execution.
- 2026-05-23: Confirmed Option A for playback field and Option A for upload flow; Phase B baseline marked complete.
- 2026-05-23: Completed Phase A baseline on watch page with Cloudflare-aware playback URL resolution and safer configuration errors.
- 2026-05-23: Removed R2 from video upload/playback while keeping R2 for thumbnails and posters.
- 2026-05-24: Started Phase C + E together (merged). Created AdConfig Prisma model (singleton),
  NestJS ad-config module (service/controller/module), frontend types, adConfigService,
  and full admin UI at /admin/settings/ads. All ad settings are now admin-panel driven.
  See ADBUTLER_IMPLEMENTATION.md for migration steps and remaining player hook work.
- 2026-05-25: Wired player ad-config flow in watch/player path. Added public ad-config fetch in
  WatchPageClient and ad slot request hooks in HLSVideoPlayer for pre-roll, mid-roll
  (interval/fixed timestamps), and post-roll with timeout, retry-once behavior, and geo/age
  suppression checks. Skip-button overlay remains pending.
- 2026-05-25: Completed Phase C wiring by adding the player skip-button overlay layer and
  slot-aware skip timing UI. Phase C is now complete; Phase D (Matomo) remains pending.