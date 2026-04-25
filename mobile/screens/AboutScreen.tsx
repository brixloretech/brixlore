import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors as themeColors } from "../src/theme/colors";
import { borderRadius, spacing, typography } from "../constants/theme";

export default function AboutScreen() {
  const router = useRouter();

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
        <Text style={styles.headerTitle}>About us</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <Ionicons
            name="sparkles-outline"
            size={28}
            color={themeColors.textPrimary}
          />
          <Text style={styles.heroTitle}>Brixlore Streaming</Text>
          <Text style={styles.heroSubtitle}>
            Curated stories, bold originals, and a cinematic home for creators.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Our mission</Text>
          <Text style={styles.sectionBody}>
            We build a premium streaming experience that balances discovery,
            community, and craft. Every feature is designed to help you find the
            next story you will love.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What we stand for</Text>
          <View style={styles.bulletRow}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={themeColors.accent}
            />
            <Text style={styles.bulletText}>Creator-first storytelling</Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={themeColors.accent}
            />
            <Text style={styles.bulletText}>Smart, human recommendations</Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={themeColors.accent}
            />
            <Text style={styles.bulletText}>Secure, private viewing</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Version</Text>
          <Text style={styles.sectionBody}>Brixlore Mobile 1.0.0</Text>
        </View>
      </ScrollView>
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  heroCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...typography.title,
    color: themeColors.textPrimary,
  },
  heroSubtitle: {
    ...typography.body,
    color: themeColors.textSecondary,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: themeColors.textPrimary,
  },
  sectionBody: {
    ...typography.body,
    color: themeColors.textSecondary,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bulletText: {
    ...typography.body,
    color: themeColors.textPrimary,
  },
});
