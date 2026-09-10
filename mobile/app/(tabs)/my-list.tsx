import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../../src/theme/colors";
import { spacing, typography } from "../../constants/theme";
import { useMyList } from "../../contexts/MyListContext";
import { contentService, type ContentSummaryDto } from "../../services/contentService";

const POSTER_WIDTH = (Dimensions.get("window").width - spacing.lg * 2 - 34) / 2;

function SavedPoster({ item, index, onOpen, onRemove }: { item: ContentSummaryDto; index: number; onOpen: () => void; onRemove: () => void }) {
  const image = item.posterUrl || item.thumbnailUrl;
  return <View style={styles.posterItem}>
    <Text style={styles.posterNumber}>{String(index + 1).padStart(2, "0")}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`Play ${item.title}`} onPress={onOpen} style={({ pressed }) => [styles.posterWrap, pressed && styles.pressed]}>
      {image ? <Image source={{ uri: image }} style={styles.posterImage} resizeMode="cover" /> : <View style={styles.posterFallback}><Ionicons name="film-outline" size={26} color="rgba(255,255,255,0.4)" /></View>}
      <View style={styles.posterGradient} />
      <View style={styles.play}><Ionicons name="play" size={15} color="#050505" /></View>
    </Pressable>
    <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={`Remove ${item.title}`} style={styles.remove}><Ionicons name="close" size={15} color={themeColors.textPrimary} /></Pressable>
    <View style={styles.posterCopy}><Text style={styles.posterTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.posterMeta} numberOfLines={1}>{item.releaseYear}  /  {item.category || item.type}</Text></View>
  </View>;
}

