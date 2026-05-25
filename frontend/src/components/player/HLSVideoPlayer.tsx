"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import videojs from "video.js";
import { cn } from "@/lib/utils";
import type { AdConfigDto, PlaybackType } from "@/types/api";

/** Player instance type from Video.js (avoids using internal types). */
type VideoJsPlayer = ReturnType<typeof videojs>;

type VhsRepresentation = {
  width?: number;
  height?: number;
  bandwidth?: number;
  enabled: (value?: boolean) => boolean;
};

type QualityOption = {
  id: string;
  label: string;
  repIndexes: number[];
  rank: number;
  sortHeight: number;
  sortBitrate: number;
};

const PREFERRED_QUALITY_ORDER = ["2160p", "1080p", "720p", "480p"] as const;

const PROGRESS_REPORT_INTERVAL_SEC = 10;
const GESTURE_SEEK_SECONDS = 10;
const DOUBLE_TAP_WINDOW_MS = 300;

type AdSlot = "pre-roll" | "mid-roll" | "post-roll";

type AdEventName =
  | "ad_suppressed"
  | "ad_request_start"
  | "ad_request_retry"
  | "ad_impression"
  | "ad_failed"
  | "ad_skipped";

type AdEvent = {
  name: AdEventName;
  slot: AdSlot;
  currentTime: number;
  details?: string;
};

type ActiveAdOverlay = {
  slot: AdSlot;
  startedAtMs: number;
  skipAfterSeconds: number;
};

export type HLSVideoPlayerProps = {
  /** HLS manifest URL (.m3u8) or MP4 URL. */
  src: string;
  /** Optional playback type hint (hls, dash, mp4). */
  type?: PlaybackType;
  /** Optional poster image URL. */
  poster?: string;
  /** Optional video title for accessibility. */
  title?: string;
  /** Optional class name for the wrapper. */
  className?: string;
  /** Optional callback when player is ready. */
  onReady?: (player: VideoJsPlayer) => void;
  /** Optional callback with current time in seconds (throttled on timeupdate, and on pause). */
  onProgress?: (progressSeconds: number) => void;
  /** Optional callback for every timeupdate event. */
  onTimeUpdate?: (currentSeconds: number) => void;
  /** Optional AdButler/public ad config fetched from /ad-config. */
  adConfig?: AdConfigDto | null;
  /** Optional viewer country code for geo restriction checks. */
  viewerCountryCode?: string | null;
  /** Optional viewer age for age restriction checks. */
  viewerAge?: number | null;
  /** Optional ad lifecycle callback (hook point for analytics/logging). */
  onAdEvent?: (event: AdEvent) => void;
};

const VIDEO_JS_OPTIONS = {
  controls: true,
  fill: true,
  playbackRates: [0.5, 1, 1.25, 1.5, 2],
  userActions: {
    doubleClick: false,
  },
  html5: {
    vhs: { overrideNative: true },
    nativeAudioTracks: false,
    nativeVideoTracks: false,
  },
} as const;

function resolveVideoType(src: string): string | undefined {
  const normalized = src.toLowerCase();
  if (/\.m3u8(\?|$)/.test(normalized)) return "application/x-mpegURL";
  if (/\.mp4(\?|$)/.test(normalized)) return "video/mp4";
  return undefined;
}

function resolveMimeFromPlaybackType(type?: PlaybackType): string | undefined {
  if (type === "hls") return "application/x-mpegURL";
  if (type === "dash") return "application/dash+xml";
  if (type === "mp4") return "video/mp4";
  return undefined;
}

function getRepresentations(player: VideoJsPlayer): VhsRepresentation[] {
  const anyPlayer = player as unknown as {
    tech?: (arg?: { IWillNotUseThisInPlugins: boolean }) => {
      vhs?: { representations?: () => VhsRepresentation[] };
      hls?: { representations?: () => VhsRepresentation[] };
    };
  };

  const tech = anyPlayer.tech?.({ IWillNotUseThisInPlugins: true });
  const reps =
    tech?.vhs?.representations?.() ?? tech?.hls?.representations?.() ?? [];
  return Array.isArray(reps) ? reps : [];
}

