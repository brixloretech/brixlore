import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Video,
  ResizeMode,
  VideoFullscreenUpdate,
  type AVPlaybackStatus,
} from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../src/theme/colors";
import { spacing, typography } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONTROLS_HIDE_DELAY = 3000;
const PROGRESS_SAVE_INTERVAL = 5000;

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
  const videoRef = useRef<Video>(null);
  const { user } = useAuthStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTimeRef = useRef(0);
  const savedStartTimeRef = useRef(0);
  const hasAppliedStartTimeRef = useRef(false);

  const videoUrl = params.videoUrl || "";
  const videoId = params.videoId || "default";
  const title = params.title || "Video";
  const isOffline = params.isOffline === "1";
  const hlsUrl = params.hlsUrl || "";
  const thumbnailUrl = params.thumbnailUrl || "";

  // Require login to watch downloads
  useEffect(() => {
    if (isOffline && !user) {
      router.replace("/login");
    }
  }, [isOffline, user]);

  // Load saved progress on mount
  useEffect(() => {
    loadSavedProgress();
  }, [videoId]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, CONTROLS_HIDE_DELAY);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  // Save progress periodically
  useEffect(() => {
    if (currentTime > 0 && duration > 0) {
      const timeSinceLastSave = currentTime - lastSavedTimeRef.current;
      if (timeSinceLastSave >= PROGRESS_SAVE_INTERVAL / 1000) {
        saveProgress(currentTime, duration);
        lastSavedTimeRef.current = currentTime;
      }
    }
  }, [currentTime, duration, videoId]);

  const loadSavedProgress = async () => {
    try {
      const savedData = await AsyncStorage.getItem(`video_progress_${videoId}`);
      if (savedData) {
        const { time, totalDuration } = JSON.parse(savedData);
        // Only resume if less than 90% watched
        if (time > 0 && totalDuration > 0 && time / totalDuration < 0.9) {
          savedStartTimeRef.current = time;
          setCurrentTime(time);
          setProgress((time / totalDuration) * 100);
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

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error("Video error:", status.error);
        setError("Failed to load video. Please try again.");
        setIsLoading(false);
        setIsBuffering(false);
      }
      return;
    }
    setIsLoading(false);
    setError(null);
    if (!hasAppliedStartTimeRef.current && savedStartTimeRef.current > 0) {
      hasAppliedStartTimeRef.current = true;
      videoRef.current?.setPositionAsync?.(
        Math.floor(savedStartTimeRef.current * 1000),
      );
    }
    const nextDuration = status.durationMillis
      ? status.durationMillis / 1000
      : 0;
    const nextPosition = status.positionMillis
      ? status.positionMillis / 1000
      : 0;
    setDuration(nextDuration);
    setCurrentTime(nextPosition);
    if (nextDuration > 0) {
      setProgress((nextPosition / nextDuration) * 100);
    }
    setIsBuffering(Boolean(status.isBuffering));
    if (status.didJustFinish) {
      setIsPlaying(false);
      setShowControls(true);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
    setShowControls(true);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setShowControls(true);
    if (isFullscreen) {
      videoRef.current?.dismissFullscreenPlayer?.();
    } else {
      videoRef.current?.presentFullscreenPlayer?.();
    }
  }, [isFullscreen]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const cyclePlaybackRate = useCallback(() => {
    const rates = [0.5, 1, 1.25, 1.5, 2];
    setPlaybackRate((prev) => {
      const index = rates.indexOf(prev);
      return rates[(index + 1) % rates.length];
    });
  }, []);

  const handleSeek = useCallback(
    (seekTime: number) => {
      videoRef.current?.setPositionAsync?.(Math.floor(seekTime * 1000));
      setCurrentTime(seekTime);
      if (duration > 0) {
        setProgress((seekTime / duration) * 100);
      }
    },
    [duration],
  );

  const handleSkip = useCallback(
    (deltaSeconds: number) => {
      const nextTime = Math.max(
        0,
        Math.min(
          currentTime + deltaSeconds,
          duration || currentTime + deltaSeconds,
        ),
      );
      videoRef.current?.setPositionAsync?.(Math.floor(nextTime * 1000));
      setCurrentTime(nextTime);
      if (duration > 0) {
        setProgress((nextTime / duration) * 100);
      }
    },
    [currentTime, duration],
  );

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleScreenPress = useCallback(() => {
    // Only reveal controls on background tap; avoid toggling off while user
    // is interacting with controls (e.g., seek bar), which can swallow taps.
    setShowControls((prev) => (prev ? prev : true));
  }, []);

  const handleBack = useCallback(() => {
    // Save progress before leaving
    if (currentTime > 0 && duration > 0) {
      saveProgress(currentTime, duration);
    }
    router.back();
  }, [currentTime, duration, router]);

  if (!videoUrl) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={themeColors.error}
          />
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

      <Pressable style={styles.videoContainer} onPress={handleScreenPress}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={[styles.video, isFullscreen && styles.fullscreenVideo]}
          shouldPlay={isPlaying}
          isMuted={isMuted}
          rate={playbackRate}
          shouldCorrectPitch
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          progressUpdateIntervalMillis={1000}
          onFullscreenUpdate={({ fullscreenUpdate }) => {
            if (fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_PRESENT) {
              setIsFullscreen(true);
            }
            if (fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_DISMISS) {
              setIsFullscreen(false);
            }
          }}
        />

        {/* Loading Indicator */}
        {isLoading && !error && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.accent} />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorOverlay}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={themeColors.error}
            />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => setError(null)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Controls Overlay */}
        {showControls && !isLoading && !error && (
          <View style={styles.controlsOverlay}>
            {/* Top Controls */}
            <View style={styles.topControls}>
              <Pressable style={styles.controlButton} onPress={handleBack}>
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={themeColors.textPrimary}
                />
              </Pressable>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                {isOffline && (
                  <View style={styles.offlineBadge}>
                    <Ionicons
                      name="cloud-offline-outline"
                      size={11}
                      color={themeColors.success}
                    />
                    <Text style={styles.offlineBadgeText}>Offline</Text>
                  </View>
                )}
              </View>
              <Pressable
                style={styles.controlButton}
                onPress={toggleFullscreen}
              >
                <Ionicons
                  name={isFullscreen ? "contract" : "expand"}
                  size={24}
                  color={themeColors.textPrimary}
                />
              </Pressable>
            </View>

            {/* Center Play/Pause Button */}
            <Pressable
              style={styles.centerPlayButton}
              onPress={togglePlayPause}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={56}
                color={themeColors.textPrimary}
              />
            </Pressable>

            {/* Transport Controls */}
            <View style={styles.transportControls}>
              <Pressable
                style={styles.controlPill}
                onPress={() => handleSkip(-10)}
              >
                <Ionicons
                  name="play-back"
                  size={20}
                  color={themeColors.textPrimary}
                />
                <Text style={styles.controlPillText}>10s</Text>
              </Pressable>
              <Pressable style={styles.controlPill} onPress={toggleMute}>
                <Ionicons
                  name={isMuted ? "volume-mute" : "volume-high"}
                  size={20}
                  color={themeColors.textPrimary}
                />
                <Text style={styles.controlPillText}>
                  {isMuted ? "Muted" : "Sound"}
                </Text>
              </Pressable>
              <Pressable style={styles.controlPill} onPress={cyclePlaybackRate}>
                <Ionicons
                  name="speedometer"
                  size={20}
                  color={themeColors.textPrimary}
                />
                <Text style={styles.controlPillText}>{playbackRate}x</Text>
              </Pressable>
              <Pressable
                style={styles.controlPill}
                onPress={() => handleSkip(10)}
              >
                <Ionicons
                  name="play-forward"
                  size={20}
                  color={themeColors.textPrimary}
                />
                <Text style={styles.controlPillText}>10s</Text>
              </Pressable>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>

              {/* Progress Bar */}
              <Pressable
                style={styles.progressBarContainer}
                onPress={(e) => {
                  const { locationX } = e.nativeEvent;
                  const containerWidth = SCREEN_WIDTH - (spacing.md * 2 + 100); // Account for time texts
                  const seekTime = (locationX / containerWidth) * duration;
                  handleSeek(Math.max(0, Math.min(seekTime, duration)));
                }}
              >
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
              </Pressable>

              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
        )}
      </Pressable>
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
    height: (SCREEN_WIDTH * 9) / 16, // 16:9 aspect ratio
  },
  fullscreenVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  bufferingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  bufferingText: {
    ...typography.body,
    color: themeColors.textPrimary,
    marginTop: spacing.md,
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
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
