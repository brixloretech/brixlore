# Mobile Video Player UI — Feature Parity Plan

> **Context:** The web app uses **Video.js** with a fully custom UI layer.  
> The mobile app uses **expo-video ^3.0.16** (`useVideoPlayer` + `<VideoView>`).  
> This document maps every web player feature to its mobile equivalent, identifies gaps,  
> and provides an implementation plan for each gap.

**Two screens are in scope:**

| Screen | File | Purpose |
|---|---|---|
| Main watch screen | `mobile/app/video/[id].tsx` | Streaming — HLS from Cloudflare Stream, ads, episodes |
| Offline player | `mobile/screens/VideoPlayerScreen.tsx` | Downloaded content, no ads |

---

## 1. Web Player Feature Inventory

Features implemented in the web Video.js player (`frontend/src/app/(public)/watch/[id]/WatchPageClient.tsx`):

### Core Playback
| Feature | Description |
|---|---|
| HLS + MP4 playback | Adaptive streaming via hls.js inside Video.js |
| Adaptive quality control | Custom quality selector: Auto + available renditions (360p / 720p / 1080p) |
| Quality menu behavior | Hover/open state, active rendition highlighted |
| Play / Pause button | Center overlay button |
| Volume control | Volume slider (0–100%) |
| Mute toggle | Speaker icon click |
| Playback time | Elapsed / total (e.g. `1:20 / 2:30`) |
| Playback speed | 0.5× / 1× / 1.25× / 1.5× / 2× cycle |
| Full screen mode | Browser Fullscreen API |
| Picture-in-Picture | Browser PiP API |
| Responsive on mobile (web) | Controls adapt to small viewport |

### Gestures & Keyboard
| Feature | Description |
|---|---|
| Keyboard ArrowLeft | Seek −10 s |
| Keyboard ArrowRight | Seek +10 s |
| Spacebar | Play / Pause toggle |
| Mobile double-tap left | Rewind −10 s |
| Mobile double-tap right | Fast-forward +10 s |
| Desktop double-click sides | Side-click seek |
| YouTube-style seek feedback | Accumulating overlay (+10 → +20 → +30 on repeated taps) |

### Ad UI Layer
| Feature | Description |
|---|---|
| Ad badge by slot | Shows **Pre-roll / Mid-roll / Post-roll** label |
| Ad progress bar | Progress bar specific to the ad clip |
| Ad mute button | Mute/unmute the ad audio |
| Skip countdown | "Skip in 5s" countdown |
| Skip button | "Skip Ad ›" when countdown reaches 0 |
| "Learn More" CTA | Opens click-through URL in new tab |
| Ad skip event hook | Fires analytics event on skip |
| Ad play/resume | Ad plays before content, resumes content after |

---

## 2. Current Mobile Implementation Status

### `app/video/[id].tsx` — Main Watch Screen

