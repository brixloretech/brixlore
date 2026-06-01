/**
 * Matomo HTTP Tracking API client for React Native.
 *
 * Uses the Matomo Tracking HTTP API directly since window._paq is unavailable
 * in React Native. All calls are fire-and-forget — failures are silently
 * discarded so analytics never crash the app.
 *
 * Optional env overrides (falls back to the production Brixlore instance):
 *   EXPO_PUBLIC_MATOMO_URL      Base URL, no trailing slash
 *   EXPO_PUBLIC_MATOMO_SITE_ID  Numeric site ID string
 */

const BASE_URL =
  process.env.EXPO_PUBLIC_MATOMO_URL ?? 'https://brixloretv.matomo.cloud';

const SITE_ID = process.env.EXPO_PUBLIC_MATOMO_SITE_ID ?? '1';

const ENDPOINT = `${BASE_URL}/matomo.php`;

class MatomoService {
  private buildUrl(extraParams: Record<string, string>): string {
    const params = new URLSearchParams({
      idsite: SITE_ID,
      rec: '1',
      apiv: '1',
      send_image: '0',
      // Cache-buster — prevents CDN / proxy caching of the tracking request
      rand: String(Math.floor(Math.random() * 1_000_000_000)),
      ...extraParams,
    });
    return `${ENDPOINT}?${params.toString()}`;
  }

  /**
   * Track a custom event.
   *
   * Matches the Matomo event taxonomy used by the web app:
   *   category / action / name? / value?
   *
   * Examples:
   *   trackEvent('Video', 'play', 'My Show — Episode 1')
   *   trackEvent('Ad', 'ad_impression', 'adbutler-slot-123')
   *   trackEvent('Download', 'download_start', 'Movie Title')
   */
  trackEvent(
    category: string,
    action: string,
    name?: string,
    value?: number,
  ): void {
    const params: Record<string, string> = {
      e_c: category,
      e_a: action,
    };
    if (name !== undefined) params.e_n = name;
    if (value !== undefined) params.e_v = String(value);

    fetch(this.buildUrl(params), { method: 'GET' }).catch(() => {
      // Intentionally empty — analytics must never interrupt app flow
    });
  }

  /**
   * Track a screen / page view.
   */
  trackPageView(title?: string): void {
    const params: Record<string, string> = {};
    if (title) params.action_name = title;

    fetch(this.buildUrl(params), { method: 'GET' }).catch(() => {});
  }
}

/** Singleton — safe to import anywhere without a React component. */
export const matomoService = new MatomoService();
