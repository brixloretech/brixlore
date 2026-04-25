/**
 * useDownload
 *
 * Per-content hook that exposes:
 *  - isDownloaded  — file is fully present on disk
 *  - isChecking    — initial async check in progress
 *  - progress      — live DownloadProgress (status, %, segments)
 *  - download(hlsUrl, title, thumbnailUrl?) — start / queue download
 *  - remove()      — delete download
 *  - localPath     — file:// path to local m3u8 when downloaded
 */
import { useState, useEffect, useCallback } from "react";
import { useDownloadStore } from "../store/useDownloadStore";
import { downloadService } from "../services/downloadService";
import type { DownloadProgress } from "../services/downloadService";

export function useDownload(contentId: string) {
  const { startDownload, deleteDownload, _setProgress, loadDownloads } =
    useDownloadStore();

  const [isChecking, setIsChecking] = useState(true);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [localPath, setLocalPath] = useState<string | undefined>();
  const [progress, setProgress] = useState<DownloadProgress | undefined>(
    downloadService.getProgress(contentId),
  );

  // Subscribe to live progress from service
  useEffect(() => {
    const unsub = downloadService.subscribe(contentId, (p) => {
      setProgress(p);
      _setProgress(p);
      if (p.status === "completed") {
        checkStatus();
        loadDownloads();
      } else if (p.status === "cancelled" || p.status === "error") {
        setIsDownloaded(false);
        setLocalPath(undefined);
      }
    });
    return unsub;
  }, [contentId]);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const path = await downloadService.getLocalPath(contentId);
      setIsDownloaded(!!path);
      setLocalPath(path);
    } finally {
      setIsChecking(false);
    }
  }, [contentId]);

  // Initial check
  useEffect(() => {
    checkStatus();
  }, [contentId]);

  const download = useCallback(
    async (hlsUrl: string, title: string, thumbnailUrl?: string) => {
      await startDownload(contentId, hlsUrl, title, thumbnailUrl);
    },
    [contentId, startDownload],
  );

  const remove = useCallback(async () => {
    await deleteDownload(contentId);
    setIsDownloaded(false);
    setLocalPath(undefined);
    setProgress(undefined);
  }, [contentId, deleteDownload]);

  return {
    isChecking,
    isDownloaded,
    localPath,
    progress,
    download,
    remove,
    refresh: checkStatus,
  };
}