export default function MyListScreen() {
  const router = useRouter();
  const { listIds, remove, refresh } = useMyList();
  const [items, setItems] = useState<ContentSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!listIds.length) { setItems([]); return; }
      const catalog = await Promise.race([contentService.getContentForBrowse(), new Promise<ContentSummaryDto[]>((resolve) => setTimeout(() => resolve([]), 10_000))]);
      const byId = new Map(catalog.map((item) => [item.id, item]));
      setItems(listIds.map((id) => byId.get(id)).filter((item): item is ContentSummaryDto => Boolean(item)));
    } finally { setIsLoading(false); setIsRefreshing(false); }
  }, [listIds]);

  useEffect(() => { void load(); }, [load]);
  const handleRefresh = useCallback(async () => { setIsRefreshing(true); await refresh(); await load(); }, [load, refresh]);
  const feature = items[0];
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category || item.type))).slice(0, 3), [items]);

  const header = <>
    <View style={styles.hero}>
      {feature?.bannerUrl || feature?.posterUrl || feature?.thumbnailUrl ? <Image source={{ uri: feature.bannerUrl || feature.posterUrl || feature.thumbnailUrl || "" }} style={styles.heroImage} resizeMode="cover" /> : null}
      <View style={styles.heroShade} />
      <View style={styles.heroContent}>
        <View style={styles.heroKicker}><Ionicons name="bookmark-outline" size={13} color="rgba(255,255,255,0.72)" /><Text style={styles.kickerText}>PERSONAL ARCHIVE</Text><View style={styles.kickerLine} /><Text style={styles.kickerText}>{String(items.length).padStart(2, "0")} SAVED</Text></View>
        <Text style={styles.heroTitle}>Keep what{"\n"}moves <Text style={styles.faded}>you.</Text></Text>
        <View style={styles.heroRule}><Text style={styles.heroDescription}>A private collection of stories worth returning to. Your Brixlore vault, ready whenever you are.</Text></View>
        <View style={styles.heroButtons}>
          <Pressable onPress={() => feature ? router.push(`/video/${feature.id}`) : router.push("/(tabs)/explore")} style={styles.mainButton}><Ionicons name={feature ? "play" : "add"} size={15} color="#050505" /><Text style={styles.mainButtonText}>{feature ? "Play first saved" : "Start collecting"}</Text></Pressable>
          <Pressable onPress={() => router.push("/(tabs)/explore")} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Add a title</Text><Ionicons name="arrow-up" size={14} color="rgba(255,255,255,0.86)" /></Pressable>
        </View>
      </View>
    </View>
    <View style={styles.marquee}><Text style={styles.marqueeText}>YOUR SAVED STORIES   ✦   BUILT FOR THE RIGHT MOMENT   ✦   THE BRIXLORE VAULT</Text></View>
    <View style={styles.collectionHeader}><View><Text style={styles.collectionEyebrow}>SELECTED BY YOU</Text><Text style={styles.collectionTitle}>Inside the vault</Text></View><View style={styles.countBlock}><Text style={styles.countValue}>{String(items.length).padStart(2, "0")}</Text><Text style={styles.countLabel}>TITLES</Text></View></View>
    {categories.length > 0 ? <View style={styles.categories}>{categories.map((category) => <Text key={category} style={styles.category}>{category}</Text>)}</View> : null}
  </>;

  return <SafeAreaView style={styles.container} edges={["top"]}>
    <FlatList
      data={isLoading ? [] : items}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={items.length ? styles.columns : undefined}
      contentContainerStyle={styles.content}
      ListHeaderComponent={header}
      renderItem={({ item, index }) => <SavedPoster item={item} index={index} onOpen={() => router.push(`/video/${item.id}`)} onRemove={() => remove(item.id)} />}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={themeColors.accent} />}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<View style={isLoading ? styles.loadingGrid : styles.empty}><>{isLoading ? Array.from({ length: 4 }, (_, index) => <View key={index} style={styles.skeleton}><View style={styles.skeletonImage} /><View style={styles.skeletonLine} /></View>) : <><Ionicons name="bookmark-outline" size={30} color="rgba(255,255,255,0.52)" /><Text style={styles.emptyTitle}>Nothing in the vault. Yet.</Text><Text style={styles.emptyCopy}>When a story stays with you, save it. Your first favourite is waiting somewhere in the catalog.</Text><Pressable onPress={() => router.push("/(tabs)/explore")} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Explore the signal</Text><Ionicons name="arrow-up" size={15} color="#050505" /></Pressable></>}</></View>}
    />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" }, content: { paddingBottom: 112 },
  hero: { minHeight: 420, overflow: "hidden", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.14)", backgroundColor: "#090909" }, heroImage: { ...StyleSheet.absoluteFill, opacity: 0.43 }, heroShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(5,5,5,0.3)" }, heroContent: { flex: 1, justifyContent: "flex-end", paddingHorizontal: spacing.lg, paddingTop: 28, paddingBottom: 30 }, heroKicker: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 22 }, kickerText: { ...typography.smallBold, color: "rgba(255,255,255,0.66)", fontSize: 9, letterSpacing: 1.2 }, kickerLine: { width: 24, height: 1, backgroundColor: "rgba(255,255,255,0.42)" }, heroTitle: { ...typography.h1, color: themeColors.textPrimary, fontSize: 43, lineHeight: 39, letterSpacing: -2.2 }, faded: { color: "rgba(255,255,255,0.42)" }, heroRule: { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.55)", paddingLeft: 13, marginTop: 19, maxWidth: 310 }, heroDescription: { ...typography.small, color: "rgba(255,255,255,0.7)", lineHeight: 19 }, heroButtons: { flexDirection: "row", gap: 9, marginTop: 23 }, mainButton: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: "#f4f4f5" }, mainButtonText: { ...typography.smallBold, color: "#050505", fontSize: 11 }, outlineButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13, paddingVertical: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.32)" }, outlineButtonText: { ...typography.smallBold, color: "rgba(255,255,255,0.88)", fontSize: 11 },
  marquee: { backgroundColor: "#f4f4f5", paddingVertical: 12, overflow: "hidden" }, marqueeText: { ...typography.smallBold, color: "#050505", fontSize: 9, letterSpacing: 1.05, textAlign: "center" }, collectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginHorizontal: spacing.lg, paddingTop: 32, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.15)" }, collectionEyebrow: { ...typography.smallBold, color: "rgba(255,255,255,0.42)", fontSize: 9, letterSpacing: 1.4 }, collectionTitle: { ...typography.h2, color: themeColors.textPrimary, fontSize: 27, lineHeight: 29, letterSpacing: -1.3, marginTop: 9 }, countBlock: { alignItems: "flex-end" }, countValue: { ...typography.title, color: "rgba(255,255,255,0.8)", fontSize: 17 }, countLabel: { ...typography.smallBold, color: "rgba(255,255,255,0.4)", fontSize: 8, letterSpacing: 1 }, categories: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginHorizontal: spacing.lg, marginTop: 14 }, category: { ...typography.smallBold, color: "rgba(255,255,255,0.62)", fontSize: 9, letterSpacing: 0.6, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  columns: { paddingHorizontal: spacing.lg, gap: 18 }, posterItem: { width: POSTER_WIDTH, marginTop: 28, position: "relative" }, posterNumber: { position: "absolute", left: -2, bottom: 40, zIndex: 2, color: themeColors.textPrimary, fontSize: 47, fontWeight: "700", letterSpacing: -5, lineHeight: 48, textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 5 }, posterWrap: { height: 245, marginLeft: 22, overflow: "hidden", backgroundColor: "#161616" }, posterImage: { width: "100%", height: "100%" }, posterFallback: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#181818" }, posterGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: 82, backgroundColor: "rgba(0,0,0,0.25)" }, play: { position: "absolute", left: 10, bottom: 10, width: 31, height: 31, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#f4f4f5" }, remove: { position: "absolute", right: 7, top: 7, width: 29, height: 29, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.67)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" }, posterCopy: { marginLeft: 22, marginTop: 10 }, posterTitle: { ...typography.smallBold, color: themeColors.textPrimary, fontSize: 12 }, posterMeta: { ...typography.small, color: "rgba(255,255,255,0.48)", fontSize: 10, marginTop: 4 }, pressed: { opacity: 0.72 },
  empty: { minHeight: 340, marginHorizontal: spacing.lg, marginTop: 26, padding: 28, alignItems: "center", justifyContent: "center", borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.18)" }, emptyTitle: { ...typography.h2, color: themeColors.textPrimary, fontSize: 25, letterSpacing: -1.1, marginTop: 20 }, emptyCopy: { ...typography.small, color: "rgba(255,255,255,0.56)", textAlign: "center", lineHeight: 19, marginTop: 9, maxWidth: 280 }, emptyButton: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 23, backgroundColor: "#f4f4f5", paddingHorizontal: 15, paddingVertical: 13 }, emptyButtonText: { ...typography.smallBold, color: "#050505", fontSize: 11 }, loadingGrid: { flexDirection: "row", flexWrap: "wrap", gap: 18, paddingHorizontal: spacing.lg, paddingTop: 26 }, skeleton: { width: POSTER_WIDTH }, skeletonImage: { height: 245, marginLeft: 22, backgroundColor: "rgba(255,255,255,0.09)" }, skeletonLine: { width: "55%", height: 12, marginLeft: 22, marginTop: 10, backgroundColor: "rgba(255,255,255,0.08)" },
});
