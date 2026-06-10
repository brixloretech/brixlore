import { api } from "./api";
import Constants from "expo-constants";

export type PlaybackType = "hls" | "dash" | "mp4";

export interface PlaybackInfoResponseDto {
  episodeId: string;
  type: PlaybackType;
  streamKey?: string;
  url: string;
  expiresAt?: string;
}

interface PlaybackMetadataResponse {
  streamKey: string;
  type?: PlaybackType;
}

type GetPlaybackInfoOptions = {
  asGuest?: boolean;
};

function buildStreamUrl(streamKey: string): string {
  const trimmed = streamKey.trim();
  if (!trimmed) return trimmed;

  // If it's already a full URL, return it
  if (/^https?:\/\//i.test(trimmed)) {
    console.log("[Streaming] Using full URL from streamKey:", trimmed);
    return trimmed;
  }

  // Get worker base URL from env (if configured)
  // Check both expo config and process.env for compatibility
  const workerBaseUrl =
    Constants.expoConfig?.extra?.r2WorkerBaseUrl ||
    process.env.EXPO_PUBLIC_R2_WORKER_BASE_URL ||
    null;

  if (workerBaseUrl) {
    const base = workerBaseUrl.trim().replace(/\/$/, "");
    const url = `${base}/${trimmed.replace(/^\/+/, "")}`;
    console.log("[Streaming] Built URL from R2 worker:", url);
    return url;
  }

  // Fallback: use API base URL - the backend might serve media directly
  // or proxy it through the API
  const apiUrl =
    Constants.expoConfig?.extra?.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL ||
    "https://brick-tales-web-production-653a.up.railway.app";

  if (apiUrl) {
    const base = apiUrl.trim().replace(/\/$/, "");
    // Try serving from API base - many backends serve media at root or /media
    // Remove leading slash from streamKey and append
    const cleanKey = trimmed.replace(/^\/+/, "");
    const url = `${base}/${cleanKey}`;
    console.log("[Streaming] Built URL from API base (fallback):", url);
    return url;
  }

  // Last resort: return as-is
  console.warn(
    "[Streaming] No base URL configured, using streamKey as-is:",
    trimmed,
  );
  return trimmed;
}

export interface ContinueWatchingItemDto {
  episodeId: string;
  contentId: string;
  episodeTitle: string;
  contentTitle: string;
  progress: number; // seconds
  duration: number; // seconds
  thumbnailUrl?: string | null;
  type?: string;
  watchedAt?: string;
}

class StreamingService {
  /**
   * Get playback info for an episode
   * Real API: GET /episodes/:id/play
   * Returns { streamKey, type } - we build the URL from streamKey
   */
  async getPlaybackInfo(
    episodeId: string,
    options?: GetPlaybackInfoOptions,
  ): Promise<PlaybackInfoResponseDto | null> {
    try {
      console.log(
        `[Streaming] Getting playback info for episode: ${episodeId}`,
      );
      let response;

      if (options?.asGuest) {
        try {
          response = await api.get<PlaybackMetadataResponse>(
            `/episodes/${episodeId}/guest-play`,
          );
        } catch (guestError: any) {
          // Backend may not have guest-play route deployed yet (404).
          // For guests, we cannot fall back to the auth-protected endpoint.
          if (guestError?.response?.status === 404) {
            console.warn(
              "[Streaming] Guest playback endpoint not available. Backend needs to be restarted/redeployed.",
            );
            throw new Error("unavailable");
          } else {
            throw guestError;
          }
        }
      } else {
        response = await api.get<PlaybackMetadataResponse>(
          `/episodes/${episodeId}/play`,
        );
      }

      if (!response.data?.streamKey) {
        console.error("[Streaming] No streamKey in response:", response.data);
        return null;
      }

      const streamKey = response.data.streamKey;
      const type = response.data.type || this.inferPlaybackType(streamKey);
      const url = buildStreamUrl(streamKey);

      console.log("[Streaming] Playback info:", {
        episodeId,
        streamKey,
        type,
        url,
      });

      return {
        episodeId,
        type,
        streamKey,
        url,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error("unauthorized");
      }
      if (error.response?.status === 403) {
        throw new Error("forbidden");
      }
      console.error("[Streaming] Failed to get playback info:", error.message);
      return null;
    }
  }

  /**
   * Infer playback type from streamKey/URL
   */
  private inferPlaybackType(streamKey: string): PlaybackType {
    const normalized = streamKey.toLowerCase();
    if (/\.m3u8(\?|$)/.test(normalized)) return "hls";
    if (/\.mp4(\?|$)/.test(normalized)) return "mp4";
    if (/\.mpd(\?|$)/.test(normalized)) return "dash";
    return "hls"; // Default to HLS
  }

  /**
   * Report watch progress
   * Real API: PATCH /streaming/continue-watching/:episodeId
   */
  async reportProgress(
    episodeId: string,
    progressSeconds: number,
    durationSeconds?: number,
  ): Promise<void> {
    try {
      const url = `/streaming/continue-watching/${encodeURIComponent(episodeId)}${durationSeconds != null ? `?duration=${durationSeconds}` : ""}`;
      await api.patch(url, { progress: Math.round(progressSeconds) });
    } catch (error: any) {
      if (error?.response?.status === 401) {
        return;
      }
      console.error("Failed to report progress:", error);
      // Don't throw - progress reporting is best effort
    }
  }

  /**
   * Remove episode from continue watching
   * Real API: DELETE /streaming/continue-watching/:episodeId
   */
  async removeFromContinueWatching(episodeId: string): Promise<void> {
    try {
      await api.delete(
        `/streaming/continue-watching/${encodeURIComponent(episodeId)}`,
      );
    } catch (error) {
      console.error("Failed to remove from continue watching:", error);
    }
  }

  /**
   * Get continue watching list
   * Real API: GET /streaming/continue-watching
   */
  async getContinueWatching(): Promise<ContinueWatchingItemDto[]> {
    try {
      const response = await api.get<ContinueWatchingItemDto[]>(
        "/streaming/continue-watching",
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      if (error?.response?.status === 401) {
        return [];
      }
      console.error("Failed to get continue watching:", error);
      return [];
    }
  }

  /**
   * Get watch history list
   * Real API: GET /streaming/watch-history
   */
  async getWatchHistory(): Promise<ContinueWatchingItemDto[]> {
    try {
      const response = await api.get<ContinueWatchingItemDto[]>(
        "/streaming/watch-history",
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      if (error?.response?.status === 401) {
        return [];
      }
      console.error("Failed to get watch history:", error);
      return [];
    }
  }
}

export const streamingService = new StreamingService();
