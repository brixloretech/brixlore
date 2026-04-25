import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import { colors as themeColors } from "../../src/theme/colors";
import { shadows } from "../../constants/theme";
import Constants from "expo-constants";

// Check if running in Expo Go (which has limited reanimated support)
// Safe check for Expo Go - executionEnvironment may not be available in all versions
const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  Constants.executionEnvironment ===
    Constants.ExecutionEnvironment?.StoreClient ||
  !Constants.executionEnvironment;

// Simple TabIcon without animations for Expo Go compatibility
function TabIcon({
  focused,
  name,
  color,
}: {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={name} size={28} color={color} />
      {focused && (
        <View
          style={{
            position: "absolute",
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: themeColors.accent,
            opacity: 0.2,
            top: -4.5,
            left: -6,
          }}
        />
      )}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: themeColors.accent,
        tabBarInactiveTintColor: themeColors.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} name="search" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-list"
        options={{
          title: "My List",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} name="bookmark" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} name="person" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    borderTopWidth: 1,
    height: 115,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarBackground: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
    paddingTop: 10,
    paddingBottom: 8,
  },
});
