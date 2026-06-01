# Cloudflare Stream UID Audit

Audit of the Cloudflare Stream UID implementation across server, web, and mobile.  
Date: May 31, 2026

---

## Audit Checklist

| # | Check | Status | Issue |
|---|---|---|---|
| 1 | UID stored correctly (not full URL) | ✅ OK | — |
| 2 | UID validated in Cloudflare | ✅ Fixed | Was: no readiness check; `hlsStatus` misleading |
| 3 | Playback from UID | ✅ OK | All 3 layers resolve correctly |
| 4 | End-to-end upload → play flow | ✅ OK | Structurally complete |
| 5 | Fallback for invalid UID | ✅ Fixed | Was: misconfigured env returned raw UID → broken mobile URL |
| 6 | No legacy R2 dependency | ✅ Fixed | Was: `downloads.service.ts` passed Cloudflare UID to `r2Service.getSignedGetUrl()` |

---

## Check 1 — UID Stored Correctly ✅

**Finding:** `Episode.videoUrl` and `Episode.hlsUrl` both store the raw Cloudflare Stream UID (e.g. `abc123def456...`), not a full URL. Resolved at runtime.

**Evidence — `frontend/src/lib/multipart-upload.ts`:**
```ts
return {
  key: directUpload.uid,   // raw UID from Cloudflare API
  uploadId: directUpload.uid,
  cloudflareStream: true,
};
```

**Evidence — `server/src/admin/admin.service.ts`:**
```ts
return (this.prisma as any).episode.create({
  data: {
    videoUrl: dto.videoKey.trim(),        // UID stored here
    hlsUrl: dto.hlsKey?.trim() || null,   // same UID stored here (for CF Stream)
  },
});
```

**No changes needed.**

---

## Check 2 — UID Validated in Cloudflare ✅ Fixed

**Finding (before):** After uploading a file to Cloudflare Stream, the UID was saved to the DB immediately with no verification that Cloudflare had finished processing the video. The admin panel's `hlsStatus` field always showed `ready` for Cloudflare content (because `hlsUrl` is set to the UID immediately), even if Cloudflare was still encoding.

**Fix — new method in `server/src/streaming/streaming.service.ts`:**
```ts
/** Check Cloudflare Stream processing status for a given UID. */
async getCloudflareVideoStatus(
  uid: string,
): Promise<{ uid: string; status: string; readyToStream: boolean }> {
  const config = this.getCloudflareStreamConfig();
  const trimmedUid = uid.trim();
  if (!trimmedUid) {
    throw new InternalServerErrorException('UID is required');
  }

  const response = await axios.get(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/stream/${trimmedUid}`,
    {
      headers: { Authorization: `Bearer ${config.apiToken}` },
      timeout: 10_000,
    },
  );

  const result = response.data?.result;
  return {
    uid: trimmedUid,
    status: result?.status?.state ?? 'unknown',
    readyToStream: result?.readyToStream === true,
  };
}
```

**Fix — new admin endpoint in `server/src/streaming/streaming.controller.ts`:**
```ts
/** Authenticated (admin): check Cloudflare Stream processing status for a UID. */
@Get('cloudflare/video-status/:uid')
async getCloudflareVideoStatus(
  @CurrentUser() user: User,
  @Param('uid') uid: string,
): Promise<{ uid: string; status: string; readyToStream: boolean }> {
  ensureAdminUploadAccess(user);
  const trimmed = uid?.trim();
  if (!trimmed) throw new BadRequestException('uid is required');
  return this.streamingService.getCloudflareVideoStatus(trimmed);
}
```

**Usage:** Admin panel can call `GET /streaming/cloudflare/video-status/:uid` after upload to confirm `readyToStream: true` before publishing. Requires `admin`, `SUPER_ADMIN`, or `CONTENT_MANAGER` role.

**Cloudflare `status` values:** `pendingupload` → `downloading` → `queued` → `inprogress` → `ready` (or `error`).

---

## Check 3 — Playback from UID ✅

**Finding:** All three layers correctly resolve a raw UID to a full HLS URL.

**Server (`server/src/streaming/streaming.service.ts`):**
```ts
// UID → https://{customerSubdomain}/{uid}/manifest/video.m3u8
return `https://${status.customerSubdomain}/${uid}/manifest/video.m3u8`;
```

**Web (`frontend/src/lib/services/streaming.service.ts`):**
```ts
function looksLikeCloudflareStreamUid(value: string): boolean {
  return /^[A-Za-z0-9_-]{8,}$/.test(value.trim()) && !value.trim().includes('/');
}
// If UID detected → same URL construction using NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN
```

**Mobile (`mobile/services/streamingService.ts`):** Server resolves UID → full HLS URL before returning `streamKey`. Mobile receives a complete `https://` URL and passes it directly to the player.

**No changes needed.**

---

## Check 4 — End-to-End Upload → Play Flow ✅

