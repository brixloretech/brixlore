"use client";

import { useCallback } from "react";

/**
 * Lightweight Matomo event tracking hook.
 * Pushes to window._paq which is initialised by the Matomo script in layout.tsx.
 * All calls are no-ops on SSR or when the queue is not yet initialised.
 */
export function useMatomo() {
  /**
   * Track a custom event.
   * Maps to Matomo's trackEvent(category, action, name?, value?).
   */
  const trackEvent = useCallback(
    (
      category: string,
      action: string,
      name?: string,
      value?: number,
    ): void => {
      if (typeof window === "undefined") return;
      const paq = window._paq;
      if (!Array.isArray(paq)) return;
      const payload: Array<string | number | undefined> = [
        "trackEvent",
        category,
        action,
      ];
      if (name !== undefined) payload.push(name);
      if (value !== undefined) payload.push(value);
      paq.push(payload as string[]);
    },
    [],
  );

  /**
   * Track a page view.
   * Useful for SPA route changes that don't trigger a full page reload.
   */
  const trackPageView = useCallback((title?: string): void => {
    if (typeof window === "undefined") return;
    const paq = window._paq;
    if (!Array.isArray(paq)) return;
    if (title) paq.push(["setDocumentTitle", title]);
    paq.push(["trackPageView"]);
  }, []);

  return { trackEvent, trackPageView };
}