function getQualityLabel(rep: VhsRepresentation): string {
  if (rep.height && Number.isFinite(rep.height)) {
    const h = rep.height;
    if (h >= 2000) return "2160p";
    if (h >= 1000) return "1080p";
    if (h >= 700) return "720p";
    if (h >= 460) return "480p";
    return `${Math.round(h)}p`;
  }
  if (rep.bandwidth && Number.isFinite(rep.bandwidth)) {
    return `${Math.round(rep.bandwidth / 1000)}kbps`;
  }
  return "Unknown";
}

function getQualityRank(label: string): number {
  const idx = PREFERRED_QUALITY_ORDER.indexOf(
    label as (typeof PREFERRED_QUALITY_ORDER)[number],
  );
  return idx === -1 ? 999 : idx;
}

function parseTimestampToSeconds(value: string): number | null {
  const trimmed = value.trim();
  const parts = trimmed.split(":");
  if (parts.length !== 3) return null;
  const [hh, mm, ss] = parts.map((part) => Number.parseInt(part, 10));
  if ([hh, mm, ss].some((n) => Number.isNaN(n) || n < 0)) return null;
  return hh * 3600 + mm * 60 + ss;
}

function parseTimestampList(values: string[]): number[] {
  const set = new Set<number>();
  for (const item of values) {
    const seconds = parseTimestampToSeconds(item);
    if (seconds !== null) set.add(seconds);
  }
  return Array.from(set).sort((a, b) => a - b);
}

function clampTimeoutSeconds(value: number): number {
  if (!Number.isFinite(value)) return 8;
  return Math.min(30, Math.max(3, Math.floor(value)));
}

function hasTagUrl(url: string): boolean {
  return url.trim().length > 0;
}

function audienceAllowsAds(
  config: AdConfigDto,
  viewerCountryCode?: string | null,
  viewerAge?: number | null,
): boolean {
  if (config.geoRestrictionsEnabled) {
    const country = (viewerCountryCode ?? "").trim().toUpperCase();
    if (!country) return false;
    const blocked = new Set((config.geoBlockedCountries ?? []).map((c) => c.toUpperCase()));
    if (blocked.has(country)) return false;
  }

  if (config.ageRestrictionEnabled) {
    if (typeof viewerAge !== "number" || Number.isNaN(viewerAge)) return false;
    if (viewerAge < config.minAge) return false;
  }

  return true;
}

/**
 * HLS video player using Video.js. Supports adaptive streaming (HLS) and
 * fullscreen via the built-in control bar.
 */
