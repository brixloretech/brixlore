# Checklist For Brixlore New Tasks

## Scope Covered
- Cloudflare Stream
- Video.js (Web Player UI)
- AdButler
- Matomo

## 1) Cloudflare Stream

### Completed
- [x] Cloudflare Stream is the primary video pipeline for playback.
- [x] Upload-to-play flow is aligned to Cloudflare direct upload path.
- [x] Playback URL resolution supports Cloudflare Stream UID flow.
- [x] R2 fallback was removed from video playback path.
- [x] R2 remains in use for posters/thumbnails only.

## Environment Variables (Live Railway Backend Deployment)

- [x] CLOUDFLARE_STREAM_ACCOUNT_ID
- [x] CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN
- [x] CLOUDFLARE_STREAM_API_TOKEN

## 2) Video.js (Web Player UI)

### Completed Core Player
- [x] Video.js integrated on watch page (`frontend/src/app/(public)/watch/[id]/WatchPageClient.tsx`).
- [x] HLS + MP4 playback support.
- [x] Adaptive quality control with custom selector (Auto + available renditions).
- [x] Custom quality menu behavior (hover/open state and active selection behavior).

### Completed UX / Controls
- [x] Keyboard seek shortcuts: ArrowLeft (-10s), ArrowRight (+10s).
- [x] Spacebar play/pause toggle on desktop.
- [x] Mobile double-tap seek (left rewind, right forward).
- [x] Desktop side double-click seek.
- [x] YouTube-style seek feedback overlay with accumulation (+10/+20, -10/-20).
- [x] Overlay sizing and visibility tuning applied.
- [x] play/resume button
- [x] volume control
- [x] playback time read (elapsed/total)  (e.g 1:20/2:30)
- [x] quality control
- [x] playback speed control
- [x] picture-in-picture mode
- [x] full screen mode
- [x] web app player responsive on mobile

### Completed Ad UI Layer in Player
- [x] Ad overlay status badge by slot (pre-roll / mid-roll / post-roll).
- [x] Skip countdown and skip button behavior.
- [x] Ad skip event hook emitted.


## 3) AdButler

### Completed Platform Wiring
- [x] AdConfig Prisma model created (singleton configuration model).
- [x] NestJS AdConfig module/service/controller implemented.
- [x] Public endpoint for player config: `GET /ad-config`.
- [x] Admin endpoints for config management: `GET/PATCH /ad-config/admin`.
- [x] Frontend service + DTO types added for ad config.
- [x] Admin settings UI page implemented: `/admin/settings/ads`.
- [x] Player hooks wired for pre-roll, mid-roll, and post-roll logic.
- [x] Mid-roll supports interval mode and fixed timestamp mode.
- [x] Timeout/failure behavior and retry logic integrated.
- [x] Geo and age suppression checks integrated.

### Completed Event Hooks
- [x] Ad impression hook emitted from player.
- [x] Ad click hook emitted from ad badge interaction.

### Pending External AdButler Account Setup
- [ ] Create/confirm Publisher in AdButler.
- [ ] Create/confirm VAST Zones (pre-roll, mid-roll, post-roll).
- [ ] Create/confirm Advertiser + Campaign + Ads.
- [ ] Assign zone and campaign to VAST channel.
- [ ] Paste live VAST URLs into `/admin/settings/ads` and validate fill.

## 4) Matomo

### Completed Integration
- [x] Matomo Cloud script integrated in app layout.
- [x] `NEXT_PUBLIC_MATOMO_URL` and `NEXT_PUBLIC_MATOMO_SITE_ID` support added.
- [x] Reusable `useMatomo` tracking hook created.
- [x] Event wiring completed for:
  - [x] Video play
  - [x] Video resume
  - [x] Video pause
  - [x] Video complete
  - [x] Ad impression
  - [x] Ad click
  - [x] Episode card click
  - [x] Signup (free/paid)
  - [x] Purchase
- [x] Build validation completed successfully after integration.


## 5) Environment Variables (Live Deployment)

### Frontend Required
- [x] `NEXT_PUBLIC_MATOMO_URL` set on live frontend environment.
- [x] `NEXT_PUBLIC_MATOMO_SITE_ID` set on live frontend environment.
  

### Backend Required for This Scope
- [x] No new backend environment variable required specifically for Matomo tracking.
- [x] Existing backend CORS/domain allowlist confirmed for live frontend origin.

