"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth, useMyList } from "@/contexts";
import { Button, Loader } from "@/components/ui";
import {
  contentService,
  subscriptionService,
  streamingService,
} from "@/lib/services";
import type {
  ContentSummaryDto,
  ContinueWatchingItemDto,
  PublicPlanDto,
} from "@/types/api";

function progressPercent(progress: number, duration: number): number {
  if (duration <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((progress / duration) * 100)));
}

export default function DashboardPage() {
  const { user, isSubscribed, setSubscribed } = useAuth();
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "there";
  const [contentItems, setContentItems] = useState<ContentSummaryDto[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [continueItems, setContinueItems] = useState<ContinueWatchingItemDto[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    Promise.all([
      contentService.getContentForBrowse(),
      contentService.getCategories(),
      subscriptionService.getPlans(),
      subscriptionService.getSubscription(true),
      streamingService.getContinueWatching(),
    ])
      .then(([items, cats, planList, subscription, continueList]) => {
        if (!active) return;
        setContentItems(items);
        setCategories(cats);
        setPlans(planList);
        setPlanId(subscription.planId ?? null);
        setSubscribed(subscription.isSubscribed);
        setContinueItems(Array.isArray(continueList) ? continueList : []);
      })
      .catch(() => {
        if (!active) return;
        setContentItems([]);
        setCategories([]);
        setPlans([]);
        setPlanId(null);
        setContinueItems([]);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [setSubscribed]);

  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === planId) ?? null,
    [plans, planId],
  );
  const categoryCount = categories.filter(
    (category) => category.toLowerCase() !== "all",
  ).length;
  const exploreTags = categories
    .filter((category) => category.toLowerCase() !== "all")
    .slice(0, 4);
  const { listIds } = useMyList();
  const savedItems = useMemo(() => {
    return contentItems.filter((item) => listIds.includes(item.id));
  }, [contentItems, listIds]);

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <Loader size="lg" label="Loading dashboard…" />
      </main>
    );
  }

  return (
    <div className="font-[var(--font-geist-sans)]">
      <header className="relative overflow-hidden rounded-2xl border border-neutral-700/60 bg-neutral-900/60 p-6 sm:p-8">
        <div
          className="absolute -left-24 top-8 h-48 w-48 rounded-full bg-white/5 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-20 right-8 h-40 w-40 rounded-full bg-accent/25 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Home
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            Your watchlist, recommendations, and playback controls live here.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard/explore">
              <Button type="button" size="lg">
                Start exploring
              </Button>
            </Link>
            <Link href="/dashboard/continue-watching">
              <Button type="button" variant="outline" size="lg">
                Resume playback
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Account snapshot"
      >
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Library
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {contentItems.length}
          </p>
          <p className="mt-1 text-xs text-neutral-400">Titles available</p>
        </div>
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Categories
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {categoryCount}
          </p>
          <p className="mt-1 text-xs text-neutral-400">Curated collections</p>
        </div>
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Subscription
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {isSubscribed ? (activePlan?.name ?? "Active") : "Free"}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {isSubscribed ? "Full access" : "Choose a plan to unlock premium access."}
          </p>
        </div>
      </section>

      <section
        className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
        aria-label="Home highlights"
      >
        <div className="rounded-2xl border border-neutral-700/50 bg-neutral-900/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Continue watching
              </h2>
              <p className="mt-1 text-sm text-neutral-400">
                Jump back into your current sessions.
              </p>
            </div>
            <Link
              href="/dashboard/continue-watching"
              className="text-xs font-semibold text-neutral-400 hover:text-accent"
            >
              View all
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {continueItems.length > 0 ? (
              continueItems.slice(0, 5).map((item) => {
                const percent = progressPercent(item.progress, item.duration);
                const watchUrl = `/watch/${item.contentId}?episodeId=${encodeURIComponent(item.episodeId)}`;
                return (
                  <div
                    key={`${item.contentId}-${item.episodeId}`}
                    className="rounded-xl border border-neutral-700/60 bg-neutral-950/60 p-4"
                  >
                    <div className="flex items-center justify-between">
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
                      <Link
                        href={watchUrl}
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button type="button" size="sm" variant="outline">
                          Resume
                        </Button>
                      </Link>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-neutral-800">
                      <div
                        className="h-1.5 rounded-full bg-accent"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-700/60 bg-neutral-950/40 p-4 text-sm text-neutral-400">
                Nothing in progress yet. Start watching a title to pick up here.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-700/50 bg-neutral-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">
              Explore something new
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Search creators, genres, and curated collections.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {exploreTags.length > 0 ? (
                exploreTags.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-neutral-700/70 bg-neutral-950/60 px-3 py-1 text-xs text-neutral-300"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-xs text-neutral-400">
                  No categories yet.
                </span>
              )}
            </div>
            <Link href="/dashboard/explore" className="mt-5 inline-flex">
              <Button type="button" size="sm">
                Open explore
              </Button>
            </Link>
          </div>

          <div className="rounded-2xl border border-neutral-700/50 bg-neutral-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">
              My list preview
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Titles you saved for later.
            </p>
            <div className="mt-5 space-y-3">
              {savedItems.length > 0 ? (
                savedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-700/60 bg-neutral-950/60 px-4 py-3"
                  >
                    <p className="text-sm font-medium text-white">
                      {item.title}
                    </p>
                    <Link href={`/watch/${item.id}`}>
                      <button
                        type="button"
                        className="text-xs font-semibold text-neutral-400 hover:text-accent"
                      >
                        Play
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-400">Your list is empty.</p>
              )}
            </div>
            <Link
              href="/dashboard/my-list"
              className="mt-5 inline-flex"
            >
              <Button type="button" variant="outline" size="sm">
                View full list
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
