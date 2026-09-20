# Preview Access Implementation

This document describes the preview access funnel used by the `watch-2` player.

## Product flow

The access sequence is:

```text
Guest
  └─ 3 previews × 45 seconds
       └─ Create a free account
            └─ Free allowance (currently configured as 180 seconds / 3 minutes)
                 └─ Existing paid plans through Stripe Checkout
```

The preview popup is rendered by `frontend/src/components/content/FigmaVideoPlayer.tsx`.
It is fixed over the page, bottom-aligned on mobile, centered on desktop, and uses a dark premium card layout. When a limit is reached, the video controls are removed and the video area becomes blurred. The final guest-limit and free-allowance popups cannot be dismissed.

## Guest previews

Guest access is tracked server-side using a hashed combination of:

- Client IP address
- `X-Device-Fingerprint` / submitted device fingerprint

The identity is HMAC-hashed in `server/src/preview/preview.service.ts`; the raw IP and fingerprint are not stored as the viewer identity.

Guest constants are defined in `server/src/preview/preview.service.ts`:

```ts
GUEST_PREVIEW_LIMIT = 3
GUEST_PREVIEW_SECONDS = 45
```

The frontend mirrors the 45-second display and playback gate in `FigmaVideoPlayer.tsx`.

### Guest API

| Method | Endpoint | Purpose | Authentication |
| --- | --- | --- | --- |
| `POST` | `/preview/sessions` | Start a guest preview session | Public |
| `PATCH` | `/preview/sessions/:id` | Record watched seconds and complete a session | Public, fingerprint required |

`POST /preview/sessions` returns the session ID, preview count, remaining preview count, maximum seconds, and playback metadata.

## Free accounts

The preview popup creates a free account through:

```text
POST /preview/signup
```

The account is signed in immediately with access and refresh tokens. Email verification remains a later account step.

Each free account has one `PreviewAllowance` record:

```prisma
model PreviewAllowance {
  userId          String @unique
  totalSeconds    Int    @default(180)
  consumedSeconds Int    @default(0)
}
```

The current schema default is 180 seconds for testing/launch configuration. If the allowance is changed, update the schema, migration strategy, generated Prisma client, and mock frontend value together. Existing allowance rows are not changed by editing the Prisma default; they must be updated or recreated separately.

### Free playback API

| Method | Endpoint | Purpose | Authentication |
| --- | --- | --- | --- |
| `POST` | `/preview/free-sessions` | Check allowance and obtain playback metadata | User token |
| `PATCH` | `/preview/free-allowance` | Consume watched seconds | User token |

The player reports accumulated playback time approximately every 10 seconds and when playback state changes. The server caps consumption at the allowance total and returns the updated `remainingSeconds` value.

## Free catalog

Admins can mark content as free catalog content with the `Content.isFreeCatalog` flag. The public catalog supports:

```text
GET /content?freeCatalog=true
```

Free catalog content is available to free users without consuming their allowance. The admin editor exposes the flag for content management.

## Paid access

Paid plans are loaded from the existing subscription API. The popup uses the selected plan ID and billing cycle when linking an authenticated user to:

```text
/subscription/payment-details?plan=<planId>&autostart=1&billingCycle=<monthly|yearly>
```

The payment-details page creates the Stripe-hosted Checkout session. Return URLs preserve the current `watch-2` content route so the user can return after checkout.

## Frontend services and types

The client integration is split into:

- `frontend/src/lib/services/preview.service.ts`
- `frontend/src/types/api/preview.types.ts`
- `frontend/src/components/content/FigmaVideoPlayer.tsx`

The service handles guest sessions, session completion, free signup, free allowance checks, and allowance consumption. Playback URLs returned by the preview API are converted to the player’s HLS or MP4 format.

## Database and deployment

Preview tables are introduced by the preview migration in:

```text
server/prisma/migrations/20260918090000_add_preview_sessions/
```

The free catalog field is introduced by:

```text
server/prisma/migrations/20260918093000_add_free_catalog_content/
```

Production deployment must use existing migrations only:

```bash
cd server
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

Do not use `prisma migrate dev`, `prisma db push`, or `prisma migrate reset` against production. Before deploying, run `npx prisma migrate status` and resolve any migration history mismatch rather than forcing the migration.

Required production configuration includes:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `PREVIEW_IDENTITY_SECRET` (recommended dedicated HMAC secret)
- Cloudflare Stream variables used by the streaming service
- Frontend API and app URLs

## Operational limitations

The preview API controls the intended `watch-2` flow, but the legacy public guest playback endpoint may still be directly callable if it remains enabled in the streaming module. Strong media enforcement requires signed Cloudflare Stream URLs or equivalent server-side authorization at the playback endpoint.

Preview identity uses IP plus device fingerprinting, so the privacy policy and retention expectations should cover this behavior.

## Verification checklist

- Guest receives three preview sessions total.
- Each guest session stops at 45 seconds.
- The final guest popup has no close button.
- A guest can create a free account from the popup and resume playback.
- Free allowance starts at the configured `totalSeconds` value.
- Free playback consumption updates over time and stops at zero.
- Free catalog content does not consume the allowance.
- Paid plan links contain a valid plan ID and billing cycle.
- Stripe Checkout returns to the original watch route.
- Production builds contain no preview test monitor, reset controls, or debug logs.