| Feature | Status | Notes |
|---|---|---|
| HLS playback | ✅ Done | expo-video + Cloudflare Stream HLS URL |
| Play / Pause button | ✅ Done | Center overlay |
| Mute toggle | ✅ Done | `isMuted` state → `player.muted` |
| Playback time display | ✅ Done | `formatTime(currentTime) / formatTime(duration)` |
| Playback speed | ✅ Done | Cycles 0.5/1/1.25/1.5/2 via settings modal state |
| Fullscreen | ✅ Done | `expo-screen-orientation` + `videoViewRef.enterFullscreen()` |
| Landscape lock on fullscreen | ✅ Done | `ScreenOrientation.lockAsync(LANDSCAPE)` |
| Double-tap seek | ✅ Done | `handleDoubleTap` — left/right zones |
| Double-tap visual feedback | ✅ Done | `showDoubleTapFeedback` state — shows icon + "10s" |
| Hold-to-2× speed | ✅ Done | 500 ms long press → `playbackRate = 2` |
| Progress bar (tap-to-seek) | ✅ Done | `handleProgressBarPress` |
| Buffering indicator | ✅ Done | `isBuffering` from `statusChange` |
| Ad overlay (pre/mid/post) | ✅ Done | `AdOverlay` component + `useAdPlayer` hook |
| Ad badge | ✅ Done | "Ad" label in `AdOverlay` |
| Ad mute button | ✅ Done | `adMuted` state in `AdOverlay` |
| Ad skip countdown + button | ✅ Done | `skipCountdown` / `canSkip` in `AdOverlay` |
| "Learn More" CTA | ✅ Done | `Linking.openURL(clickThroughUrl)` |
| Ad skip analytics | ✅ Done | `onLearnMoreClick` → Matomo event |
| Matomo video tracking | ✅ Done | play / pause / resume / complete events |
| Background audio continuation | ✅ Done | `AppState` listener → `expo-audio` |
| Continue watching (progress save) | ✅ Done | `streamingService.reportProgress()` |
| **Quality selector UI** | ✅ Done | Settings modal wired to quality state and HLS URL rebuild with seek restore |
| **Volume slider** | ❌ Missing | Only mute toggle, no slider |
| **Seek thumb (draggable)** | ✅ Done | PanResponder drag + visual thumb on progress bar |
| **Double-tap accumulation** | ✅ Done | Accumulating feedback (+10 → +20 → +30) with reset window |
| **Ad progress bar** | ✅ Done | Ad timeUpdate + duration wired to thin progress bar |
| **Ad slot label** | ✅ Done | Badge now shows Pre-roll/Mid-roll/Post-roll |
| **Picture-in-Picture** | ✅ Done | PiP button + VideoView PiP start/stop callbacks wired |
| **Settings modal content** | ✅ Done | Modal rendered with speed and quality options |
| **Animated controls fade** | ✅ Done | Animated opacity with show/hide helpers and timeout fade-out |
| **Gradient overlay** | ✅ Done | Top and bottom LinearGradient bands added |
| **Back button in overlay** | ✅ Done | Back button added to top controls row with title + settings |

### `screens/VideoPlayerScreen.tsx` — Offline Player

| Feature | Status | Notes |
|---|---|---|
| Play / Pause | ✅ Done | Center button |
| Mute | ✅ Done | Pill button |
| Speed cycle | ✅ Done | Pill button |
| Skip −10 / +10 buttons | ✅ Done | Pill buttons |
| Progress bar (tap-to-seek) | ✅ Done | `handleSeek` on press |
| Fullscreen | ✅ Done | `videoViewRef.enterFullscreen()` |
| Back button | ✅ Done | Top-left arrow |
| Title | ✅ Done | Top bar |
| Offline badge | ✅ Done | "Offline" chip with cloud icon |
| Progress persistence | ✅ Done | AsyncStorage `video_progress_{videoId}` |
| Auto-hide controls | ✅ Done | 3 s timeout while playing |
| Error overlay + retry | ✅ Done | Replace source on retry |
| **Gradient overlay** | ✅ Done | Top/bottom gradient bands added to controls overlay |
| **Buffer bar** | ❌ Missing | No buffered-range indicator behind progress fill |
| **Draggable seek thumb** | ✅ Done | PanResponder seek drag + thumb indicator |
| **Double-tap seek** | ✅ Done | Left/center/right gesture zones wired |
| **Seek accumulation feedback** | ✅ Done | Feedback shows accumulated skip amount per side |
| **Animated controls fade** | ✅ Done | Controls overlay uses Animated opacity transitions |
| **Volume slider** | ❌ Missing | Only mute toggle |

---

## 2.1 UX Tuning Pass (May 31, 2026)

This pass focuses on interaction feel and accidental-tap reduction after the main feature parity implementation.

| Tune | Status | Applied to | Notes |
|---|---|---|---|
| Double-tap timing window | ✅ Done | Main + Offline | Uses `DOUBLE_TAP_WINDOW_MS = 320` for more reliable seek gestures |
| Accumulation reset window | ✅ Done | Main + Offline | Uses `TAP_ACCUMULATION_RESET_MS = 900` for clearer repeated-tap feedback |
| Side-tap delayed fallback | ✅ Done | Main + Offline | First side tap waits briefly for 2nd tap; only then falls back to showing controls |
| Drag-pan activation threshold | ✅ Done | Main + Offline | `onMoveShouldSetPanResponder` requires small movement threshold to reduce accidental drags |
| Timer cleanup hardening | ✅ Done | Main + Offline | Clears pending tap/accumulation timers in cleanup paths |

---

## 3. Gap Analysis — Feature-by-Feature Implementation Plan

---

### GAP 1: Quality Selector UI
**Applies to:** Main watch screen  
**Web equivalent:** Custom quality dropdown with Auto + 360p / 720p / 1080p renditions

