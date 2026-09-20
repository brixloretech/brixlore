import { patch, post } from "@/lib/api-client";
import { DEFAULT_HLS_TEST_STREAM, HLS_TEST_STREAMS } from "@/lib/hls-streams";
import { USE_MOCK_API } from "./config";
import type { GuestPreviewSessionResponseDto, PlaybackType } from "@/types/api";
import type { FreePreviewSessionResponseDto, PreviewSignupResponseDto } from "@/types/api";
import { getStoredAuth, setStoredAuth } from "@/lib/auth-storage";

function playbackType(streamKey: string, type?: PlaybackType): PlaybackType {
  if (type) return type;
  return /\.mp4(\?|$)/i.test(streamKey) ? "mp4" : "hls";
}

export const previewService = {
  async startGuestPreview(episodeId: string, deviceFingerprint: string) {
    if (USE_MOCK_API) {
      const url = HLS_TEST_STREAMS[episodeId] ?? DEFAULT_HLS_TEST_STREAM;
      return {
        allowed: true,
        sessionId: `mock-preview-${Date.now()}`,
        previewsUsed: 1,
        previewsRemaining: 2,
        maxSeconds: 45,
        url,
        type: "hls" as PlaybackType,
      };
    }
    const response = await post<GuestPreviewSessionResponseDto>(
      "preview/sessions",
      { episodeId, deviceFingerprint },
    );
    return {
      ...response,
      url: response.streamKey,
      type: response.streamKey ? playbackType(response.streamKey, response.type) : response.type,
    };
  },

  async completeGuestPreview(
    sessionId: string,
    watchedSeconds: number,
    deviceFingerprint: string,
  ): Promise<void> {
    if (USE_MOCK_API) return;
    await patch<{ ok: boolean }>(
      `preview/sessions/${encodeURIComponent(sessionId)}`,
      { watchedSeconds: Math.min(45, Math.max(0, Math.floor(watchedSeconds))) },
      { headers: { "X-Device-Fingerprint": deviceFingerprint } },
    );
  },

  async signUp(body: { name: string; email: string; password: string }): Promise<void> {
    if (USE_MOCK_API) return;
    const tokens = await post<PreviewSignupResponseDto>("preview/signup", body);
    setStoredAuth({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    });
  },

  async startFreePreview(episodeId: string): Promise<FreePreviewSessionResponseDto> {
    if (USE_MOCK_API) {
      return {
        allowed: true,
        freeCatalog: false,
        remainingSeconds: 180,
        streamKey: DEFAULT_HLS_TEST_STREAM,
        type: "hls",
      };
    }
    const auth = getStoredAuth();
    if (!auth?.accessToken) throw new Error("Not authenticated");
    return post<FreePreviewSessionResponseDto>(
      "preview/free-sessions",
      { episodeId },
      { headers: { Authorization: `Bearer ${auth.accessToken}` } },
    );
  },

  async consumeFreePreview(seconds: number): Promise<FreePreviewSessionResponseDto> {
    if (USE_MOCK_API) return { allowed: true, freeCatalog: false, remainingSeconds: Math.max(0, 180 - seconds) };
    const auth = getStoredAuth();
    if (!auth?.accessToken) throw new Error("Not authenticated");
    const result = await patch<{ remainingSeconds: number }>(
      "preview/free-allowance",
      { seconds: Math.min(180, Math.max(0, Math.floor(seconds))) },
      { headers: { Authorization: `Bearer ${auth.accessToken}` } },
    );
    return { allowed: result.remainingSeconds > 0, freeCatalog: false, remainingSeconds: result.remainingSeconds };
  },
};
