/**
 * API contract types for streaming (playback, HLS, DRM).
 * Backend-ready for NestJS (e.g. StreamingModule, signed URLs, CDN).
 */

/** Playback type (HLS, DASH, or direct MP4). */
export type PlaybackType = "hls" | "dash" | "mp4";

/** Quality/variant level for adaptive streaming. */
export interface QualityLevelDto {
  height?: number;
  width?: number;
  bitrate?: number;
  /** Label for UI (e.g. "1080p", "720p"). */
  label: string;
  /** URL to manifest or segment list for this level (if not using single manifest). */
  uri?: string;
}

/** Response for GET /episodes/:id/play (playback metadata). */
export interface PlaybackInfoResponseDto {
  episodeId: string;
  type: PlaybackType;
  /** Storage key or absolute URL for the stream (HLS manifest or MP4). */
  streamKey?: string;
  /** Primary manifest URL (e.g. HLS .m3u8). Signed if required. */
  url: string;
  /** Optional expiry for signed URL (ISO date string). */
  expiresAt?: string;
  /** Optional list of quality levels for adaptive streaming. */
  qualityLevels?: QualityLevelDto[];
  /** Optional DRM license URL or key system config. */
  drm?: {
    type: "widevine" | "fairplay" | "playready";
    licenseUrl?: string;
    certificateUrl?: string;
  };
}

/** Request for POST /episodes/:id/play (if using body for entitlements). */
export interface PlaybackRequestDto {
  episodeId: string;
  /** Optional quality preference. */
  qualityPreference?: string;
}

/** Response for GET /streaming/upload-url (admin: get signed upload URL for asset). */
export interface UploadUrlResponseDto {
  videoId: string;
  /** Signed URL for PUT upload. */
  uploadUrl: string;
  /** ISO date string. */
  expiresAt: string;
}

/** Request for POST /streaming/transcode (admin: trigger transcoding job). */
export interface TranscodeRequestDto {
  videoId: string;
  /** Optional preset (e.g. "hls-adaptive", "dash"). */
  preset?: string;
}

/** Response for POST /streaming/transcode */
export interface TranscodeResponseDto {
  jobId: string;
  videoId: string;
  status: "queued" | "processing";
}

/** Item from GET /streaming/continue-watching (in-progress view history). */
export interface ContinueWatchingItemDto {
  contentId: string;
  episodeId: string;
  contentTitle: string;
  episodeTitle: string;
  progress: number;
  duration: number;
  thumbnailUrl: string | null;
  type: string;
  watchedAt: string;
}
