import { create } from "zustand";
import { useEffect } from "react";
import {
  downloadService,
  DownloadProgress,
  DownloadMeta,
} from "../services/downloadService";

interface DownloadStoreState {
  /** Snapshot of all persisted download metadata */
  downloads: DownloadMeta[];
  /** Live progress for active / recent downloads */
  progress: Record<string, DownloadProgress>;
  isLoading: boolean;
  error: string | null;
}

interface DownloadStoreActions {
  /** Load all persisted metadata from AsyncStorage */
  loadDownloads: () => Promise<void>;
  /** Start (or queue) an HLS download */
  startDownload: (
    contentId: string,
    hlsUrl: string,
    title: string,
    thumbnailUrl?: string,
  ) => Promise<void>;
  /** Cancel an in-progress or queued download */
  cancelDownload: (contentId: string) => Promise<void>;
  /** Pause an in-progress download */
  pauseDownload: (contentId: string) => Promise<void>;
  /** Resume a paused download */
  resumeDownload: (contentId: string) => Promise<void>;
  /** Delete a completed download (file + metadata) */
  deleteDownload: (contentId: string) => Promise<void>;
  /** Called internally when progress changes */
  _setProgress: (p: DownloadProgress) => void;
  /** Check if fully downloaded */
  isDownloaded: (contentId: string) => boolean;
  getProgress: (contentId: string) => DownloadProgress | undefined;
}

export const useDownloadStore = create<
  DownloadStoreState & DownloadStoreActions
>((set, get) => ({
  downloads: [],
  progress: {},
  isLoading: false,
  error: null,

  loadDownloads: async () => {
    set({ isLoading: true, error: null });
    try {
      await downloadService.pruneOrphaned();
      const downloads = await downloadService.getAllMeta();
      set({ downloads, isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message ?? "Failed to load downloads",
      });
    }
  },

  startDownload: async (contentId, hlsUrl, title, thumbnailUrl) => {
    set({ error: null });
    try {
      // Subscribe to progress BEFORE starting so we don't miss early events
      downloadService.subscribe(contentId, (p) => {
        get()._setProgress(p);
        // When completed → refresh metadata list
        if (p.status === "completed") {
          get().loadDownloads();
        }
      });
      await downloadService.startDownload(
        contentId,
        hlsUrl,
        title,
        thumbnailUrl,
      );
      await get().loadDownloads();
    } catch (err: any) {
      set({ error: err?.message ?? "Failed to start download" });
      throw err;
    }
  },

  cancelDownload: async (contentId) => {
    await downloadService.cancelDownload(contentId);
    set((s) => {
      const progress = { ...s.progress };
      delete progress[contentId];
      return { progress };
    });
  },

  pauseDownload: async (contentId) => {
    await downloadService.pauseDownload(contentId);
  },

  resumeDownload: async (contentId) => {
    await downloadService.resumeDownload(contentId);
  },

  deleteDownload: async (contentId) => {
    await downloadService.deleteDownload(contentId);
    set((s) => {
      const progress = { ...s.progress };
      delete progress[contentId];
      return {
        progress,
        downloads: s.downloads.filter((d) => d.contentId !== contentId),
      };
    });
  },

  _setProgress: (p) => {
    set((s) => ({ progress: { ...s.progress, [p.contentId]: p } }));
  },

  isDownloaded: (contentId) => {
    return get().downloads.some((d) => d.contentId === contentId);
  },

  getProgress: (contentId) => {
    return get().progress[contentId];
  },
}));

/**
 * Convenience hook: automatically loads downloads on mount and wires up
 * live progress for a specific contentId.
 */
export function useDownloadEntry(contentId: string) {
  const { loadDownloads, _setProgress, downloads, progress } =
    useDownloadStore();

  useEffect(() => {
    // Subscribe to live progress from service
    const unsub = downloadService.subscribe(contentId, _setProgress);
    return unsub;
  }, [contentId, _setProgress]);

  useEffect(() => {
    loadDownloads();
  }, []);

  const meta = downloads.find((d) => d.contentId === contentId);
  const liveProgress = progress[contentId];

  return { meta, liveProgress, isDownloaded: !!meta };
}