**expo-video limitation:** expo-video does **not** expose HLS rendition switching directly. Cloudflare Stream automatically selects the best rendition based on network bandwidth (ABR). Manual quality switching would require switching the full HLS URL with a quality suffix.

**Cloudflare Stream quality URL format:**
```
https://{subdomain}/{uid}/manifest/video.m3u8         ← Auto (ABR)
https://{subdomain}/{uid}/manifest/video.m3u8?quality=360p
https://{subdomain}/{uid}/manifest/video.m3u8?quality=720p
https://{subdomain}/{uid}/manifest/video.m3u8?quality=1080p
```

**Implementation approach:**
1. In the Settings modal, add a "Quality" row with options: Auto / 360p / 720p / 1080p
2. Store selected quality in `qualityLevel` state (`"auto" | "360p" | "720p" | "1080p"`)
3. When quality changes, rebuild the HLS URL by appending `?quality={level}` and call `player.replace({ uri: newUrl })`
4. Seek back to the current position after the source replaces (use `player.seekBy(currentTime - player.currentTime)`)
5. Show active quality in the settings icon area (e.g., "720p" badge)

**Files to modify:** `app/video/[id].tsx` — add quality state, Settings modal UI, URL rebuild logic

---

### GAP 2: Volume Slider
**Applies to:** Both screens  
**Web equivalent:** Slider 0–100% with live volume label

**expo-video support:** `player.volume` is a number from `0` to `1`. Writable directly.

**Implementation approach:**
- Option A (simple): Use `@react-native-community/slider` (already available in many Expo projects) — a native slider component
- Option B (custom): Build a tap/drag progress-bar-style slider using `PanResponder` or `react-native-gesture-handler`
- Add a volume icon that shows a mini slider on press (like YouTube mobile — tap icon to see slider)
- Persist volume preference in `AsyncStorage` so it survives session

**Recommended:** Option A — `@react-native-community/slider` is lightweight and native. Install with `npx expo install @react-native-community/slider`.

**Files to modify:** Both `app/video/[id].tsx` and `screens/VideoPlayerScreen.tsx`

---

### GAP 3: Draggable Seek Thumb
**Applies to:** Both screens  
**Web equivalent:** HTML range input / Video.js progress bar drag

**expo-video support:** `player.seekBy(delta)` available at any time.

**Implementation approach (using PanResponder):**

```tsx
// Thumb drag state
const [isDragging, setIsDragging] = useState(false);
const [dragProgress, setDragProgress] = useState(0); // 0–1

const panResponder = PanResponder.create({
  onStartShouldSetPanResponder: () => true,
  onPanResponderGrant: (e) => {
    setIsDragging(true);
    const pct = e.nativeEvent.locationX / progressBarWidth;
    setDragProgress(Math.max(0, Math.min(1, pct)));
  },
  onPanResponderMove: (e) => {
    const pct = e.nativeEvent.locationX / progressBarWidth;
    setDragProgress(Math.max(0, Math.min(1, pct)));
  },
  onPanResponderRelease: () => {
    setIsDragging(false);
    handleSeek(dragProgress * duration);
  },
});

// Thumb visual
<View {...panResponder.panHandlers} style={styles.progressBarTouchArea}>
  <View style={styles.progressBar}>
    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
    {/* Thumb dot */}
    <View style={[styles.seekThumb, { left: `${(isDragging ? dragProgress : progress) * 100}%` }]} />
  </View>
</View>
```

While dragging: show the drag position instead of live `currentTime`, and pause updates from `timeUpdate` event (or ignore them when `isDragging === true`).

**Files to modify:** Both `app/video/[id].tsx` and `screens/VideoPlayerScreen.tsx`

---

### GAP 4: Double-Tap Seek Accumulation (YouTube-Style)
**Applies to:** Both screens  
**Web equivalent:** "+10s" → "+20s" → "+30s" when tapping repeatedly within a window; resets after ~800 ms idle

**Current mobile state:** The tap feedback shows a static "10s" label every time.

**Implementation approach:**

