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
const SEEK_FEEDBACK_VISIBLE_MS = 700;
const SEEK_FEEDBACK_ACCUMULATION_MS = 900;

type AdSlot = "pre-roll" | "mid-roll" | "post-roll";

type AdEventName =
  | "ad_suppressed"
  | "ad_request_start"
  | "ad_request_retry"
  | "ad_impression"
  | "ad_click"
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
  skippable: boolean;
  mediaUrl: string;
  clickThroughUrl: string | null;
  clickTrackingUrls: string[];
};

type SeekFeedbackOverlay = {
  side: "left" | "right";
  seconds: number;
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
  /** Optional start position in seconds to resume playback from. */
  startTime?: number;
};

const VIDEO_JS_OPTIONS = {
  controls: true,
  fill: true,
  playbackRates: [0.5, 1, 1.25, 1.5, 2],
  controlBar: {
    remainingTimeDisplay: false,
  },
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

function formatSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
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
  startTime,
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
  const [adMuted, setAdMuted] = useState<boolean>(false);
  const [adPaused, setAdPaused] = useState<boolean>(false);
  const [seekFeedbackOverlay, setSeekFeedbackOverlay] =
    useState<SeekFeedbackOverlay | null>(null);

  const startTimeRef = useRef<number | undefined>(startTime);
  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  const activeAdOverlayRef = useRef<ActiveAdOverlay | null>(null);
  const adOverlayHideTimerRef = useRef<number | null>(null);
  const adDoneResolveRef = useRef<(() => void) | null>(null);
  const adVideoRef = useRef<HTMLVideoElement | null>(null);
  const seekFeedbackHideTimerRef = useRef<number | null>(null);
  const seekFeedbackLastSideRef = useRef<"left" | "right" | null>(null);
  const seekFeedbackLastAtRef = useRef<number>(0);
  const seekFeedbackAccumRef = useRef<number>(0);
  const qualityOptionsRef = useRef<QualityOption[]>([]);
  const selectedQualityRef = useRef<string>("auto");
  const qualityControlContainerRef = useRef<HTMLDivElement | null>(null);
  const qualityControlValueRef = useRef<HTMLDivElement | null>(null);
  const qualityMenuListRef = useRef<HTMLUListElement | null>(null);
  const timeLabelRef = useRef<HTMLSpanElement | null>(null);

  const emitAdEventUI = (
    name: AdEventName,
    slot: AdSlot,
    currentTime: number,
    details?: string,
  ) => {
    onAdEventRef.current?.({ name, slot, currentTime, details });
  };

  const clearAdOverlayUI = () => {
    if (adOverlayHideTimerRef.current !== null) {
      window.clearTimeout(adOverlayHideTimerRef.current);
      adOverlayHideTimerRef.current = null;
    }
    setActiveAdOverlay(null);
    activeAdOverlayRef.current = null;
    // Signal tryRunAdSlot to resume content playback
    adDoneResolveRef.current?.();
    adDoneResolveRef.current = null;
  };

  const activateAdOverlayUI = (
    slot: AdSlot,
    skipAfterSeconds: number,
    skippable: boolean,
    mediaUrl: string,
    clickThroughUrl: string | null,
    clickTrackingUrls: string[],
  ) => {
    setAdPaused(false);
    const overlay: ActiveAdOverlay = {
      slot,
      skipAfterSeconds: Math.max(1, skipAfterSeconds),
      startedAtMs: Date.now(),
      skippable,
      mediaUrl,
      clickThroughUrl,
      clickTrackingUrls,
    };

    if (adOverlayHideTimerRef.current !== null) {
      window.clearTimeout(adOverlayHideTimerRef.current);
      adOverlayHideTimerRef.current = null;
    }

    setActiveAdOverlay(overlay);
    activeAdOverlayRef.current = overlay;
  };

  const showSeekFeedbackUI = (deltaSeconds: number) => {
    const side: "left" | "right" = deltaSeconds < 0 ? "left" : "right";
    const now = Date.now();
    const amount = Math.max(1, Math.abs(deltaSeconds));

    const shouldAccumulate =
      seekFeedbackLastSideRef.current === side &&
      now - seekFeedbackLastAtRef.current <= SEEK_FEEDBACK_ACCUMULATION_MS;

    const nextAmount = shouldAccumulate
      ? seekFeedbackAccumRef.current + amount
      : amount;

    seekFeedbackAccumRef.current = nextAmount;
    seekFeedbackLastSideRef.current = side;
    seekFeedbackLastAtRef.current = now;

    setSeekFeedbackOverlay({ side, seconds: nextAmount });

    if (seekFeedbackHideTimerRef.current !== null) {
      window.clearTimeout(seekFeedbackHideTimerRef.current);
    }

    seekFeedbackHideTimerRef.current = window.setTimeout(() => {
      setSeekFeedbackOverlay(null);
      seekFeedbackHideTimerRef.current = null;
      seekFeedbackAccumRef.current = 0;
      seekFeedbackLastSideRef.current = null;
      seekFeedbackLastAtRef.current = 0;
    }, SEEK_FEEDBACK_VISIBLE_MS);
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
    qualityOptionsRef.current = qualityOptions;
  }, [qualityOptions]);

  useEffect(() => {
    selectedQualityRef.current = selectedQuality;
  }, [selectedQuality]);

  useEffect(() => {
    activeAdOverlayRef.current = activeAdOverlay;
  }, [activeAdOverlay]);

  useEffect(() => {
    if (!activeAdOverlay || adPaused) return;
    const tick = window.setInterval(() => setAdOverlayNow(Date.now()), 250);
    return () => window.clearInterval(tick);
  }, [activeAdOverlay, adPaused]);

  useEffect(() => {
    return () => {
      if (adOverlayHideTimerRef.current !== null) {
        window.clearTimeout(adOverlayHideTimerRef.current);
      }
      if (seekFeedbackHideTimerRef.current !== null) {
        window.clearTimeout(seekFeedbackHideTimerRef.current);
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

      type VastMediaInfo = {
        mediaUrl: string;
        impressionUrls: string[];
        clickThroughUrl: string | null;
        clickTrackingUrls: string[];
      };

      const fetchVastMediaInfo = async (
        tagUrl: string,
        timeoutSeconds: number,
      ): Promise<VastMediaInfo | null> => {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), timeoutSeconds * 1000);
        try {
          const res = await fetch(tagUrl, { cache: "no-store", signal: controller.signal });
          const text = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "text/xml");

          // Prefer MP4 media files; fall back to any media file
          const mediaFiles = Array.from(doc.querySelectorAll("MediaFile"));
          let mediaUrl: string | null = null;
          for (const mf of mediaFiles) {
            const mfType = (mf.getAttribute("type") ?? "").toLowerCase();
            if (mfType.includes("mp4")) {
              mediaUrl = mf.textContent?.trim() ?? null;
              if (mediaUrl) break;
            }
          }
          if (!mediaUrl && mediaFiles.length > 0) {
            mediaUrl = mediaFiles[0].textContent?.trim() ?? null;
          }
          if (!mediaUrl) return null;

          const impressionUrls = Array.from(doc.querySelectorAll("Impression"))
            .map((el) => el.textContent?.trim())
            .filter((u): u is string => Boolean(u));
          const clickThroughUrl =
            doc.querySelector("ClickThrough")?.textContent?.trim() ?? null;
          const clickTrackingUrls = Array.from(doc.querySelectorAll("ClickTracking"))
            .map((el) => el.textContent?.trim())
            .filter((u): u is string => Boolean(u));

          return { mediaUrl, impressionUrls, clickThroughUrl, clickTrackingUrls };
        } catch {
          return null;
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

        // Pause content while the ad loads and plays
        if (!player.isDisposed()) player.pause();

        let vastInfo = await fetchVastMediaInfo(slotConfig.tagUrl.trim(), timeoutSec);

        if (!vastInfo && config.adFailureBehavior === "RETRY_ONCE") {
          emitAdEvent("ad_request_retry", slot, currentTime);
          vastInfo = await fetchVastMediaInfo(slotConfig.tagUrl.trim(), timeoutSec);
        }

        if (!vastInfo) {
          emitAdEvent("ad_failed", slot, currentTime, config.adFailureBehavior);
          if (!player.isDisposed()) void player.play();
          return;
        }

        // Fire VAST impression tracking pixels
        for (const url of vastInfo.impressionUrls) {
          try { navigator.sendBeacon(url); } catch { /* ignore */ }
        }
        emitAdEvent("ad_impression", slot, currentTime);

        // Show ad video overlay; wait until it ends or is skipped
        await new Promise<void>((resolve) => {
          adDoneResolveRef.current = resolve;
          activateAdOverlayUI(
            slot,
            slotConfig.skipAfter,
            slotConfig.skippable,
            vastInfo!.mediaUrl,
            vastInfo!.clickThroughUrl,
            vastInfo!.clickTrackingUrls,
          );
        });

        // Resume content after ad completes or is skipped
        if (!player.isDisposed()) void player.play();
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
      if (!playerElement.hasAttribute("tabindex")) {
        playerElement.setAttribute("tabindex", "0");
      }
      let preRollTriggered = Boolean(startTimeRef.current && startTimeRef.current > 0);
      let postRollTriggered = false;
      let midRollCount = 0;
      const firedTimestampBreaks = new Set<number>();
      let lastIntervalBreakIndex = 0;

      const controlBar = (
        player as VideoJsPlayer & {
          controlBar?: {
            el: () => HTMLElement;
            getChild: (name: string) => { el: () => HTMLElement } | undefined;
          };
        }
      ).controlBar;
      const controlBarEl = controlBar?.el();
      let disposeOutsideMenuListener: (() => void) | null = null;

      if (controlBar && controlBarEl) {
        // ── time display: current / duration on the right side of the bar ──
        const timeDisplay = document.createElement("div");
        timeDisplay.className =
          "vjs-brixlore-time-display vjs-time-control vjs-control";

        const timeText = document.createElement("span");
        timeText.className = "vjs-brixlore-time-text";
        timeText.textContent = "0:00 / 0:00";
        timeDisplay.appendChild(timeText);
        timeLabelRef.current = timeText;

        // ── quality selector: popup menu identical to vjs-playback-rate pattern ──
        const qualityContainer = document.createElement("div");
        qualityContainer.className =
          "vjs-quality-selector-control vjs-menu-button vjs-menu-button-popup vjs-control vjs-button";
        qualityContainer.style.display = "none";

        const qualityValue = document.createElement("div");
        qualityValue.className = "vjs-quality-selector-value";
        qualityValue.textContent = "Auto";

        const qualityInnerBtn = document.createElement("button");
        qualityInnerBtn.type = "button";
        qualityInnerBtn.className =
          "vjs-quality-selector-button vjs-menu-button vjs-menu-button-popup vjs-button";
        qualityInnerBtn.setAttribute("aria-disabled", "false");
        qualityInnerBtn.setAttribute("title", "Video Quality");
        qualityInnerBtn.setAttribute("aria-haspopup", "true");
        qualityInnerBtn.setAttribute("aria-expanded", "false");

        const iconSpan = document.createElement("span");
        iconSpan.className = "vjs-icon-placeholder";
        iconSpan.setAttribute("aria-hidden", "true");
        const ctrlText = document.createElement("span");
        ctrlText.className = "vjs-control-text";
        ctrlText.setAttribute("aria-live", "polite");
        ctrlText.textContent = "Video Quality";

        qualityInnerBtn.appendChild(iconSpan);
        qualityInnerBtn.appendChild(ctrlText);

        // Menu structure — identical to vjs-playback-rate
        const qualityMenu = document.createElement("div");
        qualityMenu.className = "vjs-menu";
        const qualityMenuList = document.createElement("ul");
        qualityMenuList.className = "vjs-menu-content";
        qualityMenuList.setAttribute("role", "menu");
        qualityMenu.appendChild(qualityMenuList);

        qualityContainer.appendChild(qualityValue);
        qualityContainer.appendChild(qualityInnerBtn);
        qualityContainer.appendChild(qualityMenu);

        // Hover: show/hide menu via JS (reliable regardless of vjs-workinghover)
        qualityContainer.addEventListener("mouseenter", () => {
          qualityContainer.classList.add("vjs-hover");
        });
        qualityContainer.addEventListener("mouseleave", () => {
          qualityContainer.classList.remove("vjs-hover");
        });

        // Click-to-toggle for touch/keyboard
        qualityInnerBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const isActive = qualityContainer.classList.toggle("vjs-menu-button-active");
          qualityInnerBtn.setAttribute("aria-expanded", isActive ? "true" : "false");
          if (isActive) {
            // One-shot outside-click listener so the menu closes on blur
            const closeOnOutside = (outsideEvent: Event) => {
              if (!qualityContainer.contains(outsideEvent.target as Node)) {
                qualityContainer.classList.remove("vjs-menu-button-active");
                qualityInnerBtn.setAttribute("aria-expanded", "false");
                document.removeEventListener("click", closeOnOutside, true);
                disposeOutsideMenuListener = null;
              }
            };
            disposeOutsideMenuListener?.();
            document.addEventListener("click", closeOnOutside, true);
            disposeOutsideMenuListener = () => {
              document.removeEventListener("click", closeOnOutside, true);
              disposeOutsideMenuListener = null;
            };
          }
        });

        const beforeControl =
          controlBar.getChild("PlaybackRateMenuButton")?.el() ??
          controlBar.getChild("PictureInPictureToggle")?.el() ??
          controlBar.getChild("FullscreenToggle")?.el() ??
          null;

        // Both inserted in order before playback rate: [time] [quality]
        controlBarEl.insertBefore(timeDisplay, beforeControl);
        controlBarEl.insertBefore(qualityContainer, beforeControl);
        qualityControlContainerRef.current = qualityContainer;
        qualityControlValueRef.current = qualityValue;
        qualityMenuListRef.current = qualityMenuList;

        // Live time updates
        const updateTimeDisplay = () => {
          const label = timeLabelRef.current;
          if (!label) return;
          const cur = player.currentTime() ?? 0;
          const dur = player.duration() ?? 0;
          label.textContent = `${formatSeconds(cur)} / ${formatSeconds(dur)}`;
        };
        player.on("timeupdate", updateTimeDisplay);
        player.on("loadedmetadata", updateTimeDisplay);
        player.on("durationchange", updateTimeDisplay);
      }

      const onDoubleClick = (event: MouseEvent) => {
        if (isGestureBlockedTarget(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const side = getTapSide(event.clientX);
        const delta =
          side === "left" ? -GESTURE_SEEK_SECONDS : GESTURE_SEEK_SECONDS;
        seekBy(delta);
        showSeekFeedbackUI(delta);
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
          const delta =
            side === "left" ? -GESTURE_SEEK_SECONDS : GESTURE_SEEK_SECONDS;
          seekBy(delta);
          showSeekFeedbackUI(delta);
          // Keep chain alive so repeated taps on the same side can accumulate (+20, +30...)
          lastTapAtRef.current = now;
          lastTapSideRef.current = side;
          return;
        }

        lastTapAtRef.current = now;
        lastTapSideRef.current = side;
      };

      const onKeyDown = (event: KeyboardEvent) => {
        // Avoid hijacking keyboard interactions inside sliders/menus.
        if (
          event.target instanceof Element &&
          event.target.closest(
            ".vjs-slider, .vjs-menu, .vjs-volume-panel, input, textarea, select",
          )
        ) {
          return;
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          event.stopPropagation();
          seekBy(-GESTURE_SEEK_SECONDS);
          showSeekFeedbackUI(-GESTURE_SEEK_SECONDS);
          return;
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          event.stopPropagation();
          seekBy(GESTURE_SEEK_SECONDS);
          showSeekFeedbackUI(GESTURE_SEEK_SECONDS);
          return;
        }

        if (event.key === " " || event.code === "Space") {
          event.preventDefault();
          event.stopPropagation();
          if (player.paused()) {
            void player.play();
          } else {
            player.pause();
          }
        }
      };

      playerElement.addEventListener("dblclick", onDoubleClick, true);
      playerElement.addEventListener("touchend", onTouchEnd, {
        passive: false,
      });
      playerElement.addEventListener("keydown", onKeyDown, true);
      cleanupGestureListeners = () => {
        playerElement.removeEventListener("dblclick", onDoubleClick, true);
        playerElement.removeEventListener("touchend", onTouchEnd);
        playerElement.removeEventListener("keydown", onKeyDown, true);
        disposeOutsideMenuListener?.();
        if (seekFeedbackHideTimerRef.current !== null) {
          window.clearTimeout(seekFeedbackHideTimerRef.current);
          seekFeedbackHideTimerRef.current = null;
        }
        seekFeedbackAccumRef.current = 0;
        seekFeedbackLastSideRef.current = null;
        seekFeedbackLastAtRef.current = 0;
        setSeekFeedbackOverlay(null);
        qualityControlValueRef.current = null;
        qualityMenuListRef.current = null;
        timeLabelRef.current = null;
        qualityControlContainerRef.current = null;
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

      let hasSeekedInitial = false;
      const doInitialSeek = (eventName: string) => {
        if (hasSeekedInitial || !startTimeRef.current || startTimeRef.current <= 0) {
          return;
        }
        try {
          player.currentTime(startTimeRef.current);
          if (eventName === "playing") {
            hasSeekedInitial = true;
          }
        } catch {
          // ignore errors on uninitialized player
        }
      };
      player.on("loadedmetadata", () => doInitialSeek("loadedmetadata"));
      player.on("playing", () => doInitialSeek("playing"));

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

  useEffect(() => {
    const container = qualityControlContainerRef.current;
    const valueEl = qualityControlValueRef.current;
    const menuList = qualityMenuListRef.current;
    if (!container) return;

    container.style.display = showQualityControl ? "block" : "none";
    if (!valueEl || !menuList) return;

    // Update value overlay label
    const activeOption = qualityOptions.find((o) => o.id === selectedQuality);
    valueEl.textContent = activeOption?.label ?? "Auto";

    // Rebuild menu items so selection state and available qualities stay in sync
    menuList.replaceChildren();

    const makeMenuItem = (value: string, label: string) => {
      const isSelected = selectedQuality === value;
      const li = document.createElement("li");
      li.className = isSelected
        ? "vjs-menu-item vjs-selected"
        : "vjs-menu-item";
      li.setAttribute("tabindex", "-1");
      li.setAttribute("role", "menuitemradio");
      li.setAttribute("aria-disabled", "false");
      li.setAttribute("aria-checked", isSelected ? "true" : "false");

      const textSpan = document.createElement("span");
      textSpan.className = "vjs-menu-item-text";
      textSpan.textContent = label;

      const ctrlSpan = document.createElement("span");
      ctrlSpan.className = "vjs-control-text";
      ctrlSpan.setAttribute("aria-live", "polite");
      ctrlSpan.textContent = isSelected ? ", selected" : "";

      li.appendChild(textSpan);
      li.appendChild(ctrlSpan);

      li.addEventListener("click", (e) => {
        e.stopPropagation();
        applyQuality(value);
        // Close menu
        container.classList.remove("vjs-menu-button-active");
        const btn =
          container.querySelector<HTMLButtonElement>("[aria-haspopup]");
        btn?.setAttribute("aria-expanded", "false");
      });

      return li;
    };

    // "Auto" always first, then remaining options highest→lowest
    menuList.appendChild(makeMenuItem("auto", "Auto"));
    for (const opt of qualityOptions) {
      menuList.appendChild(makeMenuItem(opt.id, opt.label));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applyQuality uses refs internally; stable across renders
  }, [qualityOptions, selectedQuality, showQualityControl]);

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

    // Use the ref to avoid stale closure — qualityOptions from initial render would always be []
    const option = qualityOptionsRef.current.find((item) => item.id === value);
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
      {seekFeedbackOverlay ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-between px-4 sm:px-8">
          <div
            className={cn(
              "flex h-8 min-w-14 items-center justify-center rounded-md bg-black/35 px-2.5 text-base font-semibold text-white backdrop-blur-[0.5px] sm:h-9 sm:min-w-16 sm:text-lg",
              seekFeedbackOverlay.side === "left"
                ? "opacity-100"
                : "opacity-0",
            )}
            aria-hidden={seekFeedbackOverlay.side !== "left"}
          >
            <span className="leading-none">&#8249;</span>
            <span className="ml-1 text-lg leading-none sm:text-xl">
              -{seekFeedbackOverlay.seconds}
            </span>
          </div>
          <div
            className={cn(
              "flex h-8 min-w-14 items-center justify-center rounded-md bg-black/35 px-2.5 text-base font-semibold text-white backdrop-blur-[0.5px] sm:h-9 sm:min-w-16 sm:text-lg",
              seekFeedbackOverlay.side === "right"
                ? "opacity-100"
                : "opacity-0",
            )}
            aria-hidden={seekFeedbackOverlay.side !== "right"}
          >
            <span className="text-lg leading-none sm:text-xl">
              +{seekFeedbackOverlay.seconds}
            </span>
            <span className="ml-1 leading-none">&#8250;</span>
          </div>
        </div>
      ) : null}
      {activeAdOverlay ? (
        <div className="absolute inset-0 z-30 bg-black">
          {/* Ad video */}
          <video
            ref={adVideoRef}
            src={activeAdOverlay.mediaUrl}
            className="h-full w-full object-contain"
            autoPlay
            playsInline
            muted={adMuted}
            onEnded={clearAdOverlayUI}
            onError={clearAdOverlayUI}
            onPause={() => setAdPaused(true)}
            onPlay={() => setAdPaused(false)}
          />

          {/* "Advertisement" badge – top-left */}
          <div className="pointer-events-none absolute left-3 top-3 z-10 rounded bg-black/60 px-2 py-1 text-[10px] uppercase tracking-widest text-white/60 backdrop-blur-sm">
            Advertisement
          </div>

          {/* Bottom control bar */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8 sm:px-4 sm:pb-4">

            {/* Non-seekable progress bar */}
            {(() => {
              const dur = adVideoRef.current?.duration ?? 0;
              const cur = adVideoRef.current?.currentTime ?? 0;
              const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;
              return (
                <div className="mb-2 h-[3px] w-full overflow-hidden rounded-full bg-white/25 sm:mb-3">
                  <div
                    className="h-full rounded-full bg-yellow-400"
                    style={{ width: `${pct}%`, transition: "width 0.25s linear" }}
                  />
                </div>
              );
            })()}

            {/* Controls row */}
            <div className="flex items-center justify-between gap-2">

              {/* Left side: play/pause + mute toggle + time remaining */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Play / Pause */}
                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-white/80 hover:text-white sm:h-8 sm:w-8"
                  onClick={() => {
                    const video = adVideoRef.current;
                    if (!video) return;
                    if (video.paused) { void video.play(); } else { video.pause(); }
                  }}
                  aria-label={adPaused ? "Resume ad" : "Pause ad"}
                >
                  {adPaused ? (
                    /* Play icon */
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true">
                      <path d="M8 5V19L19 12L8 5Z" />
                    </svg>
                  ) : (
                    /* Pause icon */
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true">
                      <path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-white/80 hover:text-white sm:h-8 sm:w-8"
                  onClick={() => setAdMuted((m) => !m)}
                  aria-label={adMuted ? "Unmute ad" : "Mute ad"}
                >
                  {adMuted ? (
                    /* Speaker muted */
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true">
                      <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97V10.18L16.45 12.63C16.48 12.43 16.5 12.22 16.5 12ZM19 12C19 12.94 18.8 13.82 18.46 14.64L19.97 16.15C20.63 14.91 21 13.5 21 12C21 7.72 18.01 4.14 14 3.23V5.29C16.89 6.15 19 8.83 19 12ZM4.27 3L3 4.27L7.73 9H3V15H7L12 20V13.27L16.25 17.52C15.58 18.04 14.83 18.45 14 18.7V20.76C15.38 20.45 16.63 19.82 17.68 18.96L19.73 21L21 19.73L12 10.73L4.27 3ZM12 4L9.91 6.09L12 8.18V4Z" />
                    </svg>
                  ) : (
                    /* Speaker on */
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true">
                      <path d="M3 9V15H7L12 20V4L7 9H3ZM16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12ZM14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z" />
                    </svg>
                  )}
                </button>

                {/* Time remaining */}
                {(() => {
                  const dur = adVideoRef.current?.duration ?? 0;
                  const cur = adVideoRef.current?.currentTime ?? 0;
                  const remSec = Math.max(0, Math.ceil(dur - cur));
                  if (!dur) return null;
                  const fmt = (s: number) =>
                    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
                  return (
                    <span className="text-[11px] tabular-nums text-white/70 sm:text-xs">
                      {fmt(remSec)}
                    </span>
                  );
                })()}
              </div>

              {/* Right side: Learn More + Skip */}
              <div className="flex items-center gap-2">
                {activeAdOverlay.clickThroughUrl ? (
                  <button
                    type="button"
                    className="rounded border border-white/30 bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm hover:bg-black/80 sm:px-3 sm:text-xs"
                    onClick={() => {
                      const overlay = activeAdOverlayRef.current;
                      if (!overlay?.clickThroughUrl) return;
                      for (const url of overlay.clickTrackingUrls) {
                        try { navigator.sendBeacon(url); } catch { /* ignore */ }
                      }
                      window.open(overlay.clickThroughUrl, "_blank", "noopener,noreferrer");
                      const player = playerRef.current;
                      const t =
                        player && !player.isDisposed()
                          ? (player.currentTime() ?? 0)
                          : 0;
                      emitAdEventUI("ad_click", overlay.slot, t);
                    }}
                  >
                    Learn More
                  </button>
                ) : null}

                {activeAdOverlay.skippable ? (() => {
                  // Use actual video time so pausing freezes the countdown correctly.
                  // Fall back to wall-clock elapsed (adOverlayNow) before the video element
                  // is available — this also keeps the re-render ticker in use so ESLint
                  // doesn't flag adOverlayNow as unused.
                  const wallElapsed = Math.max(0, (adOverlayNow - activeAdOverlay.startedAtMs) / 1000);
                  const videoCurrent = adVideoRef.current?.currentTime ?? wallElapsed;
                  const remaining = Math.max(
                    0,
                    Math.ceil(activeAdOverlay.skipAfterSeconds - videoCurrent),
                  );
                  const canSkip = remaining === 0;

                  return canSkip ? (
                    <button
                      type="button"
                      className="rounded border border-white/40 bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-black/90 sm:px-3 sm:text-xs"
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
                      Skip Ad →
                    </button>
                  ) : (
                    <span className="rounded bg-black/60 px-2 py-1 text-[11px] text-white/70 backdrop-blur-sm sm:text-xs">
                      Skip in {remaining}s
                    </span>
                  );
                })() : null}
              </div>
            </div>
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
