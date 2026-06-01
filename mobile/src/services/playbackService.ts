import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let backgroundAudioPlayer: AudioPlayer | null = null;
let currentNotificationId: string | null = null;
let currentMediaTitle = "";
let currentMediaUrl = "";
let audioModeReady = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: "duckOthers",
  });
  audioModeReady = true;
}

function getOrCreatePlayer(url: string): AudioPlayer {
  if (backgroundAudioPlayer && currentMediaUrl === url) {
    return backgroundAudioPlayer;
  }

  if (backgroundAudioPlayer) {
    try {
      backgroundAudioPlayer.remove();
    } catch {
      // Ignore cleanup errors
    }
  }

  const player = createAudioPlayer({ uri: url });
  backgroundAudioPlayer = player;
  currentMediaUrl = url;
  return player;
}

async function safeSetPosition(
  player: AudioPlayer,
  positionSeconds?: number,
): Promise<void> {
  if (!positionSeconds || positionSeconds <= 0) return;
  try {
    await player.seekTo(positionSeconds);
  } catch {
    // Ignore seek errors
  }
}

export async function preloadAudioFromUrl(options: {
  url: string;
  positionSeconds?: number;
  title?: string;
}): Promise<void> {
  await ensureAudioMode();
  const player = getOrCreatePlayer(options.url);
  await safeSetPosition(player, options.positionSeconds);
  currentMediaTitle = options.title || currentMediaTitle || "Playing Audio";
}

export async function playAudioFromUrl(options: {
  url: string;
  positionSeconds?: number;
  title?: string;
}): Promise<AudioPlayer> {
  await ensureAudioMode();
  const player = getOrCreatePlayer(options.url);
  await safeSetPosition(player, options.positionSeconds);

  try {
    player.play();
  } catch {
    // Ignore play errors
  }
  currentMediaTitle = options.title || "Playing Audio";

  // Show notification with controls without blocking playback
  void showMediaNotification();

  return player;
}

export async function getAudioPosition(): Promise<number> {
  if (!backgroundAudioPlayer) return 0;
  try {
    return backgroundAudioPlayer.isLoaded
      ? backgroundAudioPlayer.currentTime
      : 0;
  } catch {
    return 0;
  }
}

export async function stopAudio(): Promise<void> {
  if (backgroundAudioPlayer) {
    try {
      backgroundAudioPlayer.pause();
      backgroundAudioPlayer.remove();
    } catch {
      // Ignore errors
    }
    backgroundAudioPlayer = null;
  }

  currentMediaUrl = "";
  currentMediaTitle = "";

  // Dismiss notification
  if (currentNotificationId) {
    await Notifications.dismissNotificationAsync(currentNotificationId);
    currentNotificationId = null;
  }
}

export async function pauseAudio(): Promise<void> {
  if (!backgroundAudioPlayer) return;
  try {
    backgroundAudioPlayer.pause();
    await updateMediaNotification("paused");
  } catch {
    // Ignore errors
  }
}

export async function resumeAudio(): Promise<void> {
  if (!backgroundAudioPlayer) return;
  try {
    backgroundAudioPlayer.play();
    await updateMediaNotification("playing");
  } catch {
    // Ignore errors
  }
}

async function showMediaNotification(): Promise<void> {
  try {
    // Use scheduleNotificationAsync instead of presentNotificationAsync
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: currentMediaTitle,
        body: "🎵 Audio is playing in background",
        badge: 0,
        data: {
          action: "media_controls",
          status: "playing",
        },
        categoryIdentifier: "media",
      },
      ...(Platform.OS === "android" && {
        android: {
          channelId: "media_controls",
          color: "#E50914",
          ongoing: true,
          autoCancel: false,
          sticky: true,
        },
      }),
      trigger: null, // Show immediately
    });
    currentNotificationId = notificationId;
  } catch (error) {
    console.error("Failed to show media notification:", error);
  }
}

async function updateMediaNotification(
  status: "playing" | "paused",
): Promise<void> {
  // Dismiss old notification
  if (currentNotificationId) {
    try {
      await Notifications.dismissNotificationAsync(currentNotificationId);
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
    }
  }

  try {
    // Show updated notification
    const body =
      status === "playing"
        ? "🎵 Audio is playing in background"
        : "⏸️ Audio is paused in background";
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: currentMediaTitle,
        body: body,
        badge: 0,
        data: {
          action: "media_controls",
          status: status,
        },
        categoryIdentifier: "media",
      },
      ...(Platform.OS === "android" && {
        android: {
          channelId: "media_controls",
          color: "#E50914",
          ongoing: true,
          autoCancel: false,
          sticky: true,
        },
      }),
      trigger: null, // Show immediately
    });
    currentNotificationId = notificationId;
  } catch (error) {
    console.error("Failed to update media notification:", error);
  }
}
