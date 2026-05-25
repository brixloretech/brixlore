# AdButler VAST Integration — Implementation Tracker

> Branch: `New-Features-(Videojs-Cloudflare-Stream-AdButler-Matomo)`
> Last updated: 2026-05-24

---

## Overview

Brixlore integrates AdButler VAST tags into the Video.js-based web player.
**All ad behaviour is dynamically controlled from the admin panel.**
No ad settings are hard-coded anywhere in the player or codebase.

---

## Architecture

```
Admin Panel (/admin/settings/ads)
        │
        │  PATCH /ad-config/admin  (JWT required)
        ▼
NestJS AdConfigController → AdConfigService → PostgreSQL (AdConfig table)
        │
        │  GET /ad-config  (public, no auth)
        ▼
Next.js WatchPageClient → adConfigService.getPublicAdConfig()
        │
        ▼
HLSVideoPlayer.tsx  →  ad hook reads config, fires VAST tags only when
                        adsEnabled === true AND relevant tagUrl is set
```

---

## Data Model — `AdConfig` (Prisma)

Singleton pattern: always **one row** with `id = "singleton"`.  
All fields have safe defaults (ads disabled by default).

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | String PK | `"singleton"` | Singleton key |
| `adsEnabled` | Boolean | `false` | Master switch — must be `true` for any ad to fire |
| **Pre-roll** | | | |
| `preRollEnabled` | Boolean | `false` | Enable pre-roll ad |
| `preRollTagUrl` | String | `""` | AdButler VAST tag URL |
| `preRollSkippable` | Boolean | `false` | Show skip button |
| `preRollSkipAfterSeconds` | Int | `5` | Seconds before skip appears |
| **Mid-roll** | | | |
| `midRollEnabled` | Boolean | `false` | Enable mid-roll ad |
| `midRollTagUrl` | String | `""` | AdButler VAST tag URL |
| `midRollTriggerMode` | String | `"INTERVAL"` | `"INTERVAL"` or `"FIXED_TIMESTAMPS"` |
| `midRollIntervalMinutes` | Int | `10` | Minutes between breaks (interval mode) |
| `midRollTimestamps` | String | `"[]"` | JSON array of `HH:MM:SS` strings (fixed mode) |
| `midRollSkippable` | Boolean | `false` | Show skip button |
| `midRollSkipAfterSeconds` | Int | `5` | Seconds before skip appears |
| `midRollMaxPerVideo` | Int | `2` | Max breaks per viewing session |
| **Post-roll** | | | |
| `postRollEnabled` | Boolean | `false` | Enable post-roll ad |
| `postRollTagUrl` | String | `""` | AdButler VAST tag URL |
| `postRollSkippable` | Boolean | `false` | Show skip button |
| `postRollSkipAfterSeconds` | Int | `5` | Seconds before skip appears |
| **Outstream / Banner** | | | |
| `outstreamEnabled` | Boolean | `false` | Enable outstream video ads |
| `outstreamTagUrl` | String | `""` | AdButler VAST tag URL |
| `bannerEnabled` | Boolean | `false` | Enable display banner ads |
| `bannerTagUrl` | String | `""` | AdButler banner tag URL |
| **Failure behaviour** | | | |
| `adFailureBehavior` | String | `"SKIP_IMMEDIATELY"` | `"SKIP_IMMEDIATELY"` or `"RETRY_ONCE"` |
| `adLoadTimeoutSeconds` | Int | `8` | Seconds before timeout applies |
| **Geo restrictions** | | | |
| `geoRestrictionsEnabled` | Boolean | `false` | Suppress ads for listed countries |
| `geoBlockedCountries` | String | `"[]"` | JSON array of ISO 3166-1 alpha-2 codes |
| **Age restriction** | | | |
| `ageRestrictionEnabled` | Boolean | `false` | Suppress ads below minAge |
| `minAge` | Int | `18` | Minimum viewer age for ads |
| `updatedAt` | DateTime | auto | Auto-updated timestamp |

> **Note on JSON storage:** `midRollTimestamps` and `geoBlockedCountries` are stored as
> JSON strings in the DB column (PostgreSQL `TEXT`).  The `AdConfigService` parses them
> into proper `string[]` before returning to the client, so the frontend always receives
> real arrays.

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/ad-config` | None (public) | Player config for web client |
| `GET` | `/ad-config/admin` | JWT (admin) | Full config for admin panel |
| `PATCH` | `/ad-config/admin` | JWT (admin) | Update config (partial — any field) |

---

## Files Created / Modified

### Backend (NestJS — `server/`)

| File | Status | Description |
|---|---|---|
| `prisma/schema.prisma` | Modified | Added `AdConfig` model |
| `src/ad-config/ad-config.service.ts` | **Created** | Singleton getOrCreate, update, public config |
| `src/ad-config/ad-config.controller.ts` | **Created** | Public GET + admin GET/PATCH |
| `src/ad-config/ad-config.module.ts` | **Created** | NestJS module |
| `src/app.module.ts` | Modified | Registered `AdConfigModule` |

### Frontend (Next.js — `frontend/`)

| File | Status | Description |
|---|---|---|
| `src/types/api/ad-config.types.ts` | **Created** | `AdConfigDto`, `UpdateAdConfigDto`, enums |
| `src/types/api/index.ts` | Modified | Re-exported ad-config types |
| `src/lib/services/ad-config.service.ts` | **Created** | `getPublicAdConfig`, `getAdminAdConfig`, `updateAdConfig` |
| `src/lib/services/index.ts` | Modified | Exported `adConfigService` |
| `src/app/(admin)/admin/settings/ads/page.tsx` | **Created** | Admin UI — full ad config form |
| `src/app/(admin)/admin/settings/page.tsx` | Modified | Added "Ad settings" card |

---

## Migration Steps (required before deploying)

After merging this feature branch, run the following in the `server/` directory:

```bash
# 1. Generate new Prisma client (so TypeScript knows about AdConfig)
npx prisma generate

