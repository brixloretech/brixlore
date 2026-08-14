"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader } from "@/components/ui";
import { streamingService } from "@/lib/services";
import type { ContinueWatchingItemDto } from "@/types/api";

type HistoryItem = ContinueWatchingItemDto & {
  completed?: boolean;
};

function progressPercent(progress: number, duration: number): number {
  if (duration <= 0) return 0;
  const p = Math.min(100, Math.round((progress / duration) * 100));
  return Math.max(0, p);
}

export default function WatchHistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchList = useCallback(() => {
    setLoading(true);
    streamingService
      .getWatchHistory()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleRemove = useCallback(async (episodeId: string) => {
    setRemovingId(episodeId);
    try {
      await streamingService.removeFromContinueWatching(episodeId);
      setItems((prev) => prev.filter((item) => item.episodeId !== episodeId));
    } finally {
      setRemovingId(null);
    }
  }, []);

  const hasItems = items.length > 0;
  return (
    <div className="font-sans">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
          History
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Your Watch History
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-400">
          A complete log of titles you&apos;ve watched.
        </p>
      </header>

      <section
        className="rounded-2xl border border-neutral-700/60 bg-neutral-900/60 p-6"
        aria-label="Viewing history list"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">History</h2>
          <Link
            href="/browse"
            className="text-xs font-semibold text-neutral-400 hover:text-accent"
          >
            Browse Catalog
          </Link>
        </div>
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader size="lg" label="Loading history…" />
            </div>
          ) : hasItems ? (
            items.map((item) => {
              const percent = progressPercent(item.progress, item.duration);
              const watchUrl = `/watch/${item.contentId}?episodeId=${encodeURIComponent(item.episodeId)}`;
              return (
                <div
                  key={`${item.contentId}-${item.episodeId}`}
                  className="rounded-xl border border-neutral-700/60 bg-neutral-950/60 overflow-hidden"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4">
                    <div className="flex min-w-0 gap-4">
                      {item.thumbnailUrl ? (
                        <Link
                          href={watchUrl}
                          className="relative block h-20 w-36 shrink-0 overflow-hidden rounded-lg bg-neutral-800"
                        >
                          <Image
                            src={item.thumbnailUrl}
                            alt=""
                            className="object-cover"
                            fill
                            sizes="144px"
                            unoptimized
                          />
                        </Link>
                      ) : null}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {item.contentTitle}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                          {item.episodeTitle !== item.contentTitle
                            ? item.episodeTitle
                            : item.type}
                        </p>
                        <p className="mt-1 text-[10px] text-neutral-500">
                          Watched on {new Date(item.watchedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-neutral-400">
                        {item.completed ? (
                          <span className="text-emerald-400 font-medium">Completed</span>
                        ) : (
                          `${percent}% watched`
                        )}
                      </span>
                      <Link
                        href={watchUrl}
                        className="inline-flex h-8 items-center justify-center rounded-md border-2 border-accent bg-transparent px-3 text-sm font-medium text-accent hover:bg-accent/10 active:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-off-black"
                      >
                        {item.completed ? "Watch Again" : "Resume"}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.episodeId)}
                        disabled={removingId === item.episodeId}
                        className="text-xs text-neutral-400 hover:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1"
                        title="Remove from history"
                        aria-label={`Remove ${item.contentTitle} from watch history`}
                      >
                        {removingId === item.episodeId ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </div>
                  {!item.completed && (
                    <div className="h-1.5 bg-neutral-800">
                      <div
                        className="h-1.5 rounded-r-full bg-accent"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-700/60 bg-neutral-950/40 p-4 text-sm text-neutral-400">
              No viewing history found. Start watching to see your log here!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
