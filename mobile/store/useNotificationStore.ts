import { create } from "zustand";
import { notificationService } from "../services/notificationService";
import { databaseService } from "../services/database";
import type { NotificationData } from "../services/notificationService";
import type { NotificationMetadata } from "../services/database";

type NotificationState = {
  token: string | null;
  notifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
};

type NotificationActions = {
  register: (userId?: string) => Promise<void>;
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  addNotification: (notification: NotificationData) => Promise<void>;
  getToken: () => string | null;
};

// Push notifications enabled
const NOTIFICATIONS_ENABLED = true;

export const useNotificationStore = create<
  NotificationState & NotificationActions
>((set, get) => ({
  token: null,
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  register: async (userId) => {
    if (!NOTIFICATIONS_ENABLED) {
      // No-op when notifications are disabled
      return;
    }
    try {
      set({ isLoading: true, error: null });
      const token =
        await notificationService.registerForPushNotifications(userId);
      set({ token, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to register for notifications",
      });
    }
  },

  loadNotifications: async () => {
    if (!NOTIFICATIONS_ENABLED) {
      // Return empty notifications when disabled
      set({ notifications: [], unreadCount: 0, isLoading: false });
      return;
    }
    try {
      set({ isLoading: true });

      // Try to initialize database if not already done
      try {
        await databaseService.initialize();
      } catch (dbError) {
        console.warn(
          "[NotificationStore] Database initialization failed, using empty state",
        );
        set({ notifications: [], unreadCount: 0, isLoading: false });
        return;
      }

      const metadata = await databaseService.getAllNotifications();

      const notifications: NotificationData[] = metadata.map((m) => ({
        id: m.notificationId,
        title: m.title,
        body: m.body,
        data: m.data ? JSON.parse(m.data) : {},
        receivedAt: m.receivedAt,
        read: m.read === 1,
        type: (m.type as "info" | "video" | "system") || "info",
      }));

      const unreadCount = notifications.filter((n) => !n.read).length;

      set({ notifications, unreadCount, isLoading: false });
    } catch (error: any) {
      console.warn("[NotificationStore] Failed to load notifications:", error);
      set({
        isLoading: false,
        error: error.message || "Failed to load notifications",
        notifications: [],
        unreadCount: 0,
      });
    }
  },

  markAsRead: async (notificationId) => {
    if (!NOTIFICATIONS_ENABLED) return;
    try {
      await notificationService.markAsRead(notificationId);
      await get().loadNotifications();
    } catch (error: any) {
      console.warn("[NotificationStore] Failed to mark as read:", error);
      set({ error: error.message || "Failed to mark notification as read" });
    }
  },

  markAllAsRead: async () => {
    if (!NOTIFICATIONS_ENABLED) return;
    try {
      await databaseService.markAllAsRead();
      await get().loadNotifications();
    } catch (error: any) {
      console.warn("[NotificationStore] Failed to mark all as read:", error);
      set({ error: error.message || "Failed to mark all as read" });
    }
  },

  deleteNotification: async (notificationId) => {
    if (!NOTIFICATIONS_ENABLED) return;
    try {
      await databaseService.deleteNotification(notificationId);
      await get().loadNotifications();
    } catch (error: any) {
      console.warn("[NotificationStore] Failed to delete notification:", error);
      set({ error: error.message || "Failed to delete notification" });
    }
  },

  deleteAllNotifications: async () => {
    if (!NOTIFICATIONS_ENABLED) return;
    try {
      await databaseService.deleteAllNotifications();
      await get().loadNotifications();
    } catch (error: any) {
      console.warn("[NotificationStore] Failed to delete all:", error);
      set({ error: error.message || "Failed to delete all notifications" });
    }
  },

  addNotification: async (notification) => {
    if (!NOTIFICATIONS_ENABLED) return;
    try {
      await notificationService.storeNotification(notification);
      await get().loadNotifications();
    } catch (error: any) {
      console.warn("[NotificationStore] Failed to add notification:", error);
      // Don't set error state here - notification still works without storage
    }
  },

  getToken: () => {
    return get().token || notificationService.getStoredToken();
  },
}));
