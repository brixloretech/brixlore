"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { HLSVideoPlayerLazy } from "@/components/player";
import { SubscriptionPrompt } from "@/components/content";
import { useAuth } from "@/contexts";
import { adConfigService, contentService, streamingService } from "@/lib/services";
import { ApiError } from "@/lib/api-client";
import type { AdConfigDto, ContentDetailDto, PlaybackType } from "@/types/api";
import {
  formatDuration,
  isLongForm,
  durationToSeconds,
} from "@/lib/video-utils";
import { DEFAULT_HLS_TEST_STREAM } from "@/lib/hls-streams";
import {
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  Button,
} from "@/components/ui";

type WatchPageClientProps = {
  params: { id: string };
};

type DisplayContent = {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string | null;
  category?: string;
  releaseYear?: number;
  duration?: string;
};

type PlayableEpisode = {
  id: string;
  title: string;
  duration?: string;
};

const GUEST_LIMIT_STORAGE_KEY = "guest-watch-limits-v1";
const FREE_LIMIT_STORAGE_KEY = "free-watch-limits-v1";
const MAX_UNIQUE_VIDEOS = 3;
const GUEST_MAX_PLAYBACK_SECONDS = 30;
const FREE_MAX_PLAYBACK_SECONDS = 120;

type AccessTier = "guest" | "free" | "paid";
type LimitModalReason =
  | "guest-video-limit"
  | "guest-time-limit"
  | "free-video-limit"
  | "free-time-limit";

function readWatchedIds(storageKey: string): Set<string> {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as { watchedVideoIds?: unknown };
    const ids = Array.isArray(parsed?.watchedVideoIds)
      ? parsed.watchedVideoIds.filter((v): v is string => typeof v === "string")
      : [];
    return new Set(ids);
  } catch {
    return new Set<string>();
  }
}

function writeWatchedIds(storageKey: string, ids: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({ watchedVideoIds: Array.from(ids) }),
  );
}

function toDisplayContent(dto: ContentDetailDto): DisplayContent {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    thumbnailUrl: dto.thumbnailUrl ?? null,
    category: dto.category,
    releaseYear: dto.releaseYear,
    duration: dto.duration,
  };
}

function isEpisodicContentType(type?: string): boolean {
  return type === "SERIES" || type === "ANIMATION" || type === "DOCUMENTARY";
}

function pickPrimaryEpisode(content: ContentDetailDto): PlayableEpisode | null {
  if (
    (content.type === "DOCUMENTARY" || content.type === "SERIES") &&
    content.trailer
  ) {
    return {
      id: content.trailer.id,
      title: content.trailer.title,
      duration: content.trailer.duration,
    };
  }

  // If seasons exist, select the first episode from the first season
  if (content.seasons && content.seasons.length > 0 && content.episodes) {
    const firstSeason = content.seasons[0];
    const firstSeasonEpisodes = content.episodes
      .filter((e) => e.seasonId === firstSeason.id)
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
    if (firstSeasonEpisodes.length > 0) {
      const first = firstSeasonEpisodes[0];
      return {
        id: first.id,
        title: first.title,
        duration: first.duration,
      };
    }
  }
  // Otherwise, use the first episode from the episodes array
  const firstEpisode = content.episodes?.[0];
  if (firstEpisode) {
    return {
      id: firstEpisode.id,
      title: firstEpisode.title,
      duration: firstEpisode.duration,
    };
  }
  // Fallback to trailer if available
  if (content.trailer) {
    return {
      id: content.trailer.id,
      title: content.trailer.title,
      duration: content.trailer.duration,
    };
  }
  return null;
}

