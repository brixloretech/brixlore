import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../../src/theme/colors";
import { spacing, typography, borderRadius } from "../../constants/theme";
import { useAuthStore } from "../../store/useAuthStore";
import { subscriptionService } from "../../services/subscriptionService";
import { contentService } from "../../services/contentService";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";

// ─────────────────────────────────────────────
// Guest Screen (not logged in)
// ─────────────────────────────────────────────
function GuestProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const features = [
    { icon: "play-circle-outline" as const, label: "Stream unlimited content" },
    { icon: "download-outline" as const, label: "Download for offline viewing" },
    { icon: "bookmark-outline" as const, label: "Build your personal watchlist" },
    { icon: "tv-outline" as const, label: "Watch on multiple devices" },
  ];

  return (
    <View style={[guestStyles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={themeColors.background} />
      <ScrollView
        contentContainerStyle={guestStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={guestStyles.hero}>
          {/* Icon Ring */}
          <View style={guestStyles.iconRing}>
            <Ionicons name="person-outline" size={52} color={themeColors.error} />
          </View>

          <Text style={guestStyles.heroTitle}>Welcome to Brixlore</Text>
          <Text style={guestStyles.heroSubtitle}>
            Sign in to unlock your full entertainment experience.
          </Text>
        </View>

        {/* Feature List */}
        <View style={guestStyles.featuresContainer}>
          {features.map((f) => (
            <View key={f.label} style={guestStyles.featureRow}>
              <View style={guestStyles.featureIconWrap}>
                <Ionicons name={f.icon} size={20} color={themeColors.error} />
              </View>
              <Text style={guestStyles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA Buttons */}
        <View style={guestStyles.ctaSection}>
          <Pressable
            style={({ pressed }) => [
              guestStyles.signInBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={() => router.push("/login")}
          >
            <Text style={guestStyles.signInText}>Sign In</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              guestStyles.signUpBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={() => router.push("/signup")}
          >
            <Text style={guestStyles.signUpText}>Create Account</Text>
          </Pressable>

          <Text style={guestStyles.termsNote}>
            By continuing, you agree to our{" "}
            <Text style={guestStyles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={guestStyles.termsLink}>Privacy Policy</Text>.
          </Text>
        </View>

        {/* Divider */}
        <View style={guestStyles.dividerRow}>
          <View style={guestStyles.dividerLine} />
          <Text style={guestStyles.dividerText}>or continue as guest</Text>
          <View style={guestStyles.dividerLine} />
        </View>

        {/* Guest Quick Links */}
        <View style={guestStyles.guestLinks}>
          <Pressable
            style={guestStyles.guestLinkItem}
            onPress={() => router.push("/help-support")}
          >
            <Ionicons name="help-circle-outline" size={22} color={themeColors.textSecondary} />
            <Text style={guestStyles.guestLinkText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </Pressable>
          <Pressable
            style={guestStyles.guestLinkItem}
            onPress={() => router.push("/about")}
          >
            <Ionicons name="information-circle-outline" size={22} color={themeColors.textSecondary} />
            <Text style={guestStyles.guestLinkText}>About</Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// Authenticated Profile Screen
// ─────────────────────────────────────────────
function AuthenticatedProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { subscription } = useSubscriptionStore();
  const isFreeTier = !subscription?.isSubscribed;
  const [planName, setPlanName] = useState<string | null>(null);
  const [contentCount, setContentCount] = useState<number>(0);
  const [categoriesCount, setCategoriesCount] = useState<number>(0);
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : null;

  useEffect(() => {
    let active = true;
    const loadPlanAndCounts = async () => {
      try {
        const [plans, sub, allContent, cats] = await Promise.all([
          subscriptionService.getPlans(),
          subscriptionService.getSubscription(),
          contentService.getContentForBrowse(),
          contentService.getCategories(),
        ]);
        if (!active) return;
        const match = plans.find((plan) => plan.id === sub.planId);
        setPlanName(match?.name ?? (sub.isSubscribed ? "Active" : "Free"));
        setContentCount(allContent.length);
        const filteredCats = cats.filter((c) => c.toLowerCase() !== "all");
        setCategoriesCount(filteredCats.length);
      } catch {
        if (!active) return;
        setPlanName(null);
      }
    };
    loadPlanAndCounts();
    return () => { active = false; };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color={themeColors.error} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || user?.email || "User"}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaPill}>Plan: {planName ?? "Free"}</Text>
              <Text style={styles.metaPill}>
                {memberSince ? `Member since ${memberSince}` : "Member profile"}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Snapshot Cards */}
        <View style={styles.snapshotRow}>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>Library</Text>
            <Text style={styles.snapshotValue}>{contentCount}</Text>
            <Text style={styles.snapshotSubtext}>Titles available</Text>
          </View>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotLabel}>Categories</Text>
            <Text style={styles.snapshotValue}>{categoriesCount}</Text>
            <Text style={styles.snapshotSubtext}>Collections</Text>
          </View>
          <Pressable
            style={styles.snapshotCard}
            onPress={() => router.push("/subscription")}
          >
            <Text style={styles.snapshotLabel}>Subscription</Text>
            <Text style={styles.snapshotValue} numberOfLines={1}>
              {planName ?? "Free"}
            </Text>
            <Text style={styles.snapshotSubtext} numberOfLines={2}>
              {!isFreeTier ? "Full access" : "Upgrade plan"}
            </Text>
          </Pressable>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Pressable style={styles.menuItem} onPress={() => router.push("/continue-watching")}>
            <Ionicons name="play-circle-outline" size={24} color={themeColors.textPrimary} />
            <Text style={styles.menuText}>Continue Watching</Text>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => router.push("/watch-history")}>
            <Ionicons name="time-outline" size={24} color={themeColors.textPrimary} />
            <Text style={styles.menuText}>Watch History</Text>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => router.push("/subscription")}>
            <Ionicons name="card-outline" size={24} color={themeColors.textPrimary} />
            <Text style={styles.menuText}>Subscription</Text>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => router.push("/settings")}>
            <Ionicons name="settings-outline" size={24} color={themeColors.textPrimary} />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => router.push("/help-support")}>
            <Ionicons name="help-circle-outline" size={24} color={themeColors.textPrimary} />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => router.push("/about")}>
            <Ionicons name="information-circle-outline" size={24} color={themeColors.textPrimary} />
            <Text style={styles.menuText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={themeColors.textPrimary} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// Root export: gate on authentication
// ─────────────────────────────────────────────
export default function ProfileScreen() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <GuestProfileScreen />;
  }

  return <AuthenticatedProfileScreen />;
}

// ─────────────────────────────────────────────
// Guest Styles
// ─────────────────────────────────────────────
const guestStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    alignItems: "center",
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  iconRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1.5,
    borderColor: "rgba(248, 113, 113, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
    backgroundColor: "#141418",
  },
  heroTitle: {
    ...typography.h1,
    color: themeColors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: themeColors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  featuresContainer: {
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  featureLabel: {
    ...typography.body,
    color: themeColors.textPrimary,
    flex: 1,
  },
  ctaSection: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  signInBtn: {
    backgroundColor: themeColors.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  signInText: {
    ...typography.bodyBold,
    color: "#fff",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  signUpBtn: {
    backgroundColor: "transparent",
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(248, 113, 113, 0.5)",
  },
  signUpText: {
    ...typography.bodyBold,
    color: themeColors.error,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  termsNote: {
    ...typography.small,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  termsLink: {
    color: themeColors.textSecondary,
    textDecorationLine: "underline",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: themeColors.border,
  },
  dividerText: {
    ...typography.small,
    color: "#6b7280",
    whiteSpace: "nowrap",
  } as any,
  guestLinks: {
    gap: spacing.xs,
  },
  guestLinkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    gap: spacing.md,
  },
  guestLinkText: {
    ...typography.body,
    flex: 1,
    color: themeColors.textSecondary,
    fontSize: 15,
  },
});

// ─────────────────────────────────────────────
// Authenticated Styles
// ─────────────────────────────────────────────
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
  snapshotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  snapshotCard: {
    flex: 1,
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: spacing.sm,
    minHeight: 90,
    justifyContent: "space-between",
  },
  snapshotLabel: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  snapshotValue: {
    ...typography.title,
    color: themeColors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 2,
  },
  snapshotSubtext: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontSize: 9,
  },
  menuSection: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
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
    flexDirection: "row",
    backgroundColor: "rgba(248, 113, 113, 0.12)",
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.3)",
    marginTop: spacing.md,
  },
  logoutText: {
    ...typography.bodyBold,
    fontSize: 16,
    color: themeColors.error,
  },
});