```tsx
// Track accumulated skip amount per side
const accumulatedSkipRef = useRef<{ side: "left" | "right"; amount: number; timer: ReturnType<typeof setTimeout> | null }>({
  side: "right",
  amount: 0,
  timer: null,
});

const ACCUMULATION_WINDOW_MS = 800;

const handleDoubleTap = useCallback((side: "left" | "right") => {
  const acc = accumulatedSkipRef.current;

  // Clear existing timer
  if (acc.timer) clearTimeout(acc.timer);

  // Same side as before — accumulate
  const newAmount = acc.side === side ? acc.amount + 10 : 10;
  accumulatedSkipRef.current = {
    side,
    amount: newAmount,
    timer: setTimeout(() => {
      // Reset accumulation after window expires
      accumulatedSkipRef.current = { side, amount: 0, timer: null };
    }, ACCUMULATION_WINDOW_MS),
  };

  // Apply incremental skip (always +10 per tap, accumulated label is cosmetic)
  handleSkip(side === "right" ? 10 : -10);

  // Show accumulated label
  setDoubleTapFeedback({ side, amount: newAmount });
  setTimeout(() => setDoubleTapFeedback(null), ACCUMULATION_WINDOW_MS);
}, [handleSkip]);
```

Feedback UI shows `+${amount}s` or `-${amount}s` centered on the tapped half.

**Files to modify:** Both `app/video/[id].tsx` and `screens/VideoPlayerScreen.tsx`

---

### GAP 5: Ad Progress Bar
**Applies to:** `AdOverlay.tsx`  
**Web equivalent:** A thin progress bar at the bottom of the ad showing how far through the ad clip you are

**Implementation approach:**

`AdOverlay` already has its own `adVideoPlayer`. Add `useEvent` to listen to `timeUpdate`:

```tsx
const [adDuration, setAdDuration] = useState(0);
const { currentTime: adCurrentTime } = useEvent(adVideoPlayer, "timeUpdate", {
  currentTime: adVideoPlayer.currentTime,
  bufferedPosition: adVideoPlayer.bufferedPosition,
  currentLiveTimestamp: null,
  currentOffsetFromLive: null,
});

// Capture duration on ready
useEventListener(adVideoPlayer, "statusChange", ({ status }) => {
  if (status === "readyToPlay") {
    const d = adVideoPlayer.duration;
    if (d > 0) setAdDuration(d);
    setIsBuffering(false);
  }
});

// Progress bar in JSX
const adProgress = adDuration > 0 ? (adCurrentTime / adDuration) * 100 : 0;

<View style={styles.adProgressBarTrack}>
  <View style={[styles.adProgressBarFill, { width: `${adProgress}%` }]} />
</View>
```

Position the progress bar above the bottom gradient bar (between the video and the skip/mute row).

**Files to modify:** `components/AdOverlay.tsx`

---

### GAP 6: Ad Slot Label (Pre-roll / Mid-roll / Post-roll)
**Applies to:** `AdOverlay.tsx`  
**Web equivalent:** Badge shows "Pre-roll Ad" / "Mid-roll Ad" / "Post-roll Ad" instead of just "Ad"

**Current state:** Badge always shows "Ad".

**Implementation approach:**

The `AdOverlay` already receives the slot from `useAdPlayer`. The `AdOverlayState` type needs a `slot` field (it may already have it via `adSystem.adOverlay.slot`).

In `AdOverlay.tsx`:
```tsx
// Props already include slot via AdOverlayState spread
const slotLabel = slot === "pre-roll" ? "Pre-roll" : slot === "mid-roll" ? "Mid-roll" : "Post-roll";

// Badge text
<Text style={styles.adBadgeText}>{slotLabel} Ad</Text>
```

Check that `AdOverlayState` includes `slot: string`. If not, add it to the type in `hooks/useAdPlayer.ts`.

**Files to modify:** `components/AdOverlay.tsx`, optionally `hooks/useAdPlayer.ts`

---

### GAP 7: Picture-in-Picture (PiP)
**Applies to:** Main watch screen  
**Web equivalent:** Browser PiP API button in controls

**expo-video support:** `VideoView` exposes `startPictureInPicture()` and `stopPictureInPicture()` on the ref. Supported on iOS 14+ and Android 8+.

**Implementation approach:**

```tsx
// In controls overlay — add PiP button next to fullscreen
<Pressable
  style={styles.controlIcon}
  onPress={() => {
    if (videoViewRef.current) {
      videoViewRef.current.startPictureInPicture();
    }
  }}
>
  <Ionicons name="albums-outline" size={22} color={themeColors.textPrimary} />
</Pressable>
```

Handle PiP state changes:
```tsx
<VideoView
  ...
  onPictureInPictureStart={() => setIsPiP(true)}
  onPictureInPictureStop={() => setIsPiP(false)}
/>
```

