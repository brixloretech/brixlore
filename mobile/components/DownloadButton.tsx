/**
 * DownloadButton
 *
 * Shows one of four states:
 *  ① Checking   — spinner
 *  ② Not downloaded — "Download" button (accent fill)
 *  ③ Downloading — progress bar + cancel button
 *  ④ Downloaded  — "Downloaded ✓" badge + delete option
 *
 * Usage:
 *   <DownloadButton
 *     contentId={episode.id}
 *     hlsUrl={streamUrl}
 *     title={episode.title}
 *     thumbnailUrl={episode.thumbnailUrl}
 *   />
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDownload } from "../hooks/useDownload";
import { colors } from "../src/theme/colors";
import { spacing, typography, borderRadius } from "../constants/theme";

interface DownloadButtonProps {
  contentId: string;
  hlsUrl: string;
  title: string;
  thumbnailUrl?: string;
  compact?: boolean;
  iconOnly?: boolean;
}

export function DownloadButton({
  contentId,
  hlsUrl,
  title,
  thumbnailUrl,
  compact = false,
  iconOnly = false,
}: DownloadButtonProps) {
  const { isChecking, isDownloaded, progress, download, remove } =
    useDownload(contentId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isDownloading =
    progress?.status === "downloading" || progress?.status === "queued";

  const handleCancel = () => {
    Alert.alert("Cancel download", `Stop downloading "${title}"?`, [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel download",
        style: "destructive",
        onPress: async () => {
          const { cancelDownload } = (
            await import("../store/useDownloadStore")
          ).useDownloadStore.getState();
          cancelDownload(contentId);
        },
      },
    ]);
  };

  const handleDownload = async () => {
    try {
      await download(hlsUrl, title, thumbnailUrl);
    } catch (err: any) {
      Alert.alert("Download failed", err?.message ?? "Unknown error");
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete download", `Remove "${title}" from downloads?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => remove(),
      },
    ]);
  };

  // ── Checking ────────────────────────────────────────────────────────────────
  if (isChecking) {
    return (
      <View
        style={[
          styles.base,
          compact && styles.compact,
          iconOnly && styles.iconButton,
        ]}
      >
        <ActivityIndicator
          size="small"
          color={iconOnly ? colors.textPrimary : colors.accent}
        />
        {!compact && !iconOnly && <Text style={styles.label}>Checking…</Text>}
      </View>
    );
  }

  // ── Downloaded ───────────────────────────────────────────────────────────────
  if (isDownloaded) {
    return (
      <TouchableOpacity
        style={[
          styles.base,
          styles.downloadedRow,
          compact && styles.compact,
          iconOnly && styles.iconButton,
        ]}
        onPress={handleDelete}
        activeOpacity={0.7}
      >
        <Ionicons
          name={iconOnly ? "checkmark" : "checkmark-circle"}
          size={compact || iconOnly ? 20 : 18}
          color={iconOnly ? colors.textPrimary : colors.success}
        />
        {!compact && !iconOnly && (
          <>
            <Text style={[styles.label, { color: colors.success }]}>
              Downloaded
            </Text>
            <Ionicons
              name="trash-outline"
              size={14}
              color={colors.error}
              style={{ marginLeft: 6 }}
            />
          </>
        )}
      </TouchableOpacity>
    );
  }

  // ── Downloading / Queued ─────────────────────────────────────────────────────
  if (isDownloading && progress) {
    const pct = Math.round(progress.progress);
    const isQueued = progress.status === "queued";

    if (iconOnly) {
      return (
        <TouchableOpacity
          style={[styles.base, styles.iconButton]}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <ActivityIndicator size="small" color={colors.textPrimary} />
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.downloadingWrapper, compact && styles.compact]}>
        {!compact && (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.pctText}>
              {isQueued ? "Queued" : `${pct}%`}
            </Text>
          </View>
        )}
        {compact && (
          <Text style={styles.pctTextCompact}>
            {isQueued ? "Q" : `${pct}%`}
          </Text>
        )}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close-circle"
            size={compact ? 18 : 20}
            color={colors.error}
          />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Not downloaded ───────────────────────────────────────────────────────────
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles.downloadBtn,
        compact && styles.compact,
        iconOnly && styles.iconButton,
      ]}
      onPress={handleDownload}
      activeOpacity={0.7}
    >
      <Ionicons
        name="download-sharp"
        size={compact || iconOnly ? 20 : 18}
        color={iconOnly ? colors.textPrimary : colors.background}
      />
      {!compact && !iconOnly && (
        <Text style={styles.downloadLabel}>Download</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minHeight: 40,
  },
  compact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 32,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
  },
  downloadBtn: {
    backgroundColor: colors.accent,
  },
  downloadedRow: {
    backgroundColor: "rgba(34,197,94,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
  },
  label: {
    ...typography.captionBold,
    color: colors.textPrimary,
  },
  downloadLabel: {
    ...typography.captionBold,
    color: colors.background,
  },
  downloadingWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  progressRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
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
    minWidth: 40,
    textAlign: "right",
  },
  pctTextCompact: {
    ...typography.small,
    color: colors.textSecondary,
    minWidth: 28,
    textAlign: "center",
  },
  cancelBtn: {
    padding: spacing.xs,
  },
});
