import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEvent, useEventListener } from "expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../src/theme/colors";
import { spacing, typography } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONTROLS_HIDE_DELAY = 3000;
const PROGRESS_SAVE_INTERVAL = 5; // seconds
const DOUBLE_TAP_WINDOW_MS = 320;
const TAP_ACCUMULATION_RESET_MS = 900;

type VideoPlayerScreenParams = {
  videoUrl: string;
  videoId: string;
  title?: string;
  /** "1" when playing a local offline file */
  isOffline?: string;
  /** HLS URL for downloading (if available and not offline) */
  hlsUrl?: string;
  /** Thumbnail URL for download button */
  thumbnailUrl?: string;
};

export default function VideoPlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<VideoPlayerScreenParams>();
  const videoViewRef = useRef<VideoView>(null);
  const { user } = useAuthStore();

  const videoUrl = params.videoUrl || "";
  const videoId = params.videoId || "default";
  const title = params.title || "Video";
  const isOffline = params.isOffline === "1";

  // Saved progress refs
  const savedStartTimeRef = useRef(0);
  const hasAppliedStartTimeRef = useRef(false);
  const lastSavedTimeRef = useRef(0);
  // Keep refs in sync so the unmount cleanup can read the latest values
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);

  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Progress bar drag
  const [isDragging, setIsDragging] = useState(false);
  const [dragDisplay, setDragDisplay] = useState(0); // 0–100, mirrors actual % while dragging
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  // Double-tap accumulation feedback
  const [showDoubleTapFeedback, setShowDoubleTapFeedback] = useState<{
    side: "left" | "right";
    amount: number;
  } | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Controls fade animation
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  // PanResponder drag refs (read inside stable callbacks)
  const dragProgressRef = useRef(0);
  const dragStartProgressRef = useRef(0);
  const progressBarWidthRef = useRef(0);
  // Double-tap tracking refs
  const lastTapTimeRef = useRef(0);
  const lastTapSideRef = useRef<"left" | "right" | null>(null);
  const accumulatedSkipRef = useRef<{
    side: "left" | "right";
    amount: number;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ side: "right", amount: 0, timer: null });
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep showControls readable inside stable callbacks
  const showControlsRef = useRef(true);

  // expo-video player
  const player = useVideoPlayer(videoUrl ? { uri: videoUrl } : null, (p) => {
    p.play();
  });

  useEffect(() => {
    // Ensure frequent time updates so scrub UI feels responsive on Android devices.
    player.timeUpdateEventInterval = 0.25;
  }, [player]);

  // Track player status for loading / error states
  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });

  // Track playing state
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  // Track current time (fires ~every 250 ms while playing)
  const { currentTime } = useEvent(player, "timeUpdate", {
    currentTime: player.currentTime,
    bufferedPosition: player.bufferedPosition,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
  });

  const isLoading = status === "idle" || status === "loading";
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  // Keep current-time and duration refs up to date
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  // Capture duration once the player is ready
  useEffect(() => {
    if (status === "readyToPlay") {
      setError(null);
      const d = player.duration;
      if (d && d > 0) setDuration(d);
    }
    if (status === "error") {
      setError("Failed to load video. Please try again.");
    }
  }, [status, player]);

  // Seek to saved progress once ready
  useEffect(() => {
    if (
      status === "readyToPlay" &&
      !hasAppliedStartTimeRef.current &&
      savedStartTimeRef.current > 0
    ) {
      hasAppliedStartTimeRef.current = true;
      const target = savedStartTimeRef.current;
      const anyPlayer = player as unknown as {
        currentTime: number;
        seekBy: (seconds: number) => void;
      };
      try {
        anyPlayer.currentTime = target;
      } catch {
        // no-op
      }
      const current = Number.isFinite(anyPlayer.currentTime) ? anyPlayer.currentTime : 0;
      const delta = target - current;
      if (Math.abs(delta) > 0.5) anyPlayer.seekBy(delta);
    }
  }, [status, player]);

  // Sync muted state to player
  useEffect(() => { player.muted = isMuted; }, [player, isMuted]);

  // Sync playback rate to player
  useEffect(() => { player.playbackRate = playbackRate; }, [player, playbackRate]);

  // Handle play-to-end
  useEventListener(player, "playToEnd", useCallback(() => {
    setShowControls(true);
    const t = currentTimeRef.current;
    const d = durationRef.current;
    if (d > 0) void saveProgress(t, d);
  }, []));

  // Require login for offline content
  useEffect(() => {
    if (isOffline && !user) router.replace("/login");
  }, [isOffline, user, router]);

  // Load saved progress on mount
  useEffect(() => {
    void loadSavedProgress();
  }, [videoId]);

  // Keep refs current for stable callbacks
  useEffect(() => { showControlsRef.current = showControls; }, [showControls]);
  useEffect(() => { progressBarWidthRef.current = progressBarWidth; }, [progressBarWidth]);

  // Auto-hide controls while playing — fade out after delay
  useEffect(() => {
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, CONTROLS_HIDE_DELAY);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, isPlaying, controlsOpacity]);

  // Periodically save progress
  useEffect(() => {
    if (currentTime > 0 && duration > 0) {
      const timeSinceLastSave = currentTime - lastSavedTimeRef.current;
      if (timeSinceLastSave >= PROGRESS_SAVE_INTERVAL) {
        void saveProgress(currentTime, duration);
        lastSavedTimeRef.current = currentTime;
      }
    }
  }, [currentTime, duration]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      if (accumulatedSkipRef.current.timer) clearTimeout(accumulatedSkipRef.current.timer);
      const t = currentTimeRef.current;
      const d = durationRef.current;
      if (t > 0 && d > 0) void saveProgress(t, d);
    };
  }, []);

  // Persistence helpers
  const loadSavedProgress = async () => {
    try {
      const raw = await AsyncStorage.getItem(`video_progress_${videoId}`);
      if (raw) {
        const { time, totalDuration } = JSON.parse(raw) as {
          time: number;
          totalDuration: number;
        };
        if (time > 0 && totalDuration > 0 && time / totalDuration < 0.9) {
          savedStartTimeRef.current = time;
        }
      }
    } catch (err) {
      console.error("Failed to load saved progress:", err);
    }
  };

  const saveProgress = async (time: number, totalDuration: number) => {
    try {
      await AsyncStorage.setItem(
        `video_progress_${videoId}`,
        JSON.stringify({ time, totalDuration, timestamp: Date.now() }),
      );
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  };

  // Controls
  const togglePlayPause = useCallback(() => {
    if (player.playing) { player.pause(); } else { player.play(); }
    setShowControls(true);
  }, [player]);

  const toggleFullscreen = useCallback(() => {
    setShowControls(true);
    if (isFullscreen) {
      videoViewRef.current?.exitFullscreen();
    } else {
      videoViewRef.current?.enterFullscreen();
    }
  }, [isFullscreen]);

  const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);

  const cyclePlaybackRate = useCallback(() => {
    const rates = [0.5, 1, 1.25, 1.5, 2];
    setPlaybackRate((prev) => {
      const index = rates.indexOf(prev);
      return rates[(index + 1) % rates.length];
    });
  }, []);

  const seekToTime = useCallback(
    (targetTime: number) => {
      const rawDuration = durationRef.current || player.duration || 0;
      const hasDuration = Number.isFinite(rawDuration) && rawDuration > 0;
      const clamped = hasDuration
        ? Math.max(0, Math.min(targetTime, rawDuration))
        : Math.max(0, targetTime);

      const anyPlayer = player as unknown as {
        currentTime: number;
        seekBy: (seconds: number) => void;
      };

      // Try absolute seek first (more reliable on some expo-video Android builds).
      try {
        anyPlayer.currentTime = clamped;
      } catch {
        // No-op, fallback below.
      }

      const current = Number.isFinite(anyPlayer.currentTime) ? anyPlayer.currentTime : 0;
      const delta = clamped - current;
      if (Math.abs(delta) > 0.2) {
        anyPlayer.seekBy(delta);
      }
    },
    [player],
  );

  const handleSeek = useCallback(
    (seekTime: number) => {
      seekToTime(seekTime);
    },
    [seekToTime],
  );

  const handleSkip = useCallback(
    (deltaSeconds: number) => {
      seekToTime(currentTimeRef.current + deltaSeconds);
    },
    [seekToTime],
  );

  const formatTime = (seconds: number): string => {
    const s = Math.max(0, seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // handleScreenPress kept for reference; touch is now handled via gesture zones

  const handleBack = useCallback(() => {
    const t = currentTimeRef.current;
    const d = durationRef.current;
    if (t > 0 && d > 0) void saveProgress(t, d);
    router.back();
  }, [router]);

  // ── Controls animation helpers ────────────────────────────────────────────

  const showControlsAnimated = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [controlsOpacity]);

  const hideControlsAnimated = useCallback(() => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowControls(false));
  }, [controlsOpacity]);

  // ── Double-tap seek with YouTube-style accumulation ───────────────────────

  const handleDoubleTap = useCallback(
    (side: "left" | "right") => {
      const now = Date.now();
      const acc = accumulatedSkipRef.current;

      if (now - lastTapTimeRef.current < DOUBLE_TAP_WINDOW_MS && lastTapSideRef.current === side) {
        // Double-tap detected — accumulate
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }
        if (acc.timer) clearTimeout(acc.timer);
        const newAmount = acc.side === side && acc.amount > 0 ? acc.amount + 10 : 10;
        const timer = setTimeout(() => {
          accumulatedSkipRef.current = { side, amount: 0, timer: null };
          setShowDoubleTapFeedback(null);
        }, TAP_ACCUMULATION_RESET_MS);
        accumulatedSkipRef.current = { side, amount: newAmount, timer };

        handleSkip(side === "right" ? 10 : -10);
        setShowDoubleTapFeedback({ side, amount: newAmount });
        lastTapTimeRef.current = 0;
        lastTapSideRef.current = null;
      } else {
        // First tap — start tracking. If no second tap arrives, treat as single tap and show controls.
        lastTapTimeRef.current = now;
        lastTapSideRef.current = side;
        if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = setTimeout(() => {
          if (lastTapSideRef.current === side) {
            showControlsAnimated();
          }
        }, DOUBLE_TAP_WINDOW_MS + 20);
      }
    },
    [handleSkip, showControlsAnimated],
  );

  const handleCenterTap = useCallback(() => {
    if (showControlsRef.current) {
      hideControlsAnimated();
    } else {
      showControlsAnimated();
    }
  }, [hideControlsAnimated, showControlsAnimated]);

  // ── Seek PanResponder — drag the progress bar thumb ──────────────────────

  const seekPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 2,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        showControlsAnimated();
        setIsDragging(true);
        if (progressBarWidthRef.current <= 0) return;
        const pct = Math.max(
          0,
          Math.min(1, e.nativeEvent.locationX / progressBarWidthRef.current),
        );
        dragStartProgressRef.current = pct;
        dragProgressRef.current = pct;
        setDragDisplay(pct * 100);
      },
      onPanResponderMove: (_, gestureState) => {
        if (progressBarWidthRef.current <= 0) return;
        const pct = Math.max(
          0,
          Math.min(
            1,
            dragStartProgressRef.current + gestureState.dx / progressBarWidthRef.current,
          ),
        );
        dragProgressRef.current = pct;
        setDragDisplay(pct * 100);
      },
      onPanResponderRelease: () => {
        const seekTo = dragProgressRef.current * durationRef.current;
        handleSeek(seekTo);
        setIsDragging(false);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
          hideControlsAnimated();
        }, CONTROLS_HIDE_DELAY);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    }),
  ).current;

  // Render
  if (!videoUrl) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={themeColors.error} />
          <Text style={styles.errorText}>No video URL provided</Text>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, isFullscreen && styles.fullscreenContainer]}
      edges={isFullscreen ? [] : ["top", "bottom"]}
    >
      <StatusBar hidden={isFullscreen} barStyle="light-content" />

      {/* Video container — plain View so gesture zones control touch handling */}
      <View style={styles.videoContainer}>
        <VideoView
          ref={videoViewRef}
          player={player}
          style={[styles.video, isFullscreen && styles.fullscreenVideo]}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen
          onFullscreenEnter={() => setIsFullscreen(true)}
          onFullscreenExit={() => setIsFullscreen(false)}
        />

        {/* Loading indicator */}
        {isLoading && !error && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.accent} />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        {/* Error overlay */}
        {error && (
          <View style={styles.errorOverlay}>
            <Ionicons name="alert-circle-outline" size={48} color={themeColors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                player.replace({ uri: videoUrl });
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Controls overlay — always mounted, fades in/out with animation */}
        {!isLoading && !error && (
          <Animated.View
            style={[styles.controlsOverlay, { opacity: controlsOpacity }]}
            pointerEvents={showControls ? "box-none" : "none"}
          >
            {/* Top gradient band */}
            <LinearGradient
              colors={["rgba(0,0,0,0.82)", "transparent"]}
              style={styles.topGradientBand}
              pointerEvents="none"
            />
            {/* Bottom gradient band */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.88)"]}
              style={styles.bottomGradientBand}
              pointerEvents="none"
            />

            {/* Top Controls: back · title · fullscreen */}
            <View style={styles.topControls}>
              <Pressable style={styles.controlButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
              </Pressable>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {isOffline && (
                  <View style={styles.offlineBadge}>
                    <Ionicons name="cloud-offline-outline" size={11} color={themeColors.success} />
                    <Text style={styles.offlineBadgeText}>Offline</Text>
                  </View>
                )}
              </View>
              <Pressable style={styles.controlButton} onPress={toggleFullscreen}>
                <Ionicons
                  name={isFullscreen ? "contract" : "expand"}
                  size={24}
                  color={themeColors.textPrimary}
                />
              </Pressable>
            </View>

            {/* Center Play/Pause */}
            <Pressable style={styles.centerPlayButton} onPress={togglePlayPause}>
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={56}
                color={themeColors.textPrimary}
              />
            </Pressable>

            {/* Transport control pills */}
            <View style={styles.transportControls}>
              <Pressable style={styles.controlPill} onPress={() => handleSkip(-10)}>
                <Ionicons name="play-back" size={20} color={themeColors.textPrimary} />
                <Text style={styles.controlPillText}>10s</Text>
              </Pressable>
              <Pressable style={styles.controlPill} onPress={toggleMute}>
                <Ionicons
                  name={isMuted ? "volume-mute" : "volume-high"}
                  size={20}
                  color={themeColors.textPrimary}
                />
                <Text style={styles.controlPillText}>{isMuted ? "Muted" : "Sound"}</Text>
              </Pressable>
              <Pressable style={styles.controlPill} onPress={cyclePlaybackRate}>
                <Ionicons name="speedometer" size={20} color={themeColors.textPrimary} />
                <Text style={styles.controlPillText}>{playbackRate}x</Text>
              </Pressable>
              <Pressable style={styles.controlPill} onPress={() => handleSkip(10)}>
                <Ionicons name="play-forward" size={20} color={themeColors.textPrimary} />
                <Text style={styles.controlPillText}>10s</Text>
              </Pressable>
            </View>

            {/* Bottom: time · draggable seek bar · duration */}
            <View style={styles.bottomControls}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              {/* Draggable progress bar */}
              <View
                style={styles.progressBarContainer}
                onLayout={(e) => {
                  const width = e.nativeEvent.layout.width;
                  setProgressBarWidth(width);
                  progressBarWidthRef.current = width;
                }}
                {...seekPanResponder.panHandlers}
              >
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${isDragging ? dragDisplay : progress}%` },
                    ]}
                  />
                  {/* Seek thumb dot */}
                  {progressBarWidth > 0 && (
                    <View
                      style={[
                        styles.seekThumb,
                        {
                          left:
                            ((isDragging ? dragDisplay : progress) / 100) *
                              progressBarWidth -
                            7,
                        },
                      ]}
                    />
                  )}
                </View>
              </View>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </Animated.View>
        )}

        {/* Gesture zones — active only when controls are hidden */}
        <View
          style={styles.gestureContainer}
          pointerEvents={showControls ? "none" : "box-none"}
        >
          <Pressable
            style={styles.gestureZoneLeft}
            onPress={() => handleDoubleTap("left")}
          />
          <Pressable
            style={styles.gestureZoneCenter}
            onPress={handleCenterTap}
          />
          <Pressable
            style={styles.gestureZoneRight}
            onPress={() => handleDoubleTap("right")}
          />
        </View>

        {/* Double-tap seek feedback */}
        {showDoubleTapFeedback && (
          <View
            style={[
              styles.doubleTapFeedback,
              showDoubleTapFeedback.side === "left"
                ? styles.doubleTapLeft
                : styles.doubleTapRight,
            ]}
          >
            <Ionicons
              name={
                showDoubleTapFeedback.side === "left" ? "play-back" : "play-forward"
              }
              size={36}
              color={themeColors.textPrimary}
            />
            <Text style={styles.doubleTapText}>
              {showDoubleTapFeedback.side === "left" ? "-" : "+"}
              {showDoubleTapFeedback.amount}s
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  fullscreenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: SCREEN_WIDTH,
    height: (SCREEN_WIDTH * 9) / 16,
  },
  fullscreenVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: themeColors.background,
  },
  loadingText: {
    ...typography.body,
    color: themeColors.textPrimary,
    marginTop: spacing.md,
  },
  errorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    padding: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: themeColors.textPrimary,
    marginTop: spacing.md,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: themeColors.accent,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.body,
    color: themeColors.background,
    fontWeight: "600",
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    zIndex: 2,
  },
  topGradientBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    zIndex: 0,
  },
  bottomGradientBand: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    zIndex: 0,
  },
  gestureContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 10,
  },
  gestureZoneLeft: { flex: 1, height: "100%", backgroundColor: "transparent" },
  gestureZoneCenter: { flex: 1, height: "100%", backgroundColor: "transparent" },
  gestureZoneRight: { flex: 1, height: "100%", backgroundColor: "transparent" },
  doubleTapFeedback: {
    position: "absolute",
    top: "50%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 48,
    width: 96,
    height: 96,
    zIndex: 20,
    transform: [{ translateY: -48 }],
  },
  doubleTapLeft: { left: spacing.xl },
  doubleTapRight: { right: spacing.xl },
  doubleTapText: {
    color: themeColors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  seekThumb: {
    position: "absolute",
    top: "50%",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: themeColors.accent,
    transform: [{ translateY: -7 }],
  },
  topControls: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  controlButton: {
    padding: spacing.sm,
    minWidth: 40,
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  title: {
    ...typography.body,
    color: themeColors.textPrimary,
    fontWeight: "600",
  },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  offlineBadgeText: {
    fontSize: 11,
    color: themeColors.success,
    fontWeight: "600",
  },
  centerPlayButton: {
    alignSelf: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  transportControls: {
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  controlPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  controlPillText: {
    ...typography.caption,
    color: themeColors.textPrimary,
    fontSize: 12,
  },
  bottomControls: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  timeText: {
    ...typography.caption,
    color: themeColors.textPrimary,
    minWidth: 50,
    textAlign: "center",
  },
  progressBarContainer: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "visible",
  },
  progressFill: {
    height: "100%",
    backgroundColor: themeColors.accent,
    borderRadius: 2,
  },
  backButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: themeColors.accent,
    borderRadius: 8,
  },
  backButtonText: {
    ...typography.body,
    color: themeColors.background,
    fontWeight: "600",
  },
});
