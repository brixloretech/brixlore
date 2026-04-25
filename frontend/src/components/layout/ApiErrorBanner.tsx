"use client";

import { useApiError } from "@/contexts";
import { Button } from "@/components/ui";

/**
 * Global API error banner. Shows user-friendly messages for 401, 403, 5xx, and network errors.
 * Renders nothing when there is no error.
 */
export function ApiErrorBanner() {
  const { error, message, dismiss } = useApiError();

  if (!error) return null;

  const isForbidden = error.status === 403;
  const isServer = error.status >= 500 || error.status === 0;

  const variantClass = isForbidden
    ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-900/80 dark:text-neutral-200"
    : isServer
      ? "bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-200"
      : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-200";

  return (
    <div
      role="alert"
      className={`flex flex-wrap items-center justify-center gap-3 px-4 py-3 text-sm ${variantClass}`}
    >
      <span className="flex-1 text-center min-w-0">{message}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={dismiss}
        className="shrink-0"
        aria-label="Dismiss"
      >
        Dismiss
      </Button>
    </div>
  );
}