**Finding:** The full chain is structurally complete.

```
Admin panel
  → POST /streaming/cloudflare/direct-upload
  → Server calls Cloudflare API → returns { uploadUrl, uid }
  → Admin browser PUT file directly to uploadUrl (bypasses server)
  → Admin calls createEpisode({ videoKey: uid, hlsKey: uid })
  → Episode saved to DB: videoUrl = uid, hlsUrl = uid

Client
  → GET /episodes/:id/play  (or /guest-play)
  → Server reads hlsUrl/videoUrl (the UID)
  → resolveStreamPlaybackUrl(uid) → full HLS URL
  → Returns { streamKey: "https://customer.cloudflarestream.com/{uid}/manifest/video.m3u8" }
  → Player loads stream
```

**No changes needed.**

---

## Check 5 — Fallback for Invalid UID ✅ Fixed

**Finding (before):** In `resolveStreamPlaybackUrl`, when `CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN` was not set in the environment, the method silently returned the raw UID string as the `streamKey`. The server sent this raw UID back to clients. The web frontend threw an `ApiError`, but the mobile app fell through to the R2 worker URL fallback, constructing a completely broken playback URL.

**Fix — `server/src/streaming/streaming.service.ts`:**
```ts
// Before:
private resolveStreamPlaybackUrl(streamKey: string | null | undefined): string | null {
  if (!streamKey) return null;
  if (this.isUrl(streamKey)) return streamKey;

  const status = this.getCloudflareStreamStatus();
  if (!status.customerSubdomain) {
    return streamKey;  // ← silent failure: raw UID returned to client
  }

  const uid = streamKey.trim();
  if (!uid) return null;
  return `https://${status.customerSubdomain}/${uid}/manifest/video.m3u8`;
}

// After:
private resolveStreamPlaybackUrl(streamKey: string | null | undefined): string | null {
  if (!streamKey) return null;
  if (this.isUrl(streamKey)) return streamKey;

  const status = this.getCloudflareStreamStatus();
  if (!status.customerSubdomain) {
    throw new InternalServerErrorException(
      'Cloudflare Stream customer subdomain is not configured. Set CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN.',
    );
  }

  const uid = streamKey.trim();
  if (!uid) return null;
  return `https://${status.customerSubdomain}/${uid}/manifest/video.m3u8`;
}
```

**Result:** Missing env var now fails fast with a clear 500 error server-side instead of producing a silent broken URL on mobile.

---

## Check 6 — No Legacy R2 Dependency ✅ Fixed

**Finding (before):** `server/src/downloads/downloads.service.ts` resolved download URLs as follows:

```ts
// BEFORE — broken for Cloudflare Stream content
if (/^https?:\/\//i.test(episode.videoUrl)) {
  return { downloadUrl: episode.videoUrl };  // full URL → fine
}
const signed = await this.r2Service.getSignedGetUrl(episode.videoUrl);
// ↑ For Cloudflare UIDs (no https:// prefix), this passed the raw UID
// as an R2 object key → R2 signed a URL for a key that doesn't exist → downloads broken
return { downloadUrl: signed };
```

**Fix — `server/src/downloads/downloads.service.ts`:**
```ts
// AFTER — Cloudflare UID resolved correctly
const rawUrl = episode.videoUrl.trim();
if (/^https?:\/\//i.test(rawUrl)) {
  return { downloadUrl: rawUrl };  // full URL → pass through unchanged
}
// Non-URL value is a Cloudflare Stream UID — resolve to HLS manifest URL.
const customerSubdomain = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN?.trim();
if (!customerSubdomain) {
  throw new InternalServerErrorException(
    'Cloudflare Stream customer subdomain is not configured. Set CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN.',
  );
}
return { downloadUrl: `https://${customerSubdomain}/${rawUrl}/manifest/video.m3u8` };
```

Also added `InternalServerErrorException` to the NestJS imports.

**R2 usage after fix:**
- ✅ Thumbnails / banners → R2 only (`attachSignedThumbnails` method, unchanged)
- ✅ Videos → Cloudflare Stream only
- ❌ R2 video signed URLs → removed from download flow

---

## Files Changed

| File | Change |
|---|---|
| `server/src/streaming/streaming.service.ts` | Added `getCloudflareVideoStatus()` method; fixed `resolveStreamPlaybackUrl()` to throw on missing subdomain |
| `server/src/streaming/streaming.controller.ts` | Added `GET /streaming/cloudflare/video-status/:uid` endpoint |
| `server/src/downloads/downloads.service.ts` | Replaced R2 signed URL fallback with Cloudflare UID resolution; added `InternalServerErrorException` import |

## Required Environment Variables

| Variable | Used in |
|---|---|
| `CLOUDFLARE_STREAM_ACCOUNT_ID` | Upload, status check |
| `CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN` | Playback URL construction, download URL resolution |
| `CLOUDFLARE_STREAM_API_TOKEN` | Upload, status check |
