import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "../store/useAuthStore";
import { useLimitedAccessStore } from "../store/useLimitedAccessStore";
import SplashScreen from "../screens/SplashScreen";
import { colors as themeColors } from "../src/theme/colors";

export default function Index() {
  const { isLoading, isAuthenticated, checkAuth } = useAuthStore();
  const loadLimitedAccess = useLimitedAccessStore(
    (state) => state.loadFromStorage,
  );
  const [showSplash, setShowSplash] = useState(true);
  const [forceStopLoading, setForceStopLoading] = useState(false);

  useEffect(() => {
    // Load limited access state from storage
    loadLimitedAccess();

    // Start auth check immediately
    checkAuth()
      .then(() => {
        // Auth check completed
      })
      .catch((error) => {
        console.error("Auth check error:", error);
        setForceStopLoading(true);
      });

    // Set a maximum loading time (8 seconds) - if still loading, force stop
    const timeout = setTimeout(() => {
      setForceStopLoading(true);
    }, 8000);

    return () => clearTimeout(timeout);
  }, [checkAuth, loadLimitedAccess]);

  // Show splash screen first (displays for full duration in SplashScreen)
  if (showSplash) {
    return (
      <SplashScreen
        onFinish={() => {
          setShowSplash(false);
        }}
      />
    );
  }

  // After splash, show loading if still checking auth (but not forever)
  if (isLoading && !forceStopLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: themeColors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={themeColors.accent} />
      </View>
    );
  }

  // If loading took too long OR auth check is done, route based on auth state
  if (forceStopLoading || !isLoading) {
    return <Redirect href={isAuthenticated ? "/(tabs)" : "/welcome"} />;
  }

  // Fallback (shouldn't reach here)
  return <Redirect href={isAuthenticated ? "/(tabs)" : "/welcome"} />;
}
