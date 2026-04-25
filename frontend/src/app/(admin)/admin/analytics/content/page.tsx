"use client";

import { useEffect, useMemo, useState } from "react";
import { adminService } from "@/lib/services";
import type { AdminContentAnalyticsDto } from "@/types/api";
import { Button, Loader } from "@/components/ui";

export default function AdminContentAnalyticsPage() {
  const [data, setData] = useState<AdminContentAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getContentAnalytics();
      setData(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load analytics.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const maxCategory = useMemo(() => {
    if (!data?.contentByCategory.length) return 1;
    return Math.max(1, ...data.contentByCategory.map((c) => c.value));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-neutral-700/50 bg-neutral-900/50 py-12">
        <Loader size="lg" label="Loading content analytics…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 py-12 text-center">
        <p className="text-red-300">{error ?? "Failed to load analytics."}</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => void load()}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Content Analytics
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Measure publishing activity and content engagement.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Total content
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {data.totalContent}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Published
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {data.publishedContent}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Unpublished
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {data.unpublishedContent}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Views (30 days)
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {data.viewsLast30Days}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Total views: {data.totalViews}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-neutral-700/50 bg-neutral-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Top episodes</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Most watched episodes in your catalog.
          </p>
          <div className="mt-6 space-y-3">
            {data.topEpisodes.length === 0 ? (
              <p className="text-sm text-neutral-500">No view data yet.</p>
            ) : (
              data.topEpisodes.map((episode, index) => (
                <div
                  key={episode.episodeId}
                  className="flex items-center justify-between rounded-xl border border-neutral-700/60 bg-neutral-950/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {episode.title}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {episode.views} views
                    </p>
                  </div>
                  <span className="text-xs text-neutral-500">#{index + 1}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-700/50 bg-neutral-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">Category mix</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Distribution by category.
          </p>
          <div className="mt-6 space-y-4">
            {data.contentByCategory.length === 0 ? (
              <p className="text-sm text-neutral-500">No categories found.</p>
            ) : (
              data.contentByCategory.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-200">{item.label}</span>
                    <span className="text-neutral-500">{item.value}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-800/80">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{
                        width: `${Math.max(5, (item.value / maxCategory) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
