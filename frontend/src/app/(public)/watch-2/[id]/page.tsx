"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Layers3,
  Play,
  Search,
  Share2,
  Sparkles,
} from "lucide-react";
import { BrowseAtmosphere } from "@/components/content/BrowseAtmosphere";
import { FigmaFavoriteButton } from "@/components/content/FigmaFavoriteButton";
import { FigmaVideoPlayer } from "@/components/content/FigmaVideoPlayer";
import MoviesSwiper from "@/components/content/MoviesSwiper";
import { contentService } from "@/lib/services/content.service";
import { formatDuration } from "@/lib/video-utils";
import type {
  ContentDetailDto,
  EpisodeResponseDto,
} from "@/types/api";

type WatchTwoPageProps = { params: { id: string } };

function getFirstEpisode(content: ContentDetailDto | null) {
  if (!content?.episodes?.length) return null;
  const firstSeason = [...(content.seasons ?? [])].sort(
    (a, b) => a.seasonNumber - b.seasonNumber,
  )[0];
  if (firstSeason) {
    const first = content.episodes
      .filter((episode) => episode.seasonId === firstSeason.id)
      .sort((a, b) => a.episodeNumber - b.episodeNumber)[0];
    if (first) return first;
  }
  return [...content.episodes].sort(
    (a, b) => a.episodeNumber - b.episodeNumber,
  )[0];
}

function WatchPageSkeleton() {
  return (
    <main className="min-h-screen bg-[#030303] px-4 pb-24 pt-36 text-white sm:px-6 lg:px-10 xl:px-[6vw]">
      <div className="mx-auto max-w-[1660px] animate-pulse">
        <div className="mb-6 h-4 w-40 rounded-full bg-white/10" />
        <div className="aspect-video w-full rounded-[26px] bg-white/[0.07]" />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="h-12 w-2/3 rounded-xl bg-white/10" />
            <div className="mt-5 h-5 w-full max-w-2xl rounded bg-white/[0.07]" />
            <div className="mt-3 h-5 w-4/5 max-w-xl rounded bg-white/[0.07]" />
          </div>
          <div className="h-36 rounded-[24px] bg-white/[0.06]" />
        </div>
      </div>
    </main>
  );
}

