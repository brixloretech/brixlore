import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { DownloadProgress } from "./downloadService";

const CHANNEL_ID = "downloads";
const CATEGORY_ID = "download-controls";

let channelReady = false;
const notificationIds = new Map<string, string>();

async function ensureChannel(): Promise<void> {
  if (channelReady || Platform.OS !== "android") return;
  console.log(
    "[DownloadNotifications] Creating notification channel with HIGH importance",
  );
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Downloads",
    description: "Video download status and controls",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#E50914",
    enableVibrate: true,
    showBadge: false,
  });
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    { identifier: "pause", buttonTitle: "Pause" },
    { identifier: "resume", buttonTitle: "Resume" },
    {
      identifier: "cancel",
      buttonTitle: "Cancel",
      options: { isDestructive: true },
    },
  ]);
  channelReady = true;
}

function notificationId(contentId: string): string {
  return `download-${contentId}`;
}

async function resolveNotificationId(
  contentId: string,
): Promise<string | null> {
  const cached = notificationIds.get(contentId);
  if (cached) return cached;

  const presented = await Notifications.getPresentedNotificationsAsync();
  const match = presented.find(
    (item) => item.request.content.data?.contentId === contentId,
  );
  if (match) {
    notificationIds.set(contentId, match.request.identifier);
    return match.request.identifier;
  }
  return null;
}

function progressBody(progress: DownloadProgress): string {
  if (progress.status === "queued") return "Queued";
  if (progress.status === "paused") return "Paused";
  if (progress.status === "completed") return "Download complete";
  if (progress.status === "error") return "Download failed";
  return `Downloading • ${progress.progress}%`;
}

export async function updateDownloadNotification(
  progress: DownloadProgress,
): Promise<void> {
  if (Platform.OS !== "android") return;
  await ensureChannel();

  const isPaused = progress.status === "paused";
  const isQueued = progress.status === "queued";
  const isActive = progress.status === "downloading" || isQueued || isPaused;

  if (!isActive) return;

  try {
    const contentIdStr = String(progress.contentId); // Ensure it's a string
    const existingId = await resolveNotificationId(contentIdStr);
    if (existingId) {
      await Notifications.dismissNotificationAsync(existingId).catch(() => {
        // If already dismissed, continue by posting a fresh one.
      });
    }

    const notificationPayload: Notifications.NotificationContentInput = {
      title: progress.title ?? "Downloading",
      body: progressBody(progress),
      sound: "default",
      data: {
        contentId: contentIdStr,
        status: progress.status,
      },
      sticky: progress.status === "downloading" || isQueued,
      autoDismiss: false,
      categoryIdentifier: CATEGORY_ID,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      color: "#E50914",
      interruptionLevel: "active",
    };

    const newId = await Notifications.scheduleNotificationAsync({
      content: notificationPayload,
      trigger: null,
    });
    notificationIds.set(contentIdStr, newId);
  } catch (error: any) {
    console.warn(
      "[DownloadNotifications] Failed to display notification:",
      error?.message,
    );
  }
}

export async function clearDownloadNotification(
  contentId: string,
): Promise<void> {
  if (Platform.OS !== "android") return;
  const id = await resolveNotificationId(contentId);
  if (id) {
    await Notifications.dismissNotificationAsync(id).catch(() => {
      // Ignore if notification no longer exists.
    });
  }
  notificationIds.delete(contentId);
}
