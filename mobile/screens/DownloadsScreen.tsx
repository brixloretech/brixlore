/**
 * DownloadsScreen
 *
 * Lists all locally downloaded content.
 * Each item shows:
 *  - Thumbnail (or placeholder icon)
 *  - Title
 *  - File size (human-readable)
 *  - Download date
 *  - Play button  → opens VideoPlayerScreen with local HLS path
 *  - Delete button → removes file + metadata
 *
 * Also shows active / queued downloads at the top so users can
 * cancel in-progress items.
 *
 * Requires login (wrapped in ProtectedRoute in the tab layout).
 */
import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../src/theme/colors";
import { spacing, typography, borderRadius } from "../constants/theme";
import { useDownloadStore } from "../store/useDownloadStore";
import { downloadService } from "../services/downloadService";
import type {
  DownloadMeta,
  DownloadProgress,
} from "../services/downloadService";
import { useAuthStore } from "../store/useAuthStore";

// ─────────────────────────── helpers ────────────────────────────────────────

function fmtBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function fmtDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ─────────────────────────── sub-components ─────────────────────────────────

interface ActiveItemProps {
  contentId: string;
  progress: DownloadProgress;
  title?: string;
  thumbnailUrl?: string;
  onCancel: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

function ActiveDownloadItem({
  contentId,
  progress,
  title,
  thumbnailUrl,
  onCancel,
  onPause,
  onResume,
}: ActiveItemProps) {
  const pct = Math.round(progress.progress);
  const isQueued = progress.status === "queued";
  const isPaused = progress.status === "paused";

  return (
    <View style={styles.activeItem}>
      <View style={styles.activeThumb}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.activeThumbImage}
          />
        ) : (
          <Ionicons
            name={isQueued ? "time-outline" : "cloud-download-outline"}
            size={22}
            color={colors.accent}
          />
        )}
      </View>
      <View style={styles.activeInfo}>
        <Text style={styles.activeTitle} numberOfLines={1}>
          {title ?? progress.title ?? "Downloading…"}
        </Text>
        {isQueued ? (
          <Text style={styles.activeStatus}>Waiting in queue…</Text>
        ) : (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.pctText}>{pct}%</Text>
          </View>
        )}
      </View>
      <View style={styles.activeActions}>
        {!isQueued && (
          <TouchableOpacity
            style={styles.pauseBtn}
            onPress={() =>
              isPaused ? onResume(contentId) : onPause(contentId)
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isPaused ? "play" : "pause"}
              size={20}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => onCancel(contentId)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface DownloadedItemProps {
  item: DownloadMeta;
  onPlay: (item: DownloadMeta) => void;
  onDelete: (item: DownloadMeta) => void;
}

function DownloadedItem({ item, onPlay, onDelete }: DownloadedItemProps) {
  return (
    <View style={styles.card}>
      {/* Thumbnail */}
      <View style={styles.thumbContainer}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.thumb}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="film-outline" size={28} color={colors.muted} />
          </View>
        )}
        {/* Play overlay */}
        <TouchableOpacity
          style={styles.playOverlay}
          onPress={() => onPlay(item)}
        >
          <Ionicons
            name="play-circle"
            size={40}
            color="rgba(255,255,255,0.9)"
          />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardMeta}>
          {fmtBytes(item.totalSize)} · {fmtDate(item.createdAt)}
        </Text>
        <View style={styles.cardBadge}>
          <Ionicons name="checkmark-circle" size={12} color={colors.success} />
          <Text style={styles.cardBadgeText}>Downloaded</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onPlay(item)}>
          <Ionicons name="play" size={20} color={colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onDelete(item)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────── main screen ────────────────────────────────────

export default function DownloadsScreen() {
  const router = useRouter();
  const {
    downloads,
    progress,
    isLoading,
    loadDownloads,
    cancelDownload,
    pauseDownload,
    resumeDownload,
    deleteDownload,
  } = useDownloadStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = React.useState(false);

  // Guard: must be logged in
  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user]);

  useEffect(() => {
    loadDownloads();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDownloads();
    setRefreshing(false);
  }, [loadDownloads]);

  // Separate active (downloading / queued) from completed
  const activeEntries = useMemo(
    () =>
      Object.values(progress).filter(
        (p) =>
          p.status === "downloading" ||
          p.status === "queued" ||
          p.status === "paused",
      ),
    [progress],
  );

  const handlePlay = useCallback(
    async (item: DownloadMeta) => {
      const localPath = await downloadService.getLocalPath(item.contentId);
      if (!localPath) {
        Alert.alert(
          "Not found",
          "The downloaded file could not be found. Try re-downloading.",
        );
        return;
      }
      router.push({
        pathname: "/video-player",
        params: {
          videoUrl: localPath,
          videoId: item.contentId,
          title: item.title,
          isOffline: "1",
        },
      });
    },
    [router],
  );

  const handleDelete = useCallback(
    (item: DownloadMeta) => {
      Alert.alert("Delete download", `Remove "${item.title}" from device?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteDownload(item.contentId),
        },
      ]);
    },
    [deleteDownload],
  );

  const handleCancel = useCallback(
    (contentId: string) => {
      Alert.alert("Cancel download?", undefined, [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel download",
          style: "destructive",
          onPress: () => cancelDownload(contentId),
        },
      ]);
    },
    [cancelDownload],
  );

  const handlePause = useCallback(
    (contentId: string) => {
      pauseDownload(contentId);
    },
    [pauseDownload],
  );

  const handleResume = useCallback(
    (contentId: string) => {
      resumeDownload(contentId);
    },
    [resumeDownload],
  );

  // ── render ─────────────────────────────────────────────────────────────────

  const isEmpty = downloads.length === 0 && activeEntries.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Downloads</Text>
        <View style={{ width: 40 }} />
      </View>

      {isEmpty ? (
        /* ── Empty state ── */
        <View style={styles.emptyContainer}>
          <Ionicons
            name="cloud-download-outline"
            size={72}
            color={colors.muted}
          />
          <Text style={styles.emptyTitle}>No downloads yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the Download button on any video to save it for offline viewing.
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.contentId}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListHeaderComponent={
            activeEntries.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Downloading</Text>
                {activeEntries.map((p) => {
                  const meta = downloads.find(
                    (d) => d.contentId === p.contentId,
                  );
                  return (
                    <ActiveDownloadItem
                      key={p.contentId}
                      contentId={p.contentId}
                      progress={p}
                      title={meta?.title ?? p.title}
                      thumbnailUrl={meta?.thumbnailUrl ?? p.thumbnailUrl}
                      onCancel={handleCancel}
                      onPause={handlePause}
                      onResume={handleResume}
                    />
                  );
                })}
                {downloads.length > 0 && (
                  <Text
                    style={[styles.sectionTitle, { marginTop: spacing.lg }]}
                  >
                    Downloaded
                  </Text>
                )}
              </View>
            ) : downloads.length > 0 ? (
              <Text style={[styles.sectionTitle, styles.sectionTitlePad]}>
                Downloaded
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <DownloadedItem
              item={item}
              onPlay={handlePlay}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────── styles ─────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
    width: 40,
  },
  headerTitle: {
    ...typography.title,
    color: colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },

  // ── Empty ──
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // ── Sections ──
  listContent: {
    paddingBottom: spacing.xxl,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.captionBold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitlePad: {
    paddingHorizontal: spacing.md,
  },

  // ── Active download item ──
  activeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  activeThumb: {
    width: 48,
    height: 32,
    borderRadius: borderRadius.xs,
    backgroundColor: "rgba(229,231,235,0.08)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  activeThumbImage: {
    width: "100%",
    height: "100%",
  },
  activeInfo: {
    flex: 1,
    gap: 4,
  },
  activeTitle: {
    ...typography.captionBold,
    color: colors.textPrimary,
  },
  activeStatus: {
    ...typography.small,
    color: colors.textSecondary,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  pctText: {
    ...typography.small,
    color: colors.textSecondary,
    minWidth: 36,
    textAlign: "right",
  },
  cancelBtn: {
    padding: spacing.xs,
  },
  pauseBtn: {
    padding: spacing.xs,
  },
  activeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  // ── Downloaded card ──
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  thumbContainer: {
    width: 110,
    height: 72,
    position: "relative",
  },
  thumb: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.card,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardInfo: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: "center",
    gap: 3,
  },
  cardTitle: {
    ...typography.captionBold,
    color: colors.textPrimary,
  },
  cardMeta: {
    ...typography.small,
    color: colors.textSecondary,
  },
  cardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  cardBadgeText: {
    ...typography.small,
    color: colors.success,
  },
  cardActions: {
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  actionBtn: {
    padding: spacing.xs,
  },
});
