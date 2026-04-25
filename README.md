# Brixlore

A full-stack subscription content platform consisting of three parts:

- **`server/`** — NestJS REST API with Prisma ORM (PostgreSQL)
- **`frontend/`** — Next.js 14 web app (admin dashboard + user-facing site)
- **`mobile/`** — React Native / Expo app for iOS & Android

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone & Install](#1-clone--install)
  - [2. Environment Variables](#2-environment-variables)
  - [3. Database Setup](#3-database-setup)
  - [4. Running the Server](#4-running-the-server)
  - [5. Running the Frontend](#5-running-the-frontend)
  - [6. Running the Mobile App](#6-running-the-mobile-app)
- [Environment Variable Reference](#environment-variable-reference)
  - [Server (.env)](#server-env)
  - [Frontend (.env.local)](#frontend-envlocal)
  - [Mobile (.env)](#mobile-env)
- [Database Commands](#database-commands)
- [Project Structure](#project-structure)

---

## Architecture Overview

```
brixlore/
├── server/      # NestJS API — runs on port 5000 by default
├── frontend/    # Next.js web — runs on port 3000 by default
└── mobile/      # Expo React Native app
```

The server is the single source of truth. Both the frontend and mobile app communicate with it over HTTP/REST. Storage is handled via **Cloudflare R2** (S3-compatible). Payments are processed through **Stripe**. Video streaming uses HLS and ffmpeg for transcoding.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | Required for all three packages |
| npm | 9+ | Comes with Node.js |
| PostgreSQL | 14+ | Required by the server |
| ffmpeg + ffprobe | Any recent | Required for video transcoding |
| Expo CLI | Latest | For the mobile app (`npm install -g expo-cli`) |

---

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd brixlore

# Install server dependencies
cd server && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install mobile dependencies
cd mobile && npm install && cd ..
```

### 2. Environment Variables

Each package needs its own environment file. See the [Environment Variable Reference](#environment-variable-reference) below for all required values.

```bash
# Server
cp server/.env.example server/.env        # then fill in values
# (or create server/.env from scratch using the reference below)

# Frontend
cp frontend/.env.example frontend/.env.local

# Mobile
cp mobile/.env.example mobile/.env
```

### 3. Database Setup

Make sure PostgreSQL is running and your `DATABASE_URL` is set in `server/.env`, then run:

```bash
cd server

# Apply all migrations
npm run db:migrate

# (Optional) Seed the database with initial data
npm run db:seed

# (Optional) Create an admin user locally
npx ts-node prisma/create-admin-local.ts
```

### 4. Running the Server

```bash
cd server

# Development (with hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:5000`.

### 5. Running the Frontend

```bash
cd frontend

# Development
npm run dev

# Production build
npm run build
npm run start
```

The web app will be available at `http://localhost:3000`.

### 6. Running the Mobile App

```bash
cd mobile

# Start Expo dev server
npm run start

# Or start with tunnel (for physical devices on a different network)
npm run start:tunnel

# Platform-specific
npm run android   # Requires Android SDK / emulator
npm run ios       # Requires Xcode (macOS only)
```

Scan the QR code with the **Expo Go** app on your device, or press `a`/`i` in the terminal to open an emulator.

---

## Environment Variable Reference

### Server (`server/.env`)

```env
# ── Database ──────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/brixlore

# ── Server ────────────────────────────────────────────────────────────────
PORT=5000
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000         # Comma-separated for multiple origins

# ── JWT Auth ──────────────────────────────────────────────────────────────
JWT_SECRET=your-jwt-secret
JWT_ACCESS_SECRET=your-access-secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES=7d

# ── Stripe ────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_TRIAL_DAYS=7

# ── Email (SMTP) ──────────────────────────────────────────────────────────
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false                         # true for port 465
SMTP_USER=you@example.com
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@example.com
SUPPORT_FROM_NAME=Support
SUPPORT_REPLY_TO=support@example.com

# ── Cloudflare R2 Storage ─────────────────────────────────────────────────
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_REGION=auto
R2_PUBLIC_BASE_URL=https://pub-<hash>.r2.dev

# ── Streaming / ffmpeg ────────────────────────────────────────────────────
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe
FFMPEG_CRF=23
FFMPEG_PRESET=fast
FFMPEG_THREADS=0                          # 0 = auto-detect
STREAMING_SIGNATURE_SECRET=your-stream-secret

# ── Downloads ─────────────────────────────────────────────────────────────
DOWNLOAD_TOKEN_SECRET=your-download-secret
DOWNLOAD_TOKEN_EXPIRES=3600               # seconds
DOWNLOAD_EXPIRES_DAYS=30
DOWNLOAD_JOBS_BATCH_SIZE=10
DOWNLOAD_JOBS_RETENTION_DAYS=7
```

### Frontend (`frontend/.env.local`)

```env
# Required
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Cloudflare R2 worker base URL (for media delivery)
NEXT_PUBLIC_R2_WORKER_BASE_URL=https://your-r2-worker.example.com

# Optional / feature flags
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_ADMIN_VIDEO_UPLOAD_STRATEGY=r2   # or "server"
NEXT_PUBLIC_ENABLE_LEGACY_VIDEO_UPLOAD_TOGGLE=false
NEXT_PUBLIC_ANDROID_APK_URL=https://example.com/app.apk
```

### Mobile (`mobile/.env`)

```env
# API
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_R2_WORKER_BASE_URL=https://your-r2-worker.example.com

# Expo project (from expo.dev)
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id

# RevenueCat (in-app purchases)
EXPO_PUBLIC_RC_ANDROID_API_KEY=your-rc-android-key
EXPO_PUBLIC_RC_ENTITLEMENT_ID=premium
EXPO_PUBLIC_RC_PLAN_PACKAGE_MAP={"monthly":"$rc_monthly","yearly":"$rc_annual"}
```

---

## Database Commands

Run these from inside the `server/` directory.

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Apply all pending migrations (production-safe) |
| `npm run db:migrate:dev` | Create and apply a new migration (development) |
| `npm run db:push` | Push schema changes without creating a migration file |
| `npm run db:seed` | Seed the database with initial data |
| `npm run db:reset` | Drop and re-create the database, then re-seed |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) at localhost:5555 |

---

## Project Structure

```
brixlore/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── migrations/          # Migration history
│   │   └── seed.ts              # Seed script
│   └── src/
│       ├── admin/               # Admin-only endpoints
│       ├── auth/                # JWT auth, guards, strategies
│       ├── content/             # Content management (videos, episodes, etc.)
│       ├── devices/             # Device registration
│       ├── downloads/           # Offline download management
│       ├── jobs/                # Background/scheduled jobs
│       ├── mail/                # Email service
│       ├── notifications/       # Push notifications
│       ├── prisma/              # Prisma service wrapper
│       ├── site/                # Public site settings
│       ├── storage/             # R2 / S3 storage service
│       ├── streaming/           # HLS video streaming
│       ├── subscriptions/       # Stripe subscription management
│       └── users/               # User profiles & preferences
│
├── frontend/
│   └── src/
│       └── app/
│           ├── (admin)/         # Admin dashboard (route group)
│           ├── (auth)/          # Auth pages: login, register, reset password
│           └── (main)/          # Public & subscriber-facing pages
│
└── mobile/
    ├── app/                     # Expo Router file-based routes
    ├── components/              # Reusable UI components
    ├── context/ & contexts/     # React contexts
    ├── hooks/                   # Custom hooks
    ├── screens/                 # Screen components
    ├── services/                # API service layer
    ├── store/                   # Zustand state stores
    └── utils/                   # Utility helpers
```
