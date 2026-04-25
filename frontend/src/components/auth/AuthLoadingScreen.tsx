"use client";

import { Loader } from "@/components/ui";

type AuthLoadingScreenProps = {
  /** Shown to screen readers and as context for the loading state */
  label?: string;
};

/**
 * Full-screen loading state shown while auth is being resolved (e.g. fetching /me).
 * Used by ProtectedRoute and AdminProtectedRoute so behavior is consistent.
 */
export function AuthLoadingScreen({
  label = "Checking authentication",
}: AuthLoadingScreenProps) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader size="lg" label={label} />
      <span className="text-sm text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
    </div>
  );
}