export default function WatchPageClient({ params }: WatchPageClientProps) {
  const { id } = params;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const episodeIdFromUrl = searchParams.get("episodeId")?.trim() || null;
  const {
    isSubscribed,
    isAuthenticated,
    isAdmin,
    isLoading: authLoading,
  } = useAuth();
  const isFreeUser = isAuthenticated && !isSubscribed && !isAdmin;
  const accessTier: AccessTier = isAuthenticated
    ? isFreeUser
      ? "free"
      : "paid"
    : "guest";
  const [content, setContent] = useState<ContentDetailDto | null>(null);
  const [primaryEpisode, setPrimaryEpisode] = useState<PlayableEpisode | null>(
    null,
  );
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [playbackType, setPlaybackType] = useState<PlaybackType | undefined>();
  const [adConfig, setAdConfig] = useState<AdConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingDevStream, setUsingDevStream] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  /** Set when playback permission is denied (401/403) or unavailable. */
  const [playbackError, setPlaybackError] = useState<
    "unauthorized" | "forbidden" | "unavailable" | "config_required" | null
  >(null);
  const [limitModalReason, setLimitModalReason] =
    useState<LimitModalReason | null>(null);
  const [videoLimitReached, setVideoLimitReached] = useState(false);
  const [watchedVideoIds, setWatchedVideoIds] = useState<Set<string>>(
    new Set(),
  );
  const [limitsReady, setLimitsReady] = useState(false);
  const [currentVideoStartPosition, setCurrentVideoStartPosition] = useState<
    number | null
  >(null);
  const mp4VideoRef = useRef<HTMLVideoElement | null>(null);
  const isTrailerPlayback =
    content?.type === "TRAILER" ||
    (content?.trailer?.id != null && primaryEpisode?.id === content.trailer.id);

  useEffect(() => {
    if (accessTier === "paid") {
      setLimitModalReason(null);
      setVideoLimitReached(false);
      setCurrentVideoStartPosition(null);
      setWatchedVideoIds(new Set());
      setLimitsReady(false);
      return;
    }

    const storageKey =
      accessTier === "free" ? FREE_LIMIT_STORAGE_KEY : GUEST_LIMIT_STORAGE_KEY;
    const ids = readWatchedIds(storageKey);
    setWatchedVideoIds(ids);
    setLimitsReady(true);
    setCurrentVideoStartPosition(null);
  }, [accessTier]);

  useEffect(() => {
    if (!limitsReady || accessTier === "paid" || isTrailerPlayback) {
      setVideoLimitReached(false);
      setLimitModalReason(null);
      return;
    }

    setCurrentVideoStartPosition(null);

    if (watchedVideoIds.has(id)) {
      setVideoLimitReached(false);
      setLimitModalReason(null);
      return;
    }

    if (watchedVideoIds.size >= MAX_UNIQUE_VIDEOS) {
      setVideoLimitReached(true);
      setLimitModalReason(
        accessTier === "free" ? "free-video-limit" : "guest-video-limit",
      );
      return;
    }

    const next = new Set(watchedVideoIds);
    next.add(id);
    const storageKey =
      accessTier === "free" ? FREE_LIMIT_STORAGE_KEY : GUEST_LIMIT_STORAGE_KEY;
    setWatchedVideoIds(next);
    writeWatchedIds(storageKey, next);
    setVideoLimitReached(false);
    setLimitModalReason(null);
  }, [limitsReady, watchedVideoIds, id, accessTier, isTrailerPlayback]);

  function handlePlaybackTick(currentSeconds: number): void {
    if (
      accessTier === "paid" ||
      isTrailerPlayback ||
      limitModalReason === "guest-video-limit" ||
      limitModalReason === "free-video-limit"
    ) {
      return;
    }

    const normalizedCurrent = Math.max(0, Math.floor(currentSeconds));
    if (currentVideoStartPosition === null && normalizedCurrent > 0) {
      setCurrentVideoStartPosition(normalizedCurrent);
      return;
    }

    if (currentVideoStartPosition === null) {
      return;
    }

    const watched = normalizedCurrent - currentVideoStartPosition;
    const maxSeconds =
      accessTier === "free"
        ? FREE_MAX_PLAYBACK_SECONDS
        : GUEST_MAX_PLAYBACK_SECONDS;
    if (watched >= maxSeconds) {
      setLimitModalReason(
        accessTier === "free" ? "free-time-limit" : "guest-time-limit",
      );
      if (mp4VideoRef.current) {
        void mp4VideoRef.current.pause();
      }
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const config = await adConfigService.getPublicAdConfig();
        if (!cancelled) setAdConfig(config);
      } catch {
        if (!cancelled) setAdConfig(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPlaybackError(null);
    setUsingDevStream(false);
    setComingSoon(false);
    if (process.env.NODE_ENV !== "production") {
      //console.log("[Watch] loading content", { contentId: id });
    }
    (async () => {
      setLoading(true);
      try {
        const detailRes = await contentService.getContentById(id);
        if (cancelled) return;
        const contentDetail = detailRes?.content ?? null;
        setContent(contentDetail);
        if (!contentDetail) return;
        let episode: PlayableEpisode | null = null;
        if (episodeIdFromUrl) {
          const fromList = contentDetail.episodes?.find(
            (e) => e.id === episodeIdFromUrl,
          );
          if (fromList) {
            episode = {
              id: fromList.id,
              title: fromList.title,
              duration: fromList.duration,
            };
          }
          if (!episode && contentDetail.seasons?.length) {
            for (const season of contentDetail.seasons) {
              const episodes = await contentService.getEpisodes(
                contentDetail.id,
                season.id,
              );
              if (cancelled) return;
              const found = episodes?.find((e) => e.id === episodeIdFromUrl);
              if (found) {
                episode = {
                  id: found.id,
                  title: found.title,
                  duration: found.duration,
                };
                break;
              }
            }
          }
        }
        if (!episode) episode = pickPrimaryEpisode(contentDetail);
        if (!episode && contentDetail.seasons?.length) {
          const seasonId = contentDetail.seasons[0]?.id;
          const episodes = await contentService.getEpisodes(
            contentDetail.id,
            seasonId,
          );
          if (cancelled) return;
          const first = episodes?.[0];
          if (first) {
            episode = {
              id: first.id,
              title: first.title,
              duration: first.duration,
            };
          }
        }
        setPrimaryEpisode(episode);
        if (!episode) {
          // No episode found — check if this content genuinely has no video yet (coming soon).
          const hasNoEpisodes =
            !contentDetail.episodes?.length && !contentDetail.trailer;
          if (hasNoEpisodes) {
            setComingSoon(true);
            return;
          }
          // Content has episodes/trailer but we couldn't resolve one — fall back to dev stream in development.
          if (process.env.NODE_ENV !== "production") {
            setStreamUrl(DEFAULT_HLS_TEST_STREAM);
            setUsingDevStream(true);
          }
          return;
        }
        // Playback metadata is authorized by the backend; the stream URL is built for the Worker.
        const playbackRes = await streamingService.getPlaybackInfo(
          episode.id,
          undefined,
          {
            asGuest: accessTier !== "paid",
          },
        );
        if (cancelled) return;
        if (!playbackRes?.url) {
          setStreamUrl(null);
          setPlaybackError("unavailable");
          setPlaybackType(undefined);
          if (process.env.NODE_ENV !== "production") {
            //console.warn("[Watch] missing playback URL", playbackRes);
          }
        } else {
          setStreamUrl(playbackRes.url);
          setPlaybackType(playbackRes.type);
          if (process.env.NODE_ENV !== "production") {
            //console.log("[Watch] playback URL", playbackRes.url);
            if (playbackRes.streamKey) {
              //console.log("[Watch] playback streamKey", playbackRes.streamKey);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          const isWorkerConfigMissing =
            err instanceof ApiError &&
            err.status === 500 &&
            (err.message?.includes("Cloudflare Stream subdomain") ||
              err.message?.includes("Playback URL is not configured"));
          if (isWorkerConfigMissing) {
            setStreamUrl(null);
            setPlaybackType(undefined);
            setPlaybackError("config_required");
          } else if (
            process.env.NODE_ENV !== "production" &&
            !(err instanceof ApiError)
          ) {
            setStreamUrl(DEFAULT_HLS_TEST_STREAM);
            setUsingDevStream(true);
            setPlaybackError(null);
            setPlaybackType("hls");
          } else if (
            process.env.NODE_ENV === "production" ||
            err instanceof ApiError
          ) {
            setStreamUrl(null);
            setPlaybackType(undefined);
            if (err instanceof ApiError) {
              if (err.status === 401) setPlaybackError("unauthorized");
              else if (err.status === 403) setPlaybackError("forbidden");
              else setPlaybackError("unavailable");
            } else {
              setPlaybackError("unavailable");
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, episodeIdFromUrl, accessTier]);

  useEffect(() => {
    if (!content?.seasons?.length) {
      setSelectedSeasonId(null);
      return;
    }

    const sortedSeasons = [...content.seasons].sort(
      (a, b) => a.seasonNumber - b.seasonNumber,
    );

    // Keep user-selected season unless it is no longer valid.
    if (
      selectedSeasonId &&
      content.seasons.some((season) => season.id === selectedSeasonId)
    ) {
      return;
    }

    const selectedEpisodeSeasonId = content.episodes?.find(
      (episode) => episode.id === primaryEpisode?.id,
    )?.seasonId;

    if (
      selectedEpisodeSeasonId &&
      content.seasons.some((season) => season.id === selectedEpisodeSeasonId)
    ) {
      setSelectedSeasonId(selectedEpisodeSeasonId);
      return;
    }

    setSelectedSeasonId(sortedSeasons[0].id);
  }, [content, primaryEpisode?.id, selectedSeasonId]);

  const displayContent = content ? toDisplayContent(content) : null;
  const title = displayContent?.title ?? `Content ${id}`;
  const longForm = displayContent ? isLongForm(displayContent) : false;
  const returnUrl = pathname ?? `/watch/${id}`;
  const limitModalOpen = !!limitModalReason;
  const sortedSeasons = [...(content?.seasons ?? [])].sort(
    (a, b) => a.seasonNumber - b.seasonNumber,
  );
  const selectedSeason =
    sortedSeasons.find((season) => season.id === selectedSeasonId) ??
    sortedSeasons[0] ??
    null;
  const episodesForSelectedSeason = selectedSeason
    ? (content?.episodes ?? [])
        .filter((episode) => episode.seasonId === selectedSeason.id)
        .sort((a, b) => a.episodeNumber - b.episodeNumber)
    : [];
  const fallbackEpisodes = [...(content?.episodes ?? [])].sort(
    (a, b) => a.episodeNumber - b.episodeNumber,
  );

  if (authLoading || loading) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center px-4 py-12">
        <Loader size="lg" label="Loading video…" />
      </main>
    );
  }

  if (!content) {
    return (
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 py-12">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Content not found
        </h2>
        <p className="text-center text-neutral-600 dark:text-neutral-400">
          The content you’re looking for doesn’t exist or is no longer
          available.
        </p>
        <a
          href="/browse"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Browse content
        </a>
      </main>
    );
  }

  if (content && playbackError) {
    return (
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 py-12">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          {playbackError === "unauthorized"
            ? "Sign in to watch"
            : playbackError === "forbidden"
              ? "Active subscription required"
              : playbackError === "config_required"
                ? "Video playback not configured"
                : "Playback not available"}
        </h2>
        <p className="text-center text-neutral-600 dark:text-neutral-400 max-w-md">
          {playbackError === "unauthorized"
            ? "You need to sign in to stream this video."
            : playbackError === "forbidden"
              ? "An active subscription is required to watch. Subscribe to get access."
              : playbackError === "config_required"
                ? "Set NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN for Cloudflare Stream playback."
                : "This video cannot be played right now. Try again later."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {playbackError === "unauthorized" && (
            <Link
              href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Sign in
            </Link>
          )}
          {(playbackError === "forbidden" ||
            playbackError === "unauthorized") && (
            <Link
              href={`/subscription?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="inline-flex h-10 items-center justify-center rounded-lg border-2 border-accent px-4 text-sm font-medium text-accent hover:bg-accent/10"
            >
              View plans
            </Link>
          )}
          <Link href="/browse">
            <Button type="button" variant="secondary">
              Browse content
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  if (comingSoon) {
    return (
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center">
          {displayContent?.thumbnailUrl && (
            <div className="relative mx-auto mb-8 w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayContent.thumbnailUrl}
                alt={title}
                className="h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                <span className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                  Coming Soon
                </span>
              </div>
            </div>
          )}
          <h1 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
            {title}
          </h1>
          {displayContent?.description && (
            <p className="mb-6 text-sm leading-relaxed text-neutral-400">
              {displayContent.description}
            </p>
          )}
          <p className="mb-8 text-neutral-500">
            Video playback coming soon. Check back later.
          </p>
          <Link
            href="/browse"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-100 px-6 text-sm font-medium text-neutral-900 hover:bg-white"
          >
            Browse catalog
          </Link>
        </div>
      </main>
    );
  }

  if (!streamUrl) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center px-4 py-12">
        <p className="text-neutral-600 dark:text-neutral-400">
          Playback is not available for this content.
        </p>
      </main>
    );
  }

  // If a stream URL is available, show the player unless guest limit was reached.
  const showPlayer =
    Boolean(streamUrl) && !limitModalOpen && !videoLimitReached;
  const showSubscribePrompt = !showPlayer && !isSubscribed;

  return (
    <main className="min-h-0 min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-5xl">
        {usingDevStream && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 sm:px-4">
            Using a dev test stream because real playback is not configured yet.
          </div>
        )}
        <section className="mb-4 sm:mb-6" aria-label="Video player">
          {showPlayer ? (
            <div className="aspect-video w-full min-w-0 overflow-hidden rounded-xl border border-neutral-700/60 bg-neutral-950 shadow-lg">
              {playbackType === "mp4" ? (
                <video
                  ref={mp4VideoRef}
                  controls
                  playsInline
                  preload="auto"
                  className="h-full w-full"
                  src={streamUrl}
                  onTimeUpdate={(event) => {
                    handlePlaybackTick(event.currentTarget.currentTime);
                  }}
                />
              ) : (
                <HLSVideoPlayerLazy
                  src={streamUrl}
                  type={playbackType}
                  title={title}
                  className="vjs-theme-stream"
                  adConfig={adConfig}
                  onProgress={
                    primaryEpisode && accessTier === "paid"
                      ? (progressSeconds) => {
                          const durationSec = durationToSeconds(
                            primaryEpisode?.duration,
                          );
                          void streamingService.reportProgress(
                            primaryEpisode.id,
                            progressSeconds,
                            durationSec > 0 ? durationSec : undefined,
                          );
                        }
                      : undefined
                  }
                  onReady={(player) => {
                    if (limitModalOpen) {
                      player.pause();
                    }
                    player.on("error", () => {});
                    player.on("loadedmetadata", () => {});
                  }}
                  onTimeUpdate={handlePlaybackTick}
                />
              )}
            </div>
          ) : showSubscribePrompt ? (
            <div className="overflow-hidden rounded-xl shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-800">
              <SubscriptionPrompt
                contentTitle={title}
                returnUrl={pathname ?? `/watch/${id}`}
                className="rounded-xl border-0"
              />
            </div>
          ) : null}
        </section>

        {/* Title */}
        <header className="mb-3 sm:mb-4">
          <h1 className="break-words text-xl font-bold text-neutral-900 dark:text-white sm:text-2xl lg:text-3xl">
            {title}
          </h1>
        </header>

        {/* Metadata row: duration, category, date, long-form badge */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 sm:mb-6 sm:gap-x-4 sm:gap-y-2">
          {(primaryEpisode?.duration ?? displayContent?.duration) && (
            <span
              title={`Duration: ${
                primaryEpisode?.duration ?? displayContent?.duration
              }`}
            >
              {formatDuration(
                primaryEpisode?.duration ?? displayContent?.duration ?? "0:00",
              )}
            </span>
          )}
          {displayContent?.category && (
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              {displayContent.category}
            </span>
          )}
          {displayContent?.releaseYear && (
            <span>{displayContent.releaseYear}</span>
          )}
          {longForm && (
            <span
              className="rounded-full bg-neutral-100 px-2.5 py-0.5 font-medium text-neutral-800 dark:bg-neutral-800/70 dark:text-neutral-200"
              aria-label="Long-form content"
            >
              Long-form
            </span>
          )}
        </div>

        <Modal
          isOpen={limitModalOpen}
          onClose={() => {
            if (
              limitModalReason === "guest-video-limit" ||
              limitModalReason === "free-video-limit"
            ) {
              return;
            }
            setLimitModalReason(null);
          }}
          title="Continue Watching"
          showCloseButton={false}
        >
          <ModalContent>
            <p className="text-neutral-600 dark:text-neutral-300">
              Join Brixlore to unlock full access
            </p>
          </ModalContent>
          <ModalFooter className="flex-col items-stretch sm:flex-row sm:items-center sm:justify-end">
            {accessTier === "guest" ? (
              <>
                <Link
                  href={`/subscription?returnUrl=${encodeURIComponent(returnUrl)}`}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Join Now
                </Link>
                <Link
                  href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/subscription?returnUrl=${encodeURIComponent(returnUrl)}`}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Join Now
                </Link>
                <Link
                  href={`/subscription/payment-details?returnUrl=${encodeURIComponent(returnUrl)}`}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  Add payment details
                </Link>
              </>
            )}
            {limitModalReason !== "guest-video-limit" &&
            limitModalReason !== "free-video-limit" ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setLimitModalReason(null);
                }}
              >
                Close
              </Button>
            ) : null}
          </ModalFooter>
        </Modal>

        {/* Description — supports long-form content (1–3+ hours) */}
        <section
          className="border-t border-neutral-200 pt-4 dark:border-neutral-800 sm:pt-6"
          aria-labelledby="description-heading"
        >
          <h2 id="description-heading" className="sr-only">
            Description
          </h2>
          <div className="min-w-0 max-w-none">
            {displayContent?.description ? (
              <p className="break-words whitespace-pre-wrap text-neutral-600 leading-relaxed dark:text-neutral-400">
                {displayContent.description}
              </p>
            ) : (
              <p className="text-neutral-500 dark:text-neutral-400">
                No description available.
              </p>
            )}
          </div>
        </section>

        {/* Episodes & Seasons List */}
        {content &&
        isEpisodicContentType(content.type) &&
        ((content.seasons?.length ?? 0) > 0 ||
          (content.episodes?.length ?? 0) > 0) ? (
          <section
            className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800 sm:mt-8 sm:pt-6"
            aria-labelledby="episodes-heading"
          >
            <h2
              id="episodes-heading"
              className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white sm:mb-4 sm:text-xl"
            >
              Episodes & Seasons
            </h2>
            {sortedSeasons.length > 0 ? (
              <>
                <div className="mb-4 max-w-sm">
                  <label
                    htmlFor="season-select"
                    className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
                  >
                    Season
                  </label>
                  <select
                    id="season-select"
                    value={selectedSeason?.id ?? ""}
                    onChange={(event) =>
                      setSelectedSeasonId(event.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-accent dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    {sortedSeasons.map((season) => (
                      <option key={season.id} value={season.id}>
                        {season.title || `Season ${season.seasonNumber}`}
                      </option>
                    ))}
                  </select>
                </div>

                {episodesForSelectedSeason.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {episodesForSelectedSeason.map((episode) => {
                      const isActive = primaryEpisode?.id === episode.id;
                      return (
                        <Link
                          key={episode.id}
                          href={`/watch/${content.id}?episodeId=${episode.id}`}
                          className={`group relative overflow-hidden rounded-lg border transition-colors ${
                            isActive
                              ? "border-accent bg-accent/10 dark:bg-accent/20"
                              : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                          }`}
                        >
                          <div className="flex flex-col">
                            <div className="relative aspect-video w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                              {episode.thumbnailUrl ? (
                                <img
                                  src={episode.thumbnailUrl}
                                  alt={`${episode.title} thumbnail`}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-neutral-400">
                                  <span className="text-2xl">▶</span>
                                </div>
                              )}
                              {isActive && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                  <span
                                    className="text-2xl font-medium text-white"
                                    aria-label="Currently playing"
                                  >
                                    ▶
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p
                                className={`text-sm font-medium line-clamp-2 ${
                                  isActive
                                    ? "text-accent dark:text-accent"
                                    : "text-neutral-900 dark:text-neutral-100"
                                }`}
                              >
                                {episode.title}
                              </p>
                              {episode.duration && (
                                <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-500">
                                  {formatDuration(episode.duration)}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    No episodes available for this season.
                  </p>
                )}
              </>
            ) : fallbackEpisodes.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {fallbackEpisodes.map((episode) => {
                  const isActive = primaryEpisode?.id === episode.id;
                  return (
                    <Link
                      key={episode.id}
                      href={`/watch/${content.id}?episodeId=${episode.id}`}
                      className={`group relative overflow-hidden rounded-lg border transition-colors ${
                        isActive
                          ? "border-accent bg-accent/10 dark:bg-accent/20"
                          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="relative aspect-video w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                          {episode.thumbnailUrl ? (
                            <img
                              src={episode.thumbnailUrl}
                              alt={`${episode.title} thumbnail`}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-neutral-400">
                              <span className="text-2xl">▶</span>
                            </div>
                          )}
                          {isActive && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <span
                                className="text-2xl font-medium text-white"
                                aria-label="Currently playing"
                              >
                                ▶
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p
                            className={`text-sm font-medium line-clamp-2 ${
                              isActive
                                ? "text-accent dark:text-accent"
                                : "text-neutral-900 dark:text-neutral-100"
                            }`}
                          >
                            {episode.title}
                          </p>
                          {episode.duration && (
                            <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-500">
                              {formatDuration(episode.duration)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </section>
        ) : null}

        <p className="mt-6 text-xs text-neutral-500 dark:text-neutral-500">
          HLS adaptive streaming · Use the control bar for play/pause, volume,
          quality, and fullscreen.
        </p>
      </div>
    </main>
  );
}
