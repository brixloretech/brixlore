import React, { memo } from "react";
import { View, Image, StyleSheet, Text, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../src/theme/colors";
import { spacing, typography, borderRadius, shadows } from "../constants/theme";
import { AnimatedPressableComponent } from "./AnimatedPressable";
import { AddToMyListButton } from "./AddToMyListButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_ASPECT = 16 / 9;

export type VideoCardItem = {
  id: string;
  title: string;
  subtitle?: string;
  thumbnailUri?: string;
  progressPercent?: number;
};

type LargeVideoCardProps = {
  item: VideoCardItem;
  onPress?: () => void;
  width?: number;
};

export const LargeVideoCard = memo<LargeVideoCardProps>(
  ({ item, onPress, width = CARD_WIDTH }) => {
    const cardHeight = width / CARD_ASPECT;

    return (
      <AnimatedPressableComponent
        style={[styles.wrapper, { width }]}
        onPress={onPress}
      >
        <View style={[styles.imageContainer, { width, height: cardHeight }]}>
          {item.thumbnailUri ? (
            <Image
              source={{ uri: item.thumbnailUri }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Ionicons
                name="film-outline"
                size={56}
                color={themeColors.textPrimary}
              />
            </View>
          )}

          {/* Add to My List button */}
          <View style={styles.addButtonContainer}>
            <AddToMyListButton contentId={item.id} size="sm" />
          </View>

          {/* Gradient overlay at bottom */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.9)"]}
            locations={[0.5, 0.8, 1]}
            style={styles.gradientOverlay}
          />

          {/* Play icon overlay */}
          <View style={styles.playIconContainer}>
            <View style={styles.playIcon}>
              <Ionicons name="play" size={40} color={themeColors.textPrimary} />
            </View>
          </View>

          {/* Title and subtitle overlay */}
          <View style={styles.textOverlay}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            ) : null}
          </View>
          {typeof item.progressPercent === "number" && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, Math.max(0, item.progressPercent))}%`,
                  },
                ]}
              />
            </View>
          )}
        </View>
      </AnimatedPressableComponent>
    );
  },
);

LargeVideoCard.displayName = "LargeVideoCard";

const styles = StyleSheet.create({
  wrapper: {
    marginRight: spacing.md,
  },
  imageContainer: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    backgroundColor: themeColors.card,
    position: "relative",
    ...shadows.card,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeColors.surface,
  },
  addButtonContainer: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: "40%", // Start gradient from middle-bottom
  },
  playIconContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: themeColors.textPrimary,
  },
  textOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  progressTrack: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.sm,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: themeColors.accent,
  },
  title: {
    ...typography.sectionTitle,
    fontWeight: "700",
    color: themeColors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: themeColors.textSecondary,
  },
});
