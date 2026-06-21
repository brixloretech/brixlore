import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors as themeColors } from "../src/theme/colors";
import { borderRadius, spacing, typography, shadows } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";
import {
  streamingService,
  type ContinueWatchingItemDto,
} from "../services/streamingService";

const { width: screenWidth } = Dimensions.get("window");
const CARD_ASPECT = 16 / 9;

export default function WatchHistoryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [historyItems, setHistoryItems] = useState<ContinueWatchingItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadWatchHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setHistoryItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const list = await streamingService.getWatchHistory();
      setHistoryItems(list);
    } catch (error) {
      console.error("Failed to load watch history:", error);
      setHistoryItems([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadWatchHistory();
  }, [loadWatchHistory]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadWatchHistory();
  }, [loadWatchHistory]);

  const handleItemPress = useCallback(
    (id: string, episodeId?: string) => {
      const params = episodeId ? `?episodeId=${episodeId}` : "";
      router.push(`/video/${id}${params}`);
    },
    [router],
  );

  const handleRemove = useCallback(
    async (episodeId: string) => {
      try {
        await streamingService.removeFromContinueWatching(episodeId);
        // Refresh lists local state
        setHistoryItems((prev) => prev.filter((item) => item.episodeId !== episodeId));
      } catch (error) {
        console.error("Failed to remove from watch history:", error);
      }
    },
    [],
  );

  const progressPercent = (progress: number, duration: number): number => {
    if (duration <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((progress / duration) * 100)));
  };

  const renderItem = ({ item }: { item: ContinueWatchingItemDto }) => {
    const percent = progressPercent(item.progress, item.duration);
    const sub = item.episodeTitle !== item.contentTitle ? item.episodeTitle : item.type;

    return (
      <View style={styles.card}>
        <Pressable
          style={styles.cardImageContainer}
          onPress={() => handleItemPress(item.contentId, item.episodeId)}
        >
          {item.thumbnailUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cardImage, styles.placeholder]}>
              <Ionicons name="film-outline" size={32} color={themeColors.muted} />
            </View>
          )}
          <View style={styles.cardOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={20} color={themeColors.textPrimary} />
            </View>
          </View>
        </Pressable>

        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.contentTitle}
            </Text>
            {sub ? (
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {sub}
              </Text>
            ) : null}
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarActive, { width: `${percent}%` }]} />
          </View>

          <View style={styles.cardActions}>
            <Pressable
              style={styles.resumeButton}
              onPress={() => handleItemPress(item.contentId, item.episodeId)}
            >
              <Ionicons name="play" size={14} color={themeColors.background} />
              <Text style={styles.resumeButtonText}>Resume</Text>
            </Pressable>
            <Pressable
              style={styles.removeButton}
              onPress={() => handleRemove(item.episodeId)}
            >
              <Ionicons name="trash-outline" size={14} color={themeColors.textSecondary} />
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Watch History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={historyItems}
        keyExtractor={(item) => `${item.contentId}-${item.episodeId}`}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.accent}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={48} color={themeColors.muted} />
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptyText}>
              Keep watching content to keep track of your watch history here.
            </Text>
            <Pressable
              style={styles.exploreButton}
              onPress={() => router.push("/(tabs)/explore")}
            >
              <Text style={styles.exploreButtonText}>Explore content</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.title,
    color: themeColors.textPrimary,
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: themeColors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    flexDirection: "row",
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: spacing.sm,
    marginBottom: spacing.md,
    height: 110,
    ...shadows.card,
  },
  cardImageContainer: {
    width: 140,
    height: "100%",
    borderRadius: borderRadius.md,
    overflow: "hidden",
    position: "relative",
    backgroundColor: themeColors.card,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeColors.card,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: "space-between",
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    ...typography.body,
    fontWeight: "600",
    color: themeColors.textPrimary,
    fontSize: 14,
  },
  cardSubtitle: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    width: "100%",
    marginVertical: spacing.xs,
  },
  progressBarActive: {
    height: "100%",
    backgroundColor: themeColors.accent,
    borderRadius: 2,
  },
  cardActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  resumeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.textPrimary,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  resumeButtonText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: themeColors.background,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  removeButtonText: {
    ...typography.caption,
    fontSize: 11,
    color: themeColors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 18,
    fontWeight: "600",
    color: themeColors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    fontSize: 14,
    color: themeColors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  exploreButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  exploreButtonText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.textPrimary,
  },
});
