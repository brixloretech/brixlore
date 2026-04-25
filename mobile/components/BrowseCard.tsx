import React, { memo } from "react";
import { View, Image, StyleSheet, Text, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../src/theme/colors";
import { spacing, typography, borderRadius } from "../constants/theme";
import { AnimatedPressableComponent } from "./AnimatedPressable";
import { AddToMyListButton } from "./AddToMyListButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.7; // Wide card for browse rows
const CARD_HEIGHT = CARD_WIDTH * 0.56; // 16:9 aspect ratio

export type BrowseItem = {
  id: string;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string | null;
};

type BrowseCardProps = {
  item: BrowseItem;
  onPress?: () => void;
  index?: number;
};

const GRADIENTS = [
  ["#1e293b", "#0f172a", "#475569"],
  ["#312e81", "#1e1b4b", "#6366f1"],
  ["#171717", "#0a0a0a", "#404040"],
  ["#18181b", "#09090b", "#3f3f46"],
] as const;

function getGradient(
  index: number = 0,
): readonly [string, string, ...string[]] {
  return GRADIENTS[index % GRADIENTS.length];
}

export const BrowseCard = memo<BrowseCardProps>(
  ({ item, onPress, index = 0 }) => {
    const hasThumbnail = Boolean(item.thumbnailUrl);
    const gradient = getGradient(index);

    return (
      <AnimatedPressableComponent
        style={[styles.wrapper, { width: CARD_WIDTH }]}
        onPress={onPress}
      >
        <View style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
          {/* Background gradient or thumbnail */}
          {hasThumbnail ? (
            <Image
              source={{ uri: item.thumbnailUrl! }}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.backgroundGradient}
            >
              <View style={styles.placeholderIcon}>
                <Ionicons
                  name="film-outline"
                  size={40}
                  color={themeColors.textPrimary}
                />
              </View>
            </LinearGradient>
          )}

          {/* Add to My List button */}
          <View style={styles.addButtonContainer}>
            <AddToMyListButton contentId={item.id} size="sm" />
          </View>

          {/* Bottom gradient overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.9)"]}
            style={styles.bottomGradient}
          />

          {/* Content overlay */}
          <View style={styles.contentOverlay}>
            {item.subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            )}
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.watchNow}>
              <Text style={styles.watchNowText}>Watch now</Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={themeColors.accent}
              />
            </View>
          </View>
        </View>
      </AnimatedPressableComponent>
    );
  },
);

BrowseCard.displayName = "BrowseCard";

const styles = StyleSheet.create({
  wrapper: {
    marginRight: spacing.md,
  },
  card: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: themeColors.border,
    backgroundColor: themeColors.surface,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  backgroundGradient: {
    width: "100%",
    height: "100%",
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    opacity: 0.3,
  },
  addButtonContainer: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  contentOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    zIndex: 1,
  },
  subtitle: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.body,
    color: themeColors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  watchNow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  watchNowText: {
    ...typography.caption,
    color: themeColors.accent,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
