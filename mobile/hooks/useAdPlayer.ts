import { useState, useEffect, useRef, useCallback, type MutableRefObject } from 'react';
import { useVideoPlayer } from 'expo-video';
import { adConfigService } from '../services/adConfigService';
import {
  fetchVastMediaInfo,
  fireImpressions,
  type VastMediaInfo,
} from '../src/services/vastService';
import type { AdConfigDto, AdFailureBehavior } from '../types/adConfig';

// ─── Public types ────────────────────────────────────────────────────────────

export type AdSlot = 'pre-roll' | 'mid-roll' | 'post-roll';

/** Props forwarded directly to <AdOverlay /> */
export interface AdOverlayState {
  videoUrl: string;
  mediaFallbackUrls: string[];
  skippable: boolean;
  skipAfterSeconds: number;
  startedAtMs: number;
  clickThroughUrl: string | null;
  slot: AdSlot;
}

export interface UseAdPlayerOptions {
  /**
   * Called just before VAST is fetched — pause the content player here.
   * Used automatically for mid-roll. For pre-roll / post-roll the caller
   * drives sequencing via the returned Promise.
   */
  pauseContent: () => void;
  /**
   * Called after any ad slot finishes (including failure) — resume the
   * content player here if appropriate (check your own state).
   */
  resumeContent: () => void;
}

