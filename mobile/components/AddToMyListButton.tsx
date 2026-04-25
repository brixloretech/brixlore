import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { GestureResponderEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../src/theme/colors";
import { spacing, borderRadius } from "../constants/theme";
import { useMyList } from "../contexts/MyListContext";

type AddToMyListButtonProps = {
  contentId: string;
  /** Size: sm (default), md */
  size?: "sm" | "md";
  /** Position style */
  style?: any;
};

export function AddToMyListButton({
  contentId,
  size = "sm",
  style,
}: AddToMyListButtonProps) {
  const { toggle, isInList } = useMyList();
  const inList = isInList(contentId);

  const stopEvent = (event: GestureResponderEvent) => {
    event.stopPropagation();
  };

  const handlePress = (event: GestureResponderEvent) => {
    stopEvent(event);
    toggle(contentId);
  };

  const buttonSize = size === "sm" ? 32 : 40;
  const iconSize = size === "sm" ? 18 : 22;

  return (
    <Pressable
      style={[
        styles.button,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
        },
        style,
      ]}
      onPress={handlePress}
      onPressIn={stopEvent}
      hitSlop={8}
    >
      <View style={styles.iconContainer}>
        {inList ? (
          <Ionicons
            name="checkmark"
            size={iconSize}
            color={themeColors.textPrimary}
          />
        ) : (
          <Ionicons
            name="add"
            size={iconSize}
            color={themeColors.textPrimary}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
