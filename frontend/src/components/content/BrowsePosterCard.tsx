"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { AddToMyListButton } from "./AddToMyListButton";

type BrowseItem = {
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
  "from-zinc-950 via-zinc-900 to-slate-400/40",
  "from-slate-950 via-slate-900 to-slate-500/40",
];

function getGradient(index: number) {
  return GRADIENTS[index % GRADIENTS.length];
}

/**
 * Thumbnail logic matches /dashboard/explore: render img when URL exists, no error
 * state or timeout that hides the image. Keeps thumbnails visible and loading smoothly.
 */
export function BrowsePosterCard({
  item,
  index,
}: {
  item: BrowseItem;
  index: number;
}) {
  const hasThumbnail = Boolean(item.thumbnailUrl);

  return (
    <div className="relative h-40 w-72 shrink-0 sm:h-44 sm:w-80">
      <AddToMyListButton
        contentId={item.id}
        className="absolute right-2 top-2 z-10"
        size="sm"
      />
      <Link
        href={`/watch/${item.id}`}
        className={cn(
          "group relative flex h-full w-full flex-col justify-end overflow-hidden rounded-xl border border-white/10 bg-neutral-900/60 p-3 text-left shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(0,0,0,0.45)]",
        )}
        aria-label={`Watch ${item.title}`}
      >
        {/* Thumbnail: same as explore page — show img when URL exists, gradient behind; never hide on error/timeout */}
        <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-br from-neutral-800/80 via-neutral-900 to-neutral-800/60">
          {hasThumbnail ? (
            <img
              src={item.thumbnailUrl!}
              alt=""
              className="h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
              fetchPriority={index < 6 ? "high" : "auto"}
            />
          ) : null}
        </div>
        {hasThumbnail ? null : (
          <div
            className="absolute inset-0 z-0 flex items-center justify-center bg-neutral-800/80"
            aria-hidden
          >
            <svg
              className="h-12 w-12 text-white/30"
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
        {/* Overlay: visible on hover so title/watch now are readable; when no thumbnail use full dark gradient (always visible) */}
        {hasThumbnail ? (
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
        <div className="relative z-[2] flex flex-col gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {item.badge ? (
            <span className="inline-flex w-fit rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              {item.badge}
            </span>
          ) : null}
          <p className="text-sm font-semibold text-white line-clamp-1 leading-tight">
            {item.title}
          </p>
          {item.subtitle ? (
            <p className="text-[11px] text-white/70 line-clamp-1">
              {item.subtitle}
            </p>
          ) : null}
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-white/80">
            Watch Preview
            <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </div>
  );
}
