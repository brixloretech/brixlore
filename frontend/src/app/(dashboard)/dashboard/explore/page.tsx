"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Play,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { AddToMyListButton } from "@/components/content/AddToMyListButton";
import {
  ScrollVelocityContainer,
  ScrollVelocityRow,
} from "@/components/ui/scroll-based-velocity";
import { contentService } from "@/lib/services";
import type { ContentSummaryDto } from "@/types/api";

function CatalogCard({
  item,
  index,
}: {
  item: ContentSummaryDto;
  index: number;
}) {
  const image = item.posterUrl || item.thumbnailUrl;
  return (
    <article className="group relative">
      <Link
        href={`/watch-2/${item.id}`}
        className="relative block h-[270px] overflow-hidden rounded-[3px] bg-white/10 sm:h-[320px] xl:h-[360px]"
      >
        {image ? (
          <img
            src={image}
            alt={item.title}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(145deg,#303030,#070707)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute bottom-4 left-4 flex h-10 w-10 translate-y-3 items-center justify-center rounded-full bg-white text-black opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Play size={16} fill="currentColor" />
        </span>
        <span className="absolute left-3 top-3 bg-black/65 px-2 py-1 text-[10px] font-bold tracking-[0.14em] text-white backdrop-blur">
          {item.type}
        </span>
      </Link>
      <div className="mt-3 grid grid-cols-[28px_minmax(0,1fr)] gap-2">
        <span className="font-mono text-[11px] text-white/35">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-[-0.025em]">
            {item.title}
          </h2>
          <p className="mt-1 text-xs text-white/45">
            {item.releaseYear} <span className="mx-1">/</span>{" "}
            {item.category || item.type}
          </p>
        </div>
      </div>
      <AddToMyListButton
        contentId={item.id}
        className="absolute right-3 top-3 z-10 opacity-0 transition-opacity group-hover:opacity-100"
        size="sm"
      />
    </article>
  );
}

function Skeleton() {
  return (
    <div>
      <div className="h-[270px] animate-pulse bg-white/10 sm:h-[320px] xl:h-[360px]" />
      <div className="mt-3 h-4 w-3/4 animate-pulse bg-white/10" />
    </div>
  );
}

export default function ExplorePage() {
  const [items, setItems] = useState<ContentSummaryDto[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [signalIndex, setSignalIndex] = useState(0);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      contentService.getContentForBrowse(),
      contentService.getCategories(),
    ])
      .then(([catalog, categoryList]) => {
        if (active) {
          setItems(catalog);
          setCategories(
            categoryList.filter((value) => value.toLowerCase() !== "all"),
          );
        }
      })
      .catch(() => {
        if (active) {
          setItems([]);
          setCategories([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        category === "All" ||
        (item.category || item.type).toLowerCase() === category.toLowerCase();
      const matchesQuery =
        !text ||
        [item.title, item.category, item.type]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(text);
      return matchesCategory && matchesQuery;
    });
  }, [items, query, category]);
  const signals = useMemo(
    () =>
      items
        .filter((item) => item.bannerUrl || item.thumbnailUrl || item.posterUrl)
        .slice(0, 6),
    [items],
  );
  const featured = signals[signalIndex] || results[0] || items[0];
  const hasFilters = Boolean(query || category !== "All");

  useEffect(() => {
    setSignalIndex(0);
  }, [signals.length]);
  useEffect(() => {
    if (signals.length < 2) return;
    const timer = window.setInterval(
      () => setSignalIndex((current) => (current + 1) % signals.length),
      3200,
    );
    return () => window.clearInterval(timer);
  }, [signals.length]);
  const chooseCategory = (value: string) => {
    setCategory(value);
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  };

  return (
    <div className=" min-h-[calc(100vh-57px)] w-full max-w-full  bg-[#050505] text-white  ">
      <section className="relative isolate min-h-[650px] overflow-hidden border-b border-white/15 sm:min-h-[720px]">
        <div className="absolute inset-0 -z-30">
          {signals.map((item, index) => (
            <img
              key={item.id}
              src={item.bannerUrl || item.thumbnailUrl || item.posterUrl || ""}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${index === signalIndex ? "opacity-55" : "opacity-0"}`}
            />
          ))}
        </div>
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.93)_37%,rgba(5,5,5,0.22)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-20 h-2/3 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
        <div className="absolute inset-y-0 left-[52%] hidden w-px bg-white/15 lg:block" />
        <p
          aria-hidden="true"
          className="pointer-events-none absolute right-[-0.07em] top-[10%] hidden select-none text-[20vw] font-semibold leading-none tracking-[-0.13em] text-white/[0.045] lg:block"
        >
          SEEK
        </p>
        <div className="relative mx-auto flex min-h-[650px] max-w-[1550px] items-end px-4 pb-16 pt-24 sm:min-h-[720px] sm:px-6 lg:px-10 lg:pb-20">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
              <Sparkles size={13} /> Signal /{" "}
              {String(signalIndex + 1).padStart(2, "0")}{" "}
              <span className="h-px w-9 bg-white/45" /> Discovery channel
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-[0.85] tracking-[-0.08em] sm:text-7xl lg:text-[88px]">
              Tune into
              <br />
              something <span className="text-white/45">new.</span>
            </h1>
            <p className="mt-7 max-w-md border-l border-white/45 pl-5 text-sm leading-7 text-white/65 sm:text-base">
              A living library, not a list. Search a feeling, scan a genre, or
              follow the signal.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                resultsRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className="mt-9 max-w-xl"
            >
              <label className="flex h-14 items-center gap-3 border border-white/25 bg-black/35 px-4 backdrop-blur-md transition focus-within:border-white">
                <Search size={18} className="text-white/60" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search the signal..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-white/35"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  className="flex h-8 w-8 items-center justify-center bg-white text-black"
                  type="submit"
                  aria-label="Search"
                >
                  <ArrowRight size={16} />
                </button>
              </label>
            </form>
          </div>
          <div className="absolute right-4 bottom-16 hidden w-[265px] border-l border-white/25 pl-5 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              On the signal now
            </p>
            <p className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.05em]">
              {featured?.title || "Brixlore presents"}
            </p>
            <p className="mt-2 text-sm text-white/55">
              {featured?.category || featured?.type || "A fresh selection"}
            </p>
            <Link
              href={featured ? `/watch-2/${featured.id}` : "/dashboard/explore"}
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold"
            >
              Open feature <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="absolute bottom-7 left-4 flex gap-1.5 sm:left-6 lg:left-10">
            {signals.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSignalIndex(index)}
                aria-label={`Show ${item.title}`}
                className={`h-1 transition-all ${index === signalIndex ? "w-8 bg-white" : "w-3 bg-white/35"}`}
              />
            ))}
          </div>
        </div>
      </section>
      <ScrollVelocityContainer className="border-b border-white/10 bg-white py-4 text-black">
        <ScrollVelocityRow
          baseVelocity={1.5}
          direction={1}
          scrollReactivity={false}
          className="text-sm font-bold uppercase tracking-[0.18em]"
        >
          <span className="mx-6">Search the unexpected</span>
          <span className="text-black/35">✦</span>
          <span className="mx-6">Stories without limits</span>
          <span className="text-black/35">✦</span>
          <span className="mx-6">Find your next obsession</span>
          <span className="text-black/35">✦</span>
        </ScrollVelocityRow>
      </ScrollVelocityContainer>
      <div className="mx-auto w-full max-w-[1550px] px-4 py-11 sm:px-6 sm:py-16 lg:px-10">
        <div className="border-y border-white/15 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
              Choose a frequency
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                }}
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 hover:text-white"
              >
                Reset tuner
              </button>
            )}
          </div>
          <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
            {["All", ...categories].map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => chooseCategory(item)}
                className={`group flex shrink-0 items-center gap-3 border px-4 py-3 text-left transition ${category === item ? "border-white bg-white text-black" : "border-white/15 text-white/65 hover:border-white/60 hover:text-white"}`}
              >
                <span className="font-mono text-[10px] opacity-50">
                  {String(index).padStart(2, "0")}
                </span>
                <span className="text-sm font-semibold">{item}</span>
              </button>
            ))}
          </div>
        </div>
        <section ref={resultsRef} className="scroll-mt-20 pt-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                {category === "All" ? "All frequencies" : category}
              </p>
              <h2 className="mt-3 text-4xl font-semibold leading-none tracking-[-0.065em] sm:text-5xl">
                {query ? `You searched: ${query}` : "The current signal"}
              </h2>
            </div>
            <p className="font-mono text-xs text-white/45">
              {loading
                ? "SCANNING"
                : `${String(results.length).padStart(2, "0")} FOUND`}
            </p>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          ) : results.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
              {results.map((item, index) => (
                <CatalogCard key={item.id} item={item} index={index} />
              ))}
            </div>
          ) : (
            <div className="grid min-h-[360px] place-items-center border border-dashed border-white/15 bg-white/[0.02] px-6 text-center">
              <div>
                <Search size={27} className="mx-auto text-white/40" />
                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.05em]">
                  Static on this channel.
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
                  Try another word, or reset the tuner to return to the full
                  catalog.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategory("All");
                  }}
                  className="mt-6 bg-white px-5 py-3 text-sm font-bold text-black"
                >
                  Reset tuner
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
