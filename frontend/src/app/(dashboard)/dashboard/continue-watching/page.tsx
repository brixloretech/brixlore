"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader } from "@/components/ui";
import { useAuth } from "@/contexts";
import { streamingService } from "@/lib/services";
import type { ContinueWatchingItemDto } from "@/types/api";

function progressPercent(progress: number, duration: number): number {
  if (duration <= 0) return 0;
  const p = Math.min(100, Math.round((progress / duration) * 100));
  return Math.max(0, p);
}

export default function ContinueWatchingPage() {
  const { isAuthenticated, isSubscribed, isAdmin } = useAuth();
  const isFreeUser = isAuthenticated && !isSubscribed && !isAdmin;
  const [items, setItems] = useState<ContinueWatchingItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchList = useCallback(() => {
    setLoading(true);
    streamingService
      .getContinueWatching()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isFreeUser) {
      setItems([]);
      setLoading(false);
      return;
    }
    fetchList();
  }, [fetchList, isFreeUser]);

  const handleRemove = useCallback(async (episodeId: string) => {
    setRemovingId(episodeId);
    try {
      await streamingService.removeFromContinueWatching(episodeId);
      setItems((prev) => prev.filter((item) => item.episodeId !== episodeId));
    } finally {
      setRemovingId(null);
    }
  }, []);

  if (isFreeUser) {
    return (
      <div className="font-[var(--font-geist-sans)]">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Continue Watching
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Upgrade to unlock Continue Watching
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            Continue Watching is available on paid plans.
          </p>
        </header>
        <section className="rounded-2xl border border-neutral-700/60 bg-neutral-900/60 p-6">
          <p className="text-sm text-neutral-300">
            Pick a plan to sync your in-progress titles across devices.
          </p>
          <Link href="/subscription" className="mt-4 inline-flex">
            <button className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90">
              Upgrade now
            </button>
          </Link>
        </section>
      </div>
    );
  }

  const hasItems = items.length > 0;
  return (
    <div className="font-[var(--font-geist-sans)]">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
          Continue Watching
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Pick up right where you left off
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-400">
          Your in-progress titles stay synced across devices.
        </p>
      </header>

      <section
        className="rounded-2xl border border-neutral-700/60 bg-neutral-900/60 p-6"
        aria-label="In progress"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">In progress</h2>
          <Link
            href="/browse"
            className="text-xs font-semibold text-neutral-400 hover:text-accent"
          >
            Browse
          </Link>
        </div>
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader size="lg" label="Loading…" />
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
                          <img
                            src={item.thumbnailUrl}
                            alt=""
                            className="h-full w-full object-cover"
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
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-neutral-400">
                        {percent}% watched
                      </span>
                      <Link
                        href={watchUrl}
                        className="inline-flex h-8 items-center justify-center rounded-md border-2 border-accent bg-transparent px-3 text-sm font-medium text-accent hover:bg-accent/10 active:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-off-black"
                      >
                        Resume
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.episodeId)}
                        disabled={removingId === item.episodeId}
                        className="text-xs text-neutral-400 hover:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1"
                        title="Remove from list"
                        aria-label={`Remove ${item.contentTitle} from continue watching`}
                      >
                        {removingId === item.episodeId ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 bg-neutral-800">
                    <div
                      className="h-1.5 rounded-r-full bg-accent"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-700/60 bg-neutral-950/40 p-4 text-sm text-neutral-400">
              Nothing to resume yet. Start watching a title to see progress.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