# 2. Create & apply migration
npx prisma migrate dev --name add-ad-config

# On Railway / production:
npx prisma migrate deploy
```

> **Important:** The `AdConfigService` uses `(this.prisma as any).adConfig` until
> `prisma generate` runs.  After generation the cast can be removed — it is a
> compile-time-only workaround, not a runtime risk.

---

## Phase Completion Status

### Phase C — AdButler Hook Infrastructure ✅ (in progress)

- [x] `AdConfig` data model in Prisma
- [x] NestJS service + controller + module
- [x] Frontend types + service layer
- [x] Admin panel UI (`/admin/settings/ads`)
- [x] "Ad settings" card on settings index page
- [ ] Player hook: `useAdConfig` — fetch config in WatchPageClient, pass to HLSVideoPlayer
- [ ] Player hook: Pre-roll VAST call in HLSVideoPlayer (behind `adsEnabled` gate)
- [ ] Player hook: Mid-roll VAST timing logic (interval + fixed-timestamp modes)
- [ ] Player hook: Post-roll VAST call
- [ ] Player hook: Skip-button UI layer
- [ ] Player hook: Failure + timeout handling
- [ ] Player hook: Geo + age suppression check

### Phase E — Admin Panel Config Controls ✅ (merged into Phase C)

All ad behaviour settings are admin-panel driven.  See above.

---

## AdButler Account Setup (required — not yet done)

Before enabling ads you will need:

1. Log in to AdButler (adbutler.com).
2. Create a **Campaign** for each slot type (pre-roll, mid-roll, post-roll, banner).
3. Under each campaign, create an **Ad** and choose **VAST** as the ad type.
4. Copy the generated **VAST Tag URL** for each slot.
5. Paste those URLs into the admin panel at `/admin/settings/ads`.
6. Enable the global "Enable ads" toggle.
7. Set frequency capping within AdButler at Campaign → Frequency Cap
   (capping is handled server-side by AdButler, not in the player).

---

## Player Integration Plan (Phase C — next steps)

When you are ready to wire the actual VAST calls in `HLSVideoPlayer.tsx`:

1. **Fetch config in WatchPageClient**: call `adConfigService.getPublicAdConfig()` once
   when the watch page loads and pass the result as a prop to `HLSVideoPlayer`.

2. **Guard all ad logic**: wrap every ad call in `if (!adConfig.adsEnabled) return`.

3. **Pre-roll**: before `player.play()` fires, call the VAST tag, await response,
   play ad, then resume content.

4. **Mid-roll (interval)**: use `player.on('timeupdate', ...)` to track elapsed time.
   Fire a mid-roll when `elapsedMinutes % midRollIntervalMinutes === 0` and the cap
   `midRollMaxPerVideo` is not exceeded.

5. **Mid-roll (fixed timestamps)**: parse `midRollTimestamps` into seconds.  Use the
   same `timeupdate` listener; fire when `currentTime` crosses a timestamp.

6. **Post-roll**: use `player.on('ended', ...)`.

7. **Skip button**: render an overlay `<div>` that becomes visible after
   `preRollSkipAfterSeconds` / `midRollSkipAfterSeconds` seconds.  Skip by calling
   `player.ads.skipLinearAdMode()` (Video.js contrib-ads API).

8. **Timeout**: wrap each VAST request in `Promise.race([fetchVast(), timeout()])`.
   On timeout apply `adFailureBehavior`.

9. **Geo check**: read `geoBlockedCountries` and compare against the viewer's country
   (resolved server-side and passed as a prop, or via a public IP geo API).

10. **Age check**: compare `minAge` against the authenticated user's stated age from
    their profile.

---

## Frequency Capping

Capping is handled **entirely inside AdButler** at the campaign level.
No client-side impression counting is implemented.
Configure caps in AdButler: Campaign → Edit → Frequency Cap.

---

## Notes

- `adsEnabled = false` is the **safe default**.  Deploying without touching the admin
  panel means no ads run.
- VAST tag URLs are never hard-coded in any source file.
- All settings are fetched fresh on each watch page load; no stale cache.
- Phase D (Matomo) will add `ad_impression` and `ad_click` events that fire alongside
  the ad hooks in Phase C.
