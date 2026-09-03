"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { contentService } from "@/lib/services/content.service";
import type { ContentSummaryDto } from "@/types/api";
import { FigmaFavoriteButton } from "@/components/content/FigmaFavoriteButton";

const cardClass =
  "bg-white rounded-[5px] py-[4px] px-[14px] transition-all ease-in-out duration-300 hover:bg-primary hover:text-white";

function MovieCard({ item }: { item: ContentSummaryDto }) {
  const image = item.posterUrl || item.thumbnailUrl;
  const watchHref = `/watch-2/${item.id}`;

  return (
    <article className="group text-center">
      <div className="relative mb-[20px] h-[330px] w-full overflow-hidden rounded-[5px] lg:mb-[22px]">
        <Link
          href={watchHref}
          className="block h-full overflow-hidden rounded-[5px]"
        >
          {image ? (
            <img
              src={image}
              alt={item.title}
              className="h-full w-full rounded-[5px] object-cover transition-all duration-300 ease-in-out group-hover:scale-110"
            />
          ) : (
            <div
              className="h-full w-full rounded-[5px] bg-white/10"
              aria-label={`${item.title} poster`}
            />
          )}
        </Link>
        <div className="absolute bottom-[10px] left-[15px] flex flex-wrap items-center justify-center gap-[5px] opacity-0 invisible transition-all duration-300 ease-in-out group-hover:visible group-hover:bottom-[20px] group-hover:opacity-100">
          <FigmaFavoriteButton contentId={item.id} />
        </div>
        <Link
          href={watchHref}
          aria-label={`Play ${item.title}`}
          className="absolute top-1/2 left-1/2 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-primary text-3xl text-white opacity-0 invisible transition-all duration-300 ease-in-out group-hover:visible group-hover:opacity-100 hover:bg-secondary hover:text-black"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <i className="ri-play-fill" />
        </Link>
      </div>
      <h2 className="mb-[10px] text-base leading-none md:mb-[12px] md:text-base lg:text-[18px]">
        <Link
          href={watchHref}
          className="transition-all duration-300 ease-in-out hover:text-secondary"
        >
          {item.title}
        </Link>
      </h2>
      <ul className="flex flex-wrap items-center justify-center gap-[13px] text-13 font-bold text-white/55 md:text-sm">
        <li>{item.releaseYear}</li>
        <li>
          <span className="block h-[12px] w-px bg-white/20" />
        </li>
        <li>
          <span className="text-[#ae99fa]">{item.category || item.type}</span>
        </li>
      </ul>
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="text-center">
      <div className="mb-[20px] h-[330px] w-full animate-pulse rounded-[5px] bg-white/10 lg:mb-[22px]" />
      <div className="mx-auto h-5 w-3/4 animate-pulse rounded bg-white/10" />
      <div className="mx-auto mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ContentSummaryDto[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") ?? "All",
  );
  const [selectedTag, setSelectedTag] = useState(
    searchParams.get("tag") ?? "All",
  );

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setSelectedCategory(searchParams.get("category") ?? "All");
    setSelectedTag(searchParams.get("tag") ?? "All");
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      contentService.getContentForBrowse(undefined, { cache: "no-store" }),
      contentService.getCategories(),
    ])
      .then(([catalog, categoryList]) => {
        if (!active) return;
        setItems(catalog);
        setCategories(
          Array.from(
            new Set(
              categoryList.filter(
                (category) => category && category.toLowerCase() !== "all",
              ),
            ),
          ),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const tags = useMemo(() => categories.slice(0, 8), [categories]);
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.category, item.type]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesTag = selectedTag === "All" || item.category === selectedTag;
      return matchesQuery && matchesCategory && matchesTag;
    });
  }, [items, query, selectedCategory, selectedTag]);

  function updateFilters(next: {
    q?: string;
    category?: string;
    tag?: string;
  }) {
    const params = new URLSearchParams();
    const nextQuery = next.q ?? query;
    const nextCategory = next.category ?? selectedCategory;
    const nextTag = next.tag ?? selectedTag;
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextCategory !== "All") params.set("category", nextCategory);
    if (nextTag !== "All") params.set("tag", nextTag);
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
  }

  function clearFilters() {
    setQuery("");
    setSelectedCategory("All");
    setSelectedTag("All");
    router.replace(pathname, { scroll: false });
  }

  const hasFilters = Boolean(
    query || selectedCategory !== "All" || selectedTag !== "All",
  );

  return (
    <main className="min-h-screen bg-black pt-[125px] pb-[70px] text-white md:pt-[155px] md:pb-[100px] lg:pt-[180px] lg:pb-[130px]">
      <div className="container 2xl:!max-w-[1920px] 2xl:!px-[100px]">
        <div className="mb-10 border-b border-white/10 pb-8 md:mb-12 md:pb-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
            Brixlore catalog
          </p>
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-semibold leading-none tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                Find your next story.
              </h1>
              <p className="mt-4 max-w-xl leading-7 text-white/60">
                Search the full collection, then narrow it down by the worlds
                and genres you want to watch.
              </p>
            </div>
            <p className="text-sm font-bold text-white/50">
              {loading
                ? "Searching the catalog..."
                : `${results.length} video${results.length === 1 ? "" : "s"} found`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)] xl:gap-14">
          <aside className="h-fit rounded-[10px] border border-white/10 bg-white/[0.045] p-5 sm:p-6 lg:sticky lg:top-28">
            <div className="mb-7 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <SlidersHorizontal size={18} /> Search Video
              </h2>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-bold text-white/50 transition hover:text-white"
                >
                  Clear all
                </button>
              )}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                updateFilters({ q: query });
              }}
              className="relative"
            >
              
             
                <input
                  type="text"
                  className="form-input !h-[50px] rounded-full "
                  placeholder="Search for movies or TV shows"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
       

              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    updateFilters({ q: "" });
                  }}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-3  text-white/40 hover:text-white transform-y-translate-50"
                >
                  <X size={16} />
                </button>
              )}
            </form>
            <div className="mt-8">
              <h3 className="mb-4 text-sm font-bold text-white">
                All Category
              </h3>
              <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
                {["All", ...categories].map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category);
                      updateFilters({ category });
                    }}
                    className={`flex items-center justify-between rounded-[5px] px-3 py-2 text-left text-sm font-medium transition ${selectedCategory === category ? "bg-white text-black" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                  >
                    <span>{category}</span>
                    {selectedCategory === category && (
                      <span className="text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-8 border-t border-white/10 pt-7">
              <h3 className="mb-4 text-sm font-bold text-white">Tags</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTag("All");
                    updateFilters({ tag: "All" });
                  }}
                  className={`${cardClass} ${selectedTag === "All" ? "!bg-white !text-black" : "!bg-white/10"}`}
                >
                  All
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSelectedTag(tag);
                      updateFilters({ tag });
                    }}
                    className={`${cardClass} ${selectedTag === tag ? "!bg-white !text-black" : "!bg-white/10"}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section aria-live="polite">
            {loading ? (
              <div className="grid grid-cols-2 gap-x-[18px] gap-y-10 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : results.length ? (
              <div className="grid grid-cols-2 gap-x-[18px] gap-y-10 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                <>
                  {results.map((item) => (
                    <MovieCard key={item.id} item={item} />
                  ))}
                </>
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[10px] border border-dashed border-white/15 bg-white/[0.03] px-5 text-center">
                <Search size={30} className="text-white/45" />
                <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
                  Nothing matched your search.
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
                  Try a different title, or clear your category and tag filters
                  to see more videos.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/80"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
