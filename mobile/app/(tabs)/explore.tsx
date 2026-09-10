import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../../src/theme/colors";
import { borderRadius, spacing, typography } from "../../constants/theme";
import { AddToMyListButton } from "../../components/AddToMyListButton";
import { useMatomo } from "../../hooks/useMatomo";
import {
  contentService,
  type ContentSummaryDto,
} from "../../services/contentService";

const CARD_WIDTH = (Dimensions.get("window").width - spacing.lg * 2 - spacing.md) / 2;

function PosterCard({
  item,
  onPress,
}: {
  item: ContentSummaryDto;
  onPress: () => void;
}) {
  const image = item.posterUrl ?? item.thumbnailUrl;
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={onPress}
        style={({ pressed }) => [styles.posterFrame, pressed && styles.pressed]}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Ionicons
              name="film-outline"
              size={28}
              color="rgba(255,255,255,0.35)"
            />
          </View>
        )}
        <View style={styles.posterShade} />
        <View style={styles.favoriteButton}>
          <AddToMyListButton contentId={item.id} size="sm" />
        </View>
        <View style={styles.playButton}>
          <Ionicons name="play" size={16} color={themeColors.primary} />
        </View>
      </Pressable>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.cardMeta}>
        <Text style={styles.cardMetaText}>{item.releaseYear || ""}</Text>
        <View style={styles.metaDivider} />
        <Text style={styles.cardCategory} numberOfLines={1}>
          {item.category || item.type}
        </Text>
      </View>
    </View>
  );
}

function PosterSkeleton() {
  return (
    <View style={[styles.card, styles.skeletonCard]}>
      <View style={styles.posterSkeleton} />
      <View style={styles.titleSkeleton} />
      <View style={styles.metaSkeleton} />
    </View>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { trackEvent } = useMatomo();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [items, setItems] = useState<ContentSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (category) setSelectedCategory(category);
  }, [category]);

  const loadContent = useCallback(async () => {
    try {
      setIsLoading(true);
      setItems(await contentService.getContentForBrowse());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const categories = useMemo(() => {
    const values = new Set(
      items
        .map((item) => item.category?.trim())
        .filter(
          (value): value is string =>
            Boolean(value) && value.toLowerCase() !== "all",
        ),
    );
    return ["All", ...Array.from(values).sort()];
  }, [items]);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.category, item.type]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));
      const matchesCategory =
        selectedCategory === "All" ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchesQuery && matchesCategory;
    });
  }, [items, query, selectedCategory]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setSelectedCategory("All");
  }, []);
  const handleItemPress = useCallback(
    (item: ContentSummaryDto) => {
      trackEvent("Video", "card_click", item.title);
      router.push(`/video/${item.id}`);
    },
    [router, trackEvent],
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={isLoading ? [] : results}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadContent();
            }}
            tintColor={themeColors.accent}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.intro}>
              <Text style={styles.eyebrow}>Brixlore catalog</Text>
              <Text style={styles.title}>Find your next story.</Text>
              <Text style={styles.description}>
                Search the full collection, then narrow it down by the worlds
                and genres you want to watch.
              </Text>
              <Text style={styles.resultCount}>
                {isLoading
                  ? "Searching the catalog..."
                  : `${results.length} ${results.length === 1 ? "video" : "videos"} found`}
              </Text>
            </View>
            <View style={styles.searchBox}>
              <Ionicons
                name="search"
                size={19}
                color="rgba(245,247,251,0.55)"
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search for movies or TV shows"
                placeholderTextColor="rgba(245,247,251,0.38)"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")} hitSlop={10}>
                  <Ionicons
                    name="close"
                    size={18}
                    color="rgba(245,247,251,0.55)"
                  />
                </Pressable>
              )}
            </View>
            <FlatList
              horizontal
              data={categories}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedCategory(item)}
                  style={[
                    styles.chip,
                    selectedCategory === item && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === item && styles.chipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
            />
            {isLoading && (
              <View style={styles.skeletonGrid}>
                {Array.from({ length: 6 }, (_, index) => (
                  <PosterSkeleton key={index} />
                ))}
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <PosterCard item={item} onPress={() => handleItemPress(item)} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={32}
                color="rgba(255,255,255,0.45)"
              />
              <Text style={styles.emptyTitle}>
                Nothing matched your search.
              </Text>
              <Text style={styles.emptyText}>
                Try a different title, or clear your filters to see more videos.
              </Text>
              <Pressable onPress={clearFilters} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear filters</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030303" },
  content: { paddingBottom: 110 },
  intro: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  eyebrow: {
    ...typography.smallBold,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: themeColors.textPrimary,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -1,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.caption,
    color: "rgba(255,255,255,0.58)",
    lineHeight: 21,
    maxWidth: 350,
  },
  resultCount: {
    ...typography.smallBold,
    color: "rgba(255,255,255,0.45)",
    marginTop: spacing.lg,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    minHeight: 50,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  searchInput: {
    flex: 1,
    color: themeColors.textPrimary,
    ...typography.caption,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  chips: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  chipActive: { backgroundColor: themeColors.foreground },
  chipText: { ...typography.smallBold, color: "rgba(255,255,255,0.62)" },
  chipTextActive: { color: themeColors.muted },
  columnWrapper: { paddingHorizontal: spacing.lg, gap: spacing.md },
  card: { flex: 1, minWidth: 0, marginBottom: spacing.lg },
  skeletonCard: { flexGrow: 0, flexBasis: CARD_WIDTH, width: CARD_WIDTH },
  posterFrame: {
    height: 235,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "#111",
    position: "relative",
  },
  poster: { width: "100%", height: "100%" },
  posterPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171717",
  },
  posterShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  favoriteButton: {
    position: "absolute",
    left: spacing.sm,
    bottom: spacing.sm,
  },
  playButton: {
    position: "absolute",
    right: spacing.sm,
    bottom: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeColors.foreground,
  },
  pressed: { opacity: 0.78 },
  cardTitle: {
    ...typography.smallBold,
    color: themeColors.textPrimary,
    fontSize: 13,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 5,
  },
  cardMetaText: {
    ...typography.small,
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
  },
  metaDivider: {
    width: 1,
    height: 11,
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  cardCategory: {
    ...typography.smallBold,
    color: "#ae99fa",
    fontSize: 10,
    flexShrink: 1,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  posterSkeleton: {
    width: "100%",
    height: 235,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  titleSkeleton: {
    height: 15,
    width: "72%",
    marginTop: spacing.sm,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  metaSkeleton: {
    height: 11,
    width: "45%",
    marginTop: 7,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  emptyState: {
    minHeight: 360,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
  },
  emptyTitle: {
    ...typography.h3,
    color: themeColors.textPrimary,
    fontSize: 20,
    textAlign: "center",
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.small,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  clearButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: themeColors.foreground,
  },
  clearButtonText: { ...typography.smallBold, color: themeColors.background },
});
