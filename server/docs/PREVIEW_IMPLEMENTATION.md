# Backend Preview Implementation

This document describes the backend implementation for the `watch-2` preview funnel.

## Access flow

```text
Guest → 3 preview sessions × 45 seconds
      → Free account signup and immediate authentication
      → One-time free allowance
      → Paid subscription through the existing Stripe Checkout flow
```

The preview backend is implemented in `server/src/preview` and registered through `PreviewModule` in `server/src/app.module.ts`.

## Module structure

| File | Responsibility |
| --- | --- |
| `preview.module.ts` | Imports Prisma, streaming, and auth dependencies |
| `preview.controller.ts` | Defines public and authenticated preview endpoints |
| `preview.service.ts` | Enforces limits, creates sessions, and consumes allowance |
| `dto/create-preview-session.dto.ts` | Validates guest session requests |
| `dto/complete-preview-session.dto.ts` | Validates watched seconds |
| `dto/create-preview-signup.dto.ts` | Validates free-account signup |
| `dto/start-free-preview.dto.ts` | Validates authenticated preview requests |
| `dto/consume-free-preview.dto.ts` | Validates allowance consumption |

## Guest preview rules

The constants are defined in `src/preview/preview.service.ts`:

```ts
GUEST_PREVIEW_LIMIT = 3
GUEST_PREVIEW_SECONDS = 45
```

Guest identity is derived from the client IP and device fingerprint. The combined value is HMAC-SHA256 hashed before it is stored. The secret is selected in this order:

1. `PREVIEW_IDENTITY_SECRET`
2. `JWT_ACCESS_SECRET`
3. `JWT_SECRET`
4. Development fallback

Use a dedicated `PREVIEW_IDENTITY_SECRET` in production.

When a guest starts a session, the service:

1. Upserts the `PreviewViewer` by identity hash.
2. Counts the viewer’s previous `PreviewSession` records.
3. Denies the request when the count is three or higher.
4. Gets playback metadata from `StreamingService`.
5. Creates a new session and returns its playback metadata.

The count is server-side and does not depend on browser local storage.

## API endpoints

### Start a guest preview

```http
POST /preview/sessions
Content-Type: application/json

{
  "episodeId": "episode-id",
  "deviceFingerprint": "browser-device-fingerprint"
}
```

Successful responses include `sessionId`, `previewsUsed`, `previewsRemaining`, `maxSeconds`, and playback metadata. When the limit is reached, the response contains `allowed: false` and no new session ID.

### Complete a guest preview

```http
PATCH /preview/sessions/:sessionId
Content-Type: application/json
X-Device-Fingerprint: browser-device-fingerprint

{
  "watchedSeconds": 45
}
```

The server caps watched time at 45 seconds and only updates a session belonging to the matching hashed guest identity.

### Create a free account

```http
POST /preview/signup
Content-Type: application/json

{
  "name": "Viewer",
  "email": "viewer@example.com",
  "password": "at-least-eight-characters"
}
```

The auth service creates the user, creates the free-plan subscription when configured, creates the preview allowance, sends verification email on a best-effort basis, and returns access and refresh tokens. The account can begin playback immediately; email verification remains a later account action.

### Start authenticated free preview

```http
POST /preview/free-sessions
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "episodeId": "episode-id"
}
```

The service verifies that the episode belongs to published content. Free-catalog content is allowed without consuming the user allowance. Other content is allowed only while the user has remaining seconds.

### Consume free allowance

```http
PATCH /preview/free-allowance
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "seconds": 10
}
```

The service caps consumption at the allowance total and returns the updated `remainingSeconds` value.

## Database models

The preview schema is in `prisma/schema.prisma`.

### `PreviewViewer`

Stores the HMAC identity hash for a guest browser identity. One viewer can have multiple preview sessions.

### `PreviewSession`

Stores each guest preview attempt, including:

- Viewer ID
- Episode ID
- Preview number
- Watched seconds
- Completion timestamp
- Created/updated timestamps

### `PreviewAllowance`

Stores the one-time authenticated free allowance:

```prisma
totalSeconds    Int @default(180)
consumedSeconds Int @default(0)
```

The current schema default is 180 seconds (3 minutes). Editing a Prisma default does not update existing rows. Existing accounts keep their stored `totalSeconds` and `consumedSeconds` values unless they are explicitly updated.

## Free catalog

`Content.isFreeCatalog` marks content that free users can watch without consuming their allowance.

The public content endpoint supports:

```http
GET /content?freeCatalog=true
```

The field is managed through the admin content create/update DTOs and admin editor.

## Migrations

Preview database changes are introduced by:

```text
prisma/migrations/20260918090000_add_preview_sessions/
prisma/migrations/20260918093000_add_free_catalog_content/
```

Check migration state before deployment:

```bash
cd server
npx prisma migrate status
```

Apply existing production migrations with:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
```

Use `migrate dev` only to create development migrations. Do not use `db push` or `migrate reset` on production.

If Prisma reports migrations present in the database but missing locally, restore the missing migration directories and migration history first. Do not force or reset the production database.

## Configuration

Required backend configuration includes:

```text
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
PREVIEW_IDENTITY_SECRET
```

The streaming service also requires its Cloudflare Stream configuration. CORS must allow the deployed frontend origin, and the backend enables `X-Device-Fingerprint` as an allowed request header.

## Deployment

For Vercel, configure the project root as `server`. Use:

```text
Install command: npm ci
Build command: npm run build
```

Run migrations against the production PostgreSQL database before serving traffic. Configure production Stripe, Cloudflare Stream, email, JWT, CORS, and database variables in Vercel; do not commit `.env` files or secrets.

## Security and operational notes

- Preview counts are enforced by the backend, not only by the frontend.
- Raw IP addresses and device fingerprints are not stored as the guest identity.
- The legacy public guest playback endpoint must not be treated as sufficient enforcement by itself. Strong media protection should use signed Cloudflare Stream URLs or an equivalent authorization layer.
- IP/device fingerprinting should be reflected in the application privacy policy and retention policy.
- Guest start uses a count-then-create operation. If strict protection against simultaneous requests is required, add a database transaction/locking strategy or an atomic counter.
