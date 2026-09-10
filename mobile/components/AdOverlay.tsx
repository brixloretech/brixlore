import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useVideoPlayer } from 'expo-video';
import { useEventListener } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { AdOverlayState } from '../hooks/useAdPlayer';

interface AdOverlayProps extends AdOverlayState {
  adVideoPlayer: ReturnType<typeof useVideoPlayer>;
  onDone: () => void;
  /** Called when the user taps "Learn More" — use for ad_click analytics. */
  onLearnMoreClick?: () => void;
  /** Optional hook to toggle fullscreen from ad controls. */
  onToggleFullscreen?: () => void;
  /** Current fullscreen state for icon rendering. */
  isFullscreen?: boolean;
  /** Last known ad playback position from parent (seconds). */
  resumeFromSeconds?: number | null;
  /** Reports current ad playback position to parent. */
  onProgress?: (currentTimeSec: number) => void;
}

/**
 * Full-screen ad player overlay.
 *
 * Renders ad controls on top of the shared VideoView in the parent. The parent
 * swaps that view's player to `adVideoPlayer` while an ad is active. Keeping a
 * single native video view avoids iOS platform-layer ordering bugs.
 */
export function AdOverlay({
  adVideoPlayer,
  videoUrl,
  mediaFallbackUrls,
  skippable,
  skipAfterSeconds,
  startedAtMs,
  clickThroughUrl,
  onDone,
  onLearnMoreClick,
  onToggleFullscreen,
  isFullscreen = false,
  resumeFromSeconds = null,
  onProgress,
}: AdOverlayProps) {
  const [isBuffering, setIsBuffering] = useState(true);
  const [adIsPlaying, setAdIsPlaying] = useState(true);
  const [adCurrentTime, setAdCurrentTime] = useState(0);
  const [adDuration, setAdDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hasRetriedOnErrorRef = useRef(false);
  const overlayMountedRef = useRef(true);
  const mediaQueueRef = useRef<string[]>([videoUrl, ...mediaFallbackUrls]);
  const mediaIndexRef = useRef(0);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsShownAtRef = useRef(Date.now());
  const hasAppliedResumeRef = useRef(false);
  const resumePositionSecRef = useRef(0);
  const resumeRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingStartTimeRef = useRef(0);

  const safeAdPlayerCall = useCallback((action: () => void) => {
    if (!overlayMountedRef.current) return;
    try {
      action();
    } catch {
      // Ignore released-player calls during fast unmount/navigation races.
    }
  }, []);

  useEffect(() => {
    return () => {
      overlayMountedRef.current = false;
      if (resumeRetryTimerRef.current) {
        clearTimeout(resumeRetryTimerRef.current);
        resumeRetryTimerRef.current = null;
      }
      if (loadingDebounceTimerRef.current) {
        clearTimeout(loadingDebounceTimerRef.current);
        loadingDebounceTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    mediaQueueRef.current = [videoUrl, ...mediaFallbackUrls].filter(
      (u, i, arr) => arr.indexOf(u) === i,
    );
    mediaIndexRef.current = 0;
    hasRetriedOnErrorRef.current = false;
    hasAppliedResumeRef.current = false;
    setIsBuffering(true);

    // Preserve ad continuity across normal/fullscreen remounts.
    // Use only exact player-time from parent to avoid jump-ahead on buffering.
    const restoredSec = Math.max(0, resumeFromSeconds ?? 0);
    resumePositionSecRef.current = restoredSec;
    setAdCurrentTime(restoredSec);

    console.log('[AdOverlay] media queue reset', {
      totalCandidates: mediaQueueRef.current.length,
      first: mediaQueueRef.current[0],
      resumeAtSec: restoredSec,
      startedAtMs,
    });
  }, [videoUrl, mediaFallbackUrls, resumeFromSeconds, startedAtMs]);

  const showControlsAnimated = useCallback(() => {
    setShowControls(true);
    controlsShownAtRef.current = Date.now();
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [controlsOpacity]);

  const hideControlsAnimated = useCallback(() => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setShowControls(false));
  }, [controlsOpacity]);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (!adIsPlaying || isBuffering) return;

    controlsShownAtRef.current = Date.now();

    controlsTimeoutRef.current = setTimeout(() => {
      hideControlsAnimated();
    }, 2300);
  }, [adIsPlaying, isBuffering, hideControlsAnimated]);

  useEffect(() => {
    if (showControls) resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, resetControlsTimeout]);

  useEffect(() => {
    if (isBuffering || !adIsPlaying) {
      showControlsAnimated();
    }
  }, [isBuffering, adIsPlaying, showControlsAnimated]);

  // Fallback hide path: if timer callbacks are delayed/dropped, hide controls
  // once enough playback time has elapsed while ad is actively playing.
  useEffect(() => {
    if (!showControls) return;
    if (isBuffering || !adIsPlaying) return;

    const elapsed = Date.now() - controlsShownAtRef.current;
    if (elapsed >= 2300) {
      hideControlsAnimated();
    }
  }, [adCurrentTime, adIsPlaying, isBuffering, showControls, hideControlsAnimated]);

  // Stable ref so event listeners always get the latest onDone callback.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    adVideoPlayer.timeUpdateEventInterval = 0.25;
  }, [adVideoPlayer]);

  // Track ad clip progress via event listener to avoid stale values on some devices.
  useEventListener(
    adVideoPlayer,
    'timeUpdate',
    ({ currentTime }: { currentTime: number; bufferedPosition: number }) => {
      setAdCurrentTime(currentTime);
      onProgress?.(currentTime);
      // If playback is advancing, clear any false-positive buffering overlay.
      if (isBuffering) {
        const deltaFromLoadingStart = Math.abs(currentTime - loadingStartTimeRef.current);
        if (deltaFromLoadingStart > 0.2) {
          setIsBuffering(false);
        }
      }
    },
  );

  // Status changes: capture duration, hide buffering on ready, skip broken ads.
  const applyResumePosition = useCallback((attempt: number = 0) => {
    const target = Math.max(0, resumePositionSecRef.current);
    if (target <= 0) return;

    safeAdPlayerCall(() => {
      const anyPlayer = adVideoPlayer as unknown as {
        currentTime: number;
        seekBy: (seconds: number) => void;
        playing: boolean;
        play: () => void;
      };

      // Ensure the player is actively running before seeking.
      if (!anyPlayer.playing) {
        anyPlayer.play();
      }

      // Try absolute set first; fallback to relative seek.
      try {
        anyPlayer.currentTime = target;
      } catch {
        // no-op
      }

      const delta = target - anyPlayer.currentTime;
      if (Math.abs(delta) > 0.35) {
        anyPlayer.seekBy(delta);
      }

      // Retry a few times because some devices apply seek after decoder warm-up.
      const remaining = target - anyPlayer.currentTime;
      if (Math.abs(remaining) > 0.5 && attempt < 4) {
        if (resumeRetryTimerRef.current) clearTimeout(resumeRetryTimerRef.current);
        resumeRetryTimerRef.current = setTimeout(() => {
          applyResumePosition(attempt + 1);
        }, 120);
      }
    });
  }, [adVideoPlayer, safeAdPlayerCall]);

  useEventListener(adVideoPlayer, 'statusChange', ({ status }: { status: string }) => {
    console.log('[AdOverlay] status', {
      status,
      currentCandidateIndex: mediaIndexRef.current,
      currentCandidateUrl: mediaQueueRef.current[mediaIndexRef.current],
    });
    if (status === 'readyToPlay') {
      hasRetriedOnErrorRef.current = false;
      if (loadingDebounceTimerRef.current) {
        clearTimeout(loadingDebounceTimerRef.current);
        loadingDebounceTimerRef.current = null;
      }
      const d = adVideoPlayer.duration;
      if (d && d > 0) setAdDuration(d);
      if (!hasAppliedResumeRef.current) {
        hasAppliedResumeRef.current = true;
        applyResumePosition(0);
        setAdCurrentTime(Math.max(0, resumePositionSecRef.current));
      }
      setIsBuffering(false);
      setAdIsPlaying(true);
    } else if (status === 'loading') {
      loadingStartTimeRef.current = adVideoPlayer.currentTime;
      if (loadingDebounceTimerRef.current) {
        clearTimeout(loadingDebounceTimerRef.current);
      }
      // Debounce loading to avoid spinner flashes during fullscreen transitions.
      loadingDebounceTimerRef.current = setTimeout(() => {
        const stallDelta = Math.abs(adVideoPlayer.currentTime - loadingStartTimeRef.current);
        if (stallDelta < 0.2) {
          setIsBuffering(true);
        }
      }, 280);
    } else if (status === 'error') {
      if (loadingDebounceTimerRef.current) {
        clearTimeout(loadingDebounceTimerRef.current);
        loadingDebounceTimerRef.current = null;
      }
      const nextIndex = mediaIndexRef.current + 1;
      const nextUrl = mediaQueueRef.current[nextIndex];
      if (nextUrl) {
        mediaIndexRef.current = nextIndex;
        console.log('[AdOverlay] switching to fallback candidate', {
          nextIndex,
          nextUrl,
        });
        safeAdPlayerCall(() => adVideoPlayer.replace({ uri: nextUrl }));
        safeAdPlayerCall(() => adVideoPlayer.play());
        setIsBuffering(true);
        return;
      }

      // Retry once for transient decoder/network glitches before skipping.
      if (!hasRetriedOnErrorRef.current) {
        hasRetriedOnErrorRef.current = true;
        try {
          const currentUrl = mediaQueueRef.current[mediaIndexRef.current] ?? videoUrl;
          console.log('[AdOverlay] retrying same candidate once', {
            currentUrl,
          });
          safeAdPlayerCall(() => adVideoPlayer.replace({ uri: currentUrl }));
          safeAdPlayerCall(() => adVideoPlayer.play());
          setIsBuffering(true);
          return;
        } catch {
          // fall through to onDone
        }
      }
      // Broken ad creative — silently skip to not interrupt the viewer.
      console.log('[AdOverlay] all candidates failed, ending ad slot');
      onDoneRef.current();
    }
  });

  useEventListener(
    adVideoPlayer,
    'playingChange',
    ({ isPlaying }: { isPlaying: boolean }) => {
      setAdIsPlaying(isPlaying);
      if (isPlaying && !hasAppliedResumeRef.current) {
        hasAppliedResumeRef.current = true;
        applyResumePosition(0);
      }
    },
  );

  // Ad video finished — call onDone to tear down the overlay.
  useEventListener(adVideoPlayer, 'playToEnd', () => {
    onDoneRef.current();
  });

  const handleSkip = useCallback(() => {
    const skipRemaining =
      skippable && skipAfterSeconds > 0
        ? Math.max(0, Math.ceil(skipAfterSeconds - adCurrentTime))
        : 0;
    if (skipRemaining <= 0) onDoneRef.current();
  }, [adCurrentTime, skippable, skipAfterSeconds]);

  const handleLearnMore = useCallback(() => {
    showControlsAnimated();
    resetControlsTimeout();
    onLearnMoreClick?.();
    if (clickThroughUrl) {
      Linking.openURL(clickThroughUrl).catch(() => {
        // Ignore — external link failure must not crash the app
      });
    }
  }, [clickThroughUrl, onLearnMoreClick, resetControlsTimeout, showControlsAnimated]);

  const handleAdPlayPause = useCallback(() => {
    showControlsAnimated();
    safeAdPlayerCall(() => {
      if (adVideoPlayer.playing) {
        adVideoPlayer.pause();
      } else {
        adVideoPlayer.play();
      }
    });
    resetControlsTimeout();
  }, [adVideoPlayer, safeAdPlayerCall, resetControlsTimeout, showControlsAnimated]);

  const handleToggleFullscreen = useCallback(() => {
    showControlsAnimated();
    onToggleFullscreen?.();
    resetControlsTimeout();
  }, [onToggleFullscreen, resetControlsTimeout, showControlsAnimated]);

  const handleVideoTap = useCallback(() => {
    if (showControls) {
      hideControlsAnimated();
    } else {
      showControlsAnimated();
      resetControlsTimeout();
    }
  }, [hideControlsAnimated, resetControlsTimeout, showControls, showControlsAnimated]);

  const formatAdTime = (seconds: number): string => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Ad clip progress 0-100 for the progress bar.
  const playerDuration = Number.isFinite(adVideoPlayer.duration)
    ? adVideoPlayer.duration
    : 0;
  const effectiveDuration = adDuration > 0 ? adDuration : playerDuration > 0 ? playerDuration : 0;
  const adProgress =
    effectiveDuration > 0
      ? Math.min((adCurrentTime / effectiveDuration) * 100, 100)
      : 0;
  const skipRemaining =
    skippable && skipAfterSeconds > 0
      ? Math.max(0, Math.ceil(skipAfterSeconds - adCurrentTime))
      : 0;
  const canSkipNow = !skippable || skipAfterSeconds <= 0 || skipRemaining <= 0;

  return (
    <View style={styles.container}>
      {/* Buffering spinner while the ad creative loads */}
      {isBuffering && (
        <View style={styles.bufferingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}

      {/* Tap surface to show/hide ad controls while keeping skip always visible. */}
      <Pressable
        style={[styles.tapCatcher, skippable && styles.tapCatcherAvoidSkip]}
        onPress={handleVideoTap}
      />

      {/* Top bar: "Ad" badge */}
      <View style={styles.topBar}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        <View style={styles.topRightActions} />
      </View>

      <Animated.View
        style={[styles.controlsLayer, { opacity: controlsOpacity }]}
        pointerEvents={showControls ? 'box-none' : 'none'}
      >
        {/* Flex centering keeps this control in the center of the 16:9 frame
            across iOS device sizes; percentage transforms can be offset by a
            native video surface. */}
        <View style={styles.centerControlArea} pointerEvents="box-none">
          <Pressable
            style={styles.centerPlayButton}
            onPress={handleAdPlayPause}
          >
            <Ionicons
              name={adIsPlaying ? 'pause' : 'play'}
              size={34}
              color="#ffffff"
            />
          </Pressable>
        </View>

        {/* Ad clip progress bar — thin track above the bottom controls */}
        <View style={styles.adProgressTrack}>
          <View style={[styles.adProgressFill, { width: `${adProgress}%` as any }]} />
        </View>

        {/* Bottom gradient bar: play/pause + fullscreen */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={styles.bottomGradient}
          pointerEvents="box-none"
        >
          <View style={styles.leftControlsRow}>
            <Pressable style={styles.iconBtn} onPress={handleAdPlayPause} hitSlop={8}>
              <Ionicons
                name={adIsPlaying ? 'pause' : 'play'}
                size={22}
                color="#ffffff"
              />
            </Pressable>

            {onToggleFullscreen ? (
              <Pressable
                style={styles.iconBtn}
                onPress={handleToggleFullscreen}
                hitSlop={8}
              >
                <Ionicons
                  name={isFullscreen ? 'contract' : 'expand'}
                  size={22}
                  color="#ffffff"
                />
              </Pressable>
            ) : null}

            {effectiveDuration > 0 ? (
              <Text style={styles.adInlineTimeText}>
                {formatAdTime(adCurrentTime)} / {formatAdTime(effectiveDuration)}
              </Text>
            ) : null}

            {clickThroughUrl ? (
              <Pressable style={styles.inlineLearnMoreBtn} onPress={handleLearnMore}>
                <Text style={styles.inlineLearnMoreText}>Learn More</Text>
              </Pressable>
            ) : null}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Keep the skip action inside the player frame; safe-area insets belong
          to the app screen, not this embedded 16:9 video surface. */}
      {skippable ? (
        <View style={styles.skipFloatingWrap}>
          <Pressable
            style={[
              styles.skipBtn,
              canSkipNow ? styles.skipBtnReady : styles.skipBtnWaiting,
            ]}
            onPress={handleSkip}
            disabled={!canSkipNow}
            hitSlop={4}
          >
            {canSkipNow ? (
              <Text style={styles.skipReadyText}>Skip Ad ›</Text>
            ) : (
              <Text style={styles.skipCountdownText}>
                Skip in {skipRemaining}s
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    flex: 1,
    // The video itself lives in the shared parent VideoView. This layer only
    // contains ad controls, so it must remain transparent above that native
    // surface instead of painting a second black video-sized view.
    backgroundColor: 'transparent',
    zIndex: 1000,
    elevation: 1000,
    overflow: 'hidden',
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 2,
  },
  topBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 6,
  },
  controlsLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 4,
  },
  centerControlArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapCatcher: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  tapCatcherAvoidSkip: {
    // Keep the bottom-right skip zone touchable while still allowing
    // tap-to-show/hide controls across the rest of the ad surface.
    right: 132,
    bottom: 72,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  adBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  learnMoreBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  learnMoreText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 0,
  },
  skipFloatingWrap: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    zIndex: 7,
  },
  leftControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adInlineTimeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  inlineLearnMoreBtn: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  inlineLearnMoreText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 6,
  },
  skipBtn: {
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 4,
  },
  skipBtnReady: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  skipBtnWaiting: {
    backgroundColor: 'rgba(0,0,0,0.56)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  skipReadyText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  skipCountdownText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
  },
  // Ad progress bar
  adProgressTrack: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  adProgressFill: {
    height: '100%',
    backgroundColor: '#facc15',
  },
});
