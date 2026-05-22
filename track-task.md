# Video.js Integration Task Tracker

## Project Rules
- No push unless you explicitly approve.
- No secrets in chat. Keep secrets in [server/.env](server/.env).
- Scope: Cloudflare Stream + Video.js + AdButler + Matomo.

## Status
- Current phase: Phase B baseline implemented
- Branch: New-Features-(Videojs-Cloudflare-Stream-AdButler-Matomo)
- Last updated: 2026-05-23

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
- [ ] Confirm the first target page/route for full integration
- Selected route: TBD

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
- [ ] Complete
- Notes: TBD

### Phase B: Stream UID Mapping + Upload-to-Play Flow
- [x] Complete
- Notes: Reused existing episode fields (videoUrl/hlsUrl) and enabled Cloudflare direct upload path from admin upload flow.

### Phase C: AdButler Hook Points in Player
- [ ] Complete
- Notes: TBD

### Phase D: Matomo Event Tracking
- [ ] Complete
- Notes: TBD

### Phase E: Admin Controls for Player + Ad Slots
- [ ] Complete
- Notes: TBD

## Blockers
- None currently

## Change Log
- 2026-05-23: Tracker initialized and structured for execution.
- 2026-05-23: Confirmed Option A for playback field and Option A for upload flow; Phase B baseline marked complete.