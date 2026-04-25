import { useCallback, useEffect, useMemo, useState } from "react";
import type { VideoCardItem } from "../components";
import {
  streamingService,
  type ContinueWatchingItemDto,
} from "../services/streamingService";
import { useAuthStore } from "../store/useAuthStore";

export type ContinueWatchingCardItem = VideoCardItem & {
  contentId: string;
  episodeId: string;
  progressSeconds: number;
  durationSeconds: number;
  progressPercent: number;
};

function toProgressPercent(progress: number, duration: number): number {
  if (duration <= 0) return 0;
  const raw = Math.round((progress / duration) * 100);
  return Math.max(0, Math.min(100, raw));
}

function toSubtitle(item: ContinueWatchingItemDto): string | undefined {
  if (item.episodeTitle && item.episodeTitle !== item.contentTitle) {
    return item.episodeTitle;
  }
  if (item.type) return item.type;
  return undefined;
}

export function useContinueWatching() {
  const { isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<ContinueWatchingCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContinueWatching = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const list = await streamingService.getContinueWatching();
      const mapped = list.map((item) => ({
        id: item.contentId,
        contentId: item.contentId,
        episodeId: item.episodeId,
        title: item.contentTitle,
        subtitle: toSubtitle(item),
        thumbnailUri: item.thumbnailUrl ?? undefined,
        progressSeconds: item.progress,
        durationSeconds: item.duration,
        progressPercent: toProgressPercent(item.progress, item.duration),
      }));
      setItems(mapped);
    } catch (error) {
      console.error("Failed to load continue watching:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }
    fetchContinueWatching();
  }, [fetchContinueWatching, isAuthenticated]);

  return useMemo(
    () => ({ items, loading, refresh: fetchContinueWatching }),
    [items, loading, fetchContinueWatching],
  );
}