export interface UseAdPlayerReturn {
  /** True while VAST is being fetched (before the overlay appears). */
  adLoading: boolean;
  /** Non-null when the ad overlay should be rendered. */
  adOverlay: AdOverlayState | null;
  /** Persistent ad player instance shared across normal/fullscreen UI remounts. */
  adVideoPlayer: ReturnType<typeof useVideoPlayer>;
  /** Stable callback: pass to <AdOverlay onDone={...} />. */
  onAdDone: () => void;
  /** Awaitable pre-roll trigger. Resolves when the ad ends or is skipped. */
  triggerPreRoll: () => Promise<void>;
  /** Awaitable post-roll trigger. Resolves when the ad ends or is skipped. */
  triggerPostRoll: () => Promise<void>;
  /**
   * Call on every content time-update (e.g. in the timeUpdate event listener).
   * Internally detects mid-roll trigger points and fires the ad asynchronously.
   */
  onTimeUpdate: (currentTimeSec: number) => void;
  /** Called by AdOverlay to persist current ad playback position. */
  onAdProgress: (currentTimeSec: number) => void;
  /** Last known ad playback position used to resume across remounts. */
  adPlaybackPositionRef: MutableRefObject<number>;
  /** Reset per-video ad tracking (call on episode change). */
  resetAdState: () => void;
  /**
   * Ref that is `true` while VAST is being fetched OR while the ad overlay
   * is showing. Read synchronously inside event listeners to guard against
   * ad-driven player state changes being mistaken for user interactions.
   */
  adActiveRef: MutableRefObject<boolean>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clampTimeout(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 8;
  return Math.min(30, Math.max(3, Math.floor(value)));
}

function hasTagUrl(url: string | undefined | null): boolean {
  return typeof url === 'string' && url.trim().length > 0;
}

/** Converts "HH:MM:SS" or "MM:SS" timestamp strings to seconds. */
function parseTimestampToSeconds(ts: string): number {
  const parts = ts.split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAdPlayer(options: UseAdPlayerOptions): UseAdPlayerReturn {
  const [adLoading, setAdLoading] = useState(false);
  const [adOverlay, setAdOverlay] = useState<AdOverlayState | null>(null);
  const adVideoPlayer = useVideoPlayer(null, () => {});

  // Always-current config ref — read by stable callbacks without re-renders.
  const adConfigRef = useRef<AdConfigDto | null>(null);
  const configFetchPromiseRef = useRef<Promise<AdConfigDto | null> | null>(null);

  // Always-current player control callbacks — updated via effect below.
  const pauseContentRef = useRef(options.pauseContent);
  const resumeContentRef = useRef(options.resumeContent);
  useEffect(() => {
    pauseContentRef.current = options.pauseContent;
    resumeContentRef.current = options.resumeContent;
  }, [options.pauseContent, options.resumeContent]);

  // Resolve the in-flight ad Promise (pre-roll / mid-roll / post-roll).
  const adResolveRef = useRef<(() => void) | null>(null);

  // Guards against concurrent ad slots.
  const adActiveRef = useRef(false);
  const adPlaybackPositionRef = useRef(0);

  // Unmount guard — prevents state updates on an unmounted component.
  const unmountedRef = useRef(false);
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      // Resolve any hanging Promise so callers don't wait forever.
      adResolveRef.current?.();
      adResolveRef.current = null;
    };
  }, []);

  // Per-video tracking refs (reset on episode change).
  const preRollFiredRef = useRef(false);
  const postRollFiredRef = useRef(false);
  const midRollCountRef = useRef(0);
  const firedTimestampBreaksRef = useRef(new Set<number>());
  const lastIntervalBreakIdxRef = useRef(0);

  // ── Config fetch ───────────────────────────────────────────────────────────

  const ensureConfig = useCallback(async (): Promise<AdConfigDto | null> => {
    if (adConfigRef.current) return adConfigRef.current;
    if (configFetchPromiseRef.current) return configFetchPromiseRef.current;

    configFetchPromiseRef.current = adConfigService
      .getPublicAdConfig()
      .then(cfg => {
        adConfigRef.current = cfg;
        return cfg;
      })
      .catch(() => {
        // Config unavailable — ads simply won't play. Not fatal.
        return null;
      })
      .finally(() => {
        configFetchPromiseRef.current = null;
      });

    return configFetchPromiseRef.current;
  }, []);

  useEffect(() => {
    void ensureConfig();
  }, [ensureConfig]);

  // ── Core ad runner ────────────────────────────────────────────────────────

  const runAdFromVast = useCallback(async (
    tagUrl: string,
    skippable: boolean,
    skipAfterSeconds: number,
    slot: AdSlot,
    timeoutSec: number,
    failureBehavior: AdFailureBehavior,
  ): Promise<void> => {
    console.log(`[Ad] ${slot} request start`, {
      skippable,
      skipAfterSeconds,
      timeoutSec,
      failureBehavior,
    });
    adActiveRef.current = true;
    pauseContentRef.current();

    if (!unmountedRef.current) setAdLoading(true);

    let vast: VastMediaInfo | null = await fetchVastMediaInfo(
      tagUrl,
      timeoutSec * 1000,
    );

    if (!vast && failureBehavior === 'RETRY_ONCE') {
      console.log(`[Ad] ${slot} request retry`);
      vast = await fetchVastMediaInfo(tagUrl, timeoutSec * 1000);
    }

    if (!unmountedRef.current) setAdLoading(false);

    if (!vast || unmountedRef.current) {
      console.log(`[Ad] ${slot} failed or unavailable`, {
        hasVast: Boolean(vast),
        unmounted: unmountedRef.current,
      });
      adActiveRef.current = false;
      resumeContentRef.current();
      return;
    }

    console.log(`[Ad] ${slot} loaded`, {
      mediaUrl: vast.mediaUrl,
      fallbackCount: Math.max(0, vast.mediaCandidates.length - 1),
      impressions: vast.impressionUrls.length,
    });

    try {
      adVideoPlayer.replace({ uri: vast.mediaUrl });
      adVideoPlayer.play();
    } catch {
      // Overlay-level retry/fallback logic will still handle failures.
    }

    // Fire impression pixels asynchronously — failure is silently ignored.
    fireImpressions(vast.impressionUrls);

    return new Promise<void>(resolve => {
      adResolveRef.current = resolve;
      if (!unmountedRef.current) {
        setAdOverlay({
          videoUrl: vast!.mediaUrl,
          mediaFallbackUrls: vast!.mediaCandidates.filter(u => u !== vast!.mediaUrl),
          skippable,
          skipAfterSeconds,
          startedAtMs: Date.now(),
          clickThroughUrl: vast!.clickThroughUrl,
          slot,
        });
      } else {
        // Component unmounted between VAST fetch and Promise setup.
        adActiveRef.current = false;
        resolve();
      }
    });
  }, []);

  // ── onAdDone — forwarded to <AdOverlay onDone={...} /> ───────────────────

  const onAdDone = useCallback((): void => {
    if (unmountedRef.current) return;
    console.log('[Ad] slot done');
    setAdOverlay(null);
    adActiveRef.current = false;
    adPlaybackPositionRef.current = 0;

    // Resolve the awaited Promise (pre-roll / post-roll callers unblock here).
    const resolve = adResolveRef.current;
    adResolveRef.current = null;
    resolve?.();

    try {
      adVideoPlayer.pause();
    } catch {
      // Ignore released/shared object edge cases during teardown.
    }

    // Resume content (mid-roll). For pre-roll/post-roll the caller decides
    // what to do after the Promise resolves; a duplicate play() call is safe.
    resumeContentRef.current();
  }, []);

  const onAdProgress = useCallback((currentTimeSec: number): void => {
    if (!Number.isFinite(currentTimeSec) || currentTimeSec < 0) return;
    adPlaybackPositionRef.current = currentTimeSec;
  }, []);

  // ── Public slot triggers ──────────────────────────────────────────────────

  const triggerPreRoll = useCallback(async (): Promise<void> => {
    const cfg = (await ensureConfig()) ?? adConfigRef.current;
    if (!cfg?.adsEnabled || !cfg.preRollEnabled) return;
    if (!hasTagUrl(cfg.preRollTagUrl)) return;
    if (preRollFiredRef.current || adActiveRef.current) return;

    preRollFiredRef.current = true;
    await runAdFromVast(
      cfg.preRollTagUrl,
      cfg.preRollSkippable,
      cfg.preRollSkipAfterSeconds,
      'pre-roll',
      clampTimeout(cfg.adLoadTimeoutSeconds),
      cfg.adFailureBehavior,
    );
  }, [ensureConfig, runAdFromVast]);

  const triggerPostRoll = useCallback(async (): Promise<void> => {
    const cfg = (await ensureConfig()) ?? adConfigRef.current;
    if (!cfg?.adsEnabled || !cfg.postRollEnabled) return;
    if (!hasTagUrl(cfg.postRollTagUrl)) return;
    if (postRollFiredRef.current || adActiveRef.current) return;

    postRollFiredRef.current = true;
    await runAdFromVast(
      cfg.postRollTagUrl,
      cfg.postRollSkippable,
      cfg.postRollSkipAfterSeconds,
      'post-roll',
      clampTimeout(cfg.adLoadTimeoutSeconds),
      cfg.adFailureBehavior,
    );
  }, [ensureConfig, runAdFromVast]);

  /**
   * Mid-roll check — synchronous entry point, fires async internally.
   * Safe to call on every timeUpdate event (~250 ms cadence).
   */
  const onTimeUpdate = useCallback((currentTimeSec: number): void => {
    const cfg = adConfigRef.current;
    if (!cfg) {
      void ensureConfig();
      return;
    }
    if (!cfg.adsEnabled || !cfg.midRollEnabled) return;
    if (!hasTagUrl(cfg.midRollTagUrl)) return;
    if (adActiveRef.current) return;
    if (midRollCountRef.current >= cfg.midRollMaxPerVideo) return;

    let shouldFire = false;

    if (cfg.midRollTriggerMode === 'INTERVAL') {
      const intervalSec = cfg.midRollIntervalMinutes * 60;
      if (intervalSec <= 0) return;
      const breakIdx = Math.floor(currentTimeSec / intervalSec);
      // Require at least one full interval to have elapsed before firing.
      if (breakIdx >= 1 && breakIdx > lastIntervalBreakIdxRef.current) {
        lastIntervalBreakIdxRef.current = breakIdx;
        shouldFire = true;
      }
    } else {
      // FIXED_TIMESTAMPS: check each HH:MM:SS entry in order.
      for (const ts of cfg.midRollTimestamps) {
        const tsSec = parseTimestampToSeconds(ts);
        if (tsSec <= 0) continue;
        if (firedTimestampBreaksRef.current.has(tsSec)) continue;
        if (currentTimeSec >= tsSec) {
          firedTimestampBreaksRef.current.add(tsSec);
          shouldFire = true;
          break; // one mid-roll per time-update call
        }
      }
    }

    if (!shouldFire) return;

    midRollCountRef.current += 1;
    // Fire and forget — mid-roll controls content pause/resume via callbacks.
    void runAdFromVast(
      cfg.midRollTagUrl,
      cfg.midRollSkippable,
      cfg.midRollSkipAfterSeconds,
      'mid-roll',
      clampTimeout(cfg.adLoadTimeoutSeconds),
      cfg.adFailureBehavior,
    );
  }, [ensureConfig, runAdFromVast]);

  // ── Reset per-video state ─────────────────────────────────────────────────

  const resetAdState = useCallback((): void => {
    preRollFiredRef.current = false;
    postRollFiredRef.current = false;
    midRollCountRef.current = 0;
    firedTimestampBreaksRef.current = new Set<number>();
    lastIntervalBreakIdxRef.current = 0;
    adPlaybackPositionRef.current = 0;
  }, []);

  return {
    adLoading,
    adOverlay,
    onAdDone,
    triggerPreRoll,
    triggerPostRoll,
    onTimeUpdate,
    onAdProgress,
    adPlaybackPositionRef,
    adVideoPlayer,
    resetAdState,
    adActiveRef,
  };
}
