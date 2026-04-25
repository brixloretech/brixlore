import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let backgroundAudioPlayer: Audio.Sound | null = null;
let currentNotificationId: string | null = null;
let currentMediaTitle = "";
let currentMediaUrl = "";
let audioModeReady = false;
let audioLoadPromise: Promise<void> | null = null;

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
  });
  audioModeReady = true;
}

async function getOrCreatePlayer(url: string): Promise<Audio.Sound> {
  if (backgroundAudioPlayer && currentMediaUrl === url) {
    return backgroundAudioPlayer;
  }

  if (backgroundAudioPlayer) {
    try {
      await backgroundAudioPlayer.unloadAsync();
    } catch {
      // Ignore unload errors
    }
  }

  const player = new Audio.Sound();
  audioLoadPromise = player.loadAsync({ uri: url }).then(() => {
    audioLoadPromise = null;
  });
  await audioLoadPromise;
  backgroundAudioPlayer = player;
  currentMediaUrl = url;
  return player;
}

async function ensurePlayerLoaded(
  player: Audio.Sound,
  url: string,
): Promise<void> {
  if (audioLoadPromise) {
    await audioLoadPromise;
  }

  const status = await player.getStatusAsync();
  if (status.isLoaded) return;

  audioLoadPromise = player.loadAsync({ uri: url }).then(() => {
    audioLoadPromise = null;
  });
  await audioLoadPromise;
}

async function safeSetPosition(
  player: Audio.Sound,
  url: string,
  positionSeconds?: number,
): Promise<void> {
  if (!positionSeconds || positionSeconds <= 0) return;
  await ensurePlayerLoaded(player, url);

  const status = await player.getStatusAsync();
  if (!status.isLoaded) return;

  try {
    await player.setPositionAsync(positionSeconds * 1000);
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
  const player = await getOrCreatePlayer(options.url);
  await safeSetPosition(player, options.url, options.positionSeconds);

  currentMediaTitle = options.title || currentMediaTitle || "Playing Audio";
}

export async function playAudioFromUrl(options: {
  url: string;
  positionSeconds?: number;
  title?: string;
}): Promise<Audio.Sound> {
  await ensureAudioMode();
  const player = await getOrCreatePlayer(options.url);
  await safeSetPosition(player, options.url, options.positionSeconds);

  try {
    await player.playAsync();
  } catch {
    await ensurePlayerLoaded(player, options.url);
    await player.playAsync();
  }
  currentMediaTitle = options.title || "Playing Audio";

  // Show notification with controls without blocking playback
  void showMediaNotification();

  return player;
}

export async function getAudioPosition(): Promise<number> {
  if (!backgroundAudioPlayer) return 0;
  try {
    const status = await backgroundAudioPlayer.getStatusAsync();
    return status.isLoaded && status.positionMillis
      ? status.positionMillis / 1000
      : 0;
  } catch {
    return 0;
  }
}

export async function stopAudio(): Promise<void> {
  if (backgroundAudioPlayer) {
    try {
      await backgroundAudioPlayer.pauseAsync();
      await backgroundAudioPlayer.unloadAsync();
      backgroundAudioPlayer = null;
    } catch {
      // Ignore errors
      backgroundAudioPlayer = null;
    }
  }

  audioLoadPromise = null;

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
    await backgroundAudioPlayer.pauseAsync();
    await updateMediaNotification("paused");
  } catch {
    // Ignore errors
  }
}

export async function resumeAudio(): Promise<void> {
  if (!backgroundAudioPlayer) return;
  try {
    await backgroundAudioPlayer.playAsync();
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
