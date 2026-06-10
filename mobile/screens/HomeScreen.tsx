import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { borderRadius, shadows, spacing, typography } from "../constants/theme";
import {
  LargeVideoCard,
  type VideoCardItem,
} from "../components/LargeVideoCard";
import { SmallVideoCard } from "../components/SmallVideoCard";
import { useMatomo } from "../hooks/useMatomo";
import {
  contentService,
  type ContentSummaryDto,
} from "../services/contentService";
import { subscriptionService } from "../services/subscriptionService";
import { useAuthStore } from "../store/useAuthStore";
import { useSubscriptionStore } from "../store/useSubscriptionStore";
import { useMyList } from "../contexts/MyListContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = Math.min(290, SCREEN_WIDTH * 0.58);
const HERO_CARD_WIDTH = SCREEN_WIDTH - spacing.md * 2;
const HERO_ITEM_WIDTH = SCREEN_WIDTH;

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
  const { user, isAuthenticated } = useAuthStore();
  const { subscription, fetchSubscription } = useSubscriptionStore();
  const { listIds, refresh: refreshList } = useMyList();
  const isFreeTier = !subscription?.isSubscribed;

  const [heroItems, setHeroItems] = useState<VideoCardItem[]>([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Snapshot and categories states
  const [contentCount, setContentCount] = useState<number>(0);
  const [categoriesCount, setCategoriesCount] = useState<number>(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [planName, setPlanName] = useState<string | null>(null);
  const [allContentItems, setAllContentItems] = useState<ContentSummaryDto[]>([]);

  const heroListRef = useRef<FlatList<VideoCardItem>>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
    }
  }, [fetchSubscription, isAuthenticated]);

  const savedItems = useMemo(() => {
    const byId = new Map(allContentItems.map((c) => [c.id, c]));
    return listIds
      .map((id) => byId.get(id))
      .filter((c): c is ContentSummaryDto => c != null)
      .map(toVideoCardItem);
  }, [allContentItems, listIds]);

  const loadContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allContent, cats] = await Promise.all([
        contentService.getContentForBrowse(),
        contentService.getCategories(),
      ]);

      setAllContentItems(allContent);
      setHeroItems(allContent.slice(0, 3).map(toVideoCardItem));
      setContentCount(allContent.length);

      const filteredCats = cats.filter((c) => c.toLowerCase() !== "all");
      setCategoriesCount(filteredCats.length);
      setCategories(filteredCats);

      if (isAuthenticated) {
        try {
          const [plans, sub] = await Promise.all([
            subscriptionService.getPlans(),
            subscriptionService.getSubscription(),
          ]);
          const match = plans.find((p) => p.id === sub.planId);
          setPlanName(match?.name ?? (sub.isSubscribed ? "Active" : "Free"));
        } catch {
          setPlanName("Free");
        }
      } else {
        setPlanName(null);
      }

      const nextSections: HomeSection[] = [];
      const trendingNow = allContent.slice(0, 10).map(toVideoCardItem);
      const editorPicks = allContent.slice(4, 14).map(toVideoCardItem);
      const newReleases = allContent.slice(8, 18).map(toVideoCardItem);

      if (trendingNow.length > 0) {
        nextSections.push({
          id: "trending-now",
          title: "Trending Now",
          subtitle: "Most watched this week",
          items: trendingNow,
        });
      }
      if (editorPicks.length > 0) {
        nextSections.push({
          id: "editors-picks",
          title: "Editor's Picks",
          subtitle: "Curated for quality",
          items: editorPicks,
        });
      }
      if (newReleases.length > 0) {
        nextSections.push({
          id: "new-releases",
          title: "New Releases",
          subtitle: "Freshly added titles",
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
  }, [isAuthenticated]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    if (heroItems.length <= 1) return;

    autoScrollRef.current = setInterval(() => {
      setActiveHeroIndex((prev) => {
        const next = (prev + 1) % heroItems.length;
        heroListRef.current?.scrollToOffset({
          offset: next * HERO_ITEM_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 4500);

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [heroItems.length]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    Promise.all([
      loadContent(),
      refreshList(),
    ]).finally(() => {
      setIsRefreshing(false);
    });
  }, [loadContent, refreshList]);

  const handleItemPress = useCallback(
    (id: string, episodeId?: string, title?: string) => {
      trackEvent('Video', 'card_click', title);
      const params = episodeId ? `?episodeId=${episodeId}` : "";
      router.push(`/video/${id}${params}`);
    },
    [router, trackEvent],
  );

  const userName = useMemo(() => {
    return user?.name || user?.email?.split("@")[0] || "Viewer";
  }, [user]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const renderSection = (section: HomeSection) => {
    if (section.items.length === 0) return null;

    return (
      <View style={styles.section} key={section.id}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.subtitle ? (
              <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
            ) : null}
          </View>
          <Pressable onPress={() => router.push("/(tabs)/explore")}>
            <Text style={styles.sectionLink}>See all</Text>
          </Pressable>
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
          <Text style={styles.loadingText}>Loading home...</Text>
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
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text
              style={styles.userName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {userName}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {isAuthenticated && isFreeTier ? (
              <Pressable
                style={styles.headerUpgradeButton}
                onPress={() => router.push("/plans")}
              >
                <Text style={styles.headerUpgradeButtonText}>Upgrade</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={styles.headerActionButton}
              onPress={() => router.push("/(tabs)/explore")}
            >
              <Ionicons
                name="search"
                size={20}
                color={themeColors.textPrimary}
              />
            </Pressable>
            <Pressable
              style={styles.headerActionButton}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={themeColors.textPrimary}
              />
            </Pressable>
          </View>
        </View>
        {heroItems.length > 0 ? (
          <View style={styles.heroWrap}>
            <FlatList
              ref={heroListRef}
              data={heroItems}
              horizontal
              pagingEnabled
              snapToInterval={HERO_ITEM_WIDTH}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              getItemLayout={(_, index) => ({
                length: HERO_ITEM_WIDTH,
                offset: HERO_ITEM_WIDTH * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / HERO_ITEM_WIDTH,
                );
                setActiveHeroIndex(index);
              }}
              renderItem={({ item }) => (
                <View style={styles.heroItemContainer}>
                  <Pressable
                    style={styles.heroCard}
                    onPress={() => handleItemPress(item.id, undefined, item.title)}
                  >
                    {item.thumbnailUri ? (
                      <Image
                        source={{ uri: item.thumbnailUri }}
                        style={styles.heroImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={["#111827", "#1f2937", "#374151"]}
                        style={styles.heroImage}
                      />
                    )}
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.85)"]}
                      style={styles.heroGradient}
                    />
                    <View style={styles.heroContent}>
                      <Text style={styles.heroTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      {item.subtitle ? (
                        <Text style={styles.heroSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                </View>
              )}
            />

            {heroItems.length > 1 ? (
              <View style={styles.heroDotsRow}>
                {heroItems.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.heroDot,
                      i === activeHeroIndex ? styles.heroDotActive : null,
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}


        {isAuthenticated && savedItems.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>My List</Text>
                <Text style={styles.sectionSubtitle}>Saved for later</Text>
              </View>
              <Pressable onPress={() => router.push("/(tabs)/my-list")}>
                <Text style={styles.sectionLink}>See all</Text>
              </Pressable>
            </View>
            <FlatList
              data={savedItems}
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
        ) : null}

        {categories.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Explore Categories</Text>
                <Text style={styles.sectionSubtitle}>Browse curated tags</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsScroll}
            >
              {categories.map((category) => (
                <Pressable
                  key={category}
                  style={styles.tagPill}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/explore",
                      params: { category },
                    })
                  }
                >
                  <Text style={styles.tagText}>{category}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {sections.map((section) => renderSection(section))}

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
  heroItemContainer: {
    width: HERO_ITEM_WIDTH,
    paddingHorizontal: spacing.md,
  },
  heroCard: {
    width: HERO_CARD_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.card,
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
  },
  heroBadge: {
    ...typography.caption,
    color: "#fcd34d",
    fontWeight: "700",
    marginBottom: spacing.xs,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    ...typography.title,
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  heroSubtitle: {
    ...typography.body,
    color: "rgba(255,255,255,0.85)",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  heroButtonsRow: {
    flexDirection: "row",
  },
  heroPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: themeColors.textPrimary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroPrimaryButtonText: {
    ...typography.body,
    color: themeColors.background,
    fontWeight: "700",
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...typography.title,
    color: themeColors.textPrimary,
    fontWeight: "700",
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.body,
    color: themeColors.textSecondary,
    fontSize: 13,
  },
  sectionLink: {
    ...typography.caption,
    color: themeColors.accent,
    fontWeight: "700",
  },
  horizontalList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
