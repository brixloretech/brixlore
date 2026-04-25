"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AddToMyListButton } from "./AddToMyListButton";

export type BannerItem = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  thumbnailUrl?: string | null;
};

const GRADIENTS = [
  "from-slate-950 via-slate-900 to-slate-500/40",
  "from-indigo-950 via-indigo-900 to-slate-400/40",
  "from-neutral-950 via-neutral-900 to-slate-500/40",
];

const AUTO_ADVANCE_MS = 5000;
const IMAGE_LOAD_TIMEOUT_MS = 12000;

function getGradient(index: number) {
  return GRADIENTS[index % GRADIENTS.length];
}

export function NewlyUploadedBannerCarousel({
  items,
}: {
  items: BannerItem[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({});

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex((index + items.length) % items.length);
    },
    [items.length],
  );

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % items.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [items.length]);

  const setImgError = useCallback((index: number) => {
    setImgErrors((prev) => ({ ...prev, [index]: true }));
  }, []);

  // If a slide's image does not load within timeout, show placeholder so tab is not stuck
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    items.forEach((item, index) => {
      if (!item.thumbnailUrl || imgErrors[index] || imgLoaded[index]) return;
      timers.push(setTimeout(() => setImgError(index), IMAGE_LOAD_TIMEOUT_MS));
    });
    return () => timers.forEach(clearTimeout);
  }, [items, imgErrors, imgLoaded, setImgError]);

  if (items.length === 0) return null;

  return (
    <section className="relative w-full px-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, index) => {
            const showThumbnail = item.thumbnailUrl && !imgErrors[index];
            return (
              <div
                key={item.id}
                className="relative flex min-w-full flex-shrink-0 flex-col"
                style={{ height: "clamp(18rem, 40vw, 28rem)" }}
              >
                <AddToMyListButton
                  contentId={item.id}
                  className="absolute right-4 top-4 z-10"
                  size="md"
                />
                <Link
                  href={`/watch/${item.id}`}
                  className="group relative flex flex-1 flex-col justify-end overflow-hidden rounded-xl border border-white/10 bg-neutral-900/60 text-left outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  aria-label={`Watch ${item.title}`}
                >
                  {showThumbnail && (
                    <div
                      className="absolute inset-0 z-0 animate-pulse bg-white/10"
                      aria-hidden
                    />
                  )}
                  {showThumbnail ? (
                    <img
                      src={item.thumbnailUrl!}
                      alt=""
                      className="absolute inset-0 z-0 h-full w-full object-cover object-center"
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={index === 0 ? "high" : "auto"}
                      onLoad={() =>
                        setImgLoaded((p) => ({ ...p, [index]: true }))
                      }
                      onError={() => setImgError(index)}
                    />
                  ) : (
                    <div
                      className="absolute inset-0 z-0 flex items-center justify-center bg-neutral-800/80"
                      aria-hidden
                    >
                      <svg
                        className="h-16 w-16 text-white/30"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  {showThumbnail ? (
                    <div
                      className="absolute inset-x-0 bottom-0 z-[1] h-1/2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      aria-hidden
                    />
                  ) : (
                    <div
                      className={cn(
                        "absolute inset-0 z-[1] bg-gradient-to-br opacity-90 pointer-events-none",
                        getGradient(index),
                      )}
                      aria-hidden
                    />
                  )}
                  <div className="relative z-[2] p-4 sm:p-6 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {item.badge ? (
                      <span className="mb-2 inline-flex w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                        {item.badge}
                      </span>
                    ) : null}
                    <p className="text-lg font-semibold text-white sm:text-xl line-clamp-2">
                      {item.title}
                    </p>
                    {item.subtitle ? (
                      <p className="mt-1 text-sm text-white/80 line-clamp-1">
                        {item.subtitle}
                      </p>
                    ) : null}
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white/90">
                      Watch Preview
                      <span aria-hidden>→</span>
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {items.length > 1 ? (
        <>
          <div className="mx-auto mt-4 flex max-w-5xl justify-center gap-2">
            {items.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-200",
                  index === currentIndex
                    ? "w-6 bg-white/90"
                    : "w-2 bg-white/40 hover:bg-white/60",
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
