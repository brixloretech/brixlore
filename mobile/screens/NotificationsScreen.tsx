import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../src/theme/colors";
import { spacing, typography } from "../constants/theme";
import { useNotificationStore } from "../store/useNotificationStore";

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (
    notification: (typeof notifications)[0],
  ) => {
    await markAsRead(notification.id);

    // Navigate based on notification data
    if (notification.data?.videoId) {
      const episodeId = notification.data?.episodeId as string | undefined;
      const params = episodeId
        ? `?episodeId=${encodeURIComponent(episodeId)}`
        : "";
      router.push(`/video/${notification.data.videoId}${params}` as any);
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: (typeof notifications)[0] }) => {
    return (
      <Pressable
        style={[styles.item, !item.read && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.itemContent}>
          <View style={styles.iconContainer}>
            {item.type === "video" ? (
              <Ionicons name="videocam" size={24} color={themeColors.accent} />
            ) : (
              <Ionicons
                name="notifications"
                size={24}
                color={themeColors.accent}
              />
            )}
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.itemBody} numberOfLines={3}>
              {item.body}
            </Text>
            <Text style={styles.itemDate}>{formatDate(item.receivedAt)}</Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
          <Pressable
            style={styles.deleteButton}
            onPress={() => deleteNotification(item.id)}
          >
            <Ionicons
              name="close"
              size={20}
              color={themeColors.textSecondary}
            />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={themeColors.textPrimary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <Pressable style={styles.markAllButton} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="notifications-outline"
            size={64}
            color={themeColors.muted}
          />
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>
            You'll see notifications here when they arrive
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.accent}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.title,
    color: themeColors.textPrimary,
    flex: 1,
  },
  markAllButton: {
    padding: spacing.sm,
  },
  markAllText: {
    ...typography.caption,
    color: themeColors.accent,
    fontWeight: "600",
  },
  listContent: {
    padding: spacing.md,
  },
  item: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  unreadItem: {
    borderLeftWidth: 4,
    borderLeftColor: themeColors.accent,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    ...typography.body,
    color: themeColors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  itemBody: {
    ...typography.body,
    color: themeColors.textSecondary,
    marginBottom: spacing.xs,
  },
  itemDate: {
    ...typography.caption,
    color: themeColors.muted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.accent,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  deleteButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.sectionTitle,
    color: themeColors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    color: themeColors.textSecondary,
    textAlign: "center",
  },
});