**Note:** PiP on Android requires adding `android:supportsPictureInPicture="true"` to `AndroidManifest.xml` and enabling it in `app.config.js`. Expo managed workflow handles this via the `expo-video` config plugin.

**Files to modify:** `app/video/[id].tsx`, `app.config.js` (add PiP permission if needed)

---

### GAP 8: Settings Modal (Speed + Quality)
**Applies to:** Main watch screen  
**Web equivalent:** Quality selector + speed selector in Video.js custom UI

**Current state:** `showSettingsModal` state exists, gear icon opens it, but no `<Modal>` is rendered.

**Implementation approach:**

```tsx
{/* Settings Modal */}
<Modal
  visible={showSettingsModal}
  transparent
  animationType="slide"
  onRequestClose={() => setShowSettingsModal(false)}
>
  <Pressable style={styles.modalBackdrop} onPress={() => setShowSettingsModal(false)}>
    <View style={styles.settingsSheet}>
      {/* Playback Speed */}
      <Text style={styles.settingsSectionTitle}>Playback Speed</Text>
      {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
        <Pressable key={rate} style={styles.settingsRow} onPress={() => { setPlaybackRate(rate); setShowSettingsModal(false); }}>
          <Text style={[styles.settingsOption, playbackRate === rate && styles.settingsOptionActive]}>
            {rate === 1 ? "Normal" : `${rate}×`}
          </Text>
          {playbackRate === rate && <Ionicons name="checkmark" size={18} color={themeColors.accent} />}
        </Pressable>
      ))}

      {/* Quality */}
      <Text style={styles.settingsSectionTitle}>Quality</Text>
      {(["auto", "360p", "720p", "1080p"] as const).map((q) => (
        <Pressable key={q} style={styles.settingsRow} onPress={() => { setQualityLevel(q); setShowSettingsModal(false); }}>
          <Text style={[styles.settingsOption, qualityLevel === q && styles.settingsOptionActive]}>
            {q === "auto" ? "Auto" : q}
          </Text>
          {qualityLevel === q && <Ionicons name="checkmark" size={18} color={themeColors.accent} />}
        </Pressable>
      ))}
    </View>
  </Pressable>
</Modal>
```

**Files to modify:** `app/video/[id].tsx`

---

### GAP 9: Animated Controls Fade
**Applies to:** Both screens  
**Web equivalent:** Controls overlay fades in/out instead of instant show/hide

**Implementation approach using `Animated`:**

```tsx
const controlsOpacity = useRef(new Animated.Value(1)).current;

// Animate in
const showControlsAnimated = () => {
  setShowControls(true);
  Animated.timing(controlsOpacity, {
    toValue: 1,
    duration: 200,
    useNativeDriver: true,
  }).start();
};

// Animate out
const hideControlsAnimated = () => {
  Animated.timing(controlsOpacity, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  }).start(() => setShowControls(false));
};

// JSX: replace <View style={styles.controlsOverlay}> with:
<Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
  {/* controls */}
</Animated.View>
```

Trigger `hideControlsAnimated()` instead of `setShowControls(false)` in the auto-hide timeout.

**Files to modify:** Both `app/video/[id].tsx` and `screens/VideoPlayerScreen.tsx`

---

### GAP 10: Gradient Overlay
**Applies to:** Both screens (main watch has `LinearGradient` import already; offline player does not)  
**Web equivalent:** Top and bottom gradient bands so controls are readable over any video content

**Implementation approach:**

Replace the flat `rgba(0,0,0,0.3)` controls overlay background with a `LinearGradient`:

```tsx
// Top gradient (for back button / title area)
<LinearGradient
  colors={['rgba(0,0,0,0.75)', 'transparent']}
  style={styles.topGradient}
  pointerEvents="none"
/>

// Bottom gradient (for progress bar / time / controls)
<LinearGradient
  colors={['transparent', 'rgba(0,0,0,0.85)']}
  style={styles.bottomGradient}
  pointerEvents="none"
/>
```

The center area becomes fully transparent — no dark tint between the gradients.  
`expo-linear-gradient` is already installed in the mobile project.

**Files to modify:**
- `app/video/[id].tsx` — already imports `LinearGradient`, just replace overlay style
- `screens/VideoPlayerScreen.tsx` — add `import { LinearGradient } from 'expo-linear-gradient'`, add gradient overlay

