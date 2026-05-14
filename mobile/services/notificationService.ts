import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { databaseService } from "./database";
import { deviceService } from "./deviceService";

export type NotificationData = {
  id: string;
  title: string;
  body: string;
  data?: {
    videoId?: string;
    contentType?: string;
    [key: string]: any;
  };
  receivedAt: number;
  read: boolean;
  type?: "info" | "video" | "system";
};

class NotificationService {
  private token: string | null = null;

  /**
   * Configure notification handler and channels
   * IMPORTANT: Uses separate channel from media controls
   */
  configureNotifications(): void {
    // Set notification handler for app notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Create Android channel for app notifications (separate from media controls)
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("app-notifications", {
        name: "Brixlore Notifications",
        description: "Updates about new content and features",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#E50914",
        sound: "default",
        showBadge: true,
        enableLights: true,
        enableVibrate: true,
      }).catch((error) => {
        console.warn("Failed to create notification channel:", error);
      });
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn("Push notifications only work on physical devices");
      return false;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Permission to send notifications was denied");
      return false;
    }

    return true;
  }

  /**
   * Get Expo Push Token (uses Expo Push Service, NOT Firebase)
   */
  async getToken(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log("Push tokens only work on physical devices");
      return null;
    }

    try {
      // Using Expo Push Service (no Firebase needed)
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn(
          "EAS project ID not found in app.json. Push notifications may not work.",
        );
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      this.token = token.data;
      console.log("Successfully obtained Expo Push Token");
      return token.data;
    } catch (error: any) {
      // Ignore Firebase errors - we're using Expo Push Service
      if (error.message?.includes("Firebase")) {
        console.log("Note: Using Expo Push Service (Firebase not required)");
      } else {
        console.error("Failed to get push token:", error.message);
      }
      return null;
    }
  }

  /**
   * Register device with backend and get push token
   */
  async registerForPushNotifications(userId?: string): Promise<string | null> {
    try {
      // Check if physical device
      if (!Device.isDevice) {
        console.log(
          "Push notifications require a physical device or development build",
        );
        return null;
      }

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log("Push notification permissions not granted");
        return null;
      }

      // Get push token
      const pushToken = await this.getToken();
      if (!pushToken) {
        console.log(
          "Could not obtain push token (may require development build)",
        );
        return null;
      }

      // Register/update the current device with stable identifier + push token
      await deviceService.registerDevice(pushToken);

      console.log("✅ Successfully registered for push notifications");
      return pushToken;
    } catch (error: any) {
      // Silently fail for Expo Go or development issues
      if (
        error.message?.includes("Firebase") ||
        error.message?.includes("development build")
      ) {
        console.log(
          "ℹ️ Push notifications require development build (not Expo Go)",
        );
      } else {
        console.error(
          "Failed to register for push notifications:",
          error.message,
        );
      }
      return null;
    }
  }

  /**
   * Store notification in local database
   */
  async storeNotification(notification: NotificationData): Promise<void> {
    try {
      // Ensure database is initialized
      await databaseService.initialize();

      const normalizedNotificationId =
        typeof notification.id === "string" && notification.id.trim().length > 0
          ? notification.id.trim()
          : `local-${notification.receivedAt}-${Math.random().toString(36).slice(2, 10)}`;

      await databaseService.insertNotification({
        notificationId: normalizedNotificationId,
        title: notification.title,
        body: notification.body,
        data: notification.data ? JSON.stringify(notification.data) : "{}",
        receivedAt: notification.receivedAt,
        read: notification.read ? 1 : 0,
        type: notification.type || "info",
      });
    } catch (error) {
      console.warn(
        "[NotificationService] Failed to store notification in database:",
        error,
      );
      // Don't throw - notifications can still work without local storage
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Ensure database is initialized
      await databaseService.initialize();
      await databaseService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.warn(
        "[NotificationService] Failed to mark notification as read:",
        error,
      );
      // Don't throw - this is not a critical operation
    }
  }

  /**
   * Get stored token
   */
  getStoredToken(): string | null {
    return this.token;
  }
}

export const notificationService = new NotificationService();
