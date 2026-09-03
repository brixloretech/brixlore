"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Eye, Play, Rewind, X } from "lucide-react";
import { Loader } from "@/components/ui";
import { streamingService } from "@/lib/services";
import type { ContinueWatchingItemDto } from "@/types/api";
import { RainbowButton } from "@/components/ui/rainbow-button";

type HistoryItem = ContinueWatchingItemDto & { completed?: boolean };

function percentage(item: HistoryItem) {
  return item.duration > 0
    ? Math.min(
        100,
        Math.max(0, Math.round((item.progress / item.duration) * 100)),
      )
    : 0;
}
function dateText(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const day = 86_400_000;
  const difference = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      day,
  );
  if (difference === 0) return "Today";
  if (difference === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function href(item: HistoryItem) {
  return `/watch-2/${item.contentId}?episodeId=${encodeURIComponent(item.episodeId)}`;
}

function HistoryStrip({
  item,
  index,
  onRemove,
  removing,
}: {
  item: HistoryItem;
  index: number;
  onRemove: () => void;
  removing: boolean;
}) {
  const progress = percentage(item);
  const completed = item.completed || progress >= 95;
  return (
    <article className="group relative grid min-w-0 grid-cols-[42px_96px_minmax(0,1fr)] gap-4 border-b border-white/10 py-4 sm:grid-cols-[58px_170px_minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:py-5">
      <span className="self-start pt-1 font-mono text-xs text-white/35 sm:self-auto">
        {String(index + 1).padStart(2, "0")}
      </span>
      <Link
        href={href(item)}
        className="relative block aspect-[16/10] overflow-hidden bg-white/10"
      >
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(135deg,#353535,#090909)]" />
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover:opacity-100">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-black">
            <Play size={13} fill="currentColor" />
          </span>
        </span>
      </Link>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-base font-semibold tracking-[-0.035em] sm:text-lg">
            {item.contentTitle}
          </h2>
          {completed && (
            <span className="hidden items-center gap-1 border border-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white/65 sm:inline-flex">
              <Check size={10} /> Complete
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-white/45">
          {item.episodeTitle !== item.contentTitle
            ? item.episodeTitle
            : item.type}{" "}
          <span className="mx-1 text-white/20">—</span>{" "}
          {dateText(item.watchedAt)}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px min-w-0 flex-1 bg-white/15">
            <div className="h-px bg-white" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-mono text-[10px] text-white/45">
            {completed ? "DONE" : `${progress}%`}
          </span>
        </div>
      </div>
      <div className="col-span-3 flex gap-2 sm:col-span-1 sm:flex-col sm:items-end">
        <Link href={href(item)} className="inline-flex">
          <RainbowButton>
            {completed ? "Replay" : "Resume"} <ArrowRight size={13} />
          </RainbowButton>
        </Link>
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          className="inline-flex h-8 items-center gap-1.5 text-xs font-medium text-white/45 transition hover:text-white disabled:opacity-40"
        >
          <X size={14} /> Remove
        </button>
      </div>
    </article>
  );
}

export default function WatchHistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    void streamingService
      .getWatchHistory()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
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
  const latest = items[0];
  const latestImage = latest?.thumbnailUrl;
  const completed = useMemo(
    () =>
      items.filter((item) => item.completed || percentage(item) >= 95).length,
    [items],
  );
  const minutes = useMemo(
    () =>
      Math.floor(items.reduce((total, item) => total + item.progress, 0) / 60),
    [items],
  );

  if (loading)
    return (
      <main className="flex min-h-[65vh] items-center justify-center">
        <Loader size="lg" label="Rewinding your history…" />
      </main>
    );

  return (
    <div className="min-h-[calc(100vh-57px)] w-full max-w-full overflow-x-hidden bg-[#050505] text-white">
      <div className="mx-auto max-w-[1550px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <header className="grid gap-7 border-b border-white/15 pb-8 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-end">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
              Rewind gallery / personal record
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.85] tracking-[-0.085em] sm:text-6xl lg:text-7xl">
              You were
              <br />
              here.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/55">
              Every watch leaves a mark. Scroll through the stories you entered
              and return to the ones that still call you back.
            </p>
          </div>
          <div className="grid grid-cols-3 border border-white/15">
            <div className="p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-white/40">
                Entries
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.06em]">
                {String(items.length).padStart(2, "0")}
              </p>
            </div>
            <div className="border-l border-white/15 p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-white/40">
                Done
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.06em]">
                {String(completed).padStart(2, "0")}
              </p>
            </div>
            <div className="border-l border-white/15 p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-white/40">
                Mins
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.06em]">
                {minutes}
              </p>
            </div>
          </div>
        </header>
        {latest ? (
          <section className="mt-8 grid overflow-hidden border border-white/15 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="relative min-h-[350px] overflow-hidden sm:min-h-[410px]">
              {latestImage ? (
                <img
                  src={latestImage}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-75"
                />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#343434,#080808)]" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.74),rgba(0,0,0,.08)),linear-gradient(0deg,rgba(0,0,0,.85),transparent_65%)]" />
              <div className="absolute left-6 top-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
                <Eye size={14} /> Latest trace
              </div>
              <div className="absolute inset-x-6 bottom-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                  Watched {dateText(latest.watchedAt)}
                </p>
                <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-[0.9] tracking-[-0.06em] sm:text-5xl">
                  {latest.contentTitle}
                </h2>
                <p className="mt-3 text-sm text-white/65">
                  {latest.episodeTitle !== latest.contentTitle
                    ? latest.episodeTitle
                    : latest.type}
                </p>
                <Link href={href(latest)} className="mt-6 inline-flex">
                  <RainbowButton>
                    <Play size={15} fill="currentColor" /> Watch again
                  </RainbowButton>
                </Link>
              </div>
            </div>
            <div className="flex flex-col bg-white p-6 text-black sm:p-8">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">
                Last session
              </p>
              <p className="mt-6 text-[clamp(64px,9vw,120px)] font-semibold leading-[0.7] tracking-[-0.1em]">
                {percentage(latest)}
                <span className="text-[0.38em]">%</span>
              </p>
              <p className="mt-5 text-sm text-black/60">
                of this story experienced
              </p>
              <div className="mt-7 h-[5px] bg-black/10">
                <div
                  className="h-full bg-black"
                  style={{ width: `${percentage(latest)}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(latest.episodeId)}
                disabled={removingId === latest.episodeId}
                className="mt-auto inline-flex w-fit items-center gap-2 border-b border-black pb-2 text-sm font-bold disabled:opacity-40"
              >
                <X size={15} /> Remove from gallery
              </button>
            </div>
          </section>
        ) : (
          <section className="relative mt-8 grid min-h-[430px] place-items-center overflow-hidden border border-dashed border-white/20 px-6 text-center">
            <p
              aria-hidden="true"
              className="pointer-events-none absolute right-[-0.06em] bottom-[-0.2em] select-none text-9xl font-semibold tracking-[-0.15em] text-white/[0.035]"
            >
              PLAY
            </p>
            <div className="relative">
              <Rewind size={32} className="mx-auto text-white/45" />
              <h2 className="mt-6 text-3xl font-semibold tracking-[-0.06em]">
                No traces yet.
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/55">
                Your rewind gallery starts the moment you press play.
              </p>
              <Link
                href="/dashboard/explore"
                className="mt-7 inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-bold text-black"
              >
                Discover stories <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        )}
        {items.length > 1 && (
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/15 pb-4">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  All traces
                </p>
                <h2 className="mt-3 text-4xl font-semibold leading-none tracking-[-0.065em] sm:text-5xl">
                  The rewind.
                </h2>
              </div>
              <Rewind size={20} className="mb-1 text-white/45" />
            </div>
            <div>
              {items.slice(1).map((item, index) => (
                <HistoryStrip
                  key={`${item.contentId}-${item.episodeId}`}
                  item={item}
                  index={index}
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
