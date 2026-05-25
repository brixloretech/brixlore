import type {
  ContinueWatchingItemDto,
  PlaybackInfoResponseDto,
  PlaybackRequestDto,
  PlaybackType,
} from "@/types/api";
import { get, patch, del, ApiError } from "@/lib/api-client";
import { getStoredAuth } from "@/lib/auth-storage";
import { DEFAULT_HLS_TEST_STREAM, HLS_TEST_STREAMS } from "@/lib/hls-streams";
import { USE_MOCK_API } from "./config";

/** Backend GET /episodes/:id/play response (authenticated, requires subscription). */
interface PlaybackMetadataResponse {
  streamKey: string;
  type?: PlaybackType;
}

function inferPlaybackType(url: string): PlaybackType | undefined {
  const normalized = url.toLowerCase();
  if (/\.m3u8(\?|$)/.test(normalized)) return "hls";
  if (/\.mp4(\?|$)/.test(normalized)) return "mp4";
  return undefined;
}

function getCloudflareStreamSubdomain(): string | null {
  const raw = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN;
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function looksLikeCloudflareStreamUid(value: string): boolean {
  const trimmed = value.trim();
  return /^[A-Za-z0-9_-]{8,}$/.test(trimmed) && !trimmed.includes("/");
}

function buildPlaybackUrl(streamKey: string): string {
  const trimmed = streamKey.trim();
  if (!trimmed) return trimmed;
  const cloudflareSubdomain = getCloudflareStreamSubdomain();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (looksLikeCloudflareStreamUid(trimmed)) {
    if (!cloudflareSubdomain) {
      throw new ApiError(
        "Cloudflare Stream subdomain is not configured",
        500,
      );
    }
    return `https://${cloudflareSubdomain}/${trimmed}/manifest/video.m3u8`;
  }

  throw new ApiError(
    "Playback URL is not configured for this stream key",
    500,
  );
}

/**
 * Streaming service. Real API: requests playback metadata from GET /episodes/:id/play.
 * The client resolves Cloudflare Stream playback URLs from direct URLs or Stream UIDs.
 * Mock: returns test HLS stream.
 */
export const streamingService = {
  /**
   * Get authorized playback metadata. Real API: GET /episodes/:id/play — returns stream key; 401/403 if not allowed.
   */
  async getPlaybackInfo(
    episodeId: string,
    body?: PlaybackRequestDto,
    options?: { asGuest?: boolean },
  ): Promise<PlaybackInfoResponseDto> {
    void body;
    if (USE_MOCK_API) {
      const url = HLS_TEST_STREAMS[episodeId] ?? DEFAULT_HLS_TEST_STREAM;
      return { episodeId, type: "hls", url };
    }

    let res: PlaybackMetadataResponse;

    if (options?.asGuest) {
      try {
        res = await get<PlaybackMetadataResponse>(
          `episodes/${episodeId}/guest-play`,
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          throw new ApiError(
            "Guest playback is not available",
            503,
            err.body ?? null,
          );
        }
        throw err;
      }
    } else {
      const auth = getStoredAuth();
      if (!auth?.accessToken) {
        throw new ApiError("Sign in to watch", 401);
      }

      res = await get<PlaybackMetadataResponse>(`episodes/${episodeId}/play`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
    }
    if (!res?.streamKey || typeof res.streamKey !== "string") {
      throw new ApiError("Playback stream key is missing", 500, res ?? null);
    }
    const url = buildPlaybackUrl(res.streamKey);
    return {
      episodeId,
      type:
        res.type ??
        inferPlaybackType(res.streamKey) ??
        inferPlaybackType(url) ??
        "hls",
      url,
      streamKey: res.streamKey,
    };
  },

  /**
   * Report watch progress (seconds). Real API: PATCH /streaming/continue-watching/:episodeId.
   */
  async reportProgress(
    episodeId: string,
    progressSeconds: number,
    durationSeconds?: number,
  ): Promise<void> {
    if (USE_MOCK_API) return;

    const auth = getStoredAuth();
    if (!auth?.accessToken) return;

    const url = `streaming/continue-watching/${encodeURIComponent(episodeId)}${durationSeconds != null ? `?duration=${durationSeconds}` : ""}`;
    await patch<{ ok: boolean }>(
      url,
      { progress: Math.round(progressSeconds) },
      {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      },
    );
  },

  /**
   * Remove an episode from continue watching. Real API: DELETE /streaming/continue-watching/:episodeId.
   */
  async removeFromContinueWatching(episodeId: string): Promise<void> {
    if (USE_MOCK_API) return;

    const auth = getStoredAuth();
    if (!auth?.accessToken) return;

    await del<{ ok: boolean }>(
      `streaming/continue-watching/${encodeURIComponent(episodeId)}`,
      {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      },
    );
  },

  /**
   * Get in-progress titles for continue watching. Real API: GET /streaming/continue-watching.
   */
  async getContinueWatching(): Promise<ContinueWatchingItemDto[]> {
    if (USE_MOCK_API) return [];

    const auth = getStoredAuth();
    if (!auth?.accessToken) return [];

    const items = await get<ContinueWatchingItemDto[]>(
      "streaming/continue-watching",
      {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      },
    );
    return Array.isArray(items) ? items : [];
  },
};
