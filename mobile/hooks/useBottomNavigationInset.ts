import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const APP_TAB_BAR_HEIGHT = 76;
const ANDROID_MIN_NAVIGATION_INSET = 10;

/**
 * Keeps scrollable content clear of both the app tab bar and Android's
 * system navigation controls when edge-to-edge mode is enabled.
 */
export function useBottomNavigationInset() {
  const insets = useSafeAreaInsets();
  const systemBottomInset = Math.max(
    insets.bottom,
    Platform.OS === "android" ? ANDROID_MIN_NAVIGATION_INSET : 0,
  );

  return {
    appBottomNavigationHeight: APP_TAB_BAR_HEIGHT + systemBottomInset,
    contentBottomPadding: APP_TAB_BAR_HEIGHT + systemBottomInset + 20,
    systemBottomInset,
  };
}