export function HLSVideoPlayer({
  src,
  type,
  poster,
  title,
  className,
  onReady,
  onProgress,
  onTimeUpdate,
  adConfig,
  viewerCountryCode,
  viewerAge,
  onAdEvent,
}: HLSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);
  const onProgressRef = useRef<typeof onProgress>(onProgress);
  const onTimeUpdateRef = useRef<typeof onTimeUpdate>(onTimeUpdate);
  const lastReportedRef = useRef<number>(0);
  const lastTapAtRef = useRef<number>(0);
  const lastTapSideRef = useRef<"left" | "right" | null>(null);
  const adConfigRef = useRef<AdConfigDto | null>(adConfig ?? null);
  const viewerCountryCodeRef = useRef<string | null | undefined>(viewerCountryCode);
  const viewerAgeRef = useRef<number | null | undefined>(viewerAge);
  const onAdEventRef = useRef<typeof onAdEvent>(onAdEvent);
  const [qualityOptions, setQualityOptions] = useState<QualityOption[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");
  const [activeAdOverlay, setActiveAdOverlay] = useState<ActiveAdOverlay | null>(
    null,
  );
  const [adOverlayNow, setAdOverlayNow] = useState<number>(() => Date.now());

  const activeAdOverlayRef = useRef<ActiveAdOverlay | null>(null);
  const adOverlayHideTimerRef = useRef<number | null>(null);

  const emitAdEventUI = (
    name: AdEventName,
    slot: AdSlot,
    currentTime: number,
    details?: string,
  ) => {
    onAdEventRef.current?.({ name, slot, currentTime, details });
  };

  const clearAdOverlayUI = (minVisibleMs = 0) => {
    const overlay = activeAdOverlayRef.current;
    if (!overlay) return;

    const elapsed = Date.now() - overlay.startedAtMs;
    const remaining = Math.max(0, minVisibleMs - elapsed);

    if (adOverlayHideTimerRef.current !== null) {
      window.clearTimeout(adOverlayHideTimerRef.current);
    }

    if (remaining === 0) {
      setActiveAdOverlay(null);
      activeAdOverlayRef.current = null;
      return;
    }

    adOverlayHideTimerRef.current = window.setTimeout(() => {
      setActiveAdOverlay(null);
      activeAdOverlayRef.current = null;
      adOverlayHideTimerRef.current = null;
    }, remaining);
  };

  const activateAdOverlayUI = (slot: AdSlot, skipAfterSeconds: number) => {
    const overlay: ActiveAdOverlay = {
      slot,
      skipAfterSeconds: Math.max(1, skipAfterSeconds),
      startedAtMs: Date.now(),
    };

    if (adOverlayHideTimerRef.current !== null) {
      window.clearTimeout(adOverlayHideTimerRef.current);
      adOverlayHideTimerRef.current = null;
    }

    setActiveAdOverlay(overlay);
    activeAdOverlayRef.current = overlay;
  };

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    adConfigRef.current = adConfig ?? null;
  }, [adConfig]);

  useEffect(() => {
    viewerCountryCodeRef.current = viewerCountryCode;
  }, [viewerCountryCode]);

  useEffect(() => {
    viewerAgeRef.current = viewerAge;
  }, [viewerAge]);

  useEffect(() => {
    onAdEventRef.current = onAdEvent;
  }, [onAdEvent]);

  useEffect(() => {
    activeAdOverlayRef.current = activeAdOverlay;
  }, [activeAdOverlay]);

  useEffect(() => {
    if (!activeAdOverlay) return;
    const tick = window.setInterval(() => setAdOverlayNow(Date.now()), 250);
    return () => window.clearInterval(tick);
  }, [activeAdOverlay]);

  useEffect(() => {
    return () => {
      if (adOverlayHideTimerRef.current !== null) {
        window.clearTimeout(adOverlayHideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !src) return;
    let cleanupGestureListeners: (() => void) | null = null;

    const rafId = requestAnimationFrame(() => {
      const player = videojs(
        videoEl,
        VIDEO_JS_OPTIONS,
        function (this: VideoJsPlayer) {
          if (onReady) onReady(this);
        },
      );

      const mimeType =
        resolveMimeFromPlaybackType(type) ?? resolveVideoType(src);
      player.src(mimeType ? { src, type: mimeType } : { src });
      if (poster) player.poster(poster);

      const emitAdEvent = (
        name: AdEventName,
        slot: AdSlot,
        currentTime: number,
        details?: string,
      ) => {
        onAdEventRef.current?.({ name, slot, currentTime, details });
      };

      const fetchAdTag = async (tagUrl: string, timeoutSeconds: number) => {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), timeoutSeconds * 1000);
        try {
          await fetch(tagUrl, {
            method: "GET",
            mode: "no-cors",
            cache: "no-store",
            signal: controller.signal,
          });
          return true;
        } catch {
          return false;
        } finally {
          window.clearTimeout(timeoutId);
        }
      };

      const tryRunAdSlot = async (slot: AdSlot, currentTime: number) => {
        const config = adConfigRef.current;
        if (!config?.adsEnabled) {
          emitAdEvent("ad_skipped", slot, currentTime, "ads disabled");
          return;
        }

        if (
          !audienceAllowsAds(
            config,
            viewerCountryCodeRef.current,
            viewerAgeRef.current,
          )
        ) {
          emitAdEvent(
            "ad_suppressed",
            slot,
            currentTime,
            "geo/age restriction",
          );
          return;
        }

        const slotConfig =
          slot === "pre-roll"
            ? {
                enabled: config.preRollEnabled,
                tagUrl: config.preRollTagUrl,
                skippable: config.preRollSkippable,
                skipAfter: config.preRollSkipAfterSeconds,
              }
            : slot === "mid-roll"
              ? {
                  enabled: config.midRollEnabled,
                  tagUrl: config.midRollTagUrl,
                  skippable: config.midRollSkippable,
                  skipAfter: config.midRollSkipAfterSeconds,
                }
              : {
                  enabled: config.postRollEnabled,
                  tagUrl: config.postRollTagUrl,
                  skippable: config.postRollSkippable,
                  skipAfter: config.postRollSkipAfterSeconds,
                };

        if (!slotConfig.enabled || !hasTagUrl(slotConfig.tagUrl)) {
          emitAdEvent("ad_skipped", slot, currentTime, "slot disabled or empty tag");
          return;
        }

        const timeoutSec = clampTimeoutSeconds(config.adLoadTimeoutSeconds);
        emitAdEvent("ad_request_start", slot, currentTime);
        if (slotConfig.skippable) {
          activateAdOverlayUI(slot, slotConfig.skipAfter);
        } else {
          clearAdOverlayUI();
        }

        let ok = await fetchAdTag(slotConfig.tagUrl.trim(), timeoutSec);

        if (!ok && config.adFailureBehavior === "RETRY_ONCE") {
          emitAdEvent("ad_request_retry", slot, currentTime);
          ok = await fetchAdTag(slotConfig.tagUrl.trim(), timeoutSec);
        }

        if (ok) {
          emitAdEvent("ad_impression", slot, currentTime);
          // Keep a brief visible ad-state cue without blocking playback.
          clearAdOverlayUI(1200);
          return;
        }

        emitAdEvent("ad_failed", slot, currentTime, config.adFailureBehavior);
        clearAdOverlayUI(1200);
      };

      const seekBy = (deltaSeconds: number) => {
        const duration = player.duration();
        const current = player.currentTime();
        if (typeof current !== "number" || Number.isNaN(current)) return;
        const rawNext = current + deltaSeconds;
        const max =
          typeof duration === "number" && Number.isFinite(duration)
            ? duration
            : Number.POSITIVE_INFINITY;
        const next = Math.max(0, Math.min(rawNext, max));
        player.currentTime(next);
      };

      const getTapSide = (clientX: number): "left" | "right" => {
        const rect = player.el().getBoundingClientRect();
        return clientX < rect.left + rect.width / 2 ? "left" : "right";
      };

      const isGestureBlockedTarget = (target: EventTarget | null): boolean => {
        if (!(target instanceof Element)) return false;
        return Boolean(
          target.closest(
            ".vjs-control-bar, .vjs-menu, .vjs-button, .vjs-slider, .vjs-progress-control, .vjs-volume-panel",
          ),
        );
      };

      const playerElement = player.el() as HTMLElement;
      let preRollTriggered = false;
      let postRollTriggered = false;
      let midRollCount = 0;
      const firedTimestampBreaks = new Set<number>();
      let lastIntervalBreakIndex = 0;

      const onDoubleClick = (event: MouseEvent) => {
        if (isGestureBlockedTarget(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const side = getTapSide(event.clientX);
        seekBy(side === "left" ? -GESTURE_SEEK_SECONDS : GESTURE_SEEK_SECONDS);
      };

      const onTouchEnd = (event: TouchEvent) => {
        if (isGestureBlockedTarget(event.target)) return;
        if (event.changedTouches.length !== 1) return;

        const touch = event.changedTouches[0];
        const side = getTapSide(touch.clientX);
        const now = Date.now();
        const isDoubleTapSameSide =
          lastTapSideRef.current === side &&
          now - lastTapAtRef.current <= DOUBLE_TAP_WINDOW_MS;

        if (isDoubleTapSameSide) {
          event.preventDefault();
          seekBy(
            side === "left" ? -GESTURE_SEEK_SECONDS : GESTURE_SEEK_SECONDS,
          );
          lastTapAtRef.current = 0;
          lastTapSideRef.current = null;
          return;
        }

        lastTapAtRef.current = now;
        lastTapSideRef.current = side;
      };

      playerElement.addEventListener("dblclick", onDoubleClick, true);
      playerElement.addEventListener("touchend", onTouchEnd, {
        passive: false,
      });
      cleanupGestureListeners = () => {
        playerElement.removeEventListener("dblclick", onDoubleClick, true);
        playerElement.removeEventListener("touchend", onTouchEnd);
      };

      const rebuildQualityOptions = () => {
        const reps = getRepresentations(player);
        if (!reps.length) {
          setQualityOptions([]);
          setSelectedQuality("auto");
          return;
        }

        const grouped = new Map<
          string,
          {
            label: string;
            repIndexes: number[];
            maxHeight: number;
            maxBitrate: number;
          }
        >();

        reps.forEach((rep, index) => {
          const label = getQualityLabel(rep);
          const existing = grouped.get(label);
          if (existing) {
            existing.repIndexes.push(index);
            existing.maxHeight = Math.max(existing.maxHeight, rep.height ?? 0);
            existing.maxBitrate = Math.max(
              existing.maxBitrate,
              rep.bandwidth ?? 0,
            );
            return;
          }

          grouped.set(label, {
            label,
            repIndexes: [index],
            maxHeight: rep.height ?? 0,
            maxBitrate: rep.bandwidth ?? 0,
          });
        });

        const options = Array.from(grouped.values())
          .map((group, index) => ({
            id: `quality-${index}`,
            label: group.label,
            repIndexes: group.repIndexes,
            rank: getQualityRank(group.label),
            sortHeight: group.maxHeight,
            sortBitrate: group.maxBitrate,
          }))
          .sort((a, b) => {
            if (a.rank !== b.rank) return a.rank - b.rank;
            if (a.sortHeight !== b.sortHeight)
              return b.sortHeight - a.sortHeight;
            return b.sortBitrate - a.sortBitrate;
          });

        setQualityOptions(options);
        setSelectedQuality("auto");
      };

      player.on("loadedmetadata", rebuildQualityOptions);
      player.on("loadeddata", rebuildQualityOptions);

      player.on("play", () => {
        if (preRollTriggered) return;
        preRollTriggered = true;
        void tryRunAdSlot("pre-roll", player.currentTime() || 0);
      });

      player.on("timeupdate", () => {
        const config = adConfigRef.current;
        if (!config?.adsEnabled || !config.midRollEnabled) return;
        if (!hasTagUrl(config.midRollTagUrl)) return;

        const currentTime = player.currentTime();
        if (typeof currentTime !== "number" || currentTime < 0) return;
        if (midRollCount >= Math.max(1, config.midRollMaxPerVideo)) return;

        if (config.midRollTriggerMode === "FIXED_TIMESTAMPS") {
          const breakpoints = parseTimestampList(config.midRollTimestamps ?? []);
          for (const pointSec of breakpoints) {
            if (firedTimestampBreaks.has(pointSec)) continue;
            if (currentTime >= pointSec) {
              firedTimestampBreaks.add(pointSec);
              midRollCount += 1;
              void tryRunAdSlot("mid-roll", currentTime);
              break;
            }
          }
          return;
        }

        const intervalSeconds = Math.max(60, config.midRollIntervalMinutes * 60);
        const intervalIndex = Math.floor(currentTime / intervalSeconds);
        if (intervalIndex <= 0 || intervalIndex === lastIntervalBreakIndex) return;

        lastIntervalBreakIndex = intervalIndex;
        midRollCount += 1;
        void tryRunAdSlot("mid-roll", currentTime);
      });

      player.on("ended", () => {
        if (postRollTriggered) return;
        postRollTriggered = true;
        void tryRunAdSlot("post-roll", player.currentTime() || 0);
      });

      if (onProgressRef.current) {
        const report = () => {
          const t = player.currentTime();
          if (typeof t === "number" && t >= 0) {
            lastReportedRef.current = t;
            onProgressRef.current?.(t);
          }
        };
        player.on("timeupdate", () => {
          const t = player.currentTime();
          if (
            typeof t === "number" &&
            t >= 0 &&
            t - lastReportedRef.current >= PROGRESS_REPORT_INTERVAL_SEC
          ) {
            report();
          }
        });
        player.on("pause", report);
      }

      player.on("timeupdate", () => {
        const cb = onTimeUpdateRef.current;
        if (!cb) return;
        const t = player.currentTime();
        if (typeof t === "number" && t >= 0) {
          cb(t);
        }
      });

      playerRef.current = player;
    });

    return () => {
      cancelAnimationFrame(rafId);
      cleanupGestureListeners?.();
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-init when source/poster change
  }, [src, poster, type]);

  const showQualityControl = useMemo(
    () => (playbackTypeIsHls(type, src) ? qualityOptions.length > 0 : false),
    [qualityOptions.length, src, type],
  );

  function applyQuality(value: string): void {
    const player = playerRef.current;
    if (!player) return;

    const reps = getRepresentations(player);
    if (!reps.length) return;

    if (value === "auto") {
      reps.forEach((rep) => rep.enabled(true));
      setSelectedQuality("auto");
      return;
    }

    const option = qualityOptions.find((item) => item.id === value);
    if (!option) {
      reps.forEach((rep) => rep.enabled(true));
      setSelectedQuality("auto");
      return;
    }

    const selectedIndexes = new Set(option.repIndexes);
    reps.forEach((rep, repIndex) => rep.enabled(selectedIndexes.has(repIndex)));
    setSelectedQuality(value);
  }

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-lg bg-black",
        className,
      )}
      data-vjs-player
      title={title}
    >
      {showQualityControl ? (
        <div className="absolute right-2 top-2 z-20 flex items-center gap-2 rounded bg-black/70 px-2 py-1 text-xs text-white backdrop-blur-sm">
          <label className="mr-1">Quality</label>
          <select
            className="rounded border border-white/30 bg-black/70 px-1 py-0.5 text-xs text-white"
            value={selectedQuality}
            onChange={(event) => applyQuality(event.target.value)}
            aria-label="Video quality"
          >
            <option value="auto">Auto</option>
            {qualityOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {activeAdOverlay ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-end p-3 sm:p-4">
          <div className="pointer-events-auto rounded-md border border-white/20 bg-black/70 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-sm">
            <p className="mb-1 font-medium uppercase tracking-wide text-white/90">
              {activeAdOverlay.slot.replace("-", " ")}
            </p>
            {(() => {
              const elapsedSeconds = Math.max(
                0,
                Math.floor((adOverlayNow - activeAdOverlay.startedAtMs) / 1000),
              );
              const remaining = Math.max(
                0,
                activeAdOverlay.skipAfterSeconds - elapsedSeconds,
              );
              const canSkip = remaining === 0;

              return canSkip ? (
                <button
                  type="button"
                  className="rounded border border-white/30 bg-white/10 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/20"
                  onClick={() => {
                    const overlay = activeAdOverlayRef.current;
                    if (!overlay) return;
                    const player = playerRef.current;
                    const t =
                      player && !player.isDisposed()
                        ? (player.currentTime() ?? 0)
                        : 0;
                    emitAdEventUI("ad_skipped", overlay.slot, t, "viewer skip");
                    clearAdOverlayUI();
                  }}
                >
                  Skip ad
                </button>
              ) : (
                <p className="text-[11px] text-white/80">
                  Skip in {remaining}s
                </p>
              );
            })()}
          </div>
        </div>
      ) : null}
      <video
        ref={videoRef}
        className="video-js vjs-default-skin vjs-big-play-centered vjs-fill h-full w-full"
        controls
        playsInline
        preload="auto"
        aria-label={title}
      />
    </div>
  );
}

function playbackTypeIsHls(
  type: PlaybackType | undefined,
  src: string,
): boolean {
  if (type === "hls") return true;
  return /\.m3u8(\?|$)/i.test(src);
}
