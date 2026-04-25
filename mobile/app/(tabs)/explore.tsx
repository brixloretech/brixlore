import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors as themeColors } from "../../src/theme/colors";
import { spacing, typography, borderRadius } from "../../constants/theme";
import { BrowseCard, type BrowseItem } from "../../components/BrowseCard";
import {
  contentService,
  type ContentSummaryDto,
  type ContentType,
} from "../../services/contentService";

type BrowseRow = {
  id: string;
  title: string;
  subtitle?: string;
  items: BrowseItem[];
  accent?: "amber" | "violet" | "cyan" | "rose";
};

const CONTENT_TYPE_ORDER: ContentType[] = [
  "MOVIE",
  "SERIES",
  "DOCUMENTARY",
  "ANIMATION",
  "TRAILER",
  "SHORT",
];

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  MOVIE: "Movies",
  SERIES: "Series",
  DOCUMENTARY: "Documentaries",
  ANIMATION: "Animation",
  TRAILER: "Trailers",
  SHORT: "Shorts",
};

const ACCENTS: BrowseRow["accent"][] = ["amber", "violet", "cyan", "rose"];

function formatSubtitle(item: ContentSummaryDto): string | undefined {
  const parts: string[] = [];
  if (item.releaseYear) parts.push(String(item.releaseYear));
  if (item.ageRating) parts.push(item.ageRating);
  const subtitle = parts.join(" • ");
  return subtitle.length > 0 ? subtitle : undefined;
}

function toBrowseItem(item: ContentSummaryDto): BrowseItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: formatSubtitle(item),
    thumbnailUrl: item.thumbnailUrl ?? null,
  };
}

function slugifyRowId(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug.length > 0 ? slug : "featured";
}

function buildRowsByType(items: ContentSummaryDto[]): BrowseRow[] {
  const grouped = new Map<ContentType, ContentSummaryDto[]>();
  for (const item of items) {
    const type = (item.type?.trim().toUpperCase() || "MOVIE") as ContentType;
    const existing = grouped.get(type);
    if (existing) existing.push(item);
    else grouped.set(type, [item]);
  }

  const rowKeys = CONTENT_TYPE_ORDER.filter((type) => grouped.has(type));

  return rowKeys
    .map((type, index) => ({
      id: slugifyRowId(CONTENT_TYPE_LABELS[type]),
      title: CONTENT_TYPE_LABELS[type],
      subtitle: `Top picks in ${CONTENT_TYPE_LABELS[type]}`,
      accent: ACCENTS[index % ACCENTS.length],
      items: (grouped.get(type) ?? []).map(toBrowseItem),
    }))
    .filter((row) => row.items.length > 0);
}

function getCategoryChips(items: ContentSummaryDto[]): string[] {
  const categoriesPresent = new Set<string>();
  for (const item of items) {
    if (item.category?.trim()) {
      const c = item.category.trim();
      if (c.toLowerCase() !== "all") categoriesPresent.add(c);
    }
  }
  const sortedCategories = Array.from(categoriesPresent).sort();
  return ["All", ...sortedCategories];
}

function AccentTag({
  accent,
  text,
}: {
  accent: BrowseRow["accent"];
  text: string;
}) {
  return (
    <View style={styles.accentTag}>
      <Text style={styles.accentTagText}>{text}</Text>
    </View>
  );
}

