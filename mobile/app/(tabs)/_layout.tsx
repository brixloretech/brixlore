import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIcon({
  focused,
  name,
  label,
}: {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Ionicons
        name={name}
        size={20}
        color={focused ? "#FFFFFF" : "rgba(255, 255, 255, 0.56)"}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            // height: 76 + insets.bottom,
            paddingBottom: Math.max(10, insets.bottom),
          },
        ],
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabIconSlot,
        tabBarBackground: () => (
          <BlurView intensity={24} tint="dark" style={styles.glassBackground} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="home" label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="search" label="Explore" />
          ),
        }}
      />
      <Tabs.Screen
        name="my-list"
        options={{
          title: "My List",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="bookmark" label="My List" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "My Stuff",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="person" label="My Stuff" />
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
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    borderTopColor: "transparent",
    borderTopWidth: 0,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  glassBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(5, 5, 7, 0.16)",
    overflow: "hidden",
  },
  tabBarItem: {
    flex: 1,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  tabIconSlot: {
    width: "100%",
    height: 58,
    marginTop: 0,
    marginBottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItem: {
    width: "100%",
    maxWidth: 82,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    // borderWidth: 1,
    // borderColor: "rgba(255, 255, 255, 0.16)",
    // borderRadius: 16,
    // backgroundColor: "rgba(0, 0, 0, 0.34)",
  },
  tabItemActive: {
    // backgroundColor: "rgba(255, 255, 255, 0.13)",
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  tabLabel: {
    color: "rgba(255, 255, 255, 0.56)",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
    letterSpacing: 0,
    includeFontPadding: false,
    textAlign: "center",
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
});
