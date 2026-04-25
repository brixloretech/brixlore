/**
 * Convert duration string (MM:SS or HH:MM:SS) to ISO 8601 (e.g. PT12M34S).
 * Used for schema.org VideoObject.
 */
export function durationToIso8601(duration: string): string {
  const parts = duration.trim().split(":").map(Number);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    const segs: string[] = [];
    if (h > 0) segs.push(`${h}H`);
    if (m > 0) segs.push(`${m}M`);
    segs.push(`${s}S`);
    return `PT${segs.join("")}`;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return `PT${m}M${s}S`;
  }
  return "PT0S";
}

/**
 * Format duration string (e.g. "1:22:10") for display.
 * Supports HH:MM:SS and MM:SS.
 */
export function formatDuration(duration: string): string {
  const parts = duration.trim().split(":").map(Number);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return `${m}m ${s}s`;
  }
  return duration;
}

/**
 * Parse duration string (MM:SS or HH:MM:SS) to total seconds.
 */
export function durationToSeconds(duration: string | undefined): number {
  if (!duration?.trim()) return 0;
  const parts = duration.trim().split(":").map(Number);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return (m || 0) * 60 + (s || 0);
  }
  return 0;
}

/**
 * Whether the video is considered long-form (e.g. 1+ hour).
 */
export function isLongForm(video: { duration?: string }): boolean {
  if (!video.duration) return false;
  const parts = video.duration.trim().split(":").map(Number);
  if (parts.length === 3) return parts[0] >= 1;
  return false;
}

/**
 * Format publishedAt (ISO date) for display.
 */
export function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}