function BrowseRowSection({
  row,
  onItemPress,
}: {
  row: BrowseRow;
  onItemPress: (id: string) => void;
}) {
  return (
    <View style={styles.rowSection}>
      <View style={styles.rowHeader}>
        <View style={styles.rowTitleContainer}>
          <View style={styles.rowTitleRow}>
            <Text style={styles.rowTitle}>{row.title}</Text>
            {row.accent && <AccentTag accent={row.accent} text="Curated" />}
          </View>
          {row.subtitle && (
            <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
          )}
        </View>
      </View>
      <FlatList
        data={row.items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <BrowseCard
            item={item}
            index={index}
            onPress={() => onItemPress(item.id)}
          />
        )}
        contentContainerStyle={styles.rowContent}
      />
    </View>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allContent, setAllContent] = useState<ContentSummaryDto[]>([]);

  const loadContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await contentService.getContentForBrowse();
      setAllContent(items);

      // Get categories
      const categoryChips = getCategoryChips(items);
      setCategories(categoryChips.length > 0 ? categoryChips : ["All"]);
    } catch (error) {
      console.error("Failed to load content:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadContent();
  }, [loadContent]);

  const handleItemPress = useCallback(
    (id: string) => {
      router.push(`/video/${id}`);
    },
    [router],
  );

  const handleCategoryPress = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const filteredContent = useMemo(() => {
    let filteredItems = allContent;

    if (selectedCategory && selectedCategory.trim().toLowerCase() !== "all") {
      const categoryFilter = selectedCategory.trim().toLowerCase();
      filteredItems = filteredItems.filter(
        (item) => item.category?.trim().toLowerCase() === categoryFilter,
      );
    }

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filteredItems = filteredItems.filter((item) =>
        item.title.toLowerCase().includes(query),
      );
    }

    return filteredItems;
  }, [allContent, selectedCategory, searchQuery]);

  const newestItems = useMemo(
    () => filteredContent.slice(0, 3).map(toBrowseItem),
    [filteredContent],
  );

  const rows = useMemo(
    () => buildRowsByType(filteredContent),
    [filteredContent],
  );

  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory("All");
    }
  }, [categories, selectedCategory]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient
        colors={["rgba(139, 92, 246, 0.1)", "transparent"]}
        style={styles.headerGradient}
      />
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
          <Text style={styles.headerLabel}>Browse</Text>
          <Text style={styles.headerTitle}>Find your next obsession</Text>
          <Text style={styles.headerSubtitle}>
            Curated drops, bingeable series, and midnight movie runs. Pick a row
            and hit play.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={themeColors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search content..."
            placeholderTextColor={themeColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={themeColors.textSecondary}
              />
            </Pressable>
          )}
        </View>

        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {categories.map((category, index) => (
            <Pressable
              key={`category-${category}-${index}`}
              style={[
                styles.chip,
                selectedCategory === category && styles.chipActive,
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategory === category && styles.chipTextActive,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.accent} />
          </View>
        ) : (
          <>
            {/* Banner Carousel - Newest Items */}
            {newestItems.length > 0 && (
              <View style={styles.bannerSection}>
                <Text style={styles.sectionTitle}>New Releases</Text>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bannerContainer}
                >
                  {newestItems.map((item, index) => (
                    <BrowseCard
                      key={item.id}
                      item={item}
                      index={index}
                      onPress={() => handleItemPress(item.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Browse Rows */}
            {rows.length > 0 ? (
              <View style={styles.rowsContainer}>
                {rows.map((row) => (
                  <BrowseRowSection
                    key={row.id}
                    row={row}
                    onItemPress={handleItemPress}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="film-outline"
                  size={48}
                  color={themeColors.muted}
                />
                <Text style={styles.emptyText}>No content available</Text>
                <Text style={styles.emptySubtext}>
                  Check back soon for new releases
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerLabel: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: themeColors.textPrimary,
    paddingVertical: spacing.md,
  },
  clearButton: {
    padding: spacing.xs,
  },
  chipsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: themeColors.accent,
    borderColor: themeColors.accent,
  },
  chipText: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  chipTextActive: {
    color: themeColors.background,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  bannerSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 20,
    fontWeight: "600",
    color: themeColors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  bannerContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowsContainer: {
    marginTop: spacing.md,
  },
  rowSection: {
    marginBottom: spacing.xl,
  },
  rowHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  rowTitleContainer: {
    flex: 1,
  },
  rowTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  rowTitle: {
    ...typography.title,
    fontSize: 20,
    fontWeight: "600",
    color: themeColors.textPrimary,
  },
  rowSubtitle: {
    ...typography.body,
    fontSize: 13,
    color: themeColors.textSecondary,
  },
  rowContent: {
    paddingHorizontal: spacing.lg,
  },
  accentTag: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  accentTagText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: "600",
    color: themeColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    ...typography.title,
    fontSize: 18,
    fontWeight: "600",
    color: themeColors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    fontSize: 14,
    color: themeColors.textSecondary,
    textAlign: "center",
  },
});
