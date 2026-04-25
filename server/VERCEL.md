# Deploying the backend to Vercel

If you get **500 INTERNAL_SERVER_ERROR** or **FUNCTION_INVOCATION_FAILED** when visiting the backend URL, check the following.

## 1. Root Directory

If your repo has both `frontend/` and `server/` at the root:

- In Vercel → Project Settings → **Root Directory** set to **`server`**.
- Leave it empty only if the Vercel project’s repo root **is** the Nest app (e.g. you deployed from a repo that contains only the server).

## 2. Environment variables

In Vercel → Project Settings → **Environment Variables**, add at least:

| Variable             | Required    | Notes                                                              |
| -------------------- | ----------- | ------------------------------------------------------------------ |
| `DATABASE_URL`       | Yes         | PostgreSQL connection string (e.g. Neon, Supabase, Railway).       |
| `JWT_ACCESS_SECRET`  | Yes         | Min 32 characters.                                                 |
| `JWT_REFRESH_SECRET` | Yes         | Min 32 characters.                                                 |
| `FRONTEND_URL`       | Yes         | Your frontend URL, e.g. `https://brick-tales-web-j89i.vercel.app`. |
| `CORS_ORIGIN`        | Recommended | Same as `FRONTEND_URL` or comma-separated origins.                 |

**Important:** `DATABASE_URL` must point to a **cloud** PostgreSQL instance (e.g. Neon, Supabase, Railway). Do not use `localhost` — the Vercel runtime cannot reach your machine.

### Using Neon (PostgreSQL)

1. Create a project at [Neon Console](https://console.neon.tech).
2. In the project, open **Connection string** and choose **Pooled connection** (recommended for serverless; host ends with `-pooler`).
3. Copy the URL (it includes `?sslmode=require`). Set it as `DATABASE_URL` in Vercel and in your local `.env` when running migrations.
4. Run migrations with that same URL: `npx prisma migrate deploy` (see section 3 below).

Optional but useful: `SMTP_*` (for password reset emails), `STRIPE_*` (for subscriptions).

## 3. Database migrations

Run migrations against the **production** database before or after deploy.

**PowerShell (Windows):**

```powershell
cd server
$env:DATABASE_URL = "postgresql://USER:PASSWORD@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require"
npx prisma migrate deploy
```

Run the two commands **separately** (set env, then run migrate). Or one line: `$env:DATABASE_URL = "postgresql://..."; npx prisma migrate deploy`

**Bash (Linux / macOS / Git Bash):**

```bash
cd server
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require" npx prisma migrate deploy
```

You can do this locally with the production `DATABASE_URL`, or in CI.

## 4. Check function logs

In Vercel → Project → **Deployments** → select the deployment → **Functions** → open the failed function and check **Logs**. The real error (e.g. missing env, Prisma, connection) will appear there.

## 5. Alternative: use a Node-friendly host

NestJS + Prisma work well on Vercel with zero-config, but if you keep hitting limits (cold starts, DB connections, Stripe webhooks), consider a host that runs a long-lived Node server:

- **Railway** – simple, supports PostgreSQL and env vars.
- **Render** – free tier, “Web Service” for Node.
- **Fly.io** – good for full-stack apps.

These don’t require serverless adapters; you keep using `nest start` or `node dist/main`.
