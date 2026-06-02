import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  AppState,
  type AppStateStatus,
  Modal,
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEventListener } from "expo";
import * as ScreenOrientation from "expo-screen-orientation";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors as themeColors } from "../../src/theme/colors";
import { spacing, typography, borderRadius } from "../../constants/theme";
import { contentService, type EpisodeDto } from "../../services/contentService";
import {
  streamingService,
  type PlaybackInfoResponseDto,
} from "../../services/streamingService";
import { downloadService } from "../../services/downloadService";
import { AddToMyListButton } from "../../components/AddToMyListButton";
import { useAuthStore } from "../../store/useAuthStore";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";
import { useLimitedAccessStore } from "../../store/useLimitedAccessStore";
import {
  getAudioPosition,
  preloadAudioFromUrl,
  playAudioFromUrl,
  stopAudio,
} from "../../src/services/playbackService";
import { useAdPlayer } from "../../hooks/useAdPlayer";
import { AdOverlay } from "../../components/AdOverlay";
import { useMatomo } from "../../hooks/useMatomo";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PROGRESS_REPORT_INTERVAL_SEC = 10;
const DOUBLE_TAP_WINDOW_MS = 320;
const TAP_ACCUMULATION_RESET_MS = 900;

// Report progress every 10 seconds
type ContentDetailDto = {
  id: string;
  title: string;
  description?: string;
  type: string;
  thumbnailUrl: string | null;
  releaseYear: number;
  ageRating: string;
  duration?: string;
  category?: string;
  trailer?: {
    id: string;
    title: string;
    duration: string;
  };
  seasons?: Array<{
    id: string;
    seasonNumber: number;
    title: string;
    episodeCount: number;
  }>;
  episodes?: Array<{
    id: string;
    seasonId?: string;
    episodeNumber: number;
    title: string;
    duration: string;
    thumbnailUrl?: string;
  }>;
};

type PlayableEpisode = {
  id: string;
  title: string;
  duration?: string;
};

type EpisodeItem = NonNullable<ContentDetailDto["episodes"]>[number];

function durationToSeconds(duration?: string): number {
  if (!duration) return 0;
  const parts = duration.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}
