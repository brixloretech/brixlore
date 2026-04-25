import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors as themeColors } from "../../src/theme/colors";
import {
  spacing,
  typography,
  borderRadius,
  shadows,
} from "../../constants/theme";
import { useMyList } from "../../contexts/MyListContext";
import {
  contentService,
  type ContentSummaryDto,
} from "../../services/contentService";
import { AddToMyListButton } from "../../components/AddToMyListButton";

const CARD_ASPECT = 16 / 9;

function formatSubtitle(item: ContentSummaryDto): string | undefined {
  const parts: string[] = [];
  if (item.releaseYear) parts.push(String(item.releaseYear));
  if (item.ageRating) parts.push(item.ageRating);
  const subtitle = parts.join(" • ");
  return subtitle.length > 0 ? subtitle : undefined;
}

export default function MyListScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { listIds, remove, refresh: refreshList } = useMyList();
  const [savedItems, setSavedItems] = useState<ContentSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const columns = useMemo(() => {
    if (screenWidth >= 900) return 4;
    if (screenWidth >= 700) return 3;
    if (screenWidth >= 480) return 2;
    return 1;
  }, [screenWidth]);
  const isCompact = screenWidth < 360;
  const cardWidth = useMemo(() => {
    const horizontalPadding = spacing.lg * 2;
    const totalGutter = spacing.md * (columns - 1);
    const available = Math.max(
      0,
      screenWidth - horizontalPadding - totalGutter,
    );
    return columns > 0 ? available / columns : screenWidth;
  }, [columns, screenWidth]);
  const cardHeight = cardWidth / CARD_ASPECT;

  const loadMyList = useCallback(async () => {
    try {
      setIsLoading(true);

      if (listIds.length === 0) {
        setSavedItems([]);
        return;
      }

      // Fetch all content and filter by saved IDs
      const allContent = await contentService.getContentForBrowse();
      const byId = new Map(allContent.map((c) => [c.id, c]));
      const items = listIds
        .map((id) => byId.get(id))
        .filter((c): c is ContentSummaryDto => c != null);

      setSavedItems(items);
    } catch (error) {
      console.error("Failed to load my list:", error);
      setSavedItems([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [listIds]);

  useEffect(() => {
    loadMyList();
  }, [loadMyList]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshList();
    await loadMyList();
  }, [refreshList, loadMyList]);

  const handleItemPress = useCallback(
    (id: string) => {
      router.push(`/video/${id}`);
    },
    [router],
  );

  const handleRemove = useCallback(
    async (id: string) => {
      await remove(id);
      // List will update automatically via useEffect
    },
    [remove],
  );

  const renderItem = ({ item }: { item: ContentSummaryDto }) => {
    const subtitle = formatSubtitle(item);

    return (
      <View style={[styles.card, { width: cardWidth }]}>
        <Pressable
          style={[styles.cardImageContainer, { height: cardHeight }]}
          onPress={() => handleItemPress(item.id)}
        >
          {item.thumbnailUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={["#1e1b4b", "#312e81", "#4c1d95"]}
              style={styles.cardImage}
            />
          )}
          <View style={styles.cardOverlay}>
            <Pressable
              style={styles.playButton}
              onPress={() => handleItemPress(item.id)}
            >
              <Ionicons name="play" size={20} color={themeColors.textPrimary} />
            </Pressable>
          </View>
          <View style={styles.addButtonContainer}>
            <AddToMyListButton contentId={item.id} size="sm" />
          </View>
        </Pressable>

        <View
          style={[styles.cardContent, isCompact && styles.cardContentCompact]}
        >
          <Text
            style={[styles.cardTitle, isCompact && styles.cardTitleCompact]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.cardSubtitle,
                isCompact && styles.cardSubtitleCompact,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
          <View
            style={[styles.cardActions, isCompact && styles.cardActionsCompact]}
          >
            <Pressable
              style={[
                styles.playActionButton,
                isCompact && styles.playActionButtonCompact,
              ]}
              onPress={() => handleItemPress(item.id)}
            >
              <Ionicons
                name="play"
                size={isCompact ? 14 : 16}
                color={themeColors.background}
              />
              <Text
                style={[
                  styles.playActionText,
                  isCompact && styles.actionTextCompact,
                ]}
              >
                Play
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.removeButton,
                isCompact && styles.removeButtonCompact,
              ]}
              onPress={() => handleRemove(item.id)}
            >
              <Ionicons
                name="trash-outline"
                size={isCompact ? 14 : 16}
                color={themeColors.textSecondary}
              />
              <Text
                style={[
                  styles.removeText,
                  isCompact && styles.actionTextCompact,
                ]}
              >
                Remove
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accent} />
          <Text style={styles.loadingText}>Loading your list...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>My List</Text>
            <Text style={styles.headerTitle}>Saved for the perfect moment</Text>
            <Text style={styles.headerSubtitle}>
              Titles you plan to watch next, synced across every device.
            </Text>
          </View>
        </View>

        {/* Saved Titles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved titles</Text>
            {savedItems.length > 0 && (
              <Pressable onPress={() => router.push("/(tabs)/explore")}>
                <Text style={styles.addMoreText}>Add more</Text>
              </Pressable>
            )}
          </View>

          {savedItems.length > 0 ? (
            <FlatList
              data={savedItems}
              key={`grid-${columns}`}
              numColumns={columns}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={columns > 1 ? styles.row : undefined}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCard}>
                <Ionicons
                  name="bookmark-outline"
                  size={48}
                  color={themeColors.muted}
                />
                <Text style={styles.emptyTitle}>Your list is empty</Text>
                <Text style={styles.emptyText}>
                  Discover new titles in Explore, or use the + icon on any video
                  to add it here.
                </Text>
                <Pressable
                  style={styles.exploreButton}
                  onPress={() => router.push("/(tabs)/explore")}
                >
                  <Text style={styles.exploreButtonText}>Explore now</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* CTA Section */}
          {savedItems.length > 0 && (
            <View style={styles.ctaCard}>
              <Text style={styles.ctaTitle}>Keep saving favorites</Text>
              <Text style={styles.ctaText}>
                Discover new titles in Explore, or use the + icon on any video
                to add it here.
              </Text>
              <Pressable
                style={styles.ctaButton}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <Text style={styles.ctaButtonText}>Explore now</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
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
    marginTop: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: themeColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 28,
    fontWeight: "700",
    color: themeColors.textPrimary,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    ...typography.body,
    fontSize: 14,
    color: themeColors.textSecondary,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    flexWrap: "wrap",
    rowGap: spacing.xs,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 18,
    fontWeight: "600",
    color: themeColors.textPrimary,
  },
  addMoreText: {
    ...typography.body,
    fontSize: 12,
    color: themeColors.accent,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.lg,
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  cardImageContainer: {
    width: "100%",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonContainer: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardContentCompact: {
    padding: spacing.sm,
  },
  cardTitle: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: themeColors.textSecondary,
    marginBottom: spacing.sm,
  },
  cardTitleCompact: {
    fontSize: 13,
  },
  cardSubtitleCompact: {
    fontSize: 11,
  },
  cardActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  cardActionsCompact: {
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  playActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeColors.textPrimary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  playActionButtonCompact: {
    paddingHorizontal: spacing.xs,
  },
  playActionText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: themeColors.background,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: themeColors.border,
    gap: spacing.xs,
  },
  removeButtonCompact: {
    paddingHorizontal: spacing.xs,
  },
  removeText: {
    ...typography.caption,
    fontSize: 12,
    color: themeColors.textSecondary,
  },
  actionTextCompact: {
    fontSize: 11,
  },
  emptyContainer: {
    marginTop: spacing.lg,
  },
  emptyCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderStyle: "dashed",
    backgroundColor: themeColors.surface,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 18,
    fontWeight: "600",
    color: themeColors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
  ctaCard: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderStyle: "dashed",
    backgroundColor: themeColors.surface,
    padding: spacing.lg,
    alignItems: "center",
  },
  ctaTitle: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.textPrimary,
    marginBottom: spacing.xs,
  },
  ctaText: {
    ...typography.caption,
    fontSize: 12,
    color: themeColors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  ctaButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  ctaButtonText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.textPrimary,
  },
});
