import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { pauseAudio, resumeAudio, stopAudio } from "./playbackService";

let notificationListener: any = null;
let responseListener: any = null;

export async function setupNotifications(): Promise<void> {
  try {
    // Set up notification categories for iOS with actions
    await Notifications.setNotificationCategoryAsync("media", [
      {
        identifier: "pause",
        buttonTitle: "Pause",
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: "stop",
        buttonTitle: "Stop",
        options: {
          opensAppToForeground: false,
          isDestructive: true,
        },
      },
    ]);

    // Create Android channel for media controls with high importance
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("media_controls", {
        name: "Media Controls",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0],
        sound: null,
        lightColor: "#E50914",
        enableLights: true,
        enableVibrate: false,
        bypassDnd: true,
      });
    }

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Listen to notifications (when app is in foreground)
    notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Handle notification in foreground if needed
      },
    );

    // Listen to notification responses (when user taps notification or action buttons)
    responseListener = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const { notification, actionIdentifier } = response;
        const data = notification.request.content.data;

        // Handle action button taps (iOS uses actionIdentifier)
        if (actionIdentifier) {
          if (actionIdentifier === "pause") {
            await pauseAudio();
          } else if (actionIdentifier === "play") {
            await resumeAudio();
          } else if (actionIdentifier === "stop") {
            await stopAudio();
          }
        }
      },
    );
  } catch (error) {
    console.error("Failed to setup notifications:", error);
  }
}

export function cleanupNotifications(): void {
  if (notificationListener) {
    notificationListener.remove();
    notificationListener = null;
  }
  if (responseListener) {
    responseListener.remove();
    responseListener = null;
  }
}
