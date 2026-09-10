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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs),
    ),
  ]);
}

/**
 * Guest playback must not pass through the authenticated Axios client. An
 * expired stored session can make its interceptors retry/short-circuit an
 * otherwise-public request on device. This small direct request keeps the
 * preview route independent from authentication state.
 */
async function getGuestPlaybackDirect(
  episodeId: string,
): Promise<PlaybackMetadataResponse | null> {
  const apiBaseUrl =
    api.defaults.baseURL ||
    Constants.expoConfig?.extra?.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL ||
    "https://brick-tales-web-production-653a.up.railway.app";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);
  const requestUrl = `${String(apiBaseUrl).replace(/\/$/, "")}/episodes/${encodeURIComponent(episodeId)}/guest-play`;
  try {
    const response = await fetch(
      requestUrl,
      { headers: { Accept: "application/json" }, signal: controller.signal },
    );
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as PlaybackMetadataResponse & {
      data?: PlaybackMetadataResponse;
    };
    const data = payload?.streamKey ? payload : payload?.data;
    return data?.streamKey ? data : null;
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

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
      let response;

      if (options?.asGuest) {
        // Use the public endpoint directly first. The Axios auth interceptor
        // can retry an expired token and hide a valid guest stream in Expo Go.
        const guestData = await getGuestPlaybackDirect(episodeId);
        if (guestData?.streamKey) {
          response = { data: guestData };
        } else {
          response = await api.get<PlaybackMetadataResponse>(
            `/episodes/${encodeURIComponent(episodeId)}/guest-play`,
          );
        }
      } else {
        try {
          // An expired or stalled authenticated endpoint must not block an
          // otherwise-valid public preview stream indefinitely.
          response = await withTimeout(
            api.get<PlaybackMetadataResponse>(
              `/episodes/${encodeURIComponent(episodeId)}/play`,
            ),
            5_000,
            "Authenticated playback request",
          );
        } catch (authenticatedError: any) {
          // Preserve an explicit access denial, but allow an expired/missing
          // session to use the public preview route instead of leaving the
          // native player with no source.
          if (authenticatedError?.response?.status === 403) {
            throw authenticatedError;
          }
          console.warn(
            "[Streaming] Auth playback unavailable; trying guest playback.",
          );
          response = { data: await getGuestPlaybackDirect(episodeId) };
        }
      }

      if (!response.data?.streamKey) {
        // Some older API deployments can reply successfully to /play without
        // a stream key. The public endpoint is the reliable fallback for a
        // preview-capable title.
        if (!options?.asGuest) {
          console.warn("[Streaming] Empty auth playback response; trying guest playback.");
          response = { data: await getGuestPlaybackDirect(episodeId) };
        }
        if (!response.data?.streamKey) {
          if (options?.asGuest) response = { data: await getGuestPlaybackDirect(episodeId) };
          if (!response.data?.streamKey) {
            console.error("[Streaming] No streamKey in response:", response.data);
            return null;
          }
        }
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
