"use client";

import Link from "next/link";
import Image from "next/image";
import type { Video } from "@/types";
import { cn } from "@/lib/utils";

/** Minimal gray blur placeholder for image loading (avoids layout shift). */
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=";

type VideoCardProps = {
  video: Video;
  className?: string;
  /** Set for above-the-fold cards (e.g. first row) for faster LCP. */
  priority?: boolean;
};

/**
 * Placeholder thumbnail when no image URL is provided.
 * Uses a gradient and the first letter of the title for a consistent mock look.
 */
function ThumbnailPlaceholder({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const initial = title.charAt(0).toUpperCase();
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-neutral-200 text-4xl font-bold text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400",
        className,
      )}
      aria-hidden
    >
      {initial}
    </div>
  );
}

export function VideoCard({
  video,
  className,
  priority = false,
}: VideoCardProps) {
  return (
    <Link
      href={`/watch/${video.id}`}
      className={cn(
        "group block overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-neutral-900/50",
        className,
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt=""
            fill
            className="object-cover transition-transform group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <ThumbnailPlaceholder title={video.title} />
        )}
        {video.duration ? (
          <span
            className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-0.5 text-xs font-medium text-white"
            aria-label={`Duration: ${video.duration}`}
          >
            {video.duration}
          </span>
        ) : null}
      </div>
      <div className="p-3 sm:p-4">
        <h2 className="line-clamp-2 font-semibold text-neutral-900 group-hover:text-neutral-700 dark:text-white dark:group-hover:text-neutral-200">
          {video.title}
        </h2>
      </div>
    </Link>
  );
}
