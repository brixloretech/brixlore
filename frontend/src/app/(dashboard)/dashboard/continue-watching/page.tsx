"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, Pause, Play, RotateCcw, X } from "lucide-react";
import { Loader } from "@/components/ui";
import { streamingService } from "@/lib/services";
import type { ContinueWatchingItemDto } from "@/types/api";
import { RainbowButton } from "@/components/ui/rainbow-button";

function percent(progress: number, duration: number) {
  return duration > 0
    ? Math.min(100, Math.max(0, Math.round((progress / duration) * 100)))
    : 0;
}
function remaining(progress: number, duration: number) {
  const seconds = Math.max(0, Math.ceil(duration - progress));
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes} min remaining` : `${seconds} sec remaining`;
}
function watchUrl(item: ContinueWatchingItemDto) {
  return `/watch-2/${item.contentId}?episodeId=${encodeURIComponent(item.episodeId)}`;
}

function SessionTile({
  item,
  index,
  active,
  onSelect,
  onRemove,
  removing,
}: {
  item: ContinueWatchingItemDto;
  index: number;
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
  removing: boolean;
}) {
  const progress = percent(item.progress, item.duration);
  return (
    <article
      className={`group relative overflow-hidden border transition ${active ? "border-white bg-white text-black" : "border-white/15 bg-[#0b0b0b] text-white hover:border-white/55"}`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
      >
        <div className="relative aspect-[16/8] overflow-hidden">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt=""
              className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${active ? "opacity-90" : "opacity-65"}`}
            />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,#363636,#080808)]" />
          )}
          <span
            className={`absolute left-3 top-3 font-mono text-[10px] ${active ? "text-black/60" : "text-white/55"}`}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <div className="p-4">
          <p className="truncate text-sm font-semibold tracking-[-0.03em]">
            {item.contentTitle}
          </p>
          <p
            className={`mt-1 truncate text-xs ${active ? "text-black/55" : "text-white/45"}`}
          >
            {item.episodeTitle !== item.contentTitle
              ? item.episodeTitle
              : item.type}
          </p>
          <div
            className={`mt-4 h-[3px] ${active ? "bg-black/15" : "bg-white/15"}`}
          >
            <div
              className={`h-full ${active ? "bg-black" : "bg-white"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        aria-label={`Remove ${item.contentTitle}`}
        className={`absolute right-3 top-3 grid h-7 w-7 place-items-center border opacity-0 transition group-hover:opacity-100 ${active ? "border-black/20 bg-white/30 hover:bg-black hover:text-white" : "border-white/25 bg-black/45 hover:bg-white hover:text-black"} disabled:opacity-30`}
      >
        <X size={14} />
      </button>
    </article>
  );
}

export default function ContinueWatchingPage() {
  const [items, setItems] = useState<ContinueWatchingItemDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const fetchSessions = useCallback(() => {
    setLoading(true);
    void streamingService
      .getContinueWatching()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);
  useEffect(() => {
    if (items.length && !items.some((item) => item.episodeId === selectedId))
      setSelectedId(items[0].episodeId);
  }, [items, selectedId]);
  const remove = useCallback(async (episodeId: string) => {
    setRemovingId(episodeId);
    try {
      await streamingService.removeFromContinueWatching(episodeId);
      setItems((current) =>
        current.filter((item) => item.episodeId !== episodeId),
      );
    } finally {
      setRemovingId(null);
    }
  }, []);
  const selected =
    items.find((item) => item.episodeId === selectedId) ?? items[0];
  const selectedProgress = selected
    ? percent(selected.progress, selected.duration)
    : 0;
  const watchedMinutes = useMemo(
    () =>
      Math.floor(items.reduce((total, item) => total + item.progress, 0) / 60),
    [items],
  );

  if (loading)
    return (
      <main className="flex min-h-[65vh] items-center justify-center">
        <Loader size="lg" label="Rebuilding your playback deck…" />
      </main>
    );

  return (
    <div className="min-h-[calc(100vh-57px)] w-full max-w-full overflow-x-hidden bg-[#050505] text-white">
      <div className="mx-auto max-w-[1550px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <header className="flex flex-col justify-between gap-7 border-b border-white/15 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Playback deck / private session
            </p>
            <h1 className="mt-4 text-5xl font-semibold leading-[0.86] tracking-[-0.08em] sm:text-6xl lg:text-7xl">
              Don’t lose
              <br />
              your place.
            </h1>
          </div>
          <div className="grid grid-cols-2 border border-white/15 bg-[#0c0c0c] sm:w-[285px]">
            <div className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                Sessions
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.06em]">
                {String(items.length).padStart(2, "0")}
              </p>
            </div>
            <div className="border-l border-white/15 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                Minutes
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.06em]">
                {watchedMinutes}
              </p>
            </div>
          </div>
        </header>

        {selected ? (
          <section className="mt-8 grid border border-white/15 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <div className="relative min-h-[390px] overflow-hidden bg-white/10 sm:min-h-[480px]">
              {selected.thumbnailUrl ? (
                <img
                  src={selected.thumbnailUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#303030,#080808)]" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.74),rgba(0,0,0,.08)),linear-gradient(0deg,rgba(0,0,0,.82),transparent_60%)]" />
              <div className="absolute left-5 top-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/65">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/35">
                  ON
                </span>{" "}
                Selected session
              </div>
              <div className="absolute inset-x-5 bottom-5 sm:inset-x-8 sm:bottom-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                  Resume from {selectedProgress}%
                </p>
                <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-[0.9] tracking-[-0.065em] sm:text-5xl">
                  {selected.contentTitle}
                </h2>
                <p className="mt-3 text-sm text-white/65">
                  {selected.episodeTitle !== selected.contentTitle
                    ? selected.episodeTitle
                    : selected.type}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href={watchUrl(selected)} className="inline-flex ">
                    <RainbowButton>
                      <Play size={15} fill="currentColor" /> Resume session
                    </RainbowButton>
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(selected.episodeId)}
                    disabled={removingId === selected.episodeId}
                    className="inline-flex"
                  >
                    <RainbowButton className="text-white" variant="outline">
                      <X size={16} /> Remove
                    </RainbowButton>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col bg-white p-6 text-black sm:p-8">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">
                  Your place
                </p>
                <Pause size={17} />
              </div>
              <p className="mt-7 text-[clamp(72px,12vw,150px)] font-semibold leading-[0.72] tracking-[-0.1em]">
                {selectedProgress}
                <span className="text-[0.36em]">%</span>
              </p>
              <p className="mt-5 text-sm font-medium text-black/60">
                {remaining(selected.progress, selected.duration)}
              </p>
              <div className="mt-8 h-2 overflow-hidden bg-black/10">
                <div
                  className="h-full bg-black"
                  style={{ width: `${selectedProgress}%` }}
                />
              </div>
              <div className="mt-auto border-t border-black/15 pt-5">
                <p className="text-sm font-semibold">
                  Your next frame is waiting.
                </p>
                <p className="mt-1 text-xs leading-5 text-black/55">
                  Return whenever you’re ready. We’ll hold every second.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="relative mt-8 grid min-h-[470px] place-items-center overflow-hidden border border-dashed border-white/20 bg-[#0a0a0a] px-6 text-center">
            <p
              aria-hidden="true"
              className="pointer-events-none absolute right-[-0.06em] bottom-[-0.22em] select-none text-9xl font-semibold tracking-[-0.14em] text-white/[0.035]"
            >
              PAUSE
            </p>
            <div className="relative">
              <RotateCcw size={32} className="mx-auto text-white/45" />
              <h2 className="mt-6 text-3xl font-semibold tracking-[-0.06em]">
                Your deck is clear.
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/55">
                Start something new. When life interrupts, your place will live
                here.
              </p>
              <Link
                href="/dashboard/explore"
                className="mt-7 inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-bold text-black"
              >
                Find a story <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        )}

        {items.length > 1 && (
          <section className="mt-12">
            <div className="mb-6 flex items-end justify-between border-b border-white/15 pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Session navigator
                </p>
                <h2 className="mt-3 text-3xl font-semibold leading-none tracking-[-0.06em]">
                  Choose your next return.
                </h2>
              </div>
              <Clock3 size={19} className="mb-1 text-white/45" />
            </div>
            <div className="grid gap-px border border-white/15 bg-white/15 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => (
                <SessionTile
                  key={`${item.contentId}-${item.episodeId}`}
                  item={item}
                  index={index}
                  active={item.episodeId === selected?.episodeId}
                  onSelect={() => {
                    setSelectedId(item.episodeId);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onRemove={() => remove(item.episodeId)}
                  removing={removingId === item.episodeId}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
