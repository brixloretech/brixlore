import { api } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PlaybackType = "hls" | "dash" | "mp4";

export type GuestPreviewSession = {
  allowed: boolean;
  sessionId?: string;
  previewsUsed: number;
  previewsRemaining: number;
  maxSeconds?: number;
  streamKey?: string;
  type?: PlaybackType;
};

export type FreePreviewSession = {
  allowed: boolean;
  freeCatalog: boolean;
  remainingSeconds: number;
  streamKey?: string;
  type?: PlaybackType;
};

export type PreviewSignupResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

function inferPlaybackType(streamKey?: string, type?: PlaybackType): PlaybackType | undefined {
  if (type) return type;
  if (!streamKey) return undefined;
  if (/\.mp4(?:\?|$)/i.test(streamKey)) return "mp4";
  if (/\.m3u8(?:\?|$)/i.test(streamKey)) return "hls";
  return undefined;
}

function createDeviceFingerprint(): string {
  // Avoid uuid's crypto.getRandomValues requirement: some Expo runtimes do
  // not expose Web Crypto. This is an opaque, persisted identifier—not a
  // security token—and is only used to group guest preview sessions.
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 12);
  return `mobile-${stamp}-${random}`;
}

/**
 * Server-backed preview access used by the web FigmaVideoPlayer.
 * This service deliberately does not apply local limits; the preview API is
 * the source of truth for guest sessions and free-user allowance.
 */
class PreviewService {
  private static readonly FINGERPRINT_KEY = "@preview_device_fingerprint";

  async getDeviceFingerprint(): Promise<string> {
    const stored = await AsyncStorage.getItem(PreviewService.FINGERPRINT_KEY);
    if (stored?.trim()) return stored;

    const fingerprint = createDeviceFingerprint();
    await AsyncStorage.setItem(
      PreviewService.FINGERPRINT_KEY,
      fingerprint,
    );
    return fingerprint;
  }

  async startGuestPreview(
    episodeId: string,
    deviceFingerprint?: string,
  ): Promise<GuestPreviewSession> {
    const fingerprint =
      deviceFingerprint ?? (await this.getDeviceFingerprint());
    const response = await api.post<GuestPreviewSession>("/preview/sessions", {
      episodeId: episodeId.trim(),
      deviceFingerprint: fingerprint,
    });
    // Keep the counters numeric even if an older API deployment serializes
    // them as strings. The UI uses these values as authoritative server
    // usage, so never let an undefined/NaN value collapse to the display's
    // initial `0`.
    const result: GuestPreviewSession = {
      ...response.data,
      previewsUsed: Number(response.data.previewsUsed) || 0,
      previewsRemaining: Number(response.data.previewsRemaining) || 0,
      maxSeconds: response.data.maxSeconds == null
        ? undefined
        : Number(response.data.maxSeconds),
      type: inferPlaybackType(response.data.streamKey, response.data.type),
    };
    if (__DEV__) {
      console.log("[PreviewDebug] guest preview response", {
        raw: response.data,
        allowed: result.allowed,
        previewsUsed: result.previewsUsed,
        previewsRemaining: result.previewsRemaining,
        hasSession: Boolean(result.sessionId),
      });
    }
    return result;
  }

  async completeGuestPreview(
    sessionId: string,
    watchedSeconds: number,
    deviceFingerprint?: string,
  ): Promise<{ ok: boolean }> {
    const fingerprint =
      deviceFingerprint ?? (await this.getDeviceFingerprint());
    const response = await api.patch<{ ok: boolean }>(
      `/preview/sessions/${encodeURIComponent(sessionId)}`,
      { watchedSeconds: Math.min(45, Math.max(0, Math.floor(watchedSeconds))) },
      { headers: { "X-Device-Fingerprint": fingerprint } },
    );
    return response.data;
  }

  async startFreePreview(episodeId: string): Promise<FreePreviewSession> {
    const response = await api.post<FreePreviewSession>(
      "/preview/free-sessions",
      { episodeId: episodeId.trim() },
    );
    const result = {
      ...response.data,
      type: inferPlaybackType(response.data.streamKey, response.data.type),
    };
    return result;
  }

  async consumeFreePreview(seconds: number): Promise<FreePreviewSession> {
    const response = await api.patch<{ remainingSeconds: number }>(
      "/preview/free-allowance",
      { seconds: Math.min(1200, Math.max(0, Math.floor(seconds))) },
    );
    return {
      allowed: response.data.remainingSeconds > 0,
      freeCatalog: false,
      remainingSeconds: response.data.remainingSeconds,
    };
  }

  async resetTestAccess(): Promise<void> {
    const fingerprint = await this.getDeviceFingerprint();
    await api.post(
      "/preview/reset-test-access",
      {},
      { headers: { "X-Device-Fingerprint": fingerprint } },
    );
  }

  async signUp(body: {
    name: string;
    email: string;
    password: string;
  }): Promise<PreviewSignupResponse> {
    const response = await api.post<PreviewSignupResponse>("/preview/signup", {
      name: body.name.trim(),
      email: body.email.trim(),
      password: body.password,
    });
    return response.data;
  }
}

export const previewService = new PreviewService();
