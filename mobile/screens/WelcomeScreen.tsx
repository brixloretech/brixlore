import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../store/useAuthStore";

const ROTATING_WORDS = ["connects", "unfolds", "evolves", "streams"];
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const player = useVideoPlayer(require("../assets/LandingPageBanner.mp4"), (video) => {
    video.loop = true;
    video.muted = true;
    video.play();
  });
  const wordOpacity = useRef(new Animated.Value(1)).current;
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/(tabs)");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(wordOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(wordOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      ]).start();
      setWordIndex((current) => (current + 1) % ROTATING_WORDS.length);
    }, 2600);
    return () => clearInterval(interval);
  }, [wordOpacity]);

  const go = (path: "/(tabs)" | "/login" | "/signup") => router.replace(path);

  return (
    <View style={styles.root}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        surfaceType="textureView"
      />
      <View style={styles.videoTint} />
      <LinearGradient
        colors={["rgba(5,5,7,0.88)", "rgba(5,5,7,0.16)", "rgba(5,5,7,0.38)", "#050507"]}
        locations={[0, 0.28, 0.58, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.shell}>
          <View style={styles.topbar}>
            <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />

          </View>

          <View style={styles.hero}>
            <Text style={styles.title}>Where urban media</Text>
            <Animated.Text style={[styles.rotatingTitle, { opacity: wordOpacity }]}>{ROTATING_WORDS[wordIndex]}</Animated.Text>
            <View style={styles.rule} />
            <Text style={styles.description}>Where authentic culture meets prestige broadcast. Be the first to experience the next evolution of urban media.</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start watching Brixlore"
              disabled={isLoading}
              onPress={() => go("/(tabs)")}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, isLoading && styles.disabled]}
            >
              <Text style={styles.primaryText}>Start watching</Text>
            </Pressable>
            <View style={styles.secondaryRow}>
              <Pressable onPress={() => go("/login")} disabled={isLoading} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryText}>Log in</Text></Pressable>
              <Pressable onPress={() => go("/signup")} disabled={isLoading} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryText}>Create account</Text></Pressable>
            </View>

          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050507" },
  video: { position: "absolute", top: 0, left: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  videoTint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(4,4,6,0.24)" },
  safeArea: { flex: 1 },
  shell: { flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 15, justifyContent: "space-between" },
  topbar: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  logo: { width: 132, height: 39, tintColor: "#fff" },
  status: { flexDirection: "row", alignItems: "center", gap: 7 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d9f99d" },
  statusText: { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "700", letterSpacing: 1.4 },
  hero: { marginTop: 30, alignItems: "center" },
  kicker: { color: "rgba(255,255,255,0.62)", fontSize: 10, fontWeight: "700", letterSpacing: 2.5, marginBottom: 23 },
  title: { color: "#fff", fontSize: 42, lineHeight: 44, fontWeight: "600", letterSpacing: -2.2, textAlign: "center" },
  rotatingTitle: { color: "#fff", fontSize: 43, lineHeight: 45, fontWeight: "600", letterSpacing: -2.2, textAlign: "center" },
  rule: { width: 34, height: 1, backgroundColor: "rgba(255,255,255,0.7)", marginTop: 25, marginBottom: 18 },
  description: { maxWidth: 310, color: "rgba(255,255,255,0.78)", fontSize: 15, lineHeight: 23, textAlign: "center" },
  actions: { gap: 11 },
  primaryButton: { height: 56, borderRadius: 999, backgroundColor: "#f5f5f5", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryText: { color: "#08080a", fontSize: 14, fontWeight: "700", letterSpacing: 0.1 },
  arrow: { color: "#08080a", fontSize: 19, lineHeight: 19 },
  secondaryRow: { flexDirection: "row", gap: 11 },
  secondaryButton: { flex: 1, height: 49, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.35)", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,5,7,0.28)" },
  secondaryText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  note: { color: "rgba(255,255,255,0.5)", fontSize: 11, textAlign: "center", marginTop: 5 },
  pressed: { opacity: 0.68 },
  disabled: { opacity: 0.5 },
});
