// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { View, StyleSheet, Pressable, Text, Image } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useRouter } from "expo-router";
// import { Video, ResizeMode, type AVPlaybackStatus } from "expo-av";
// import { LinearGradient } from "expo-linear-gradient";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useAuthStore } from "../store/useAuthStore";
// import { siteService } from "../services/siteService";

// type BrandingSettings = {
//   mobileWelcomeVideoUrl?: string;
// };

// const WELCOME_VIDEO_URL_CACHE_KEY = "@welcome_video_url";

// function parseBranding(content?: string | null): BrandingSettings {
//   if (!content) return {};
//   try {
//     const data = JSON.parse(content) as BrandingSettings;
//     return {
//       mobileWelcomeVideoUrl:
//         typeof data.mobileWelcomeVideoUrl === "string" &&
//         data.mobileWelcomeVideoUrl.trim().length > 0
//           ? data.mobileWelcomeVideoUrl.trim()
//           : undefined,
//     };
//   } catch {
//     return {};
//   }
// }

// export default function WelcomeScreen() {
//   const router = useRouter();
//   const { isAuthenticated, isLoading } = useAuthStore();
//   const [videoUrl, setVideoUrl] = useState<string | null>(null);
//   const videoRef = useRef<Video | null>(null);
//   const lastResumeAttemptRef = useRef(0);

//   useEffect(() => {
//     if (!isLoading && isAuthenticated) {
//       router.replace("/(tabs)");
//     }
//   }, [isAuthenticated, isLoading, router]);

//   const updateVideoUrl = useCallback((nextUrl: string | null) => {
//     if (!nextUrl) return;
//     setVideoUrl((currentUrl) =>
//       currentUrl === nextUrl ? currentUrl : nextUrl,
//     );
//   }, []);

//   const fetchRemoteVideoUrl = useCallback(async () => {
//     try {
//       const brandingPage = await siteService.getPage("branding");
//       const branding = parseBranding(brandingPage?.content ?? "");
//       const remoteUrl = branding.mobileWelcomeVideoUrl?.trim();

//       if (!remoteUrl) {
//         return;
//       }

//       updateVideoUrl(remoteUrl);
//       await AsyncStorage.setItem(WELCOME_VIDEO_URL_CACHE_KEY, remoteUrl);
//     } catch {
//       // Keep current URL and fail silently
//     }
//   }, [updateVideoUrl]);

//   useEffect(() => {
//     let mounted = true;

//     const loadBranding = async () => {
//       try {
//         const cachedUrl = await AsyncStorage.getItem(
//           WELCOME_VIDEO_URL_CACHE_KEY,
//         );
//         if (mounted && cachedUrl && cachedUrl.trim().length > 0) {
//           updateVideoUrl(cachedUrl.trim());
//         }
//       } catch {
//         // Ignore cache read failures
//       }
//     };

//     void loadBranding();
//     void fetchRemoteVideoUrl();

//     return () => {
//       mounted = false;
//     };
//   }, [fetchRemoteVideoUrl, updateVideoUrl]);

//   const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
//     if (!status.isLoaded) {
//       return;
//     }

//     const stalledWhileShouldPlay =
//       status.shouldPlay && !status.isPlaying && !status.isBuffering;

//     if (!stalledWhileShouldPlay) {
//       return;
//     }

//     const now = Date.now();
//     if (now - lastResumeAttemptRef.current < 1500) {
//       return;
//     }

//     lastResumeAttemptRef.current = now;
//     videoRef.current?.playAsync().catch(() => {
//       // Ignore playback retry failures
//     });
//   }, []);

//   return (
//     <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
//       {/* Video Background Layer */}
//       <View style={styles.backgroundLayer}>
//         {videoUrl ? (
//           <Video
//             ref={(ref) => {
//               videoRef.current = ref;
//             }}
//             source={{ uri: videoUrl }}
//             style={StyleSheet.absoluteFill}
//             shouldPlay
//             isLooping
//             isMuted
//             resizeMode={ResizeMode.COVER}
//             progressUpdateIntervalMillis={1000}
//             onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
//             onError={() => {
//               void fetchRemoteVideoUrl();
//             }}
//           />
//         ) : (
//           <View style={styles.fallbackBackground} />
//         )}

