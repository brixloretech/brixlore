import { useCallback } from 'react';
import { matomoService } from '../src/services/matomoService';

/**
 * Lightweight Matomo analytics hook for React Native.
 *
 * Mirrors the web `useMatomo` hook API so tracking call-sites look identical
 * on both platforms. Instead of pushing to window._paq, calls are sent
 * directly to the Matomo HTTP Tracking API via matomoService.
 *
 * All returned functions are stable (useCallback with empty deps) — safe to
 * call inside useEventListener and other event handlers without stale-closure
 * concerns.
 */
export function useMatomo() {
  const trackEvent = useCallback(
    (
      category: string,
      action: string,
      name?: string,
      value?: number,
    ): void => {
      matomoService.trackEvent(category, action, name, value);
    },
    [],
  );

  const trackPageView = useCallback((title?: string): void => {
    matomoService.trackPageView(title);
  }, []);

  return { trackEvent, trackPageView };
}
