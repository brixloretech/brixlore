"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { contentService } from "@/lib/services";
import type { ContentSummaryDto } from "@/types/api";
import { VideoCardSkeleton } from "@/components/content/VideoCardSkeleton";
import { AddToMyListButton } from "@/components/content/AddToMyListButton";

export default function ExplorePage() {
  const [contentItems, setContentItems] = useState<ContentSummaryDto[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      contentService.getContentForBrowse(),
      contentService.getCategories(),
    ])
      .then(([items, cats]) => {
        if (!active) return;
        setContentItems(items);
        setCategories(cats);
      })
      .catch(() => {
        if (!active) return;
        setContentItems([]);
        setCategories([]);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const quickFilters = categories
    .filter((category) => category.toLowerCase() !== "all")
    .slice(0, 5);
  const moods = categories
    .filter((category) => category.toLowerCase() !== "all")
    .slice(0, 6);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return contentItems.filter((item) => {
      const matchesCategory = activeCategory
        ? (item.category ?? item.type).toLowerCase() ===
          activeCategory.toLowerCase()
        : true;
      const matchesQuery = normalizedQuery
        ? [item.title, item.category, item.type]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      return matchesCategory && matchesQuery;
    });
  }, [contentItems, searchQuery, activeCategory]);

  const trendingItems = filteredItems.slice(0, 4);
  const hasTrending = trendingItems.length > 0;
  const hasMoods = moods.length > 0;

  const handleFilterSelect = (category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const handleClearFilters = () => {
    setActiveCategory(null);
    setSearchQuery("");
  };
  return (
    <div className="font-[var(--font-geist-sans)]">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
          Search / Explore
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Find your next favorite watch
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-400">
          Search across creators, collections, and playlists curated for your
          mood.
        </p>
      </header>

      <section
        className="rounded-2xl border border-neutral-700/60 bg-neutral-900/60 p-6"
        aria-label="Search"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Input
            label="Search titles, creators, or genres"
            placeholder='Try "live concerts"'
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <div className="rounded-xl border border-neutral-700/70 bg-neutral-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
              Quick filters
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickFilters.length > 0 ? (
                quickFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => handleFilterSelect(filter)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      activeCategory === filter
                        ? "border-accent text-accent"
                        : "border-neutral-600 text-neutral-200 hover:border-accent hover:text-accent"
                    }`}
                  >
                    {filter}
                  </button>
                ))
              ) : (
                <span className="text-xs text-neutral-400">
                  Filters appear when content is available.
                </span>
              )}
            </div>
            {(activeCategory || searchQuery) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-4 text-xs font-semibold text-neutral-400 hover:text-accent"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8" aria-label="Trending">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Trending now</h2>
          <Link
            href="/browse"
            className="text-xs font-semibold text-neutral-400 hover:text-accent"
          >
            Open browse
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <VideoCardSkeleton key={`trend-skeleton-${index}`} />
            ))
          ) : hasTrending ? (
            trendingItems.map((item) => (
              <div
                key={item.id}
                className="relative rounded-xl border border-neutral-700/60 bg-neutral-900/60 p-4"
              >
                <AddToMyListButton
                  contentId={item.id}
                  className="absolute right-3 top-3 z-10"
                  size="sm"
                />
                <div className="relative h-24 overflow-hidden rounded-lg bg-gradient-to-br from-neutral-800/80 via-neutral-900 to-neutral-800/60">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <p className="mt-4 text-sm font-semibold text-white">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  {item.category ?? item.type}
                </p>
                <Link href={`/watch/${item.id}`} className="mt-4 block">
                  <Button type="button" variant="outline" size="sm" fullWidth>
                    View details
                  </Button>
                </Link>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-700/60 bg-neutral-900/40 p-6 text-sm text-neutral-400 sm:col-span-2 lg:col-span-4">
              Trending content will appear once titles are available.
            </div>
          )}
        </div>
      </section>

      <section className="mt-8" aria-label="Results" ref={resultsRef}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Results</h2>
          {(activeCategory || searchQuery) && (
            <span className="text-xs text-neutral-400">
              {activeCategory ? `Filter: ${activeCategory}` : "All categories"}
            </span>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <VideoCardSkeleton key={`result-skeleton-${index}`} />
            ))
          ) : filteredItems.length > 0 ? (
            filteredItems.slice(0, 9).map((item) => (
              <div
                key={item.id}
                className="relative rounded-xl border border-neutral-700/60 bg-neutral-900/60 p-4 transition hover:border-neutral-500"
              >
                <AddToMyListButton
                  contentId={item.id}
                  className="absolute right-3 top-3 z-10"
                  size="sm"
                />
                <Link href={`/watch/${item.id}`} className="block">
                  <div className="relative h-32 overflow-hidden rounded-lg bg-gradient-to-br from-neutral-800/80 via-neutral-900 to-neutral-800/60">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {item.category ?? item.type}
                  </p>
                </Link>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-700/60 bg-neutral-900/40 p-6 text-sm text-neutral-400 sm:col-span-2 lg:col-span-3">
              No results found. Try a different search or filter.
            </div>
          )}
        </div>
      </section>

      <section className="mt-8" aria-label="Browse by mood">
        <h2 className="text-lg font-semibold text-white">Browse by mood</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hasMoods ? (
            moods.map((mood) => (
              <div
                key={mood}
                className="flex items-center justify-between rounded-xl border border-neutral-700/60 bg-neutral-900/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{mood}</p>
                  <p className="text-xs text-neutral-400">Curated playlists</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleFilterSelect(mood)}
                  className="text-xs font-semibold text-neutral-400 hover:text-accent"
                >
                  Explore
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-700/60 bg-neutral-900/40 p-4 text-sm text-neutral-400 sm:col-span-2 lg:col-span-3">
              Mood collections will show once categories are available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