//         {/* Gradient Overlay - stronger at bottom */}
//         <LinearGradient
//           colors={["rgba(0,0,0,0.06)", "rgba(0,0,0,0.22)", "rgba(0,0,0,0.58)"]}
//           locations={[0, 0.5, 1]}
//           style={StyleSheet.absoluteFill}
//           pointerEvents="none"
//         />
//       </View>

//       {/* Content Container */}
//       <View style={styles.content}>
//         {/* Logo */}
//         <View style={styles.logoContainer}>
//           <Image
//             source={require("../assets/logo.png")}
//             style={styles.logo}
//             resizeMode="contain"
//           />
//         </View>

//         {/* Text Section */}
//         <View style={styles.textSection}>
//           <Text style={styles.mainText}>Culture With Substance</Text>
//           <Text style={styles.subtitleText}>
//             Join Brixlore and step into stories shaped by culture
//           </Text>
//         </View>

//         {/* Buttons Section */}
//         <View style={styles.buttonsSection}>
//           {/* Primary Button - Start Watching (Yellow/Accent) */}
//           <Pressable
//             style={({ pressed }) => [
//               styles.primaryButton,
//               pressed && styles.primaryButtonPressed,
//               isLoading && styles.buttonDisabled,
//             ]}
//             disabled={isLoading}
//             onPress={() => router.replace("/(tabs)")}
//           >
//             <Text style={styles.primaryButtonText}>Start Watching</Text>
//           </Pressable>

//           {/* Secondary Button - Login (Orange Outline) */}
//           <Pressable
//             style={({ pressed }) => [
//               styles.secondaryButton,
//               pressed && styles.secondaryButtonPressed,
//               isLoading && styles.buttonDisabled,
//             ]}
//             disabled={isLoading}
//             onPress={() => router.replace("/login")}
//           >
//             <Text style={styles.secondaryButtonText}>Log In</Text>
//           </Pressable>

