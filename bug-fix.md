# Bug Fix Log

## 2026-05-26 - Admin upload hit localhost:5000 on live

**Issue**
- Admin content upload on the live setup was still trying to reach a localhost API URL.
- This showed up as a network failure during upload even though the Vercel environment variables were configured.

**Root cause**
- The frontend API resolver in `frontend/src/lib/env.ts` had a hardcoded fallback to `http://localhost:5000` when `NEXT_PUBLIC_API_BASE_URL` was missing during server-side evaluation.
- The upload page error copy also mentioned localhost directly, which made the live issue look like a local-dev requirement.

**Fix**
- Removed the localhost fallback from `getApiBaseUrl()`.
- Kept browser-side same-origin fallback only when running in the browser.
- Updated the admin upload network error message to be environment-agnostic.

**Files changed**
- `frontend/src/lib/env.ts`
- `frontend/src/app/(admin)/admin/content/upload/page.tsx`

**Notes**
- Live deployments should always provide `NEXT_PUBLIC_API_BASE_URL` explicitly.
- If this variable is missing in production, the app should now fail clearly instead of silently targeting localhost.

## 2026-05-26 - Cloudflare Stream uploads stuck in pending

**Issue**
- Admin uploads created Cloudflare Stream entries, but videos stayed in `Pending Upload`.
- UI showed network failure even for small files.

**Root cause**
- Frontend direct-upload request used `PUT` with raw body.
- Cloudflare Stream direct upload URL expects `POST` with `multipart/form-data` (`file` field).
- Backend logs also showed production-origin CORS denials, which could fail follow-up admin API calls.

**Fix**
- Switched Cloudflare direct upload client to `POST` using `FormData` in `frontend/src/lib/multipart-upload.ts`.
- Restored strict CORS allowlist logic in `server/src/main.ts` with explicit production domains and optional `*.vercel.app` preview allowance.

**Files changed**
- `frontend/src/lib/multipart-upload.ts`
- `server/src/main.ts`