export default function WatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    episodeId?: string;
    resumeAt?: string;
  }>();
  const contentId = params.id;
  const episodeIdFromUrl = params.episodeId;
  const resumeAtFromUrl = Number(params.resumeAt ?? 0);
  const resumeFromUrlSec = Number.isFinite(resumeAtFromUrl)
    ? Math.max(0, Math.floor(resumeAtFromUrl))
    : 0;
  const { isAuthenticated } = useAuthStore();
  const videosWatchedCount = useLimitedAccessStore(
    (state) => state.videosWatchedCount,
  );
  const startVideoWatch = useLimitedAccessStore(
    (state) => state.startVideoWatch,
  );
  const stopVideoWatch = useLimitedAccessStore((state) => state.stopVideoWatch);
  const updateCurrentVideoWatchTime = useLimitedAccessStore(
    (state) => state.updateCurrentVideoWatchTime,
  );
  const setLoginModalShownFor30s = useLimitedAccessStore(
    (state) => state.setLoginModalShownFor30s,
  );
  const resetCurrentVideoWatchTime = useLimitedAccessStore(
    (state) => state.resetCurrentVideoWatchTime,
  );
  const incrementVideosWatched = useLimitedAccessStore(
    (state) => state.incrementVideosWatched,
  );
  const saveLimitedAccessToStorage = useLimitedAccessStore(
    (state) => state.saveToStorage,
  );
  const getEpisodeCumulativeTime = useLimitedAccessStore(
    (state) => state.getEpisodeCumulativeTime,
  );
  const updateEpisodeCumulativeTime = useLimitedAccessStore(
    (state) => state.updateEpisodeCumulativeTime,
  );
  const freeUnlockedVideoId = useLimitedAccessStore(
    (state) => state.freeUnlockedVideoId,
  );
  const setFreeUnlockedVideoId = useLimitedAccessStore(
    (state) => state.setFreeUnlockedVideoId,
  );
  const videoViewRef = useRef<VideoView>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const wasPlayingRef = useRef(false);
  const backgroundAudioActiveRef = useRef(false);
  const lastPositionRef = useRef(0);
  const progressReportIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastReportedRef = useRef(0);
  const hasSeekedToSavedProgressRef = useRef(false);
  const primaryEpisodeRef = useRef<PlayableEpisode | null>(null);
  const watchTimeTrackerRef = useRef<NodeJS.Timeout | null>(null);
  const videoStartPositionRef = useRef<number | null>(null);
  const currentTimeRef = useRef(0);
  const initialCumulativeTimeRef = useRef<number>(0);
  const watchedEpisodeIdRef = useRef<string | null>(null);
  const [savedProgress, setSavedProgress] = useState<number>(0);
  // expo-video player — source is loaded imperatively via player.replace()
  const player = useVideoPlayer(null, () => {});
  const playerMountedRef = useRef(true);
  // savedProgress ref so event listener callbacks always read the current value
  const savedProgressRef = useRef(0);

  const safePlayerCall = useCallback((action: () => void, label: string) => {
    if (!playerMountedRef.current) return;
    try {
      action();
    } catch (error) {
      console.warn(`[Watch] Skipping player ${label} on released instance`, error);
    }
  }, []);

  useEffect(() => {
    return () => {
      playerMountedRef.current = false;
    };
  }, []);

  // Always-current isPlaying ref (readable inside stable callbacks).
  const isPlayingRef = useRef(true);

  // Tracks whether content was playing immediately before an ad slot started.
  // Used by resumeContent to decide whether to restart playback.
  const wasPlayingBeforeAdRef = useRef(false);

  // ── Matomo analytics tracking refs ──────────────────────────────────────────
  // hasTrackedFirstPlayRef: true after the first 'play' event fires for the
  //   current source — distinguishes 'play' (first start) from 'resume'.
  const hasTrackedFirstPlayRef = useRef(false);
  // contentEndedRef: set true in playToEnd so the matching playingChange
  //   (nowPlaying=false) is not mistaken for a user-initiated pause.
  const contentEndedRef = useRef(false);
  // adJustResumedRef: set true in resumeContent when the ad system restarts
  //   the content player, so the resulting playingChange is not tracked as
  //   a user resume.
  const adJustResumedRef = useRef(false);
  // videoTitleRef: current "Show Title \u2014 Episode Title" string for event name.
  const videoTitleRef = useRef('');

  // Ad system — manages pre-roll / mid-roll / post-roll lifecycle.
  const adSystem = useAdPlayer({
    pauseContent: useCallback(() => {
      wasPlayingBeforeAdRef.current = isPlayingRef.current;
      safePlayerCall(() => player.pause(), "pauseContent");
    }, [player, safePlayerCall]),
    resumeContent: useCallback(() => {
      if (wasPlayingBeforeAdRef.current) {
        wasPlayingBeforeAdRef.current = false;
        // Signal that the next playingChange(nowPlaying=true) is ad-driven.
        adJustResumedRef.current = true;
        safePlayerCall(() => player.play(), "resumeContent");
      }
    }, [player, safePlayerCall]),
  });

  const { trackEvent } = useMatomo();
  const [content, setContent] = useState<ContentDetailDto | null>(null);
  const [primaryEpisode, setPrimaryEpisode] = useState<PlayableEpisode | null>(
    null,
  );
  const [playbackInfo, setPlaybackInfo] =
    useState<PlaybackInfoResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [comingSoon, setComingSoon] = useState(false);
  const [playbackError, setPlaybackError] = useState<
    "unauthorized" | "forbidden" | "unavailable" | null
  >(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showLimitedAccessLoginModal, setShowLimitedAccessLoginModal] =
    useState(false);
  const [limitedAccessModalReason, setLimitedAccessModalReason] = useState<
    "video-limit" | "watch-time" | "free-tier-limit" | "guest-limit"
  >("watch-time");
  const { subscription, fetchSubscription } = useSubscriptionStore();
  const isFreeTier = isAuthenticated && !subscription?.isSubscribed;
  const isGuest = !isAuthenticated;
  const showUpgradeModal2SecRef = useRef(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Controls animation helpers (GAP 9) ────────────────────────────────────

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

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowControls(false));
    }, 4000);
  }, [controlsOpacity]);

  // Keep showControlsRef current for stable callbacks
  useEffect(() => { showControlsRef.current = showControls; }, [showControls]);
  // Keep progressBarWidthRef current
  useEffect(() => { progressBarWidthRef.current = progressBarWidth; }, [progressBarWidth]);

  useEffect(() => {
    if (showControls) resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      if (accumulatedSkipRef.current.timer) clearTimeout(accumulatedSkipRef.current.timer);
    };
  }, [showControls, resetControlsTimeout]);

  // Cleanup: Unlock orientation when component unmounts
  useEffect(() => {
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {
        // Ignore unlock errors on unmount
      });
    };
  }, []);

  // Cleanup: Pause video and stop audio when navigating away from screen
  useEffect(() => {
    return () => {
      // When user navigates away (back button), pause video and stop audio
      safePlayerCall(() => player.pause(), "unmountCleanupPause");
      stopAudio().catch(() => {
        // Ignore stop errors
      });
      backgroundAudioActiveRef.current = false;

      // Save cumulative watch time for free tier tracking
      if (watchedEpisodeIdRef.current && isFreeTier) {
        const currentPos = currentTimeRef.current;
        if (videoStartPositionRef.current !== null && currentPos > 0) {
          const actualPlaybackTime = Math.floor(
            currentPos - videoStartPositionRef.current,
          );
          const totalWatchedTime =
            initialCumulativeTimeRef.current + actualPlaybackTime;
          updateEpisodeCumulativeTime(
            watchedEpisodeIdRef.current,
            totalWatchedTime,
          );
          saveLimitedAccessToStorage();
        }
      }
    };
  }, [isFreeTier, updateEpisodeCumulativeTime, saveLimitedAccessToStorage, player, safePlayerCall]);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(
    null,
  );
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [seasonEpisodesById, setSeasonEpisodesById] = useState<
    Record<string, EpisodeItem[]>
  >({});
  const [seasonEpisodesLoading, setSeasonEpisodesLoading] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [similarVideos, setSimilarVideos] = useState<any[]>([]);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const trailerEpisodeId = content?.trailer?.id ?? null;
  const isTrailerPlayback =
    content?.type === "TRAILER" ||
    (trailerEpisodeId !== null && selectedEpisodeId === trailerEpisodeId) ||
    ((content?.type === "DOCUMENTARY" || content?.type === "SERIES") &&
      trailerEpisodeId !== null &&
      !episodeIdFromUrl &&
      selectedEpisodeId === null);

  // New gesture-based controls state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  // Double-tap accumulation: stores side + accumulated skip amount
  const [showDoubleTapFeedback, setShowDoubleTapFeedback] = useState<{
    side: "left" | "right";
    amount: number;
  } | null>(null);
  // Quality selector (GAP 8: wired settings modal + GAP 1: URL rebuild)
  const [qualityLevel, setQualityLevel] = useState<"auto" | "1080p" | "720p" | "480p">("auto");
  // Drag seek state
  const [isDragging, setIsDragging] = useState(false);
  const [dragDisplay, setDragDisplay] = useState(0); // 0–100
  const lastTapTimeRef = useRef<number>(0);
  const lastTapSideRef = useRef<"left" | "right" | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const normalPlaybackRateRef = useRef<number>(1);
  // Controls fade animation (GAP 9)
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const showControlsRef = useRef(true);
  // Accumulated double-tap skip ref
  const accumulatedSkipRef = useRef<{
    side: "left" | "right";
    amount: number;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ side: "right", amount: 0, timer: null });
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Progress bar drag refs
  const dragProgressRef = useRef(0);
  const progressBarWidthRef = useRef(0);
  // Quality change guard — skip effect on first render
  const isFirstQualityRender = useRef(true);

  useEffect(() => {
    primaryEpisodeRef.current = primaryEpisode;
  }, [primaryEpisode]);

  // Keep videoTitleRef current for analytics event names.
  useEffect(() => {
    if (!content) {
      videoTitleRef.current = '';
      return;
    }
    videoTitleRef.current = primaryEpisode?.title
      ? `${content.title} — ${primaryEpisode.title}`
      : content.title;
  }, [content, primaryEpisode]);

  // Fetch subscription status for free tier check
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
    }
  }, [isAuthenticated, fetchSubscription]);

  // Reset limited access timer when starting a new video
  useEffect(() => {
    resetCurrentVideoWatchTime();
    videoStartPositionRef.current = null;
    showUpgradeModal2SecRef.current = false;

    if (isTrailerPlayback) {
      initialCumulativeTimeRef.current = 0;
      watchedEpisodeIdRef.current = null;
      return;
    }

    // Load cumulative time for this episode (for free tier tracking)
    const episodeId = episodeIdFromUrl || contentId;
    if (episodeId && (isFreeTier || isGuest)) {
      // Check if this is the unlocked video (Free Tier only)
      const isUnlocked = isFreeTier && episodeId === freeUnlockedVideoId;

      const cumulativeTime = getEpisodeCumulativeTime(episodeId);
      initialCumulativeTimeRef.current = cumulativeTime;
      watchedEpisodeIdRef.current = episodeId;

      // If already watched for 2+ minutes AND NOT UNLOCKED, show modal immediately
      if (cumulativeTime >= 120 && !isUnlocked) {
        showUpgradeModal2SecRef.current = true;
        setShowLimitedAccessLoginModal(true);
        setLimitedAccessModalReason("free-tier-limit");
        setIsPlaying(false);
      }
    } else {
      initialCumulativeTimeRef.current = 0;
      watchedEpisodeIdRef.current = null;
    }
  }, [
    contentId,
    episodeIdFromUrl,
    resetCurrentVideoWatchTime,
    isFreeTier,
    getEpisodeCumulativeTime,
    isTrailerPlayback,
  ]);

  // Update current time ref whenever currentTime changes
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Limited Access: Check if user is trying to watch more than 3 videos
  // (This is a backup check to ensure modal stays visible if state changes)
  useEffect(() => {
    if (isGuest && selectedEpisodeId && !isTrailerPlayback) {
      const liveState = useLimitedAccessStore.getState();
      if (!liveState.watchedVideoIds.has(selectedEpisodeId) && liveState.videosWatchedCount >= 3) {
        setShowLimitedAccessLoginModal(true);
        setLimitedAccessModalReason("video-limit");
        setIsPlaying(false);
      }
    }
  }, [selectedEpisodeId, isGuest, videosWatchedCount, isTrailerPlayback]);

  // Limited Access: Track actual video playback time and show login after 30 seconds (or 2 minutes for free tier)
  useEffect(() => {
    if (isTrailerPlayback) {
      if (watchTimeTrackerRef.current) {
        clearInterval(watchTimeTrackerRef.current);
        watchTimeTrackerRef.current = null;
      }
      return;
    }

    if (isPlaying && !showLimitedAccessLoginModal) {
      // Start the watch timer
      watchTimeTrackerRef.current = setInterval(() => {
        const currentPos = currentTimeRef.current;

        // Initialize start position on first check
        if (videoStartPositionRef.current === null && currentPos > 0) {
          videoStartPositionRef.current = currentPos;
        }

        // Calculate actual playback time
        if (videoStartPositionRef.current !== null) {
          const actualPlaybackTime = Math.floor(
            currentPos - videoStartPositionRef.current,
          );
          updateCurrentVideoWatchTime(actualPlaybackTime);

          // FREE TIER: Show modal after 2 minutes (cumulative across sessions)
          if (isFreeTier && watchedEpisodeIdRef.current) {
            const isUnlocked = watchedEpisodeIdRef.current === freeUnlockedVideoId;

            // If this is the FIRST video they play, unlock it permanently
            if (!freeUnlockedVideoId) {
              setFreeUnlockedVideoId(watchedEpisodeIdRef.current);
              saveLimitedAccessToStorage();
              // Don't apply limit for the first video
              return;
            }

            // If it's the unlocked video, don't apply 2-minute limit
            if (isUnlocked) {
              return;
            }

            const totalWatchedTime =
              initialCumulativeTimeRef.current + actualPlaybackTime;

            // Update cumulative time in store every 5 seconds of playback
            if (actualPlaybackTime > 0 && actualPlaybackTime % 5 === 0) {
              updateEpisodeCumulativeTime(
                watchedEpisodeIdRef.current,
                totalWatchedTime,
              );
              saveLimitedAccessToStorage();
            }

            if (totalWatchedTime >= 120 && !showUpgradeModal2SecRef.current) {
              showUpgradeModal2SecRef.current = true;
              // Save final cumulative time
              updateEpisodeCumulativeTime(
                watchedEpisodeIdRef.current,
                totalWatchedTime,
              );
              saveLimitedAccessToStorage();
              setShowLimitedAccessLoginModal(true);
              setLimitedAccessModalReason("free-tier-limit");
              setIsPlaying(false);
              if (watchTimeTrackerRef.current) {
                clearInterval(watchTimeTrackerRef.current);
                watchTimeTrackerRef.current = null;
              }
              return;
            }
          }

          // GUEST (NOT AUTHENTICATED): Show login modal after 120 seconds (2 minutes) of actual playback
          if (isGuest) {
            const { loginModalShownFor30s } = useLimitedAccessStore.getState();
            if (actualPlaybackTime >= 120 && !loginModalShownFor30s) {
              setLoginModalShownFor30s(true);
              setShowLimitedAccessLoginModal(true);
              setLimitedAccessModalReason("guest-limit");
              setIsPlaying(false);
              if (watchTimeTrackerRef.current) {
                clearInterval(watchTimeTrackerRef.current);
                watchTimeTrackerRef.current = null;
              }
            }
          }
        }
      }, 1000); // Check every second

      return () => {
        if (watchTimeTrackerRef.current) {
          clearInterval(watchTimeTrackerRef.current);
          watchTimeTrackerRef.current = null;
        }
      };
    }
  }, [
    isTrailerPlayback,
    isAuthenticated,
    isPlaying,
    showLimitedAccessLoginModal,
    isFreeTier,
    setLoginModalShownFor30s,
    updateCurrentVideoWatchTime,
    updateEpisodeCumulativeTime,
    saveLimitedAccessToStorage,
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setPlaybackError(null);
      setComingSoon(false);
      try {
        const detailRes = await contentService.getContentById(contentId);
        if (cancelled) return;
        const contentDetail = detailRes?.content ?? null;
        if (!contentDetail) {
          setPlaybackError("unavailable");
          return;
        }
        setContent(contentDetail);
        const prefersTrailerFirst =
          contentDetail.type === "DOCUMENTARY" ||
          contentDetail.type === "SERIES";
        // Pick primary episode
        let episode: PlayableEpisode | null = null;
        // If episodeId is in URL, try to find it
        if (episodeIdFromUrl) {
          // First check in episodes array
          const found = contentDetail.episodes?.find(
            (e: EpisodeItem) => e.id === episodeIdFromUrl,
          );
          if (found) {
            episode = {
              id: found.id,
              title: found.title,
              duration: found.duration,
            };
          } else if (contentDetail.seasons?.length) {
            // If not found and seasons exist, fetch episodes for each season
            for (const season of contentDetail.seasons) {
              const episodesRes = await contentService.getEpisodes(
                contentDetail.id,
                season.id,
              );
              if (cancelled) return;
              const episodes = episodesRes;
              const found = episodes.find(
                (e: any) => e.id === episodeIdFromUrl,
              );
              if (found) {
                episode = {
                  id: found.id,
                  title: found.title,
                  duration: found.duration,
                };
                break;
              }
            }
          }
        }
        // If no episode selected yet, pick primary episode
        if (!episode) {
          // Series/Documentaries should start with trailer when available.
          if (prefersTrailerFirst && contentDetail.trailer) {
            episode = {
              id: contentDetail.trailer.id,
              title: contentDetail.trailer.title,
              duration: contentDetail.trailer.duration,
            };
          } else {
            // If seasons exist, select the first episode from the first season
            if (
              contentDetail.seasons &&
              contentDetail.seasons.length > 0 &&
              contentDetail.episodes
            ) {
              const firstSeason = contentDetail.seasons[0];
              const firstSeasonEpisodes = contentDetail.episodes
                .filter((e: EpisodeItem) => e.seasonId === firstSeason.id)
                .sort(
                  (a: EpisodeItem, b: EpisodeItem) =>
                    a.episodeNumber - b.episodeNumber,
                );
              if (firstSeasonEpisodes.length > 0) {
                const first = firstSeasonEpisodes[0];
                episode = {
                  id: first.id,
                  title: first.title,
                  duration: first.duration,
                };
              }
            }
            // Otherwise, use the first episode from the episodes array
            if (!episode) {
              const firstEpisode = contentDetail.episodes?.[0];
              if (firstEpisode) {
                episode = {
                  id: firstEpisode.id,
                  title: firstEpisode.title,
                  duration: firstEpisode.duration,
                };
              }
            }
            // Fallback to trailer if available
            if (!episode && contentDetail.trailer) {
              episode = {
                id: contentDetail.trailer.id,
                title: contentDetail.trailer.title,
                duration: contentDetail.trailer.duration,
              };
            }
          }
        }
        if (cancelled) return;
        if (!episode) {
          // No episode and no trailer — content has no video yet (coming soon placeholder)
          const hasNoVideo =
            !contentDetail.episodes?.length && !contentDetail.trailer;
          if (hasNoVideo) {
            setComingSoon(true);
          } else {
            setPlaybackError("unavailable");
          }
          return;
        }
        setPrimaryEpisode(episode);
        setSelectedEpisodeId(episode.id);
        const isTrailerSelection =
          contentDetail.type === "TRAILER" ||
          (contentDetail.trailer && episode.id === contentDetail.trailer.id);

        // ===== GUEST VIDEO LIMIT CHECK =====
        // Now we know the EXACT episode that will play and whether it's a trailer.
        // Block BEFORE fetching playback URL if guest has exceeded 3 previews.
        if (isGuest && !isTrailerSelection) {
          const liveState = useLimitedAccessStore.getState();
          if (
            liveState.videosWatchedCount >= 3 &&
            !liveState.watchedVideoIds.has(episode.id)
          ) {
            setLoading(false);
            setShowLimitedAccessLoginModal(true);
            setLimitedAccessModalReason("video-limit");
            setIsPlaying(false);
            return;
          }
        }

        if (isAuthenticated) {
          let nextSavedProgress = resumeFromUrlSec;
          // Fetch saved progress from continue watching BEFORE loading video
          try {
            const continueWatchingList =
              await streamingService.getContinueWatching();
            if (cancelled) return;
            const savedItem = continueWatchingList.find(
              (item) => item.episodeId === episode.id,
            );
            if (savedItem && savedItem.progress > 0) {
              nextSavedProgress = Math.max(nextSavedProgress, savedItem.progress);
            }
          } catch (error) {
            console.error("Failed to fetch saved progress:", error);
            // Continue without saved progress
          }

          if (nextSavedProgress > 0) {
            setSavedProgress(nextSavedProgress);
            hasSeekedToSavedProgressRef.current = false;
          }
        }

        // Get playback info
        const playbackRes = await streamingService.getPlaybackInfo(episode.id, {
          asGuest: !isAuthenticated,
        });
        if (cancelled) return;
        if (!playbackRes?.url) {
          console.error(
            "[Watch] No playback URL available for episode:",
            episode.id,
          );
          setPlaybackError("unavailable");
          return;
        }
        console.log("[Watch] Loaded playback info successfully");
        setPlaybackInfo(playbackRes);

        // Mark video as watched for limited access tracking (only if Guest)
        // Track by EPISODE ID, not content ID, so each episode counts separately
        if (isGuest && episode && !isTrailerSelection) {
          const liveState = useLimitedAccessStore.getState();
          if (!liveState.watchedVideoIds.has(episode.id)) {
            incrementVideosWatched(episode.id);
            saveLimitedAccessToStorage();
          }
        }
      } catch (err: any) {
        if (cancelled) return;
        const isExpectedGuestAuthError =
          !isAuthenticated &&
          (err?.message === "unauthorized" || err?.message === "forbidden");
        if (!isExpectedGuestAuthError) {
          console.error("[Watch] Error loading video:", err);
        }
        if (err.message === "unauthorized") {
          setPlaybackError("unauthorized");
        } else if (err.message === "forbidden") {
          setPlaybackError("forbidden");
        } else {
          setPlaybackError("unavailable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    contentId,
    episodeIdFromUrl,
    incrementVideosWatched,
    isAuthenticated,
    saveLimitedAccessToStorage,
  ]);

  // Fetch similar videos
  useEffect(() => {
    const fetchSimilarVideos = async () => {
      if (!content) return;
      try {
        const allContent = await contentService.getContentForBrowse(
          content.type as any,
        );
        // Filter out current video and get up to 10 similar ones
        const similar = allContent
          .filter((item) => item.id !== contentId)
          .slice(0, 10);
        setSimilarVideos(similar);
      } catch (error) {
        console.error("Failed to fetch similar videos:", error);
      }
    };
    fetchSimilarVideos();
  }, [content, contentId]);

  // Keep savedProgress ref in sync so event listeners always see the current value
  useEffect(() => {
    savedProgressRef.current = savedProgress;
  }, [savedProgress]);

  // Load new source into player when playback URL becomes available.
  // Pre-roll runs before content starts; player.play() fires after it resolves.
  useEffect(() => {
    const url = playbackInfo?.url;
    if (!url) return;
    let cancelled = false;
    hasSeekedToSavedProgressRef.current = false;
    // Reset per-source analytics state.
    hasTrackedFirstPlayRef.current = false;
    contentEndedRef.current = false;
    adJustResumedRef.current = false;

    // Pause any in-flight playback before pre-roll begins so content never flashes first.
    safePlayerCall(() => player.pause(), "prePrerollPause");
    void adSystem.triggerPreRoll().then(() => {
      if (cancelled) return;
      safePlayerCall(() => player.replace({ uri: url }), "sourceReplace");
      safePlayerCall(() => player.play(), "postPrerollPlay");
    });
    return () => {
      cancelled = true;
    };
  }, [playbackInfo?.url, player, safePlayerCall]);

  // GAP 1: Quality selector URL rebuild (`?quality=720p`) and keep playback position.
  useEffect(() => {
    if (!playbackInfo?.url) return;
    if (isFirstQualityRender.current) {
      isFirstQualityRender.current = false;
      return;
    }

    const base = playbackInfo.url.split("?")[0];
    const newUrl = qualityLevel === "auto" ? base : `${base}?quality=${qualityLevel}`;
    const currentPos = player.currentTime;

    safePlayerCall(() => player.replace({ uri: newUrl }), "qualityReplace");
    const seekTimer = setTimeout(() => {
      try {
        safePlayerCall(() => player.seekBy(currentPos - player.currentTime), "qualitySeekRestore");
        if (isPlayingRef.current) safePlayerCall(() => player.play(), "qualityResumePlay");
      } catch {
        // Ignore seek/play errors after source replacement
      }
    }, 800);

    return () => {
      clearTimeout(seekTimer);
    };
  }, [qualityLevel, playbackInfo?.url, player, safePlayerCall]);

  // Keep isPlayingRef current so stable ad callbacks can read playing state.
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Sync playback rate → player (replaces expo-av rate prop)
  useEffect(() => {
    safePlayerCall(() => {
      player.playbackRate = playbackRate;
    }, "syncPlaybackRate");
  }, [playbackRate, player, safePlayerCall]);

  // expo-video: Player status changes (loading → readyToPlay / error)
  useEventListener(player, "statusChange", ({ status }: { status: string }) => {
    setIsBuffering(status === "loading");
    if (status === "readyToPlay") {
      setLoading(false);
      const d = player.duration;
      if (d && d > 0) setDuration(d);
      // Seek to saved progress on first load of each source
      if (!hasSeekedToSavedProgressRef.current && savedProgressRef.current > 0) {
        hasSeekedToSavedProgressRef.current = true;
        safePlayerCall(
          () => player.seekBy(savedProgressRef.current - player.currentTime),
          "seekToSavedProgress",
        );
      }
    } else if (status === "error") {
      console.error("[Watch] Video playback error");
      setPlaybackError("unavailable");
      setLoading(false);
    }
  });

  // expo-video: Playback time updates (~250 ms while playing)
  useEventListener(player, "timeUpdate", ({ currentTime: ct }: { currentTime: number; bufferedPosition: number }) => {
    setCurrentTime(ct);
    adSystem.onTimeUpdate(ct);
  });

  // Fallback timer sync: keeps UI time moving even if a timeUpdate event is missed.
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      let t = 0;
      try {
        t = player.currentTime;
      } catch {
        return;
      }
      if (!Number.isFinite(t) || t < 0) return;
      setCurrentTime((prev) => (Math.abs(prev - t) > 0.2 ? t : prev));
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, player]);

  // expo-video: Video reached end
  useEventListener(player, "playToEnd", () => {
    // Mark ended before setIsPlaying(false) so playingChange does not track
    // the resulting state change as a user pause.
    contentEndedRef.current = true;
    trackEvent('Video', 'complete', videoTitleRef.current || undefined);
    setIsPlaying(false);
    const episode = primaryEpisodeRef.current;
    if (episode && isAuthenticated) {
      const durationSec = durationToSeconds(episode.duration);
      streamingService.reportProgress(
        episode.id,
        lastPositionRef.current,
        durationSec > 0 ? durationSec : undefined,
      );
    }
    // Post-roll: fire after content ends (fire-and-forget — nothing resumes after).
    void adSystem.triggerPostRoll();
  });

  // expo-video: Report progress when playback pauses; track play/pause/resume events.
  useEventListener(player, "playingChange", ({ isPlaying: nowPlaying }: { isPlaying: boolean }) => {
    setIsPlaying(nowPlaying);
    if (!nowPlaying) {
      const episode = primaryEpisodeRef.current;
      if (episode && lastPositionRef.current > 0 && isAuthenticated) {
        const durationSec = durationToSeconds(episode.duration);
        lastReportedRef.current = lastPositionRef.current;
        streamingService.reportProgress(
          episode.id,
          lastPositionRef.current,
          durationSec > 0 ? durationSec : undefined,
        );
      }
      // Track pause — skip if the content ended naturally or an ad paused the player.
      if (!adSystem.adActiveRef.current && !contentEndedRef.current) {
        trackEvent('Video', 'pause', videoTitleRef.current || undefined);
      }
      // Consume the ended flag after the first playingChange(false) that follows.
      contentEndedRef.current = false;
    } else {
      // Track play / resume — skip if the ad system triggered playback.
      if (!adSystem.adActiveRef.current) {
        if (!hasTrackedFirstPlayRef.current) {
          // First play for this source.
          hasTrackedFirstPlayRef.current = true;
          adJustResumedRef.current = false; // clear suppression if set
          trackEvent('Video', 'play', videoTitleRef.current || undefined);
        } else if (adJustResumedRef.current) {
          // Ad system resumed content — suppress this event.
          adJustResumedRef.current = false;
        } else {
          trackEvent('Video', 'resume', videoTitleRef.current || undefined);
        }
      }
    }
  });

  useEffect(() => {
    lastPositionRef.current = currentTime;
  }, [currentTime]);

  // Track Ad impression when adOverlay transitions from null → non-null.
  const prevAdOverlayRef = useRef(adSystem.adOverlay);
  useEffect(() => {
    const prev = prevAdOverlayRef.current;
    prevAdOverlayRef.current = adSystem.adOverlay;
    if (!prev && adSystem.adOverlay) {
      trackEvent('Ad', 'ad_impression', adSystem.adOverlay.slot);
    }
  }, [adSystem.adOverlay, trackEvent]);

  useEffect(() => {
    return () => {
      const episode = primaryEpisodeRef.current;
      const progressSeconds = lastPositionRef.current;
      if (!isAuthenticated || !episode || progressSeconds <= 0) return;
      const durationSec = durationToSeconds(episode.duration);
      streamingService.reportProgress(
        episode.id,
        progressSeconds,
        durationSec > 0 ? durationSec : undefined,
      );
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!playbackInfo || !primaryEpisode || !isPlaying) return;
    const title = primaryEpisode
      ? `${content?.title} - ${primaryEpisode.title}`
      : content?.title || "Playing Audio";
    preloadAudioFromUrl({
      url: playbackInfo.url,
      title,
    }).catch(() => {
      // Ignore preload errors
    });
  }, [content?.title, isPlaying, playbackInfo?.url, primaryEpisode]);

  useEffect(() => {
    if (!playbackInfo || !primaryEpisode) return;

    const handleAppStateChange = async (nextState: AppStateStatus) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState === "active" && nextState === "background") {
        // App moving to actual background: pause video and optionally start audio
        // BUT: don't start audio if there are active downloads (user might be interacting with notification)
        // OR if we just interacted with a notification (within cooldown period)
        if (
          backgroundAudioActiveRef.current ||
          downloadService.hasActiveDownloads() ||
          downloadService.isInNotificationCooldown()
        )
          return;
        wasPlayingRef.current = isPlaying;
        backgroundAudioActiveRef.current = true;
        setIsPlaying(false);

        // expo-video: read currentTime directly (synchronous property)
        const resumePosition = player.currentTime > 0 ? player.currentTime : lastPositionRef.current;

        try {
          await stopAudio();
        } catch {
          // Ignore stop errors
        }

        safePlayerCall(() => player.pause(), "appBackgroundPause");
        if (wasPlayingRef.current) {
          const title = primaryEpisode
            ? `${content?.title} - ${primaryEpisode.title}`
            : content?.title || "Playing Audio";
          try {
            await playAudioFromUrl({
              url: playbackInfo.url,
              positionSeconds: resumePosition,
              title,
            });
          } catch {
            // Ignore background handoff errors
          }
        }
      }

      if (prevState !== "active" && nextState === "active") {
        const positionFromAudio = await getAudioPosition();
        const resumePosition =
          positionFromAudio > 0 ? positionFromAudio : lastPositionRef.current;

        try {
          await stopAudio();
        } catch {
          // Ignore stop errors
        }

        if (resumePosition > 0) {
          try {
            safePlayerCall(
              () => player.seekBy(resumePosition - player.currentTime),
              "appForegroundSeekRestore",
            );
            setCurrentTime(resumePosition);
          } catch {
            // Ignore seek errors
          }
        }

        if (wasPlayingRef.current) {
          setIsPlaying(true);
        }

        backgroundAudioActiveRef.current = false;
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
      stopAudio();
    };
  }, [content?.thumbnailUrl, isPlaying, playbackInfo, primaryEpisode, player, safePlayerCall]);

  useEffect(() => {
    if (!isAuthenticated || !primaryEpisode) return;
    const durationSec = durationToSeconds(primaryEpisode.duration);
    const intervalId = setInterval(() => {
      if (currentTime <= 0) return;
      if (
        currentTime - lastReportedRef.current <
        PROGRESS_REPORT_INTERVAL_SEC
      ) {
        return;
      }
      lastReportedRef.current = currentTime;
      streamingService.reportProgress(
        primaryEpisode.id,
        currentTime,
        durationSec > 0 ? durationSec : undefined,
      );
    }, PROGRESS_REPORT_INTERVAL_SEC * 1000);

    return () => clearInterval(intervalId);
  }, [currentTime, isAuthenticated, primaryEpisode]);
  const toggleFullscreen = useCallback(() => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    if (next) {
      void lockLandscape();
    } else {
      void lockPortrait();
    }
    resetControlsTimeout();
  }, [isFullscreen, lockLandscape, lockPortrait, resetControlsTimeout]);
  const lockLandscape = useCallback(async () => {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE,
      );
    } catch (error) {
      console.warn("Failed to lock landscape orientation:", error);
    }
  }, []);
  const lockPortrait = useCallback(async () => {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    } catch (error) {
      console.warn("Failed to lock portrait orientation:", error);
    }
  }, []);
  const cyclePlaybackRate = useCallback(() => {
    const rates = [0.5, 1, 1.25, 1.5, 2];
    setPlaybackRate((prev) => {
      const index = rates.indexOf(prev);
      return rates[(index + 1) % rates.length];
    });
  }, []);
  const handleSeek = useCallback((seekTime: number) => {
    safePlayerCall(() => player.seekBy(seekTime - player.currentTime), "handleSeek");
    setCurrentTime(seekTime);
  }, [player, safePlayerCall]);
  const handlePlayPause = useCallback(() => {
    if (player.playing) {
      safePlayerCall(() => player.pause(), "handlePlayPausePause");
    } else {
      safePlayerCall(() => player.play(), "handlePlayPausePlay");
    }
    resetControlsTimeout();
  }, [player, resetControlsTimeout, safePlayerCall]);
  const handleSkip = useCallback(
    (deltaSeconds: number) => {
      const nextTime = Math.max(
        0,
        Math.min(
          currentTime + deltaSeconds,
          duration || currentTime + deltaSeconds,
        ),
      );
      safePlayerCall(() => player.seekBy(nextTime - player.currentTime), "handleSkip");
      setCurrentTime(nextTime);
    },
    [currentTime, duration, player, safePlayerCall],
  );

  // Double tap handler with YouTube-style accumulation (+10, +20, +30...) 
  const handleDoubleTap = useCallback(
    (side: "left" | "right") => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;
      const acc = accumulatedSkipRef.current;

      if (timeSinceLastTap < DOUBLE_TAP_WINDOW_MS && lastTapSideRef.current === side) {
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

  const handleSideTap = useCallback((side: "left" | "right") => {
    if (showControlsRef.current) {
      resetControlsTimeout();
    } else {
      handleDoubleTap(side);
    }
  }, [handleDoubleTap, resetControlsTimeout]);

  const handleProgressBarPress = useCallback(
    (event: any) => {
      if (duration <= 0 || progressBarWidth <= 0) return;
      const locationX = Math.max(
        0,
        Math.min(event.nativeEvent.locationX, progressBarWidth),
      );
      const nextTime = (locationX / progressBarWidth) * duration;
      handleSeek(nextTime);
      resetControlsTimeout();
    },
    [duration, progressBarWidth, handleSeek, resetControlsTimeout],
  );

  // Draggable seek thumb (GAP 3)
  const progressPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
      onPanResponderGrant: (e) => {
        if (duration <= 0 || progressBarWidthRef.current <= 0) return;
        showControlsAnimated();
        setIsDragging(true);
        const pct = Math.max(
          0,
          Math.min(1, e.nativeEvent.locationX / progressBarWidthRef.current),
        );
        dragProgressRef.current = pct;
        setDragDisplay(pct * 100);
      },
      onPanResponderMove: (e) => {
        if (duration <= 0 || progressBarWidthRef.current <= 0) return;
        const pct = Math.max(
          0,
          Math.min(1, e.nativeEvent.locationX / progressBarWidthRef.current),
        );
        dragProgressRef.current = pct;
        setDragDisplay(pct * 100);
      },
      onPanResponderRelease: () => {
        if (duration <= 0) {
          setIsDragging(false);
          return;
        }
        safePlayerCall(
          () => player.seekBy(dragProgressRef.current * player.duration - player.currentTime),
          "progressPanReleaseSeek",
        );
        setIsDragging(false);
        resetControlsTimeout();
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    }),
  ).current;

  // Long press handler for 2x speed
  const handlePressIn = useCallback(() => {
    holdTimeoutRef.current = setTimeout(() => {
      setIsHolding(true);
      normalPlaybackRateRef.current = playbackRate;
      setPlaybackRate(2);
    }, 500); // Hold for 500ms to activate 2x speed
  }, [playbackRate]);

  const handlePressOut = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (isHolding) {
      setIsHolding(false);
      setPlaybackRate(normalPlaybackRateRef.current);
    }
  }, [isHolding]);

  const handleEpisodeSelect = useCallback(
    async (episodeId: string) => {
      setSelectedEpisodeId(episodeId);
      setLoading(true);
      setPlaybackError(null);
      setSavedProgress(0);
      hasSeekedToSavedProgressRef.current = false;
      // Reset time display for new episode
      setCurrentTime(0);
      setDuration(0);
      // Reset watch time tracking for new episode
      videoStartPositionRef.current = null;
      showUpgradeModal2SecRef.current = false;
      // Reset ad tracking so all slots can fire again for the new episode.
      adSystem.resetAdState();
      // Reset analytics tracking state for the new episode.
      hasTrackedFirstPlayRef.current = false;
      contentEndedRef.current = false;
      adJustResumedRef.current = false;
      videoTitleRef.current = '';
      try {
        if (isAuthenticated) {
          // Fetch saved progress BEFORE loading video
          try {
            const continueWatchingList =
              await streamingService.getContinueWatching();
            const savedItem = continueWatchingList.find(
              (item) => item.episodeId === episodeId,
            );
            if (savedItem && savedItem.progress > 0) {
              console.log(
                `[Continue Watching] Found saved progress: ${savedItem.progress}s for episode ${episodeId}`,
              );
              setSavedProgress(savedItem.progress);
            } else {
              console.log(
                `[Continue Watching] No saved progress found for episode ${episodeId}`,
              );
            }
          } catch (error) {
            console.error("Failed to fetch saved progress:", error);
            // Continue without saved progress
          }
        }

        const playbackRes = await streamingService.getPlaybackInfo(episodeId, {
          asGuest: !isAuthenticated,
        });
        if (playbackRes?.url) {
          setPlaybackInfo(playbackRes);
          const allEpisodes = [
            ...(content?.episodes ?? []),
            ...Object.values(seasonEpisodesById).flat(),
          ];
          const episode = allEpisodes.find((e) => e.id === episodeId);
          if (episode) {
            setPrimaryEpisode({
              id: episode.id,
              title: episode.title,
              duration: episode.duration,
            });
          }

          if (isGuest) {
            const isTrailerSelection =
              content?.type === "TRAILER" ||
              (content?.trailer && episodeId === content.trailer.id);
            if (!isTrailerSelection) {
              // Check guest limit BEFORE allowing playback
              const liveState = useLimitedAccessStore.getState();
              if (!liveState.watchedVideoIds.has(episodeId)) {
                if (liveState.videosWatchedCount >= 3) {
                  // Already at limit, block this episode
                  setPlaybackInfo(null);
                  setShowLimitedAccessLoginModal(true);
                  setLimitedAccessModalReason("video-limit");
                  setIsPlaying(false);
                  return;
                }
                incrementVideosWatched(episodeId);
                saveLimitedAccessToStorage();
              }
            }
          }
        } else {
          setPlaybackError("unavailable");
        }
      } catch (err: any) {
        const isExpectedGuestAuthError =
          !isAuthenticated &&
          (err?.message === "unauthorized" || err?.message === "forbidden");
        if (!isExpectedGuestAuthError) {
          console.error("[Watch] Error changing episode:", err);
        }
        if (err.message === "unauthorized") {
          setPlaybackError("unauthorized");
        } else if (err.message === "forbidden") {
          setPlaybackError("forbidden");
        } else {
          setPlaybackError("unavailable");
        }
      } finally {
        setLoading(false);
      }
    },
    [
      content,
      contentId,
      incrementVideosWatched,
      isAuthenticated,
      saveLimitedAccessToStorage,
      seasonEpisodesById,
    ],
  );

  useEffect(() => {
    if (!content?.seasons?.length) {
      setSelectedSeasonId(null);
      setShowSeasonDropdown(false);
      return;
    }

    const sortedSeasons = [...content.seasons].sort(
      (a, b) => a.seasonNumber - b.seasonNumber,
    );

    // Keep user-selected season unless it is no longer valid.
    if (
      selectedSeasonId &&
      content.seasons.some((season) => season.id === selectedSeasonId)
    ) {
      return;
    }

    const selectedEpisodeSeasonId = content.episodes?.find(
      (episode) => episode.id === selectedEpisodeId,
    )?.seasonId;

    if (
      selectedEpisodeSeasonId &&
      content.seasons.some((season) => season.id === selectedEpisodeSeasonId)
    ) {
      setSelectedSeasonId(selectedEpisodeSeasonId);
      return;
    }

    setSelectedSeasonId(sortedSeasons[0].id);
  }, [content, selectedEpisodeId, selectedSeasonId]);

  useEffect(() => {
    setSeasonEpisodesById({});
  }, [contentId]);

  useEffect(() => {
    if (!content?.id || !selectedSeasonId) return;

    const embeddedEpisodes = (content.episodes ?? []).filter(
      (episode) => episode.seasonId === selectedSeasonId,
    );
    if (embeddedEpisodes.length > 0 || seasonEpisodesById[selectedSeasonId]) {
      return;
    }

    let cancelled = false;

    const loadSeasonEpisodes = async () => {
      setSeasonEpisodesLoading(true);
      try {
        const episodes = await contentService.getEpisodes(
          content.id,
          selectedSeasonId,
        );
        if (cancelled) return;
        setSeasonEpisodesById((prev) => ({
          ...prev,
          [selectedSeasonId]: episodes as EpisodeDto[],
        }));
      } finally {
        if (!cancelled) {
          setSeasonEpisodesLoading(false);
        }
      }
    };

    void loadSeasonEpisodes();

    return () => {
      cancelled = true;
    };
  }, [content, selectedSeasonId, seasonEpisodesById]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const formatDuration = (duration?: string): string => {
    if (!duration) return "";
    return duration;
  };
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accent} />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (!content) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Content not found</Text>{" "}
          <Text style={styles.errorText}>
            The content you're looking for doesn't exist or is no longer
            available.
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
  if (comingSoon) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.comingSoonContainer}>
          <Pressable
            style={styles.comingSoonBackButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={themeColors.textPrimary}
            />
          </Pressable>
          {content.thumbnailUrl ? (
            <View style={styles.comingSoonThumbnailWrapper}>
              <Image
                source={{ uri: content.thumbnailUrl }}
                style={styles.comingSoonThumbnail}
                resizeMode="cover"
              />
              <View style={styles.comingSoonOverlay}>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonBadgeText}>COMING SOON</Text>
                </View>
              </View>
            </View>
          ) : null}
          <Text style={styles.comingSoonTitle}>{content.title}</Text>
          {content.description ? (
            <Text style={styles.comingSoonDescription} numberOfLines={3}>
              {content.description}
            </Text>
          ) : null}
          <Text style={styles.comingSoonSubtext}>
            Video playback coming soon. Check back later.
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Browse Catalog</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (playbackError) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            {playbackError === "unauthorized"
              ? "Sign in to watch"
              : playbackError === "forbidden"
                ? "Active subscription required"
                : "Playback not available"}
          </Text>
          <Text style={styles.errorText}>
            {playbackError === "unauthorized"
              ? "You need to sign in to stream this video."
              : playbackError === "forbidden"
                ? "An active subscription is required to watch."
                : "This video cannot be played right now. Try again later."}
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
  if (!playbackInfo || !primaryEpisode) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Playback is not available for this content.
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
  const isEpisodicContent =
    content.type === "SERIES" ||
    content.type === "ANIMATION" ||
    content.type === "DOCUMENTARY";
  const sortedSeasons = [...(content.seasons ?? [])].sort(
    (a, b) => a.seasonNumber - b.seasonNumber,
  );
  const selectedSeason =
    sortedSeasons.find((season) => season.id === selectedSeasonId) ??
    sortedSeasons[0] ??
    null;
  const embeddedEpisodesForSelectedSeason = selectedSeason
    ? (content.episodes ?? [])
      .filter((episode) => episode.seasonId === selectedSeason.id)
      .sort((a, b) => a.episodeNumber - b.episodeNumber)
    : [];
  const episodesForSelectedSeason = selectedSeason
    ? embeddedEpisodesForSelectedSeason.length > 0
      ? embeddedEpisodesForSelectedSeason
      : (seasonEpisodesById[selectedSeason.id] ?? [])
    : [];
  const fallbackEpisodeMap = new Map<string, EpisodeItem>();
  (content.episodes ?? []).forEach((episode) => {
    fallbackEpisodeMap.set(episode.id, episode);
  });
  Object.values(seasonEpisodesById).forEach((episodes) => {
    episodes.forEach((episode) => {
      if (!fallbackEpisodeMap.has(episode.id)) {
        fallbackEpisodeMap.set(episode.id, episode);
      }
    });
  });
  const fallbackEpisodes = [...fallbackEpisodeMap.values()].sort(
    (a, b) => a.episodeNumber - b.episodeNumber,
  );
  const hasEpisodes =
    (content.episodes?.length ?? 0) > 0 || (content.seasons?.length ?? 0) > 0;
  const rightEdgeInset = Math.max(16, insets.right + 22);

  const renderVideoPlayer = (fullscreen: boolean) => (
    <View style={fullscreen ? styles.playerContainerFullscreen : styles.playerContainer}>
      <View style={[styles.videoWrapper, fullscreen && styles.videoWrapperFullscreen]}>
        <VideoView
          ref={videoViewRef}
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
        />

        {/* Controls Overlay — always mounted for fade animation */}
        <Animated.View
          style={[styles.controlsOverlay, { opacity: controlsOpacity }]}
          pointerEvents={showControls ? "box-none" : "none"}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.82)", "transparent"]}
            style={styles.topGradientBand}
            pointerEvents="none"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.88)"]}
            style={styles.bottomGradientBand}
            pointerEvents="none"
          />

          {/* Top controls: back + title + settings */}
          <View
            style={[
              styles.topControls,
              {
                paddingTop: fullscreen ? insets.top + 4 : 0,
                paddingRight: rightEdgeInset,
              },
            ]}
          >
            <Pressable style={styles.controlIcon} onPress={() => router.back()}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={themeColors.textPrimary}
              />
            </Pressable>
            <Text style={styles.overlayTitle} numberOfLines={1}>
              {primaryEpisode?.title ?? content?.title ?? ""}
            </Text>
            <Pressable
              style={styles.controlIcon}
              onPress={() => setShowSettingsModal(true)}
            >
              <Ionicons
                name="settings-outline"
                size={24}
                color={themeColors.textPrimary}
              />
            </Pressable>
          </View>

          {/* Center Play/Pause Button */}
          <Pressable
            style={styles.centerPlayButton}
            onPress={handlePlayPause}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={48}
              color={themeColors.textPrimary}
            />
          </Pressable>

          {/* Bottom Controls */}
          <View
            style={[
              styles.bottomSection,
              fullscreen && styles.bottomSectionFullscreen,
              { paddingBottom: fullscreen ? Math.max(12, insets.bottom + 8) : 10 },
            ]}
          >
            <View
              style={[
                styles.bottomControls,
                fullscreen && styles.bottomControlsFullscreen,
                { paddingRight: rightEdgeInset },
              ]}
            >
              <Text style={styles.timeText}>
                {formatTime(Math.floor(currentTime))} /{" "}
                {formatTime(Math.floor(duration))}
              </Text>

              <View style={styles.bottomControlsRight}>
                <Pressable
                  style={styles.controlIcon}
                  onPress={toggleFullscreen}
                >
                  <Ionicons
                    name={fullscreen ? "contract" : "expand"}
                    size={24}
                    color={themeColors.textPrimary}
                  />
                </Pressable>
              </View>
            </View>

            {/* YouTube-style Progress Bar */}
            <View
              style={[
                styles.progressBarContainer,
                fullscreen && styles.progressBarContainerFullscreen,
              ]}
            >
              <View
                style={[
                  styles.progressBarTouchArea,
                  fullscreen && styles.progressBarTouchAreaFullscreen,
                ]}
                onLayout={(event) => {
                  setProgressBarWidth(event.nativeEvent.layout.width);
                }}
                {...progressPanResponder.panHandlers}
              >
                <View
                  style={[
                    styles.progressBar,
                    fullscreen && styles.progressBarFullscreen,
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${
                          isDragging
                            ? dragDisplay
                            : duration > 0
                              ? (currentTime / duration) * 100
                              : 0
                        }%`,
                      },
                    ]}
                  />
                  {progressBarWidth > 0 && (
                    <View
                      style={[
                        styles.seekThumb,
                        {
                          left:
                            ((isDragging
                              ? dragDisplay
                              : duration > 0
                                ? (currentTime / duration) * 100
                                : 0) /
                              100) *
                              progressBarWidth -
                            7,
                        },
                      ]}
                    />
                  )}
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Gesture Overlay - MUST BE LAST so it's on top and captures touches */}
        <View
          style={styles.gestureContainer}
          pointerEvents={showControls ? "none" : "box-none"}
        >
          <Pressable
            style={styles.gestureZoneLeft}
            onPress={() => handleSideTap("left")}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          />
          <Pressable
            style={styles.gestureZoneCenter}
            onPress={handleCenterTap}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          />
          <Pressable
            style={styles.gestureZoneRight}
            onPress={() => handleSideTap("right")}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          />
        </View>

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
                showDoubleTapFeedback.side === "left"
                  ? "play-back"
                  : "play-forward"
              }
              size={48}
              color={themeColors.textPrimary}
            />
            <Text style={styles.doubleTapText}>
              {showDoubleTapFeedback.side === "left" ? "-" : "+"}
              {showDoubleTapFeedback.amount}s
            </Text>
          </View>
        )}

        {isHolding && (
          <View style={styles.speedIndicator}>
            <Text style={styles.speedIndicatorText}>2x</Text>
          </View>
        )}

        {adSystem.adLoading && (
          <View style={styles.adLoadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}

        {adSystem.adOverlay ? (
          <AdOverlay
            {...adSystem.adOverlay}
            adVideoPlayer={adSystem.adVideoPlayer}
            onDone={adSystem.onAdDone}
            onProgress={adSystem.onAdProgress}
            resumeFromSeconds={adSystem.adPlaybackPositionRef.current}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={fullscreen}
            onLearnMoreClick={() =>
              trackEvent('Ad', 'ad_click', adSystem.adOverlay?.slot)
            }
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={isFullscreen ? [] : ["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!isFullscreen}
      >
        {/* Video Player */}
        {!isFullscreen && renderVideoPlayer(false)}
        {/* Content Info */}
        {content && (
          <View style={styles.contentInfo}>
            {/* Title and Add to List */}
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>
                {content.title}
              </Text>
              <AddToMyListButton contentId={content.id} size="md" />
            </View>

            {/* Description with See More */}
            {content.description && (
              <View style={styles.descriptionContainer}>
                <Text
                  style={styles.description}
                  numberOfLines={descriptionExpanded ? undefined : 2}
                >
                  {content.description}
                </Text>
                {content.description.length > 100 && (
                  <Pressable
                    onPress={() => setDescriptionExpanded(!descriptionExpanded)}
                  >
                    <Text style={styles.seeMoreText}>
                      {descriptionExpanded ? "Show less" : "See more"}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Video Meta Info */}
            <View style={styles.metaInfo}>
              {content.releaseYear && (
                <Text style={styles.metaText}>{content.releaseYear}</Text>
              )}
              {content.ageRating && (
                <Text style={styles.metaText}>{content.ageRating}</Text>
              )}
              {content.category && (
                <Text style={styles.metaText}>{content.category}</Text>
              )}
            </View>
          </View>
        )}

        {/* Similar Videos */}
        {similarVideos.length > 0 &&
          content.type !== "DOCUMENTARY" &&
          content.type !== "SERIES" && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionTitle}>Recommended to you</Text>
              <FlatList
                data={similarVideos}
                scrollEnabled={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.similarVideoCard}
                    onPress={() => {
                      router.push(`/video/${item.id}`);
                    }}
                  >
                    {item.thumbnailUrl ? (
                      <Image
                        source={{ uri: item.thumbnailUrl }}
                        style={styles.similarThumbnail}
                      />
                    ) : (
                      <View style={styles.similarThumbnailPlaceholder}>
                        <Ionicons
                          name="play-circle"
                          size={32}
                          color={themeColors.textSecondary}
                        />
                      </View>
                    )}
                    <View style={styles.similarVideoInfo}>
                      <Text style={styles.similarVideoTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      {item.releaseYear && (
                        <Text style={styles.similarVideoMetaText}>
                          {item.releaseYear}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                )}
              />
            </View>
          )}

        {/* Episodes & Seasons */}
        {isEpisodicContent && hasEpisodes && (
          <View style={styles.episodesSection}>
            <Text style={styles.sectionTitle}>Episodes & Seasons</Text>
            {sortedSeasons.length > 0 ? (
              <>
                <View style={styles.seasonDropdownWrapper}>
                  <Pressable
                    style={styles.seasonDropdownTrigger}
                    onPress={() =>
                      setShowSeasonDropdown((prevOpen) => !prevOpen)
                    }
                  >
                    <Text style={styles.seasonDropdownLabel}>Season</Text>
                    <View style={styles.seasonDropdownValueWrap}>
                      <Text style={styles.seasonDropdownValue}>
                        {selectedSeason
                          ? selectedSeason.title ||
                          `Season ${selectedSeason.seasonNumber}`
                          : "Select season"}
                      </Text>
                      <Ionicons
                        name={
                          showSeasonDropdown ? "chevron-up" : "chevron-down"
                        }
                        size={16}
                        color={themeColors.textSecondary}
                      />
                    </View>
                  </Pressable>

                  {showSeasonDropdown && (
                    <View style={styles.seasonDropdownMenu}>
                      {sortedSeasons.map((season) => {
                        const isActiveSeason = selectedSeason?.id === season.id;
                        return (
                          <Pressable
                            key={season.id}
                            style={[
                              styles.seasonDropdownItem,
                              isActiveSeason && styles.seasonDropdownItemActive,
                            ]}
                            onPress={() => {
                              setSelectedSeasonId(season.id);
                              setShowSeasonDropdown(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.seasonDropdownItemText,
                                isActiveSeason &&
                                styles.seasonDropdownItemTextActive,
                              ]}
                            >
                              {season.title || `Season ${season.seasonNumber}`}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>

                {episodesForSelectedSeason.length > 0 ? (
                  <FlatList
                    data={episodesForSelectedSeason}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                      const isActive = selectedEpisodeId === item.id;
                      return (
                        <Pressable
                          style={[
                            styles.episodeCard,
                            isActive && styles.episodeCardActive,
                          ]}
                          onPress={() => handleEpisodeSelect(item.id)}
                        >
                          {item.thumbnailUrl ? (
                            <Image
                              source={{ uri: item.thumbnailUrl }}
                              style={styles.episodeThumbnail}
                            />
                          ) : (
                            <View style={styles.episodeThumbnailPlaceholder}>
                              <Ionicons
                                name="play"
                                size={24}
                                color={themeColors.textSecondary}
                              />
                            </View>
                          )}
                          {isActive && (
                            <View style={styles.activeIndicator}>
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={themeColors.accent}
                              />
                            </View>
                          )}
                          <Text style={styles.episodeNumber}>
                            Episode {item.episodeNumber}
                          </Text>
                          <Text style={styles.episodeTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          {item.duration && (
                            <Text style={styles.episodeDuration}>
                              {formatDuration(item.duration)}
                            </Text>
                          )}
                        </Pressable>
                      );
                    }}
                    contentContainerStyle={styles.episodesList}
                  />
                ) : seasonEpisodesLoading ? (
                  <Text style={styles.emptySeasonText}>
                    Loading episodes...
                  </Text>
                ) : (
                  <Text style={styles.emptySeasonText}>
                    No episodes available for this season.
                  </Text>
                )}
              </>
            ) : fallbackEpisodes.length > 0 ? (
              <FlatList
                data={fallbackEpisodes}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isActive = selectedEpisodeId === item.id;
                  return (
                    <Pressable
                      style={[
                        styles.episodeCard,
                        isActive && styles.episodeCardActive,
                      ]}
                      onPress={() => handleEpisodeSelect(item.id)}
                    >
                      {item.thumbnailUrl ? (
                        <Image
                          source={{ uri: item.thumbnailUrl }}
                          style={styles.episodeThumbnail}
                        />
                      ) : (
                        <View style={styles.episodeThumbnailPlaceholder}>
                          <Ionicons
                            name="play"
                            size={24}
                            color={themeColors.textSecondary}
                          />
                        </View>
                      )}
                      {isActive && (
                        <View style={styles.activeIndicator}>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={themeColors.accent}
                          />
                        </View>
                      )}
                      <Text style={styles.episodeNumber}>
                        Episode {item.episodeNumber}
                      </Text>
                      <Text style={styles.episodeTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      {item.duration && (
                        <Text style={styles.episodeDuration}>
                          {formatDuration(item.duration)}
                        </Text>
                      )}
                    </Pressable>
                  );
                }}
                contentContainerStyle={styles.episodesList}
              />
            ) : null}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isFullscreen}
        transparent={false}
        animationType="fade"
        onRequestClose={toggleFullscreen}
        statusBarTranslucent
      >
        <View style={styles.fullscreenModalContainer}>
          {renderVideoPlayer(true)}
        </View>
      </Modal>

      {/* Limited Access Login Modal */}
      <Modal
        visible={showLimitedAccessLoginModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowLimitedAccessLoginModal(false);
          router.back();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name="lock-closed-outline"
              size={48}
              color={themeColors.accent}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>
              {limitedAccessModalReason === "video-limit"
                ? "Video Limit Reached"
                : limitedAccessModalReason === "free-tier-limit"
                  ? "Watch More with Premium"
                  : "Continue Watching?"}
            </Text>
            <Text style={styles.modalText}>
              {limitedAccessModalReason === "free-tier-limit"
                ? "Free users can watch up to 2 minutes per video. Upgrade to Premium for unlimited watching."
                : limitedAccessModalReason === "video-limit"
                  ? "You've watched 3 videos. Sign in or create an account to continue watching unlimited content."
                  : "You've watched 2 minutes. Sign in or create an account to continue watching without limits."}
            </Text>
            <View style={styles.modalButtons}>
              {limitedAccessModalReason === "free-tier-limit" ? (
                <>
                  <Pressable
                    style={styles.modalButtonPrimary}
                    onPress={() => {
                      setShowLimitedAccessLoginModal(false);
                      router.push("/plans");
                    }}
                  >
                    <Text style={styles.modalButtonPrimaryText}>
                      View Plans
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalButtonText}
                    onPress={() => {
                      setShowLimitedAccessLoginModal(false);
                      router.back();
                    }}
                  >
                    <Text style={styles.modalButtonTextLabel}>Go Back</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    style={styles.modalButtonPrimary}
                    onPress={() => {
                      setShowLimitedAccessLoginModal(false);
                      router.push({
                        pathname: "/login",
                        params: {
                          returnToVideoId: String(contentId ?? ""),
                          ...(selectedEpisodeId
                            ? { returnToEpisodeId: selectedEpisodeId }
                            : {}),
                          ...(currentTimeRef.current > 0
                            ? {
                                returnToResumeAt: String(
                                  Math.floor(currentTimeRef.current),
                                ),
                              }
                            : {}),
                          fromGuestPreview: "1",
                        },
                      });
                    }}
                  >
                    <Text style={styles.modalButtonPrimaryText}>Sign In</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalButtonSecondary}
                    onPress={() => {
                      setShowLimitedAccessLoginModal(false);
                      router.push({
                        pathname: "/signup",
                        params: {
                          returnToVideoId: String(contentId ?? ""),
                          ...(selectedEpisodeId
                            ? { returnToEpisodeId: selectedEpisodeId }
                            : {}),
                          ...(currentTimeRef.current > 0
                            ? {
                                returnToResumeAt: String(
                                  Math.floor(currentTimeRef.current),
                                ),
                              }
                            : {}),
                          fromGuestPreview: "1",
                        },
                      });
                    }}
                  >
                    <Text style={styles.modalButtonSecondaryText}>
                      Create Account
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalButtonText}
                    onPress={() => {
                      setShowLimitedAccessLoginModal(false);
                      router.back();
                    }}
                  >
                    <Text style={styles.modalButtonTextLabel}>Go Back</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.settingsModalContainer}>
          <Pressable
            style={styles.settingsModalBackdrop}
            onPress={() => setShowSettingsModal(false)}
          />
          <View style={styles.settingsModalContent}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Player Settings</Text>
              <Pressable onPress={() => setShowSettingsModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={themeColors.textPrimary}
                />
              </Pressable>
            </View>

            {/* Playback Speed */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Playback Speed</Text>
              <View style={styles.settingsOptions}>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <Pressable
                    key={rate}
                    style={[
                      styles.settingsOption,
                      playbackRate === rate && styles.settingsOptionActive,
                    ]}
                    onPress={() => {
                      setPlaybackRate(rate);
                      normalPlaybackRateRef.current = rate;
                    }}
                  >
                    <Text
                      style={[
                        styles.settingsOptionText,
                        playbackRate === rate &&
                        styles.settingsOptionTextActive,
                      ]}
                    >
                      {rate}x
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Quality */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Quality</Text>
              <View style={styles.settingsOptions}>
                {(["auto", "1080p", "720p", "480p"] as const).map((q) => (
                  <Pressable
                    key={q}
                    style={[
                      styles.settingsOption,
                      qualityLevel === q && styles.settingsOptionActive,
                    ]}
                    onPress={() => setQualityLevel(q)}
                  >
                    <Text
                      style={[
                        styles.settingsOptionText,
                        qualityLevel === q && styles.settingsOptionTextActive,
                      ]}
                    >
                      {q === "auto" ? "Auto" : q}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: { ...typography.body, color: themeColors.textSecondary },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: {
    ...typography.title,
    fontSize: 20,
    fontWeight: "700",
    color: themeColors.textPrimary,
    textAlign: "center",
  },
  errorText: {
    ...typography.body,
    color: themeColors.textSecondary,
    textAlign: "center",
  },
  backButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: themeColors.accent,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    ...typography.body,
    color: themeColors.background,
    fontWeight: "600",
  },
  playerContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
  },
  playerContainerFullscreen: {
    flex: 1,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: "#000",
  },
  fullscreenModalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoWrapper: { width: "100%", height: "100%", position: "relative" },
  videoWrapperFullscreen: {
    width: "100%",
    height: "100%",
  },
  video: { ...StyleSheet.absoluteFillObject },

  // Gesture overlay styles
  gestureContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 10,
    pointerEvents: "box-none",
  },
  gestureZoneLeft: {
    flex: 1,
    height: "100%",
    backgroundColor: "transparent",
  },
  gestureZoneCenter: {
    flex: 1,
    height: "100%",
    backgroundColor: "transparent",
  },
  gestureZoneRight: {
    flex: 1,
    height: "100%",
    backgroundColor: "transparent",
  },

  // Double tap feedback
  doubleTapFeedback: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -50 }],
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    zIndex: 4,
  },
  doubleTapLeft: {
    left: spacing.xl,
  },
  doubleTapRight: {
    right: spacing.xl,
  },
  doubleTapText: {
    ...typography.body,
    color: themeColors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginTop: spacing.xs,
  },

  // 2x speed indicator
  speedIndicator: {
    position: "absolute",
    top: spacing.xl,
    left: "50%",
    transform: [{ translateX: -30 }],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: 4,
  },
  speedIndicatorText: {
    ...typography.body,
    color: themeColors.accent,
    fontSize: 18,
    fontWeight: "700",
  },

  // Shown while VAST XML is being fetched (before ad overlay appears).
  adLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 99,
  },

  // Locked controls indicator
  lockedIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -75 }, { translateY: -50 }],
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    width: 150,
    zIndex: 4,
  },
  lockedText: {
    ...typography.body,
    color: themeColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  lockedSubtext: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontSize: 11,
    marginTop: spacing.xs,
    textAlign: "center",
  },

  tapOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  bufferingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 3,
  },
  bufferingText: {
    ...typography.body,
    color: themeColors.textPrimary,
    marginTop: spacing.md,
    fontSize: 16,
  },
  controlsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    alignItems: "stretch",
    backgroundColor: "transparent",
    paddingHorizontal: spacing.sm,
    paddingVertical: 0,
    zIndex: 2,
  },
  topGradientBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 0,
  },
  bottomGradientBand: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
    zIndex: 0,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 0,
  },
  overlayTitle: {
    flex: 1,
    color: themeColors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
    marginHorizontal: spacing.sm,
  },
  topControlsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  topControlsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  topRightControls: {
    alignSelf: "flex-end",
  },
  centerPlayButton: {
    alignSelf: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: spacing.sm,
    marginBottom: 0,
  },
  bottomControlsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  bottomControlsFullscreen: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  bottomSection: {
    width: "100%",
    alignSelf: "flex-end",
    paddingBottom: 10,
  },
  bottomSectionFullscreen: {
    paddingBottom: spacing.md,
  },
  controlIcon: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  backControlButton: { padding: spacing.sm, alignSelf: "flex-start" },
  playPauseButton: {
    alignSelf: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  transportRow: {
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.sm,
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
  progressBarContainer: {
    width: "100%",
    paddingHorizontal: 0,
  },
  progressBarContainerFullscreen: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressBarTouchArea: {
    width: "100%",
    justifyContent: "center",
    paddingVertical: spacing.xs,
  },
  progressBarTouchAreaFullscreen: {
    paddingVertical: spacing.sm,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  progressBar: {
    width: "100%",
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 0,
    overflow: "visible",
  },
  progressBarFullscreen: {
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: themeColors.accent,
    borderRadius: 0,
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
  timeText: {
    ...typography.caption,
    color: themeColors.textPrimary,
    fontSize: 13,
    fontWeight: "500",
  },
  contentInfo: { padding: spacing.lg },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  titleActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    ...typography.title,
    fontSize: 24,
    fontWeight: "700",
    color: themeColors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metadataText: {
    ...typography.body,
    fontSize: 14,
    color: themeColors.textSecondary,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    ...typography.caption,
    fontSize: 12,
    color: themeColors.textPrimary,
    fontWeight: "600",
  },
  descriptionContainer: {
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: themeColors.textSecondary,
    lineHeight: 20,
    fontSize: 14,
  },
  seeMoreText: {
    ...typography.body,
    color: themeColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaText: {
    ...typography.caption,
    fontSize: 13,
    color: themeColors.textSecondary,
  },
  similarSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  similarVideoCard: {
    flexDirection: "row",
    marginBottom: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  similarThumbnail: {
    width: 120,
    height: 68,
    borderRadius: borderRadius.sm,
    backgroundColor: themeColors.surface,
  },
  similarThumbnailPlaceholder: {
    width: 120,
    height: 68,
    borderRadius: borderRadius.sm,
    backgroundColor: themeColors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  similarVideoInfo: {
    flex: 1,
    justifyContent: "center",
  },
  similarVideoTitle: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.textPrimary,
    marginBottom: spacing.xs,
  },
  similarVideoMetaText: {
    ...typography.caption,
    fontSize: 12,
    color: themeColors.textSecondary,
    marginTop: spacing.xs,
  },
  episodesSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 20,
    fontWeight: "600",
    color: themeColors.textPrimary,
    marginBottom: spacing.md,
  },
  seasonContainer: { marginBottom: spacing.xl },
  seasonTitle: {
    ...typography.title,
    fontSize: 18,
    fontWeight: "600",
    color: themeColors.textPrimary,
    marginBottom: spacing.md,
  },
  seasonDropdownWrapper: {
    marginBottom: spacing.md,
  },
  seasonDropdownTrigger: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: borderRadius.md,
    backgroundColor: themeColors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  seasonDropdownLabel: {
    ...typography.caption,
    color: themeColors.textSecondary,
    marginBottom: spacing.xs,
  },
  seasonDropdownValueWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seasonDropdownValue: {
    ...typography.body,
    color: themeColors.textPrimary,
    fontWeight: "600",
    flex: 1,
    marginRight: spacing.sm,
  },
  seasonDropdownMenu: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    backgroundColor: themeColors.surface,
    overflow: "hidden",
  },
  seasonDropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  seasonDropdownItemActive: {
    backgroundColor: themeColors.card,
  },
  seasonDropdownItemText: {
    ...typography.body,
    color: themeColors.textSecondary,
    fontSize: 14,
  },
  seasonDropdownItemTextActive: {
    color: themeColors.textPrimary,
    fontWeight: "600",
  },
  emptySeasonText: {
    ...typography.body,
    color: themeColors.textSecondary,
  },
  episodesList: { paddingRight: spacing.lg },
  episodeCard: {
    width: 160,
    marginRight: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    overflow: "hidden",
  },
  episodeCardActive: {
    borderColor: themeColors.accent,
    backgroundColor: themeColors.card,
  },
  episodeThumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: themeColors.surface,
  },
  episodeThumbnailPlaceholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: themeColors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  activeIndicator: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    padding: spacing.xs,
  },
  episodeNumber: {
    ...typography.body,
    fontSize: 12,
    fontWeight: "600",
    color: themeColors.textPrimary,
    padding: spacing.sm,
    paddingBottom: spacing.xs,
  },
  episodeTitle: {
    ...typography.body,
    fontSize: 13,
    color: themeColors.textSecondary,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  episodeDuration: {
    ...typography.caption,
    fontSize: 11,
    color: themeColors.muted,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  // Limited Access Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 22,
    fontWeight: "700",
    color: themeColors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  modalText: {
    ...typography.body,
    fontSize: 15,
    color: themeColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  modalButtons: {
    width: "100%",
    gap: spacing.md,
  },
  modalButtonPrimary: {
    backgroundColor: themeColors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.background,
  },
  modalButtonSecondary: {
    backgroundColor: "transparent",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: themeColors.accent,
  },
  modalButtonSecondaryText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.accent,
  },
  modalButtonText: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  modalButtonTextLabel: {
    ...typography.body,
    fontSize: 14,
    color: themeColors.textSecondary,
  },

  // Settings Modal Styles
  settingsModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  settingsModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  settingsModalContent: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: "80%",
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  settingsTitle: {
    ...typography.title,
    fontSize: 20,
    fontWeight: "700",
    color: themeColors.textPrimary,
  },
  settingsSection: {
    marginBottom: spacing.xl,
  },
  settingsSectionTitle: {
    ...typography.body,
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.textPrimary,
    marginBottom: spacing.md,
  },
  settingsOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  settingsOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: themeColors.background,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  settingsOptionActive: {
    backgroundColor: themeColors.accent,
    borderColor: themeColors.accent,
  },
  settingsOptionText: {
    ...typography.body,
    fontSize: 14,
    color: themeColors.textSecondary,
  },
  settingsOptionTextActive: {
    color: themeColors.background,
    fontWeight: "600",
  },
  settingsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: themeColors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  settingsToggleActive: {
    borderColor: themeColors.accent,
    backgroundColor: "rgba(229, 9, 20, 0.1)",
  },
  settingsToggleText: {
    ...typography.body,
    fontSize: 14,
    color: themeColors.textPrimary,
  },
  settingsHelper: {
    ...typography.caption,
    fontSize: 12,
    color: themeColors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: themeColors.background,
  },
  comingSoonBackButton: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    padding: spacing.sm,
    zIndex: 10,
  },
  comingSoonThumbnailWrapper: {
    width: "100%",
    maxWidth: 320,
    aspectRatio: 16 / 9,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginBottom: spacing.xl,
  },
  comingSoonThumbnail: {
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },
  comingSoonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonBadge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  comingSoonBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  comingSoonTitle: {
    ...typography.title,
    fontSize: 22,
    fontWeight: "700",
    color: themeColors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  comingSoonDescription: {
    ...typography.body,
    fontSize: 14,
    color: themeColors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  comingSoonSubtext: {
    ...typography.body,
    fontSize: 14,
    color: themeColors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
});
