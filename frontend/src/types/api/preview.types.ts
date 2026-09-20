import type { PlaybackType } from "./streaming.types";

export interface GuestPreviewSessionResponseDto {
  allowed: boolean;
  sessionId?: string;
  previewsUsed: number;
  previewsRemaining: number;
  maxSeconds?: number;
  streamKey?: string;
  type?: PlaybackType;
}

export interface FreePreviewSessionResponseDto {
  allowed: boolean;
  freeCatalog: boolean;
  remainingSeconds: number;
  streamKey?: string;
  type?: PlaybackType;
}

export interface PreviewSignupResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
