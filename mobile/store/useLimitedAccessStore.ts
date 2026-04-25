import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LimitedAccessState {
  /**
   * Number of videos watched in limited access mode
   * Resets when user logs in
   */
  videosWatchedCount: number;

  /**
   * Track which videos were already watched to not double-count
   */
  watchedVideoIds: Set<string>;

  /**
   * Total watch time in current video session (in seconds)
   */
  currentVideoWatchTime: number;

  /**
   * Cumulative watch time per episode (in seconds) - persists across sessions
   * Map of episodeId -> total seconds watched
   */
  episodeWatchTimes: Map<string, number>;

  /**
   * Whether the user triggered the login modal after 30s
   */
  loginModalShownFor30s: boolean;

  /**
   * Whether the user triggered the login modal for exceeding 3 videos
   */
  loginModalShownForVideoLimit: boolean;

  /**
   * Track video watch start to calculate elapsed time
   */
  videoWatchStartTime: number | null;

  // Actions
  incrementVideosWatched: (videoId: string) => void;
  resetWatchedVideos: () => void;
  updateCurrentVideoWatchTime: (seconds: number) => void;
  resetCurrentVideoWatchTime: () => void;
  getEpisodeCumulativeTime: (episodeId: string) => number;
  updateEpisodeCumulativeTime: (episodeId: string, seconds: number) => void;
  setLoginModalShownFor30s: (shown: boolean) => void;
  setLoginModalShownForVideoLimit: (shown: boolean) => void;
  startVideoWatch: () => void;
  stopVideoWatch: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const LIMITED_ACCESS_STORAGE_KEY = "@limited_access_state";

export const useLimitedAccessStore = create<LimitedAccessState>((set, get) => ({
  videosWatchedCount: 0,
  watchedVideoIds: new Set(),
  currentVideoWatchTime: 0,
  episodeWatchTimes: new Map(),
  loginModalShownFor30s: false,
  loginModalShownForVideoLimit: false,
  videoWatchStartTime: null,

  incrementVideosWatched: (videoId: string) => {
    const current = get();
    if (!current.watchedVideoIds.has(videoId)) {
      current.watchedVideoIds.add(videoId);
      set({
        videosWatchedCount: current.videosWatchedCount + 1,
      });
    }
  },

  resetWatchedVideos: () => {
    set({
      videosWatchedCount: 0,
      watchedVideoIds: new Set(),
      episodeWatchTimes: new Map(),
      loginModalShownFor30s: false,
      loginModalShownForVideoLimit: false,
    });
  },

  updateCurrentVideoWatchTime: (seconds: number) => {
    set({ currentVideoWatchTime: seconds });
  },

  resetCurrentVideoWatchTime: () => {
    set({
      currentVideoWatchTime: 0,
      videoWatchStartTime: null,
      loginModalShownFor30s: false,
    });
  },

  getEpisodeCumulativeTime: (episodeId: string) => {
    return get().episodeWatchTimes.get(episodeId) || 0;
  },

  updateEpisodeCumulativeTime: (episodeId: string, seconds: number) => {
    const times = new Map(get().episodeWatchTimes);
    times.set(episodeId, Math.max(0, Math.floor(seconds)));
    set({ episodeWatchTimes: times });
  },

  setLoginModalShownFor30s: (shown: boolean) => {
    set({ loginModalShownFor30s: shown });
  },

  setLoginModalShownForVideoLimit: (shown: boolean) => {
    set({ loginModalShownForVideoLimit: shown });
  },

  startVideoWatch: () => {
    set({ videoWatchStartTime: Date.now() });
  },

  stopVideoWatch: () => {
    set({ videoWatchStartTime: null });
  },

  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem(LIMITED_ACCESS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const episodeTimesArray: [string, number][] =
          parsed.episodeWatchTimes || [];
        const episodeTimesMap = new Map<string, number>(episodeTimesArray);
        set({
          videosWatchedCount: parsed.videosWatchedCount || 0,
          watchedVideoIds: new Set(parsed.watchedVideoIds || []),
          episodeWatchTimes: episodeTimesMap,
        });
      }
    } catch (error) {
      console.error("Failed to load limited access state:", error);
    }
  },

  saveToStorage: async () => {
    try {
      const state = get();
      await AsyncStorage.setItem(
        LIMITED_ACCESS_STORAGE_KEY,
        JSON.stringify({
          videosWatchedCount: state.videosWatchedCount,
          watchedVideoIds: Array.from(state.watchedVideoIds),
          episodeWatchTimes: Array.from(state.episodeWatchTimes.entries()),
        }),
      );
    } catch (error) {
      console.error("Failed to save limited access state:", error);
    }
  },
}));
