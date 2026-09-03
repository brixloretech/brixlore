"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HLSVideoPlayerLazy } from "@/components/player";
import { SubscriptionPrompt } from "@/components/content";
import { useAuth } from "@/contexts";
import { ApiError } from "@/lib/api-client";
import { contentService, streamingService } from "@/lib/services";
import type { ContentDetailDto, PlaybackType } from "@/types/api";

const GUEST_IDS = "guest-watch-limits-v1";
const FREE_IDS = "free-watch-limits-v1";
const PROGRESS = "guest-playback-progress-v1";
const MAX_VIDEOS = 3;
const MAX_SECONDS = 120;

type Tier = "guest" | "free" | "paid";
type PlaybackError = "unauthorized" | "forbidden" | "unavailable";

function ids(key: string) {
  try {
    const value = localStorage.getItem(key);
    const data = value ? JSON.parse(value) as { watchedVideoIds?: unknown } : {};
    return new Set(Array.isArray(data.watchedVideoIds) ? data.watchedVideoIds.filter((id): id is string => typeof id === "string") : []);
  } catch { return new Set<string>(); }
}

function saveIds(key: string, watched: Set<string>) {
  localStorage.setItem(key, JSON.stringify({ watchedVideoIds: Array.from(watched) }));
}

function savedProgress(id: string) {
  try {
    const value = localStorage.getItem(PROGRESS);
    const data = value ? JSON.parse(value) as Record<string, number> : {};
    return data[id] ?? 0;
  } catch { return 0; }
}

function saveProgress(id: string, seconds: number) {
  try {
    const value = localStorage.getItem(PROGRESS);
    const data = value ? JSON.parse(value) as Record<string, number> : {};
    data[id] = seconds;
    localStorage.setItem(PROGRESS, JSON.stringify(data));
  } catch { /* optional local progress */ }
}

function primaryEpisode(content: ContentDetailDto, requestedEpisodeId?: string | null) {
  if (requestedEpisodeId) {
    const requested = content.episodes?.find((episode) => episode.id === requestedEpisodeId);
    if (requested) return requested;
    if (content.trailer?.id === requestedEpisodeId) return content.trailer;
  }
  if (content.seasons?.length && content.episodes?.length) {
    const season = [...content.seasons].sort((a, b) => a.seasonNumber - b.seasonNumber)[0];
    return [...content.episodes].filter((episode) => episode.seasonId === season.id).sort((a, b) => a.episodeNumber - b.episodeNumber)[0] ?? content.episodes[0];
  }
  return content.episodes?.[0] ?? content.trailer;
}

export function FigmaVideoPlayer({ contentId, episodeId }: { contentId: string; episodeId?: string | null }) {
  const { isAuthenticated, isSubscribed, isAdmin, isLoading: authLoading } = useAuth();
  const tier: Tier = !isAuthenticated ? "guest" : isSubscribed || isAdmin ? "paid" : "free";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [content, setContent] = useState<ContentDetailDto | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [type, setType] = useState<PlaybackType>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PlaybackError | null>(null);
  const [limited, setLimited] = useState(false);
  const [start, setStart] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [episodeTitle, setEpisodeTitle] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true); setUrl(null); setType(undefined); setError(null); setLimited(false);
    async function load() {
      try {
        const result = await contentService.getContentById(contentId);
        if (!active || !result?.content) return;
        let detail = result.content;
        if (!detail.episodes?.length || (episodeId && !detail.episodes.some((item) => item.id === episodeId))) {
          const episodes = await contentService.getEpisodes(detail.id);
          if (!active) return;
          if (episodes?.length) detail = { ...detail, episodes };
        }
        setContent(detail);
        const episode = primaryEpisode(detail, episodeId);
        if (!episode) return;
        setEpisodeTitle(episode.title);
        if (tier !== "paid" && detail.type !== "TRAILER") {
          const guest = ids(GUEST_IDS);
          const free = ids(FREE_IDS);
          const watched = tier === "free" ? new Set([...Array.from(guest), ...Array.from(free)]) : guest;
          if (!watched.has(contentId) && watched.size >= MAX_VIDEOS) { setLimited(true); return; }
          if (!watched.has(contentId)) {
            watched.add(contentId);
            saveIds(tier === "free" ? FREE_IDS : GUEST_IDS, watched);
          }
        }
        const playback = await streamingService.getPlaybackInfo(episode.id, undefined, { asGuest: tier !== "paid" });
        if (!active) return;
        if (!playback?.url) { setError("unavailable"); return; }
        setUrl(playback.url); setType(playback.type); setStart(playback.progress ?? savedProgress(episode.id));
      } catch (value) {
        if (!active) return;
        setError(value instanceof ApiError && value.status === 401 ? "unauthorized" : value instanceof ApiError && value.status === 403 ? "forbidden" : "unavailable");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [contentId, episodeId, tier]);

  function onTimeUpdate(seconds: number) {
    if (tier !== "guest" || !content || content.type === "TRAILER") return;
    saveProgress(content.id, Math.floor(seconds));
    if (startedAt === null && seconds > 0) setStartedAt(seconds);
    if (startedAt !== null && seconds - startedAt >= MAX_SECONDS) { videoRef.current?.pause(); setLimited(true); }
  }

  if (authLoading || loading) return <div className="aspect-video w-full animate-pulse rounded-t-[10px] bg-white/10 md:rounded-[10px]" />;
  if (limited) return <SubscriptionPrompt contentTitle={content?.title ?? "this video"} returnUrl={`/watch-2/${contentId}${episodeId ? `?episodeId=${encodeURIComponent(episodeId)}` : ""}`} className="rounded-[10px] border-0" />;
  if (error) return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-[10px] bg-black px-5 text-center text-white">
      <p className="text-lg font-semibold">{error === "unauthorized" ? "Sign in to watch" : error === "forbidden" ? "Active subscription required" : "Playback not available"}</p>
      <p className="text-sm text-white/60">{error === "unauthorized" ? "You need to sign in to stream this video." : error === "forbidden" ? "An active subscription is required to watch this video." : "This video cannot be played right now."}</p>
      {error !== "unavailable" && <Link href={error === "unauthorized" ? `/login?returnUrl=${encodeURIComponent(`/watch-2/${contentId}`)}` : "/subscription"} className="rounded-[5px] bg-white px-4 py-2 text-sm font-semibold text-black">{error === "unauthorized" ? "Sign in" : "View plans"}</Link>}
    </div>
  );
  if (!url) return <div className="flex aspect-video w-full items-center justify-center rounded-t-[10px] bg-black text-white/60 md:rounded-[10px]">Video unavailable</div>;
  return <div className="aspect-video w-full overflow-hidden rounded-t-[10px] md:rounded-[10px]">
    {type === "mp4" ? <video ref={videoRef} src={url} controls playsInline preload="auto" className="h-full w-full" poster={content?.thumbnailUrl ?? undefined} onLoadedMetadata={(event) => { event.currentTarget.currentTime = start; }} onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)} /> : <HLSVideoPlayerLazy src={url} type={type} title={episodeTitle ?? content?.title ?? "Video"} className="vjs-theme-stream" startTime={start} onTimeUpdate={onTimeUpdate} />}
  </div>;
}
