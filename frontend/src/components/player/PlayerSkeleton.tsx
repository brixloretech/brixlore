"use client";

import { cn } from "@/lib/utils";

/**
 * Skeleton placeholder while the video player bundle loads.
 * Preserves aspect ratio (16:9) to avoid layout shift.
 */
export function PlayerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex aspect-video w-full items-center justify-center rounded-xl bg-neutral-900",
        className,
      )}
      aria-hidden
    >
      <div className="flex flex-col items-center gap-3 text-neutral-500">
        <div
          className="h-14 w-14 rounded-full border-2 border-neutral-600 border-t-transparent animate-spin"
          aria-hidden
        />
        <span className="text-sm font-medium">Loading player…</span>
      </div>
    </div>
  );
}
