import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../../src/theme/colors";
import { spacing, typography, borderRadius } from "../../constants/theme";
import { useAuthStore } from "../../store/useAuthStore";
import { subscriptionService } from "../../services/subscriptionService";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [planName, setPlanName] = useState<string | null>(null);
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : null;

  useEffect(() => {
    let active = true;
    const loadPlan = async () => {
      try {
        const [plans, subscription] = await Promise.all([
          subscriptionService.getPlans(),
          subscriptionService.getSubscription(),
        ]);
        if (!active) return;
        const match = plans.find((plan) => plan.id === subscription.planId);
        setPlanName(
          match?.name ?? (subscription.isSubscribed ? "Active" : "Free"),
        );
      } catch {
        if (!active) return;
        setPlanName(null);
      }
    };
    loadPlan();
    return () => {
      active = false;
    };
  }, []);

  const handleAuthAction = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    await logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color={themeColors.accent} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.name || user?.email || "User"}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaPill}>Plan: {planName ?? "Free"}</Text>
              <Text style={styles.metaPill}>
                {memberSince ? `Member since ${memberSince}` : "Member profile"}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/settings")}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={themeColors.textPrimary}
            />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={themeColors.textSecondary}
            />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/help-support")}
          >
            <Ionicons
              name="help-circle-outline"
              size={24}
              color={themeColors.textPrimary}
            />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={themeColors.textSecondary}
            />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/about")}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={themeColors.textPrimary}
            />
            <Text style={styles.menuText}>About</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={themeColors.textSecondary}
            />
          </Pressable>
        </View>

        {/* Auth Button */}
        <Pressable style={styles.logoutButton} onPress={handleAuthAction}>
          <Text style={styles.logoutText}>
            {isAuthenticated ? "Sign Out" : "Login"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    fontSize: 32,
    fontWeight: "700",
    color: themeColors.textPrimary,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: themeColors.card,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.title,
    fontSize: 18,
    fontWeight: "600",
    color: themeColors.textPrimary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body,
    fontSize: 14,
    color: themeColors.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  metaPill: {
    ...typography.caption,
    fontSize: 11,
    color: themeColors.textSecondary,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: themeColors.card,
  },
  menuSection: {
    marginBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  menuText: {
    ...typography.body,
    flex: 1,
    fontSize: 16,
    color: themeColors.textPrimary,
    marginLeft: spacing.md,
  },
  logoutButton: {
    backgroundColor: themeColors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  logoutText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.textPrimary,
  },
});