function EpisodeCard({
  contentId,
  episode,
  seasonNumber,
  active,
  fallbackImage,
}: {
  contentId: string;
  episode: EpisodeResponseDto;
  seasonNumber?: number;
  active: boolean;
  fallbackImage?: string | null;
}) {
  const image = episode.thumbnailUrl || fallbackImage;

  return (
    <Link
      href={`/watch-2/${contentId}?episodeId=${encodeURIComponent(episode.id)}`}
      aria-current={active ? "page" : undefined}
      className={`group block min-w-0 overflow-hidden rounded-[22px] border transition duration-300 ${
        active
          ? "border-white/45 bg-white/[0.11] shadow-[0_18px_60px_rgba(0,0,0,.4)]"
          : "border-white/10 bg-white/[0.035] hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.065]"
      }`}
    >
      <div className="relative aspect-video overflow-hidden bg-white/[0.06]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${episode.title} thumbnail`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,.16),transparent_38%),#111]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
        <span className={`absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full backdrop-blur-md transition ${active ? "bg-white text-black" : "bg-black/45 text-white group-hover:bg-white group-hover:text-black"}`}>
          <Play size={15} fill="currentColor" />
        </span>
        {active && (
          <span className="absolute bottom-3 left-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Playing now
          </span>
        )}
        {episode.duration && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white/75 backdrop-blur-md">
            {formatDuration(episode.duration)}
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-white/35">
          {seasonNumber ? `S${String(seasonNumber).padStart(2, "0")} · ` : ""}E{String(episode.episodeNumber).padStart(2, "0")}
        </p>
        <h3 className="mt-2 line-clamp-1 text-base font-semibold tracking-[-0.025em] text-white">
          {episode.title}
        </h3>
        {episode.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/42">
            {episode.description}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function WatchTwoPage({ params }: WatchTwoPageProps) {
  const searchParams = useSearchParams();
  const episodeId = searchParams.get("episodeId")?.trim() || null;
  const [content, setContent] = useState<ContentDetailDto | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);

    void Promise.all([
      contentService.getContentById(params.id),
      contentService.getCategories(),
    ])
      .then(async ([result, categoryList]) => {
        if (!active) return;
        if (!result?.content) {
          setNotFound(true);
          return;
        }

        const detail = result.content;
        const [seasonResult, episodeResult] = await Promise.all([
          detail.seasons?.length
            ? Promise.resolve(detail.seasons)
            : contentService.getSeasons(detail.id),
          detail.episodes?.length
            ? Promise.resolve(detail.episodes)
            : contentService.getEpisodes(detail.id),
        ]);
        if (!active) return;

        const hydrated: ContentDetailDto = {
          ...detail,
          seasons: seasonResult ?? detail.seasons ?? [],
          episodes: episodeResult ?? detail.episodes ?? [],
        };
        setContent(hydrated);
        setCategories(
          categoryList.filter(
            (category) => category && category.toLowerCase() !== "all",
          ),
        );
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  const sortedSeasons = useMemo(
    () =>
      [...(content?.seasons ?? [])].sort(
        (a, b) => a.seasonNumber - b.seasonNumber,
      ),
    [content?.seasons],
  );
  const currentEpisode = useMemo(
    () =>
      content?.episodes?.find((episode) => episode.id === episodeId) ??
      getFirstEpisode(content),
    [content, episodeId],
  );

  useEffect(() => {
    const episodeSeasonId = currentEpisode?.seasonId;
    if (episodeSeasonId) {
      setSelectedSeasonId(episodeSeasonId);
      return;
    }
    if (!selectedSeasonId && sortedSeasons[0]) {
      setSelectedSeasonId(sortedSeasons[0].id);
    }
  }, [currentEpisode?.seasonId, selectedSeasonId, sortedSeasons]);

  const selectedSeason =
    sortedSeasons.find((season) => season.id === selectedSeasonId) ??
    sortedSeasons[0] ??
    null;
  const visibleEpisodes = useMemo(() => {
    const episodes = [...(content?.episodes ?? [])];
    return episodes
      .filter(
        (episode) => !selectedSeason || episode.seasonId === selectedSeason.id,
      )
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
  }, [content?.episodes, selectedSeason]);

  if (loading) return <WatchPageSkeleton />;

  if (notFound || !content) {
    return (
      <main className="flex min-h-[75vh] flex-col items-center justify-center bg-[#030303] px-5 pt-28 text-center text-white">
        <span className="grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-white/[0.05]"><Search size={21} /></span>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.05em]">This story is off-air.</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-white/50">It may have moved or is no longer available in the collection.</p>
        <Link href="/browse-2" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black">Return to browse <ArrowUpRight size={15} /></Link>
      </main>
    );
  }

  const isEpisodic =
    content.type === "SERIES" ||
    sortedSeasons.length > 0 ||
    (content.episodes?.length ?? 0) > 1;
  const heroImage =
    content.bannerUrl || content.thumbnailUrl || content.posterUrl || null;
  const seasonNumber = sortedSeasons.find(
    (season) => season.id === currentEpisode?.seasonId,
  )?.seasonNumber;
  const displayTitle = isEpisodic
    ? currentEpisode?.title || content.title
    : content.title;
  const displayDuration = currentEpisode?.duration || content.duration;
  const shareDescription = content.description;

  async function sharePage() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: displayTitle, text: shareDescription, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030303] pb-20 pt-[125px] text-white md:pt-[145px] lg:pb-28 lg:pt-[165px]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[980px] overflow-hidden">
        {heroImage && (
          <div
            className="absolute inset-[-8%] bg-cover bg-center opacity-[0.23] blur-[32px] saturate-50"
            style={{ backgroundImage: `url(${JSON.stringify(heroImage)})` }}
          />
        )}
        <BrowseAtmosphere />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,3,.42),#030303_88%)]" />
      </div>

      <div className="relative mx-auto max-w-[1660px] px-4 sm:px-6 lg:px-10 xl:px-[6vw]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
            <Link href="/browse-2" className="inline-flex items-center gap-2 transition hover:text-white"><ArrowLeft size={14} /> Browse</Link>
            <ChevronRight size={13} />
            {isEpisodic && episodeId ? (
              <>
                <Link href={`/watch-2/${content.id}`} className="max-w-[180px] truncate transition hover:text-white sm:max-w-none">{content.title}</Link>
                <ChevronRight size={13} className="hidden sm:block" />
                <span className="hidden max-w-[220px] truncate text-white/70 sm:block">{currentEpisode?.title}</span>
              </>
            ) : (
              <span className="max-w-[220px] truncate text-white/70">{content.title}</span>
            )}
          </nav>
         
        </div>

        <section aria-label="Video player" className="relative overflow-hidden rounded-[22px] border border-white/15 bg-black shadow-[0_35px_120px_rgba(0,0,0,.65)] sm:rounded-[28px]">
          <div className="absolute inset-x-[12%] -top-px z-10 h-px bg-gradient-to-r from-transparent via-white/75 to-transparent" />
          <FigmaVideoPlayer contentId={content.id} episodeId={currentEpisode?.id ?? episodeId} />
        </section>

        <section className="grid gap-8 border-b border-white/10 py-9 sm:py-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16 lg:py-14">
          <div>
            {isEpisodic && (
              <Link href={`/watch-2/${content.id}`} className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-white/42 transition hover:text-white">
                <Layers3 size={14} /> From the series · {content.title}
              </Link>
            )}
            <h1 className="max-w-5xl text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-5xl lg:text-6xl">{displayTitle}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-white/45 sm:text-sm">
              {isEpisodic && currentEpisode && (
                <span>S{String(seasonNumber ?? 1).padStart(2, "0")} E{String(currentEpisode.episodeNumber).padStart(2, "0")}</span>
              )}
              <span>{content.releaseYear}</span>
              <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-white/60">{content.ageRating || "NR"}</span>
              {displayDuration && <span className="flex items-center gap-1.5"><Clock3 size={14} /> {formatDuration(displayDuration)}</span>}
              {content.category && <Link href={`/search?category=${encodeURIComponent(content.category)}`} className="text-white/70 transition hover:text-white">{content.category}</Link>}
            </div>
            <p className="mt-7 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-white/54 sm:text-base sm:leading-8">{currentEpisode?.description || content.description || "No description available yet."}</p>
          </div>

          <aside className="flex flex-col justify-between rounded-[24px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl sm:p-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">In your orbit</p>
              <p className="mt-3 text-sm leading-6 text-white/55">Save this title for later or share the current episode with someone.</p>
            </div>
            <div className="mt-7 flex items-center gap-3">
              <div className="[&_button]:!h-11 [&_button]:!w-11 [&_button]:!bg-white [&_button]:!text-black [&_button]:hover:!bg-white/80"><FigmaFavoriteButton contentId={content.id} /></div>
              <button type="button" onClick={() => void sharePage()} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] text-xs font-semibold text-white transition hover:bg-white hover:text-black">
                {copied ? <Check size={15} /> : <Share2 size={15} />} {copied ? "Link copied" : "Share"}
              </button>
            </div>
          </aside>
        </section>

        {isEpisodic && (content.episodes?.length ?? 0) > 0 && (
          <section className="border-b border-white/10 py-14 sm:py-16 lg:py-20" aria-labelledby="episodes-heading">
            <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/38"><Sparkles size={13} /> Continue the story</p>
                <h2 id="episodes-heading" className="text-3xl font-semibold tracking-[-0.055em] sm:text-5xl">Episodes</h2>
              </div>
              {sortedSeasons.length > 0 && (
                <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto pb-1" aria-label="Choose a season">
                  {sortedSeasons.map((season) => {
                    const selected = selectedSeason?.id === season.id;
                    return (
                      <button key={season.id} type="button" onClick={() => setSelectedSeasonId(season.id)} aria-pressed={selected} className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold transition ${selected ? "bg-white text-black" : "border border-white/12 bg-white/[0.04] text-white/55 hover:border-white/30 hover:text-white"}`}>
                        {season.title || `Season ${season.seasonNumber}`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedSeason?.description && <p className="mb-8 max-w-2xl text-sm leading-6 text-white/45">{selectedSeason.description}</p>}
            {visibleEpisodes.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleEpisodes.map((episode) => (
                  <EpisodeCard key={episode.id} contentId={content.id} episode={episode} seasonNumber={selectedSeason?.seasonNumber} active={currentEpisode?.id === episode.id} fallbackImage={content.thumbnailUrl || content.bannerUrl} />
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-white/15 px-6 py-14 text-center text-sm text-white/45">Episodes for this season are coming soon.</div>
            )}
          </section>
        )}

        <section className="py-14 sm:py-16 lg:py-20" aria-labelledby="related-heading">
          <div className="mb-8 grid gap-4 sm:mb-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/38">Stay on this frequency</p>
              <h2 id="related-heading" className="text-3xl font-semibold tracking-[-0.055em] sm:text-5xl">More like this</h2>
            </div>
            <div>
              <p className="text-sm leading-6 text-white/45">More films and shows from the same corner of the Brixlore collection.</p>
              <Link href="/search" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/65 transition hover:text-white">Explore all <ArrowUpRight size={14} /></Link>
            </div>
          </div>
          <MoviesSwiper contentId={content.id} slidesPerView={4} />
        </section>

        {categories.length > 0 && (
          <section className="flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Explore another world</p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {categories.slice(0, 7).map((category) => (
                <Link key={category} href={`/search?category=${encodeURIComponent(category)}`} className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-white/50 transition hover:border-white/30 hover:text-white">{category}</Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
