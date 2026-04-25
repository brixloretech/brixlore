import React, { memo } from "react";
import { View, Image, StyleSheet, Text, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../src/theme/colors";
import { spacing, typography, borderRadius, shadows } from "../constants/theme";
import { AnimatedPressableComponent } from "./AnimatedPressable";
import { AddToMyListButton } from "./AddToMyListButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.32;
const CARD_ASPECT = 2 / 3; // Poster aspect ratio

export type VideoCardItem = {
  id: string;
  title: string;
  subtitle?: string;
  posterUri?: string;
  thumbnailUri?: string;
};

type SmallVideoCardProps = {
  item: VideoCardItem;
  onPress?: () => void;
  width?: number;
};

export const SmallVideoCard = memo<SmallVideoCardProps>(
  ({ item, onPress, width = CARD_WIDTH }) => {
    const cardHeight = width / CARD_ASPECT;
    const preferredImageUri = item.posterUri ?? item.thumbnailUri;

    return (
      <AnimatedPressableComponent
        style={[styles.wrapper, { width }]}
        onPress={onPress}
      >
        <View style={[styles.imageContainer, { width, height: cardHeight }]}>
          {preferredImageUri ? (
            <Image
              source={{ uri: preferredImageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Ionicons
                name="film-outline"
                size={32}
                color={themeColors.textPrimary}
              />
            </View>
          )}
          {/* Add to My List button */}
          <View style={styles.addButtonContainer}>
            <AddToMyListButton contentId={item.id} size="sm" />
          </View>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          {item.subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>
      </AnimatedPressableComponent>
    );
  },
);

SmallVideoCard.displayName = "SmallVideoCard";

const styles = StyleSheet.create({
  wrapper: {
    marginRight: spacing.md,
    marginBottom: spacing.sm,
  },
  imageContainer: {
    borderRadius: borderRadius.md,
    overflow: "hidden",
    backgroundColor: themeColors.card,
    ...shadows.card,
    position: "relative",
  },
  addButtonContainer: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    zIndex: 10,
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
  textContainer: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  title: {
    ...typography.body,
    fontWeight: "600",
    color: themeColors.textPrimary,
    fontSize: 14,
  },
  subtitle: {
    ...typography.caption,
    color: themeColors.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
});
