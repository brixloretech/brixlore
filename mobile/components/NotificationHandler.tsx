import React, { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useNotificationStore } from "../store/useNotificationStore";
import type { NotificationData } from "../services/notificationService";
import * as Device from "expo-device";

/**
 * NotificationHandler: Handles app push notifications (NOT media control notifications)
 * This component listens for push notifications and handles deep linking
 * Media control notifications are handled separately in notificationSetup.ts
 */
export function NotificationHandler() {
  const router = useRouter();
  const { addNotification } = useNotificationStore();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const parseNotificationType = (value: unknown): NotificationData["type"] => {
    if (value === "info" || value === "video" || value === "system") {
      return value;
    }
    return "info";
  };

  useEffect(() => {
    // Skip if not a physical device (Expo Go or simulator)
    if (!Device.isDevice) {
      console.log(
        "NotificationHandler: Push notifications require a physical device with development build.",
      );
      return;
    }

    // Handle notifications received while app is in foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener(async (notification) => {
        // Only handle app notifications, not media control notifications
        const categoryId = notification.request.content.categoryIdentifier;
        if (categoryId === "media") {
          // Skip media control notifications
          return;
        }

        const notificationData: NotificationData = {
          id: notification.request.identifier,
          title: notification.request.content.title || "",
          body: notification.request.content.body || "",
          data: notification.request.content.data as any,
          receivedAt: Date.now(),
          read: false,
          type: parseNotificationType(notification.request.content.data?.type),
        };

        await addNotification(notificationData);
      });

    // Handle notification taps (when user taps on notification)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          const notification = response.notification;
          const categoryId = notification.request.content.categoryIdentifier;

          // Only handle app notifications, not media control notifications
          if (categoryId === "media") {
            // Skip media control notifications (handled in notificationSetup.ts)
            return;
          }

          const data = notification.request.content.data as any;

          // Store notification
          const notificationData: NotificationData = {
            id: notification.request.identifier,
            title: notification.request.content.title || "",
            body: notification.request.content.body || "",
            data,
            receivedAt: Date.now(),
            read: true, // Mark as read since user tapped it
            type: parseNotificationType(data?.type),
          };

          await addNotification(notificationData);

          // Handle deep linking to video screen
          if (data?.videoId) {
            const params = data?.episodeId
              ? `?episodeId=${encodeURIComponent(String(data.episodeId))}`
              : "";
            router.push(`/video/${data.videoId}${params}`);
          } else if (data?.url) {
            // Handle custom URL deep links
            router.push(data.url as any);
          }
        },
      );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router, addNotification]);

  // Return null - this is a handler component with no UI
  return null;
}
