/**
 * SEO config and helpers for the streaming platform.
 * Used by Next.js metadata API and JSON-LD.
 */

export const SITE_NAME = "Brixlore.TV";
/** Full branding with .TV suffix (e.g. footer, hero). */
export const SITE_BRAND = "Brixlore.TV";
export const LOGO_HEIGHT = 80;
export const LOGO_WIDTH = 140;
export const SITE_TAGLINE =
  "Brixlore | Media On Our Terms";
export const SITE_DESCRIPTION =
  "Where urban media unfolds. Stream original content, cinema, real-time news, and raw culture.";
export const SITE_KEYWORDS = [
  "Urban",
  "culture",
  "streaming",
  "network",
  "storytelling",
  "series",
];

import { getAppUrl } from "@/lib/env";

/** Base URL for canonical links and Open Graph. Set NEXT_PUBLIC_APP_URL in production. */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return getAppUrl();
}

/** Absolute URL for a path (canonical, og:url). */
export function absoluteUrl(path: string): string {
  const base = getBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