//           {/* Create Account Link */}
//           <View style={styles.linkSection}>
//             <Text style={styles.linkText}>or </Text>
//             <Pressable onPress={() => router.replace("/signup")}>
//               <Text style={styles.createAccountLink}>Create Account</Text>
//             </Pressable>
//           </View>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#000000",
//   },
//   backgroundLayer: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "#000000",
//   },
//   fallbackBackground: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "#000000",
//   },
//   content: {
//     flex: 1,
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingTop: 40,
//     paddingBottom: 48,
//   },
//   logoContainer: {
//     alignItems: "center",
//     marginBottom: 24,
//   },
//   logo: {
//     width: 220,
//     height: 66,
//   },
//   textSection: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 40,
//   },
//   mainText: {
//     color: "#FFFFFF",
//     fontSize: 27,
//     fontWeight: "800",
//     lineHeight: 34,
//     textAlign: "center",
//     marginHorizontal: 12,
//   },
//   subtitleText: {
//     color: "#FFFFFF",
//     fontSize: 15,
//     fontWeight: "500",
//     lineHeight: 22,
//     textAlign: "center",
//     marginTop: 10,
//     marginHorizontal: 20,
//     opacity: 0.9,
//   },
//   buttonsSection: {
//     gap: 14,
//   },
//   // Primary Button - Filled White (Start Watching)
//   primaryButton: {
//     height: 50,
//     borderRadius: 4,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#FFFFFF",
//   },
//   primaryButtonPressed: {
//     opacity: 0.85,
//   },
//   primaryButtonText: {
//     color: "#000000",
//     fontSize: 16,
//     fontWeight: "700",
//     lineHeight: 18,
//   },
//   // Secondary Button - Outlined White (Log In)
//   secondaryButton: {
//     height: 50,
//     borderRadius: 4,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "transparent",
//     borderWidth: 2,
//     borderColor: "#FFFFFF",
//   },
//   secondaryButtonPressed: {
//     opacity: 0.8,
//   },
//   secondaryButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "700",
//     lineHeight: 18,
//   },
//   buttonDisabled: {
//     opacity: 0.5,
//   },
//   // Create Account Section
//   linkSection: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 12,
//   },
//   linkText: {
//     color: "#FFFFFF",
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   createAccountLink: {
//     color: "#FFFFFF",
//     fontSize: 14,
//     fontWeight: "700",
//     textDecorationLine: "underline",
//   },
// });

// "use client";

// import React, { useCallback, useEffect, useRef } from "react";
// import { View, StyleSheet, Pressable, Text, Image } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useRouter } from "expo-router";
// import { Video, ResizeMode, type AVPlaybackStatus } from "expo-av";
// import { LinearGradient } from "expo-linear-gradient";
// import { useAuthStore } from "../store/useAuthStore";

// export default function WelcomeScreen() {
//   const router = useRouter();
//   const { isAuthenticated, isLoading } = useAuthStore();

//   const videoRef = useRef<Video | null>(null);
//   const lastResumeAttemptRef = useRef(0);

//   // Redirect if already logged in
//   useEffect(() => {
//     if (!isLoading && isAuthenticated) {
//       router.replace("/(tabs)");
//     }
//   }, [isAuthenticated, isLoading, router]);

//   // 🔥 Fix freeze / stuck playback
//   const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
//     if (!status.isLoaded) return;

//     const stalled =
//       status.shouldPlay && !status.isPlaying && !status.isBuffering;

//     if (!stalled) return;

//     const now = Date.now();
//     if (now - lastResumeAttemptRef.current < 1500) return;

//     lastResumeAttemptRef.current = now;

//     videoRef.current?.playAsync().catch(() => {});
//   }, []);

//   return (
//     <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
//       {/* 🎥 FULLSCREEN VIDEO BACKGROUND */}
//       <View style={styles.backgroundLayer}>
//         <Video
//           ref={(ref) => {
//             videoRef.current = ref;
//           }}
//           source={require("../assets/BannerVideo.mp4")} // ✅ LOCAL VIDEO
//           style={StyleSheet.absoluteFill} // ✅ FULL WIDTH + HEIGHT
//           shouldPlay
//           isLooping
//           isMuted
//           resizeMode={ResizeMode.COVER} // ✅ COVER FULL SCREEN
//           progressUpdateIntervalMillis={1000}
//           onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
//         />

//         {/* 🌑 Gradient overlay */}
//         <LinearGradient
//           colors={["rgba(0,0,0,0.06)", "rgba(0,0,0,0.22)", "rgba(0,0,0,0.58)"]}
//           locations={[0, 0.5, 1]}
//           style={StyleSheet.absoluteFill}
//           pointerEvents="none"
//         />
//       </View>

//       {/* CONTENT */}
//       <View style={styles.content}>
//         {/* LOGO */}
//         <View style={styles.logoContainer}>
//           <Image
//             source={require("../assets/logo.png")}
//             style={styles.logo}
//             resizeMode="contain"
//           />
//         </View>

//         {/* TEXT */}
//         <View style={styles.textSection}>
//           <Text style={styles.mainText}>Culture With Substance</Text>
//           <Text style={styles.subtitleText}>
//             Join Brixlore and step into stories shaped by culture
//           </Text>
//         </View>

//         {/* BUTTONS */}
//         <View style={styles.buttonsSection}>
//           {/* START WATCHING */}
//           <Pressable
//             style={({ pressed }) => [
//               styles.primaryButton,
//               pressed && styles.primaryButtonPressed,
//               isLoading && styles.buttonDisabled,
//             ]}
//             disabled={isLoading}
//             onPress={() => router.replace("/(tabs)")}
//           >
//             <Text style={styles.primaryButtonText}>Start Watching</Text>
//           </Pressable>

//           {/* LOGIN */}
//           <Pressable
//             style={({ pressed }) => [
//               styles.secondaryButton,
//               pressed && styles.secondaryButtonPressed,
//               isLoading && styles.buttonDisabled,
//             ]}
//             disabled={isLoading}
//             onPress={() => router.replace("/login")}
//           >
//             <Text style={styles.secondaryButtonText}>Log In</Text>
//           </Pressable>

//           {/* CREATE ACCOUNT */}
//           <View style={styles.linkSection}>
//             <Text style={styles.linkText}>or </Text>
//             <Pressable onPress={() => router.replace("/signup")}>
//               <Text style={styles.createAccountLink}>Create Account</Text>
//             </Pressable>
//           </View>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#000000",
//   },
//   backgroundLayer: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "#000000",
//   },
//   content: {
//     flex: 1,
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingTop: 40,
//     paddingBottom: 48,
//   },
//   logoContainer: {
//     alignItems: "center",
//     marginBottom: 24,
//   },
//   logo: {
//     width: 220,
//     height: 66,
//   },
//   textSection: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 40,
//   },
//   mainText: {
//     color: "#FFFFFF",
//     fontSize: 27,
//     fontWeight: "800",
//     lineHeight: 34,
//     textAlign: "center",
//     marginHorizontal: 12,
//   },
//   subtitleText: {
//     color: "#FFFFFF",
//     fontSize: 15,
//     fontWeight: "500",
//     lineHeight: 22,
//     textAlign: "center",
//     marginTop: 10,
//     marginHorizontal: 20,
//     opacity: 0.9,
//   },
//   buttonsSection: {
//     gap: 14,
//   },
//   primaryButton: {
//     height: 50,
//     borderRadius: 4,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#FFFFFF",
//   },
//   primaryButtonPressed: {
//     opacity: 0.85,
//   },
//   primaryButtonText: {
//     color: "#000000",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   secondaryButton: {
//     height: 50,
//     borderRadius: 4,
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 2,
//     borderColor: "#FFFFFF",
//   },
//   secondaryButtonPressed: {
//     opacity: 0.8,
//   },
//   secondaryButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   buttonDisabled: {
//     opacity: 0.5,
//   },
//   linkSection: {
//     flexDirection: "row",
//     justifyContent: "center",
//     marginTop: 12,
//   },
//   linkText: {
//     color: "#FFFFFF",
//     fontSize: 14,
//   },
//   createAccountLink: {
//     color: "#FFFFFF",
//     fontSize: 14,
//     fontWeight: "700",
//     textDecorationLine: "underline",
//   },
// });

"use client";

import React, { useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEventListener } from "expo";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../store/useAuthStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen"); // "screen" not "window" — gets true full size

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const player = useVideoPlayer(require("../assets/LandingPageBanner.mp4"), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, router]);

  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "readyToPlay" && !player.playing) {
      player.play();
    }
  });

  return (
    // Outer View — plain, no safe area, fills entire screen including notch/home bar
    <View style={styles.root}>
      {/* VIDEO — absolutely positioned, true full screen */}
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      {/* GRADIENT OVERLAY */}
      <LinearGradient
        colors={["rgba(0,0,0,0.06)", "rgba(0,0,0,0.22)", "rgba(0,0,0,0.58)"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* CONTENT — SafeAreaView only here so buttons/text respect notch */}
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          {/* LOGO */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* TEXT */}
          <View style={styles.textSection}>
            <Text style={styles.mainText}>Built From Culture</Text>
            <Text style={styles.subtitleText}>
              Join Brixlore and Access the Urban Archive
            </Text>
          </View>

          {/* BUTTONS */}
          <View style={styles.buttonsSection}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                isLoading && styles.buttonDisabled,
              ]}
              disabled={isLoading}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={styles.primaryButtonText}>Start Watching</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
                isLoading && styles.buttonDisabled,
              ]}
              disabled={isLoading}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.secondaryButtonText}>Log In</Text>
            </Pressable>

            <View style={styles.linkSection}>
              <Text style={styles.linkText}>or </Text>
              <Pressable onPress={() => router.replace("/signup")}>
                <Text style={styles.createAccountLink}>Create Account</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 48,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 220,
    height: 66,
  },
  textSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  mainText: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    lineHeight: 34,
    textAlign: "center",
    marginHorizontal: 12,
  },
  subtitleText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    marginHorizontal: 20,
    opacity: 0.9,
  },
  buttonsSection: {
    gap: 14,
  },
  primaryButton: {
    height: 50,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  primaryButtonPressed: { opacity: 0.85 },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    height: 50,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  secondaryButtonPressed: { opacity: 0.8 },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: { opacity: 0.5 },
  linkSection: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  linkText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  createAccountLink: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

// "use client";

// import React, { useCallback, useEffect, useRef } from "react";
// import { View, StyleSheet, Pressable, Text, Image } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useRouter } from "expo-router";
// import { Video, ResizeMode, type AVPlaybackStatus } from "expo-av";
// import { LinearGradient } from "expo-linear-gradient";
// import { useAuthStore } from "../store/useAuthStore";

// const VIDEO_URL = "https://brixlore.vercel.app/LandingPageBanner.mp4";

// export default function WelcomeScreen() {
//   const router = useRouter();
//   const { isAuthenticated, isLoading } = useAuthStore();

//   const videoRef = useRef<Video | null>(null);
//   const lastResumeAttemptRef = useRef<number>(0);

//   useEffect(() => {
//     if (!isLoading && isAuthenticated) {
//       router.replace("/(tabs)");
//     }
//   }, [isAuthenticated, isLoading, router]);

//   const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
//     if (!status.isLoaded) return;

//     const stalled =
//       status.shouldPlay && !status.isPlaying && !status.isBuffering;

//     if (!stalled) return;

//     const now = Date.now();
//     if (now - lastResumeAttemptRef.current < 1500) return;

//     lastResumeAttemptRef.current = now;

//     videoRef.current?.playAsync().catch(() => {});
//   }, []);

//   return (
//     <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
//       {/* Background Video */}
//       <View style={styles.backgroundLayer}>
//         <Video
//           ref={(ref) => {
//             videoRef.current = ref;
//           }}
//           source={{ uri: VIDEO_URL }}
//           style={StyleSheet.absoluteFill}
//           shouldPlay
//           isLooping
//           isMuted
//           resizeMode={ResizeMode.COVER}
//           useNativeControls={false}
//           progressUpdateIntervalMillis={1000}
//           onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
//           onError={(err) => {
//             console.log("Video error:", err);
//           }}
//         />

//         {/* Gradient Overlay */}
//         <LinearGradient
//           colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.65)"]}
//           locations={[0, 0.5, 1]}
//           style={StyleSheet.absoluteFill}
//           pointerEvents="none"
//         />
//       </View>

//       {/* Content */}
//       <View style={styles.content}>
//         <View style={styles.logoContainer}>
//           <Image
//             source={require("../assets/logo.png")}
//             style={styles.logo}
//             resizeMode="contain"
//           />
//         </View>

//         <View style={styles.textSection}>
//           <Text style={styles.mainText}>Culture With Substance</Text>
//           <Text style={styles.subtitleText}>
//             Join Brixlore and step into stories shaped by culture
//           </Text>
//         </View>

//         <View style={styles.buttonsSection}>
//           <Pressable
//             style={styles.primaryButton}
//             onPress={() => router.replace("/(tabs)")}
//           >
//             <Text style={styles.primaryButtonText}>Start Watching</Text>
//           </Pressable>

//           <Pressable
//             style={styles.secondaryButton}
//             onPress={() => router.replace("/login")}
//           >
//             <Text style={styles.secondaryButtonText}>Log In</Text>
//           </Pressable>

//           <View style={styles.linkSection}>
//             <Text style={styles.linkText}>or </Text>
//             <Pressable onPress={() => router.replace("/signup")}>
//               <Text style={styles.createAccountLink}>Create Account</Text>
//             </Pressable>
//           </View>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#000",
//   },
//   backgroundLayer: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "#000",
//   },
//   content: {
//     flex: 1,
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingTop: 40,
//     paddingBottom: 48,
//   },
//   logoContainer: {
//     alignItems: "center",
//   },
//   logo: {
//     width: 220,
//     height: 66,
//   },
//   textSection: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   mainText: {
//     color: "#fff",
//     fontSize: 27,
//     fontWeight: "800",
//     textAlign: "center",
//   },
//   subtitleText: {
//     color: "#fff",
//     fontSize: 15,
//     marginTop: 10,
//     textAlign: "center",
//     opacity: 0.9,
//   },
//   buttonsSection: {
//     gap: 14,
//   },
//   primaryButton: {
//     height: 50,
//     borderRadius: 4,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#fff",
//   },
//   primaryButtonText: {
//     color: "#000",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   secondaryButton: {
//     height: 50,
//     borderRadius: 4,
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 2,
//     borderColor: "#fff",
//   },
//   secondaryButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   linkSection: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   linkText: {
//     color: "#fff",
//   },
//   createAccountLink: {
//     color: "#fff",
//     fontWeight: "700",
//     textDecorationLine: "underline",
//   },
// });
