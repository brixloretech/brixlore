import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors as themeColors } from "../src/theme/colors";
import { borderRadius, spacing, typography } from "../constants/theme";
import { type VideoCardItem } from "../components/LargeVideoCard";
import { SmallVideoCard } from "../components/SmallVideoCard";
import { useMatomo } from "../hooks/useMatomo";
import {
  contentService,
  type ContentSummaryDto,
} from "../services/contentService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = Math.min(500, Math.max(430, SCREEN_WIDTH * 1.08));
const HERO_SIDE_PADDING = spacing.md;
const HERO_ITEM_WIDTH = SCREEN_WIDTH - HERO_SIDE_PADDING * 2;
const HERO_PAGE_WIDTH = SCREEN_WIDTH;

type HomeSection = {
  id: string;
  title: string;
  subtitle?: string;
  items: VideoCardItem[];
};

function formatSubtitle(item: ContentSummaryDto): string | undefined {
  const parts: string[] = [];
  if (item.releaseYear) parts.push(String(item.releaseYear));
  if (item.ageRating) parts.push(item.ageRating);
  const subtitle = parts.join(" • ");
  return subtitle.length > 0 ? subtitle : undefined;
}

function toVideoCardItem(item: ContentSummaryDto): VideoCardItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: formatSubtitle(item),
    thumbnailUri: item.posterUrl ?? item.thumbnailUrl ?? undefined,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const { trackEvent } = useMatomo();

  const [heroItems, setHeroItems] = useState<ContentSummaryDto[]>([]);
  const [contentItems, setContentItems] = useState<ContentSummaryDto[]>([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const heroListRef = useRef<FlatList<ContentSummaryDto>>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  const loadContent = useCallback(async () => {
    try {
      setIsLoading(true);
      // Content should render independently of optional account/subscription
      // requests. Keep the first screen responsive on slow mobile networks.
      const allContent = await Promise.race([
        contentService.getContentForBrowse(),
        new Promise<ContentSummaryDto[]>((resolve) =>
          setTimeout(() => resolve([]), 8000),
        ),
      ]);

      setContentItems(allContent);
      setHeroItems(allContent.slice(0, 3));

      // Subscription state is loaded separately and must not block the home UI.

      const nextSections: HomeSection[] = [];
      const trendingNow = allContent.slice(0, 10).map(toVideoCardItem);
      const editorPicks = allContent.slice(4, 14).map(toVideoCardItem);
      const newReleases = allContent.slice(8, 18).map(toVideoCardItem);

      if (trendingNow.length > 0) {
        nextSections.push({
          id: "trending-now",
          title: "Trending Now",

          items: trendingNow,
        });
      }
      if (editorPicks.length > 0) {
        nextSections.push({
          id: "editors-picks",
          title: "Editor's Picks",

          items: editorPicks,
        });
      }
      if (newReleases.length > 0) {
        nextSections.push({
          id: "new-releases",
          title: "New Releases",

          items: newReleases,
        });
      }

      setSections(nextSections);
    } catch (error) {
      console.error("Failed to load home content:", error);
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
      contentItems
        .map((item) => item.category?.trim())
        .filter(
          (value): value is string =>
            Boolean(value) && value!.toLowerCase() !== "all",
        ),
    );
    return ["All", ...Array.from(values).sort()];
  }, [contentItems]);

  const visibleHeroItems = heroItems.filter(
    (item) =>
      selectedCategory === "All" ||
      item.category?.toLowerCase() === selectedCategory.toLowerCase(),
  );

  useEffect(() => {
    if (visibleHeroItems.length <= 1) return;

    autoScrollRef.current = setInterval(() => {
      setActiveHeroIndex((prev) => {
        const next = (prev + 1) % visibleHeroItems.length;
        heroListRef.current?.scrollToOffset({
          offset: next * HERO_PAGE_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 4500);

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [visibleHeroItems.length, selectedCategory]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadContent().finally(() => {
      setIsRefreshing(false);
    });
  }, [loadContent]);

  const selectCategory = useCallback((category: string) => {
    setSelectedCategory(category);
    setActiveHeroIndex(0);
    requestAnimationFrame(() => {
      heroListRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, []);

  const handleItemPress = useCallback(
    (id: string, episodeId?: string, title?: string) => {
      trackEvent('Video', 'card_click', title);
      const params = episodeId ? `?episodeId=${episodeId}` : "";
      router.push(`/video/${id}${params}`);
    },
    [router, trackEvent],
  );

  const renderSection = (section: HomeSection) => {
    if (section.items.length === 0) return null;

    return (
      <View style={styles.editorialRail} key={section.id}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.editorialHeading}>

            <View>
              <Text style={styles.eyebrow}>{section.id === "trending-now" ? "New on Brixlore" : section.id === "editors-picks" ? "The culture edit" : "Late-night signal"}</Text>
              <Text style={styles.sectionTitle}>{section.id === "trending-now" ? "Fresh stories, still warm." : section.id === "editors-picks" ? "Work that stays with you." : "Press play after dark."}</Text>
            </View>
          </View>
          <View style={styles.sectionHeaderAside}>
            <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>

          </View>
        </View>
        <FlatList
          data={section.items}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SmallVideoCard
              item={item}
              onPress={() => handleItemPress(item.id, undefined, item.title)}
            />
          )}
          contentContainerStyle={styles.horizontalList}
        />
      </View>
    );
  };

  if (isLoading) {
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.accent}
          />
        }
      >
        {heroItems.length > 0 ? (
          <>
            <View>
              <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRail}
              >
              {categories.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => selectCategory(category)}
                  style={[
                    styles.categoryTab,
                    selectedCategory === category && styles.categoryTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category && styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
              </ScrollView>
            </View>
            <View style={styles.heroWrap}>
              {/* <View style={styles.heroIntro}>
                <View>
                  <Text style={styles.heroEyebrow}>Brixlore selection</Text>
                  <Text style={styles.heroHeading}>Find your next story.</Text>
                </View>
                <Ionicons name="sparkles" size={18} color="rgba(255,255,255,0.62)" />
              </View> */}
            <FlatList
              ref={heroListRef}
              data={visibleHeroItems}
              horizontal
              pagingEnabled
              snapToInterval={HERO_PAGE_WIDTH}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              getItemLayout={(_, index) => ({
                length: HERO_PAGE_WIDTH,
                offset: HERO_PAGE_WIDTH * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / HERO_PAGE_WIDTH,
                );
                setActiveHeroIndex(index);
              }}
              renderItem={({ item }) => {
                const imageUrl = item.bannerUrl ?? item.posterUrl ?? item.thumbnailUrl;
                const metadata = formatSubtitle(item);

                return (
                  <View style={styles.heroItemContainer}>
                    <Pressable
                      style={styles.heroCard}
                      onPress={() => handleItemPress(item.id, undefined, item.title)}
                    >
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.heroImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={["#090909", "#151515", "#030303"]}
                        style={styles.heroImage}
                      />
                    )}
                    <LinearGradient
                      colors={["rgba(3,3,3,0.04)", "rgba(3,3,3,0.20)", "rgba(3,3,3,0.72)", "#030303"]}
                      locations={[0, 0.35, 0.70, 1]}
                      style={styles.heroGradient}
                    />
                    <View style={styles.heroContent}>
                      <View style={styles.heroMetaRow}>
                        <Text style={styles.heroBadge}>Featured {item.type === "SERIES" ? "series" : "film"}</Text>
                        {metadata ? <Text style={styles.heroMeta}>{metadata}</Text> : null}
                      </View>
                      <Text style={styles.heroTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.heroDescription} numberOfLines={2}>
                        Discover {item.title}, now streaming as part of the Brixlore collection.
                      </Text>
                      <View style={styles.heroButtonRow}>
                        <View style={styles.heroPlayButton}>
                          <Ionicons name="play" size={15} color="#030303" />
                          <Text style={styles.heroPlayText}>Play now</Text>
                        </View>
                        <View style={styles.heroInfoButton}>
                          <Ionicons name="information-outline" size={16} color={themeColors.textPrimary} />
                          <Text style={styles.heroInfoText}>Details</Text>
                        </View>
                      </View>
                    </View>
                    </Pressable>
                  </View>
                );
              }}
            />
            </View>

            {/* {visibleHeroItems.length > 1 ? (
              <View style={styles.heroDotsRow}>
                {visibleHeroItems.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.heroDot,
                      i === activeHeroIndex ? styles.heroDotActive : null,
                    ]}
                  />
                ))}
              </View>
            ) : null} */}
          </>
        ) : null}

        {/* <View style={styles.signalBand}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.signalContent}>
            <Text style={styles.signalText}>STORIES WITHOUT LIMITS</Text>
            <Text style={styles.signalMark}>✦</Text>
            <Text style={styles.signalText}>BUILT FROM CULTURE</Text>
            <Text style={styles.signalMark}>✦</Text>
            <Text style={styles.signalText}>STORIES WITHOUT LIMITS</Text>
          </ScrollView>
        </View> */}


        {sections.map((section) => renderSection(section))}

        <View style={styles.closingCta}>
          <Text style={styles.eyebrow}>Take the signal with you</Text>
          <Text style={styles.ctaTitle}>Your screen. Your pace. Your stories.</Text>
          <Text style={styles.ctaDescription}>Keep watching wherever the day takes you. Download once, watch offline, and move between devices without losing your place.</Text>
          <Pressable style={styles.ctaButton} onPress={() => router.push("/downloads")}>
            <Text style={styles.ctaButtonText}>Watch your way</Text>
            <Ionicons name="arrow-forward" size={16} color="#030303" />
          </Pressable>
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
  scroll: {
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
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    ...typography.caption,
    color: themeColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 11,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.sm,
  },
  userName: {
    ...typography.title,
    color: themeColors.textPrimary,
    fontSize: 25,
    fontWeight: "700",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
  headerUpgradeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: themeColors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: "transparent",
  },
  headerUpgradeButtonText: {
    ...typography.small,
    color: themeColors.accent,
    fontWeight: "700",
  },
  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: themeColors.surface,
  },
  heroWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  heroIntro: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  heroEyebrow: {
    ...typography.smallBold,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  heroHeading: {
    ...typography.h2,
    color: themeColors.textPrimary,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.7,
  },
  categoryRail: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  categoryTabActive: {
    borderColor: "rgba(255,255,255,0.72)",
    backgroundColor: themeColors.textPrimary,
  },
  categoryText: {
    ...typography.smallBold,
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
  },
  categoryTextActive: {
    color: themeColors.background,
  },
  heroItemContainer: {
    width: HERO_ITEM_WIDTH,
    marginHorizontal: HERO_SIDE_PADDING,
  },
  heroCard: {
    width: "100%",
    height: HERO_HEIGHT,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "#111114",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: "rgba(5,5,7,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroBadge: {
    ...typography.smallBold,
    color: themeColors.primary,
    // backgroundColor: themeColors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroMeta: {
    ...typography.smallBold,
    color: "rgba(255,255,255,0.65)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    ...typography.title,
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
  },
  heroDescription: {
    ...typography.caption,
    color: "rgba(255,255,255,0.85)",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: 21,
  },
  heroButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroPlayButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: themeColors.textPrimary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroPlayText: {
    ...typography.smallBold,
    color: themeColors.background,
  },
  heroInfoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.24)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroInfoText: {
    ...typography.smallBold,
    color: themeColors.textPrimary,
  },
  heroDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  heroDotActive: {
    width: 24,
    backgroundColor: themeColors.accent,
  },
  signalBand: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    // borderColor: "rgba(255,255,255,0.10)",
    marginBottom: spacing.lg,
    // paddingVertical: spacing.lg,
    overflow: "hidden",
    opacity: 0.42,
  },
  signalContent: {
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  signalText: {
    ...typography.h3,
    color: themeColors.textPrimary,
    fontSize: 22,
    letterSpacing: -0.5,
    textTransform: "uppercase",
  },
  signalMark: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 20,
  },
  editorialRail: {
    // borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
    paddingTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  editorialHeading: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  editorialNumber: {
    ...typography.smallBold,
    color: "rgba(255,255,255,0.30)",
    fontSize: 9,
    letterSpacing: 0.7,
    paddingTop: 3,
  },
  eyebrow: {
    ...typography.smallBold,
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  sectionTitle: {
    ...typography.h2,
    color: themeColors.textPrimary,
    fontWeight: "600",
    fontSize: 24,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  sectionHeaderAside: {
    width: 78,
    gap: 5,
  },
  sectionSubtitle: {
    ...typography.small,
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    lineHeight: 13,
  },
  sectionLink: {
    ...typography.smallBold,
    color: "rgba(255,255,255,0.70)",
    textTransform: "uppercase",
    fontSize: 9,
    letterSpacing: 0.7,
  },
  horizontalList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  closingCta: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0d0d0d",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  ctaTitle: {
    ...typography.h1,
    color: themeColors.textPrimary,
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: -1,
    marginBottom: spacing.md,
  },
  ctaDescription: {
    ...typography.caption,
    color: "rgba(255,255,255,0.52)",
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  ctaButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: themeColors.foreground,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  ctaButtonText: {
    ...typography.smallBold,
    color: themeColors.background,
  },
  snapshotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  snapshotCard: {
    flex: 1,
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: spacing.sm,
    minHeight: 90,
    justifyContent: "space-between",
  },
  snapshotLabel: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  snapshotValue: {
    ...typography.title,
    color: themeColors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 2,
  },
  snapshotSubtext: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontSize: 9,
  },
  tagsScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  tagPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  tagText: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
});
