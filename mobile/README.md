# Brixlore Mobile (Expo)

React Native mobile app for Brixlore — Expo + TypeScript + Expo Router. Dark theme only; colors match the web project.

## Run

```bash
cd mobile
npx expo start
```

Then scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `a` for Android emulator / `i` for iOS simulator.

## EAS Android Build (Firebase File)

This project supports Firebase config through an EAS file environment variable.

- Variable name: `GOOGLE_SERVICES_JSON`
- Type: `file`
- Environment: `development` (and any other profile you build with)

Create it from `mobile/`:

```bash
eas env:create development --name GOOGLE_SERVICES_JSON --type file --visibility sensitive --value ./google-services.json
```

The dynamic Expo config in `app.config.js` uses this value only from EAS env variables. If `GOOGLE_SERVICES_JSON` is missing, `android.googleServicesFile` is removed to avoid remote build failures.

## Play Store Payments (Android)

This app is wired for Android in-app subscriptions using RevenueCat + Google Play Billing.

Required public env variables for the mobile app build:

- `EXPO_PUBLIC_RC_ANDROID_API_KEY`:
  RevenueCat Android API key (starts with `goog_...`).
- `EXPO_PUBLIC_RC_ENTITLEMENT_ID`:
  RevenueCat entitlement to check after purchase (example: `premium`).
- `EXPO_PUBLIC_RC_PLAN_PACKAGE_MAP`:
  JSON map of backend plan IDs to RevenueCat package or product identifiers.

Example:

```env
EXPO_PUBLIC_RC_ANDROID_API_KEY=goog_xxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_RC_ENTITLEMENT_ID=premium
EXPO_PUBLIC_RC_PLAN_PACKAGE_MAP={"plan_monthly":"$rc_monthly","plan_yearly":"$rc_annual"}
```

Notes:

- Android uses Google Play billing flow from the app plans screen.
- Non-Android keeps using the existing billing portal endpoint.
- Use an EAS Development Build or production build for testing purchases; Expo Go does not support billing SDK native flows.

## Stack

- **Expo** (SDK 54) + **Expo Router** (file-based routing)
- **TypeScript**
- **Zustand** (state)
- **Axios** (API)
- **React Native Safe Area Context** + **React Native Screens**

## Folder structure

- `app/` — Expo Router routes and layouts (tabs: Home, Explore, Scenes, Live TV, My Stuff)
- `components/` — Reusable UI (Card, VideoThumbnail, SectionCard)
- `screens/` — Screen components (e.g. HomeScreen)
- `services/` — API client (Axios)
- `store/` — Zustand stores (e.g. useAuthStore)
- `constants/` — Theme (colors from web), spacing, typography
- `context/` — DarkThemeProvider
- `hooks/` — Custom hooks (e.g. useContinueWatching)
- `assets/` — Images, fonts

## Theme

Colors are taken from the Brixlore web app (`frontend/src/app/globals.css`):

- Background: `#0b0b0e`
- Foreground: `#f5f7fb`
- Accent: `#e5e7eb`
- Accent foreground: `#0b0b0e`

Dark theme only; no light theme.