---

### GAP 11: Back Button in Main Watch Screen Player Controls
**Applies to:** Main watch screen  
**Web equivalent:** Back/close button in top-left of the player overlay

**Current state:** The main watch screen has no back button in the video overlay (user relies on device back gesture). The offline `VideoPlayerScreen` does have a back button.

**Implementation approach:**

Add to the top-right controls section (or a separate top-left section):

```tsx
{/* Top controls */}
<View style={styles.topControls}>
  {/* Back button */}
  <Pressable style={styles.controlIcon} onPress={() => router.back()}>
    <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
  </Pressable>

  {/* Episode title */}
  <Text style={styles.overlayTitle} numberOfLines={1}>
    {primaryEpisode?.title ?? content?.title ?? ''}
  </Text>

  {/* Settings gear */}
  <Pressable style={styles.controlIcon} onPress={() => setShowSettingsModal(true)}>
    <Ionicons name="settings-outline" size={24} color={themeColors.textPrimary} />
  </Pressable>
</View>
```

**Files to modify:** `app/video/[id].tsx`

---

## 4. Priority & Effort Summary

| # | Feature | Screen | Priority | Effort |
|---|---|---|---|---|
| 6 | Ad slot label (Pre-roll / Mid-roll / Post-roll) | AdOverlay | 🔴 High | XS — 5 min |
| 5 | Ad progress bar | AdOverlay | 🔴 High | S — 30 min |
| 11 | Back button in player overlay | Main watch | 🔴 High | XS — 10 min |
| 10 | Gradient overlay (both players) | Both | 🟠 Medium | S — 30 min |
| 9 | Animated controls fade | Both | 🟠 Medium | M — 1 h |
| 4 | Double-tap accumulation feedback | Both | 🟠 Medium | S — 30 min |
| 8 | Settings modal (speed + quality) | Main watch | 🟠 Medium | M — 1–2 h |
| 1 | Quality selector (Cloudflare UID rebuild) | Main watch | 🟠 Medium | M — 1–2 h |
| 3 | Draggable seek thumb | Both | 🟡 Low-Medium | M — 1–2 h |
| 2 | Volume slider | Both | 🟡 Low | M — 1 h |
| 7 | Picture-in-Picture | Main watch | 🟡 Low | S — 45 min |

---

## 5. Features Not Applicable on Mobile

| Web Feature | Reason Not Applicable |
|---|---|
| Keyboard ArrowLeft / ArrowRight / Spacebar | Physical keyboard not a target for mobile apps |
| Desktop double-click sides | Mouse/cursor interaction; mobile uses double-tap |
| HLS rendition switching via hls.js | expo-video does not expose segment-level HLS control; use Cloudflare quality URL approach instead (GAP 1) |

---

## 6. Dependencies Check

All required libraries are already installed in the mobile project:

| Library | Version | Used for |
|---|---|---|
| `expo-video` | ^3.0.16 | Core player |
| `expo-linear-gradient` | Already in project | Gradient overlays (GAP 10) |
| `expo-screen-orientation` | Already in project | Landscape lock on fullscreen |
| `@expo/vector-icons` (Ionicons) | Already in project | All icons |
| `react-native` PanResponder | Built-in | Draggable thumb (GAP 3) |

**New install needed (optional):**

```bash
npx expo install @react-native-community/slider
```
Only needed if you go with the native slider for the volume control (GAP 2 Option A).

---

## 7. File Change Map

```
mobile/
├── app/
│   └── video/
│       └── [id].tsx          ← GAPs 1, 7, 8, 9, 10, 11 (+ accumulation GAP 4)
├── screens/
│   └── VideoPlayerScreen.tsx ← GAPs 2, 3, 4, 9, 10 (offline player)
└── components/
    └── AdOverlay.tsx         ← GAPs 5, 6
```

---

## 8. Quick Wins (Do First)

These can be done in under an hour total and have the highest visual impact:

1. **Ad slot label** — 1-line change in `AdOverlay.tsx`
2. **Back button in main watch screen overlay** — add a `<Pressable>` with `router.back()`
3. **Gradient overlay** — swap `rgba` background for `LinearGradient` (import already exists in `[id].tsx`)
4. **Ad progress bar** — add `useEvent(adVideoPlayer, "timeUpdate", ...)` + progress bar view in `AdOverlay.tsx`
