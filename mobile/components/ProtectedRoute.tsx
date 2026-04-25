import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { usePathname, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "../store/useAuthStore";
import { colors as themeColors } from "../src/theme/colors";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Don't call checkAuth here - it's already called in index.tsx
  // This prevents duplicate calls

  useEffect(() => {
    if (!isLoading) {
      const isLoginScreen = segments[0] === "login";
      const isSignUpScreen = segments[0] === "signup";
      const isForgotPasswordScreen = segments[0] === "forgot-password";
      const isWelcomeScreen = segments[0] === "welcome";
      const isIndexScreen = pathname === "/";
      const isTabsScreen = segments[0] === "(tabs)";
      const isVideoScreen = segments[0] === "video"; // video/[id].tsx route

      // Don't redirect if we're on index screen (let index.tsx handle it)
      if (isIndexScreen) {
        return;
      }

      // Allow access to tabs for both authenticated and unauthenticated users (guest mode)
      // The limited access store will handle restrictions within tabs
      if (isTabsScreen || isVideoScreen) {
        return;
      }

      // Don't redirect if we're on login/signup/welcome screens
      if (
        !isAuthenticated &&
        !isLoginScreen &&
        !isSignUpScreen &&
        !isForgotPasswordScreen &&
        !isWelcomeScreen
      ) {
        // Redirect to login if not authenticated (but not if already on allowed screens)
        router.replace("/login");
      } else if (
        isAuthenticated &&
        (isLoginScreen || isSignUpScreen || isForgotPasswordScreen)
      ) {
        // Redirect to home if authenticated and on login or signup screen
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, isLoading, pathname, segments, router]);

  // Always allow index, login, signup, welcome, tabs, and video screens to render
  // Guest users can browse tabs and watch videos with limitations
  const isIndexScreen = pathname === "/";
  const isLoginScreen = segments[0] === "login";
  const isSignUpScreen = segments[0] === "signup";
  const isForgotPasswordScreen = segments[0] === "forgot-password";
  const isWelcomeScreen = segments[0] === "welcome";
  const isTabsScreen = segments[0] === "(tabs)";
  const isVideoScreen = segments[0] === "video"; // video/[id].tsx route

  if (
    isIndexScreen ||
    isLoginScreen ||
    isSignUpScreen ||
    isForgotPasswordScreen ||
    isWelcomeScreen ||
    isTabsScreen ||
    isVideoScreen
  ) {
    return <>{children}</>;
  }

  // Show loading only if we're actually loading AND not on allowed screens
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accent} />
      </View>
    );
  }

  // For other screens (settings, downloads, notifications, etc.), require authentication
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: themeColors.background,
  },
});
