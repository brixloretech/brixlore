import { Tabs } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";
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
    <View style={styles.tabItem}>
      <Ionicons
        name={name}
        size={22}
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
  // Android edge-to-edge can report a zero bottom inset on some devices even
  // though the system navigation bar still overlays the app.
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === "android" ? 10 : 0,
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            // The inset must be part of the bar height so the tab labels are
            // laid out above Android's system navigation area.
            height: 76 + bottomInset,
            paddingBottom: bottomInset,
          },
        ],
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabIconSlot,
        tabBarBackground: () => (
          <BlurView intensity={48} tint="dark" style={styles.blurBackground} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name={focused ? "home-sharp" : "home-outline"}
              label="Home"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name={focused ? "compass" : "compass-outline"}
              label="Explore"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-list"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name={focused ? "person-circle" : "person-circle-outline"}
              label="Account"
            />
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
    borderTopColor: "rgba(255, 255, 255, 0.15)",
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    paddingHorizontal: 10,
    paddingTop: 8,

  },
  tabBarItem: {
    flex: 1,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,

  },
  blurBackground: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.80)",
    overflow: "hidden",
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
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLabel: {
    color: "rgba(255, 255, 255, 0.56)",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "400",
    letterSpacing: 0,
    includeFontPadding: false,
    textAlign: "center",
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
});
