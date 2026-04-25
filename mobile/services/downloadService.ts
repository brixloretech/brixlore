/**
 * HLS Download Service
 *
 * Downloads HLS streams (index.m3u8 + all .ts segments) into app-private storage.
 *
 * Storage layout:
 *   FileSystem.documentDirectory/downloads/<uuid>/
 *     index.m3u8        (rewritten to reference local segment filenames)
 *     seg_0001.ts
 *     seg_0002.ts
 *     ...
 *     _meta.json        (title, contentId, hlsUrl, createdAt, totalSize)
 *
 * Protection:
 *  - App-private document directory — NOT in gallery / public storage
 *  - Folder name is a UUID (obfuscated)
 *  - Auth required to start a download (caller must provide the HLS URL)
 *
 * Concurrency: max 2 simultaneous active downloads; rest are queued.
 */

import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  updateDownloadNotification,
  clearDownloadNotification,
} from "./downloadNotifications";

/** UUID-v4-like generator that only uses built-ins — avoids Metro/ESM issues with uuid v13 */
function generateId(): string {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${s4()}${s4()}-${s4()}-4${s4().slice(1)}-${((Math.random() * 4) | 8).toString(16)}${s4().slice(1)}-${s4()}${s4()}${s4()}`;
}

// expo-file-system v19 changed the export shape; support both
const docDir: string =
  (FileSystem as any).documentDirectory ??
  (FileSystem as any).FileSystem?.documentDirectory ??
  "";

// ─── Types ───────────────────────────────────────────────────────────────────

export type DownloadStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "completed"
  | "error"
  | "cancelled";

export interface DownloadProgress {
  contentId: string;
  status: DownloadStatus;
  /** 0‒100 */
  progress: number;
  segmentsTotal: number;
  segmentsDone: number;
  title?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface DownloadMeta {
  contentId: string;
  /** UUID folder name inside downloads/ */
  folderName: string;
  title: string;
  /** Original HLS URL used to download */
  hlsUrl: string;
  createdAt: number;
  /** Total size of all downloaded segments in bytes */
  totalSize: number;
  thumbnailUrl?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DOWNLOADS_ROOT = `${docDir}downloads/`;
const META_STORE_KEY = "@downloads_meta_v2";
const MAX_CONCURRENT = 2;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Resolve a possibly-relative segment URL against the .m3u8 base URL. */
function resolveSegmentUrl(segmentLine: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(segmentLine)) return segmentLine;
  const base = baseUrl.substring(0, baseUrl.lastIndexOf("/") + 1);
  return `${base}${segmentLine}`;
}

/** Parse .m3u8 text and extract all .ts (or segment) URIs in order. */
function parseM3U8Segments(m3u8Text: string): string[] {
  const lines = m3u8Text.split("\n").map((l) => l.trim());
  const segments: string[] = [];
  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    segments.push(line);
  }
  return segments;
}

/** Rewrite the m3u8 so all segment lines reference local filenames. */
function rewriteM3U8ForLocal(
  m3u8Text: string,
  segmentMap: Record<string, string>,
): string {
  return m3u8Text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;
      return segmentMap[trimmed] ?? line;
    })
    .join("\n");
}

// ─── Persistent meta storage ─────────────────────────────────────────────────

async function loadAllMeta(): Promise<DownloadMeta[]> {
  try {
    const raw = await AsyncStorage.getItem(META_STORE_KEY);
    return raw ? (JSON.parse(raw) as DownloadMeta[]) : [];
  } catch {
    return [];
  }
}

async function saveAllMeta(list: DownloadMeta[]): Promise<void> {
  await AsyncStorage.setItem(META_STORE_KEY, JSON.stringify(list));
}

async function upsertMeta(meta: DownloadMeta): Promise<void> {
  const all = await loadAllMeta();
  const idx = all.findIndex((m) => m.contentId === meta.contentId);
  if (idx >= 0) all[idx] = meta;
  else all.push(meta);
  await saveAllMeta(all);
}

async function removeMeta(contentId: string): Promise<void> {
  const all = await loadAllMeta();
  await saveAllMeta(all.filter((m) => m.contentId !== contentId));
}

// ─── DownloadService ──────────────────────────────────────────────────────────

class DownloadService {
  /** contentId → live progress for in-flight downloads */
  private liveProgress = new Map<string, DownloadProgress>();
  /** contentId → abort flag */
  private cancelFlags = new Map<string, boolean>();
  /** contentId → paused flag */
  private pauseFlags = new Map<string, boolean>();
  /** progress listeners */
  private listeners = new Map<string, Set<(p: DownloadProgress) => void>>();
  /** queue of pending contentIds */
  private queue: string[] = [];
  /** number of active downloads right now */
  private activeCount = 0;
  /** queued start params keyed by contentId */
  private pendingParams = new Map<
    string,
    { hlsUrl: string; title: string; thumbnailUrl?: string; folderName: string }
  >();
  /** Timestamp of last notification interaction (to prevent background audio from triggering) */
  private lastNotificationActionTime = 0;

  // ── Listener API ────────────────────────────────────────────────────────────

  subscribe(contentId: string, cb: (p: DownloadProgress) => void): () => void {
    if (!this.listeners.has(contentId))
      this.listeners.set(contentId, new Set());
    this.listeners.get(contentId)!.add(cb);
    // immediately emit current state if we have one
    const current = this.liveProgress.get(contentId);
    if (current) cb(current);
    return () => this.listeners.get(contentId)?.delete(cb);
  }

  private emit(progress: DownloadProgress) {
    this.liveProgress.set(progress.contentId, progress);
    this.listeners.get(progress.contentId)?.forEach((cb) => cb(progress));

    if (
      progress.status === "completed" ||
      progress.status === "cancelled" ||
      progress.status === "error"
    ) {
      void clearDownloadNotification(progress.contentId);
      return;
    }

    void updateDownloadNotification(progress);
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  getProgress(contentId: string): DownloadProgress | undefined {
    return this.liveProgress.get(contentId);
  }

  async getAllMeta(): Promise<DownloadMeta[]> {
    return loadAllMeta();
  }

  async getMeta(contentId: string): Promise<DownloadMeta | undefined> {
    const all = await loadAllMeta();
    return all.find((m) => m.contentId === contentId);
  }

  /** Returns local m3u8 path if fully downloaded, otherwise undefined. */
  async getLocalPath(contentId: string): Promise<string | undefined> {
    const meta = await this.getMeta(contentId);
    if (!meta) return undefined;
    const m3u8Path = `${DOWNLOADS_ROOT}${meta.folderName}/index.m3u8`;
    const info = await FileSystem.getInfoAsync(m3u8Path);
    return info.exists ? m3u8Path : undefined;
  }

  /** True only if the download folder + m3u8 exist on disk. */
  async isDownloaded(contentId: string): Promise<boolean> {
    return !!(await this.getLocalPath(contentId));
  }

  /**
   * Mark that a notification action was just performed.
   * This prevents background audio from starting for a brief period.
   */
  markNotificationAction(): void {
    this.lastNotificationActionTime = Date.now();
  }

  /**
   * Check if we're in the cooldown period after a notification action.
   * Returns true if less than 2 seconds have passed since the last notification action.
   */
  isInNotificationCooldown(): boolean {
    const timeSinceLastAction = Date.now() - this.lastNotificationActionTime;
    return timeSinceLastAction < 2000; // 2 second cooldown
  }

  /**
   * Queue (or immediately start) a download.
   * @param hlsUrl   Full HLS URL: https://worker.domain/uploads/.../hls/index.m3u8
   */
  async startDownload(
    contentId: string,
    hlsUrl: string,
    title: string,
    thumbnailUrl?: string,
  ): Promise<void> {
    console.log("[Download] startDownload called:", {
      contentId,
      hlsUrl,
      title,
      thumbnailUrl,
    });

    if (this.cancelFlags.get(contentId) === false) {
      // already downloading
      console.log("[Download] Already downloading:", contentId);
      return;
    }
    if (await this.isDownloaded(contentId)) {
      console.log("[Download] Already downloaded:", contentId);
      return;
    }

    const folderName = generateId();
    this.pendingParams.set(contentId, {
      hlsUrl,
      title,
      thumbnailUrl,
      folderName,
    });
    this.cancelFlags.set(contentId, false);

    const meta: DownloadMeta = {
      contentId,
      folderName,
      title,
      hlsUrl,
      createdAt: Date.now(),
      totalSize: 0,
      thumbnailUrl,
    };
    await upsertMeta(meta);

    if (this.activeCount >= MAX_CONCURRENT) {
      console.log("[Download] Queueing (max concurrent reached):", {
        contentId,
        activeCount: this.activeCount,
      });
      this.queue.push(contentId);
      this.emit({
        contentId,
        status: "queued",
        progress: 0,
        segmentsTotal: 0,
        segmentsDone: 0,
        title,
        thumbnailUrl,
      });
      return;
    }

    console.log("[Download] Starting download:", contentId);
    this._runDownload(contentId, hlsUrl, title, thumbnailUrl, folderName);
  }

  async pauseDownload(contentId: string): Promise<void> {
    const current = this.liveProgress.get(contentId);
    const params = this.pendingParams.get(contentId);
    this.pauseFlags.set(contentId, true);
    this.cancelFlags.set(contentId, true);
    this.queue = this.queue.filter((id) => id !== contentId);
    this.emit({
      contentId,
      status: "paused",
      progress: current?.progress ?? 0,
      segmentsTotal: current?.segmentsTotal ?? 0,
      segmentsDone: current?.segmentsDone ?? 0,
      title: params?.title ?? current?.title,
      thumbnailUrl: params?.thumbnailUrl ?? current?.thumbnailUrl,
    });
  }

  async resumeDownload(contentId: string): Promise<void> {
    const meta = await this.getMeta(contentId);
    const params =
      this.pendingParams.get(contentId) ??
      (meta
        ? {
            hlsUrl: meta.hlsUrl,
            title: meta.title,
            thumbnailUrl: meta.thumbnailUrl,
            folderName: meta.folderName,
          }
        : undefined);

    if (!params) return;
    if (this.cancelFlags.get(contentId) === false) return;

    this.pendingParams.set(contentId, params);
    this.cancelFlags.set(contentId, false);
    this.pauseFlags.delete(contentId);

    if (this.activeCount >= MAX_CONCURRENT) {
      this.queue.push(contentId);
      this.emit({
        contentId,
        status: "queued",
        progress: 0,
        segmentsTotal: 0,
        segmentsDone: 0,
        title: params.title,
        thumbnailUrl: params.thumbnailUrl,
      });
      return;
    }

    this._runDownload(
      contentId,
      params.hlsUrl,
      params.title,
      params.thumbnailUrl,
      params.folderName,
    );
  }

  async cancelDownload(contentId: string): Promise<void> {
    const params = this.pendingParams.get(contentId);
    this.cancelFlags.set(contentId, true);
    // remove from queue if it hasn't started yet
    this.queue = this.queue.filter((id) => id !== contentId);
    this.pendingParams.delete(contentId);
    this.pauseFlags.delete(contentId);
    this.emit({
      contentId,
      status: "cancelled",
      progress: 0,
      segmentsTotal: 0,
      segmentsDone: 0,
      title: params?.title,
      thumbnailUrl: params?.thumbnailUrl,
    });
    // clean up any partial folder
    await this._cleanupFolder(contentId).catch(() => {});
    await removeMeta(contentId).catch(() => {});
  }

  async deleteDownload(contentId: string): Promise<void> {
    await this.cancelDownload(contentId);
    await this._cleanupFolder(contentId).catch(() => {});
    await removeMeta(contentId);
    this.liveProgress.delete(contentId);
    this.listeners.delete(contentId);
  }

  // ── Core download loop ──────────────────────────────────────────────────────

  private async _runDownload(
    contentId: string,
    hlsUrl: string,
    title: string,
    thumbnailUrl?: string,
    folderName?: string,
  ): Promise<void> {
    const resolvedFolderName = folderName ?? generateId();
    console.log("[Download._runDownload] Starting:", {
      contentId,
      hlsUrl,
      folderPath: `${DOWNLOADS_ROOT}${resolvedFolderName}/`,
    });

    this.activeCount++;
    const folderPath = `${DOWNLOADS_ROOT}${resolvedFolderName}/`;

    this.emit({
      contentId,
      status: "downloading",
      progress: 0,
      segmentsTotal: 0,
      segmentsDone: 0,
      title,
      thumbnailUrl,
    });

    let wasPaused = false;

    try {
      // --- 1. Ensure root downloads directory ---
      const rootInfo = await FileSystem.getInfoAsync(DOWNLOADS_ROOT);
      if (!rootInfo.exists) {
        await FileSystem.makeDirectoryAsync(DOWNLOADS_ROOT, {
          intermediates: true,
        });
      }
      await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });

      // --- 2. Fetch the .m3u8 playlist ---
      if (this.cancelFlags.get(contentId)) {
        throw new Error(
          this.pauseFlags.get(contentId) ? "paused" : "cancelled",
        );
      }
      const m3u8Response = await FileSystem.downloadAsync(
        hlsUrl,
        `${folderPath}_raw_index.m3u8`,
      );
      if (m3u8Response.status !== 200) {
        throw new Error(
          `Failed to fetch playlist: HTTP ${m3u8Response.status}`,
        );
      }
      const m3u8Text = await FileSystem.readAsStringAsync(m3u8Response.uri);

      // --- 3. Parse segments ---
      const segmentRelUrls = parseM3U8Segments(m3u8Text);
      if (segmentRelUrls.length === 0) {
        throw new Error("No segments found in .m3u8 playlist");
      }
      const totalSegments = segmentRelUrls.length;

      this.emit({
        contentId,
        status: "downloading",
        progress: 0,
        segmentsTotal: totalSegments,
        segmentsDone: 0,
        title,
        thumbnailUrl,
      });

      // --- 4. Download each segment ---
      const segmentMap: Record<string, string> = {}; // relUrl → local filename
      let totalSize = 0;
      let segmentsDone = 0;

      for (let i = 0; i < totalSegments; i++) {
        if (this.cancelFlags.get(contentId)) {
          throw new Error(
            this.pauseFlags.get(contentId) ? "paused" : "cancelled",
          );
        }

        const relUrl = segmentRelUrls[i];
        const absUrl = resolveSegmentUrl(relUrl, hlsUrl);
        const localFilename = `seg_${String(i + 1).padStart(4, "0")}.ts`;
        const localPath = `${folderPath}${localFilename}`;

        const existingInfo = await FileSystem.getInfoAsync(localPath);
        if (existingInfo.exists) {
          segmentMap[relUrl] = localFilename;
          segmentsDone += 1;
          totalSize += (existingInfo as any).size ?? 0;
          this.emit({
            contentId,
            status: "downloading",
            progress: Math.round((segmentsDone / totalSegments) * 99),
            segmentsTotal: totalSegments,
            segmentsDone,
            title,
            thumbnailUrl,
          });
          continue;
        }

        const segResult = await FileSystem.downloadAsync(absUrl, localPath);
        if (segResult.status !== 200) {
          throw new Error(`Segment ${i + 1} failed: HTTP ${segResult.status}`);
        }

        // accumulate size
        try {
          const fi = await FileSystem.getInfoAsync(localPath);
          if (fi.exists) totalSize += (fi as any).size ?? 0;
        } catch {
          /* ignore */
        }

        segmentMap[relUrl] = localFilename;

        segmentsDone += 1;
        this.emit({
          contentId,
          status: "downloading",
          progress: Math.round((segmentsDone / totalSegments) * 99), // keep 100 for final write
          segmentsTotal: totalSegments,
          segmentsDone,
          title,
          thumbnailUrl,
        });
      }

      // --- 5. Rewrite m3u8 with local paths and save ---
      if (this.cancelFlags.get(contentId)) {
        throw new Error(
          this.pauseFlags.get(contentId) ? "paused" : "cancelled",
        );
      }
      const localM3u8 = rewriteM3U8ForLocal(m3u8Text, segmentMap);
      const finalM3u8Path = `${folderPath}index.m3u8`;
      await FileSystem.writeAsStringAsync(finalM3u8Path, localM3u8);

      // Remove the raw temporary playlist
      await FileSystem.deleteAsync(`${folderPath}_raw_index.m3u8`, {
        idempotent: true,
      });

      // --- 6. Persist metadata ---
      const meta: DownloadMeta = {
        contentId,
        folderName: resolvedFolderName,
        title,
        hlsUrl,
        createdAt: Date.now(),
        totalSize,
        thumbnailUrl,
      };
      await upsertMeta(meta);

      this.emit({
        contentId,
        status: "completed",
        progress: 100,
        segmentsTotal: totalSegments,
        segmentsDone: totalSegments,
        title,
        thumbnailUrl,
      });
    } catch (err: any) {
      const isPaused =
        err?.message === "paused" || this.pauseFlags.get(contentId);
      const isCancelled =
        err?.message === "cancelled" || this.cancelFlags.get(contentId);
      if (!isPaused && !isCancelled) {
        console.error("[Download._runDownload] Error:", err);
      }
      if (isPaused) {
        wasPaused = true;
      }
      if (!isCancelled && !isPaused) {
        // Clean up partial download
        console.log(
          "[Download._runDownload] Cleaning up folder due to error:",
          folderPath,
        );
        await FileSystem.deleteAsync(folderPath, { idempotent: true }).catch(
          () => {},
        );
      }
      const current = this.liveProgress.get(contentId);
      this.emit({
        contentId,
        status: isPaused ? "paused" : isCancelled ? "cancelled" : "error",
        progress: isPaused ? (current?.progress ?? 0) : 0,
        segmentsTotal: isPaused ? (current?.segmentsTotal ?? 0) : 0,
        segmentsDone: isPaused ? (current?.segmentsDone ?? 0) : 0,
        title,
        thumbnailUrl,
        error:
          isPaused || isCancelled
            ? undefined
            : (err?.message ?? "Download failed"),
      });
    } finally {
      console.log("[Download._runDownload] Finishing:", {
        contentId,
        activeCount: this.activeCount - 1,
      });
      this.activeCount--;
      this.cancelFlags.delete(contentId);
      if (!wasPaused) {
        this.pendingParams.delete(contentId);
        this.pauseFlags.delete(contentId);
      }
      // start next queued item
      this._drainQueue();
    }
  }

  private _drainQueue() {
    if (this.queue.length === 0 || this.activeCount >= MAX_CONCURRENT) return;
    const next = this.queue.shift()!;
    const params = this.pendingParams.get(next);
    if (params) {
      this._runDownload(
        next,
        params.hlsUrl,
        params.title,
        params.thumbnailUrl,
        params.folderName,
      );
    }
  }

  private async _cleanupFolder(contentId: string): Promise<void> {
    const meta = await this.getMeta(contentId);
    if (!meta) return;
    const folderPath = `${DOWNLOADS_ROOT}${meta.folderName}/`;
    await FileSystem.deleteAsync(folderPath, { idempotent: true });
  }

  // ── Housekeeping ─────────────────────────────────────────────────────────────

  /** Remove downloads whose folders no longer exist on disk (e.g. app reinstall). */
  async pruneOrphaned(): Promise<void> {
    const all = await loadAllMeta();
    const valid: DownloadMeta[] = [];
    for (const m of all) {
      const path = `${DOWNLOADS_ROOT}${m.folderName}/index.m3u8`;
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) valid.push(m);
    }
    await saveAllMeta(valid);
  }

  /** Check if there are any active downloads in progress */
  hasActiveDownloads(): boolean {
    return (
      this.activeCount > 0 ||
      Array.from(this.liveProgress.values()).some(
        (p) =>
          p.status === "downloading" ||
          p.status === "queued" ||
          p.status === "paused",
      )
    );
  }
}

export const downloadService = new DownloadService();
