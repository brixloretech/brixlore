"use client";

import { cn } from "@/lib/utils";

/**
 * Skeleton for video cards. Used as Suspense fallback or while grid loads.
 */
export function VideoCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900",
        className,
      )}
    >
      <div className="relative aspect-video w-full animate-pulse bg-neutral-200 dark:bg-neutral-800" />
      <div className="space-y-2 p-3 sm:p-4">
        <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
  );
}
