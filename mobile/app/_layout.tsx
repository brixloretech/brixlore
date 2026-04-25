import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LogBox, View } from "react-native";
import { useCallback, useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { DarkThemeProvider } from "../context/ThemeContext";
import { MyListProvider } from "../contexts/MyListContext";
import { databaseService } from "../services/database";
import { notificationService } from "../services/notificationService";
import {
  setupNotifications,
  cleanupNotifications,
} from "../src/services/notificationSetup";
import { NotificationHandler } from "../components/NotificationHandler";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useNotificationStore } from "../store/useNotificationStore";
import { useAuthStore } from "../store/useAuthStore";
import * as Notifications from "expo-notifications";
import { downloadService } from "../services/downloadService";
import {
  updateDownloadNotification,
  clearDownloadNotification,
} from "../services/downloadNotifications";

const APP_BG = "#0b0b0e";

// Keep native splash visible until root layout is mounted and painted.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if splash is already prevented/hidden.
});

export default function RootLayout() {
  const { register, loadNotifications } = useNotificationStore();
  const { isAuthenticated, user } = useAuthStore();
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  // Removed checkAuth from here - it's called in index.tsx to avoid duplicate calls

  // Register download notification handlers
  useEffect(() => {
    console.log(
      "[RootLayout] 🚀 Registering download notification handlers...",
    );

    const handleNotificationAction = async (
      actionId: string,
      contentId?: string,
    ) => {
      console.log(
        `[RootLayout] 📝 Handler called: action=${actionId}, contentId=${contentId}`,
      );

      if (!contentId) {
        console.warn("[RootLayout] Missing contentId in notification action");
        return;
      }

      // Mark that we're handling a notification action to prevent background audio from triggering
      downloadService.markNotificationAction();

      console.log(
        `[RootLayout] ⚙️ EXECUTING: ${actionId.toUpperCase()} for ${contentId}`,
      );

      try {
        switch (actionId) {
          case "pause":
            await downloadService.pauseDownload(contentId);
            console.log(`[RootLayout] ✓ Download PAUSED`);
            break;
          case "resume":
            await downloadService.resumeDownload(contentId);
            console.log(`[RootLayout] ✓ Download RESUMED`);
            break;
          case "cancel":
            await downloadService.cancelDownload(contentId);
            await clearDownloadNotification(contentId);
            console.log(`[RootLayout] ✓ Download CANCELLED`);
            return;
          default:
            console.warn(`[RootLayout] Unknown action: ${actionId}`);
            return;
        }

        // Note: No need to manually update notification here
        // The downloadService.emit() method automatically updates notifications
        // when pause/resume/cancel is called
        console.log(
          `[RootLayout] ✅ Action completed, notification will auto-update`,
        );
      } catch (error: any) {
        console.error(
          `[RootLayout] ❌ Failed to handle ${actionId}:`,
          error?.message || error,
        );
      }
    };

    const handleResponse = async (
      response: Notifications.NotificationResponse,
    ) => {
      const actionId = response.actionIdentifier;
      if (!["pause", "resume", "cancel"].includes(actionId)) {
        return;
      }

      const contentId = response.notification.request.content.data
        ?.contentId as string | undefined;
      console.log(
        `[RootLayout] 👆 ACTION_RESPONSE: action="${actionId}", contentId="${contentId}"`,
      );
      if (contentId) {
        await handleNotificationAction(actionId, contentId);
      }
    };

    console.log("[RootLayout] 📝 Setting up Expo response handlers...");
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        void handleResponse(response);
      },
    );
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          void handleResponse(response);
        }
      })
      .catch(() => {
        // Best-effort only.
      });
    console.log("[RootLayout] ✅ Expo response handlers registered");

    console.log(
      "[RootLayout] ✅ All download notification handlers registered successfully",
    );

    return () => {
      console.log("[RootLayout] 🧹 Cleaning up Expo response handlers");
      responseSub.remove();
    };
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(APP_BG).catch(() => {
      // Best-effort only.
    });

    LogBox.ignoreLogs(["Unable to activate keep awake"]);

    LogBox.ignoreLogs(["Unable to activate keep awake"]);

    // Initialize database on app start
    databaseService.initialize().catch((error) => {
      console.error("Failed to initialize database:", error);
    });

    // Setup notification system for media controls
    setupNotifications().catch((error) => {
      console.error("Failed to setup notifications:", error);
    });

    // Configure push notification channels (separate from media controls)
    notificationService.configureNotifications();

    // Load existing notifications
    loadNotifications().catch((error) => {
      console.error("Failed to load notifications:", error);
    });

    return () => {
      cleanupNotifications();
    };
  }, []);

  useEffect(() => {
    if (!isLayoutReady) return;
    SplashScreen.hideAsync().catch(() => {
      // Ignore if already hidden.
    });
  }, [isLayoutReady]);

  const handleRootLayout = useCallback(() => {
    setIsLayoutReady(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Register for push notifications only after auth so /devices/register succeeds.
    register(user?.id).catch((error) => {
      if (
        !error?.message?.includes("Expo Go") &&
        !error?.message?.includes("development build")
      ) {
        console.error("Failed to register for notifications:", error);
      }
    });
  }, [isAuthenticated, user?.id, register]);

  return (
    <View
      style={{ flex: 1, backgroundColor: APP_BG }}
      onLayout={handleRootLayout}
    >
      <SafeAreaProvider>
        <DarkThemeProvider>
          <MyListProvider>
            <StatusBar style="light" />
            <ProtectedRoute>
              <NotificationHandler />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: APP_BG },
                }}
              >
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="signup" options={{ headerShown: false }} />
                <Stack.Screen
                  name="settings"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="plans" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </ProtectedRoute>
          </MyListProvider>
        </DarkThemeProvider>
      </SafeAreaProvider>
    </View>
  );
}
