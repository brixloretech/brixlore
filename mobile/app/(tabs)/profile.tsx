import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../../src/theme/colors";
import { spacing, typography } from "../../constants/theme";
import { useAuthStore } from "../../store/useAuthStore";
import { subscriptionService } from "../../services/subscriptionService";
import { contentService } from "../../services/contentService";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function Row({ icon, title, detail, onPress }: { icon: IconName; title: string; detail?: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
    <View style={styles.rowIcon}><Ionicons name={icon} size={18} color="rgba(255,255,255,0.82)" /></View>
    <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text>{detail ? <Text style={styles.rowDetail} numberOfLines={1}>{detail}</Text> : null}</View>
    <Ionicons name="arrow-forward" size={17} color="rgba(255,255,255,0.38)" />
  </Pressable>;
}

function GuestProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const benefits: Array<{ icon: IconName; text: string }> = [
    { icon: "play-outline", text: "Pick up any story, on any screen." },
    { icon: "bookmark-outline", text: "Keep a personal list of titles." },
    { icon: "download-outline", text: "Take your favourites offline." },
  ];
  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <StatusBar barStyle="light-content" />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View style={styles.guestHero}>
        <Text style={styles.eyebrow}>BRIXLORE / ACCOUNT</Text>
        <Text style={styles.guestTitle}>Make it{"\n"}yours.</Text>
        <View style={styles.copyRule}><Text style={styles.guestCopy}>Sign in to build your collection and make every return feel familiar.</Text></View>
        <Pressable onPress={() => router.push("/login")} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Sign in</Text><Ionicons name="arrow-up" size={16} color="#050505" /></Pressable>
        <Pressable onPress={() => router.push("/signup")} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Create an account</Text></Pressable>
      </View>
      <View style={styles.guestPanel}>
        <Text style={styles.panelLabel}>WHAT YOU UNLOCK</Text>
        {benefits.map((benefit, index) => <View key={benefit.text} style={[styles.benefit, index > 0 && styles.benefitBorder]}><Ionicons name={benefit.icon} size={19} color="rgba(255,255,255,0.78)" /><Text style={styles.benefitText}>{benefit.text}</Text></View>)}
      </View>
      <View style={styles.footerLinks}><Pressable onPress={() => router.push("/help-support")}><Text style={styles.footerLink}>Help & support</Text></Pressable><View style={styles.footerDot} /><Pressable onPress={() => router.push("/about")}><Text style={styles.footerLink}>About Brixlore</Text></Pressable></View>
    </ScrollView>
  </View>;
}

function AuthenticatedProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { subscription, fetchSubscription } = useSubscriptionStore();
  const [planName, setPlanName] = useState("Free");
  const [contentCount, setContentCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const isSubscribed = Boolean(subscription?.isSubscribed);
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Member";
  const initials = useMemo(() => displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(), [displayName]);
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : null;

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await fetchSubscription();
        const current = useSubscriptionStore.getState().subscription;
        const [plans, content, categories] = await Promise.all([subscriptionService.getPlans(), contentService.getContentForBrowse(), contentService.getCategories()]);
        if (!active) return;
        setPlanName(plans.find((plan) => plan.id === current?.planId)?.name ?? (current?.isSubscribed ? "Active membership" : "Free"));
        setContentCount(content.length);
        setCategoriesCount(categories.filter((category) => category.toLowerCase() !== "all").length);
      } catch { if (active) setPlanName("Free"); }
    })();
    return () => { active = false; };
  }, [fetchSubscription]);

  const signOut = () => { void logout(); router.replace("/login"); };
  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <StatusBar barStyle="light-content" />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View style={styles.accountHero}>
        <Text style={styles.eyebrow}>MEMBER SPACE / 01</Text>
        <View style={styles.accountTopline}><View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View><View style={styles.online}><View style={styles.onlineDot} /><Text style={styles.onlineText}>ACTIVE</Text></View></View>
        <Text style={styles.name}>{displayName}<Text style={styles.namePeriod}>.</Text></Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.copyRule}><Text style={styles.welcomeCopy}>Your personal front row is ready whenever you are.</Text></View>
      </View>
      <View style={styles.statGrid}>
        <View style={[styles.stat, styles.statBorderRight]}><Text style={styles.statValue}>{contentCount || "—"}</Text><Text style={styles.statLabel}>TITLES IN CATALOG</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{categoriesCount || "—"}</Text><Text style={styles.statLabel}>COLLECTIONS</Text></View>
      </View>
      <Pressable onPress={() => router.push("/subscription")} style={({ pressed }) => [styles.membership, pressed && styles.rowPressed]}>
        <View style={styles.membershipHeader}><Text style={styles.membershipLabel}>YOUR ACCESS</Text><Ionicons name={isSubscribed ? "checkmark-circle" : "add-circle-outline"} size={18} color="#050505" /></View>
        <Text style={styles.membershipTitle}>{planName}</Text>
        <Text style={styles.membershipCopy}>{isSubscribed ? "Your membership is active. Everything is ready to explore." : "Upgrade for uninterrupted stories and full access."}</Text>
        <View style={styles.membershipAction}><Text style={styles.membershipActionText}>{isSubscribed ? "Manage membership" : "See membership"}</Text><Ionicons name="arrow-up" size={15} color="#050505" /></View>
      </Pressable>
      <View style={styles.sectionHeader}><Text style={styles.sectionIndex}>02 / 03</Text><Text style={styles.sectionTitle}>Your activity</Text></View>
      <View style={styles.listPanel}>
        <Row icon="play-circle-outline" title="Continue watching" detail="Return to what you started" onPress={() => router.push("/continue-watching")} />
        <Row icon="time-outline" title="Watch history" detail="Every story you have played" onPress={() => router.push("/watch-history")} />
      </View>
      <View style={styles.sectionHeader}><Text style={styles.sectionIndex}>03 / 03</Text><Text style={styles.sectionTitle}>Account</Text></View>
      <View style={styles.listPanel}>
        <Row icon="settings-outline" title="Settings" detail={memberSince ? `Member since ${memberSince}` : "Preferences and account details"} onPress={() => router.push("/settings")} />
        <Row icon="help-circle-outline" title="Help & support" detail="We are here if you need us" onPress={() => router.push("/help-support")} />
        <Row icon="information-circle-outline" title="About Brixlore" onPress={() => router.push("/about")} />
      </View>
      <Pressable onPress={signOut} style={({ pressed }) => [styles.signOut, pressed && styles.rowPressed]}><Ionicons name="log-out-outline" size={18} color="rgba(255,255,255,0.7)" /><Text style={styles.signOutText}>Sign out</Text></Pressable>
    </ScrollView>
  </View>;
}

export default function ProfileScreen() { return useAuthStore((state) => state.isAuthenticated) ? <AuthenticatedProfile /> : <GuestProfile />; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050505" }, scroll: { paddingBottom: 118 },
  eyebrow: { ...typography.smallBold, color: "rgba(255,255,255,0.45)", fontSize: 10, letterSpacing: 1.8 },
  accountHero: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 28, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.13)" }, accountTopline: { marginTop: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, avatar: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", backgroundColor: "#f4f4f5" }, avatarText: { ...typography.title, color: "#050505", fontSize: 18, fontWeight: "800", letterSpacing: -0.5 }, online: { flexDirection: "row", gap: 6, alignItems: "center" }, onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#a3e635" }, onlineText: { ...typography.smallBold, color: "rgba(255,255,255,0.55)", fontSize: 9, letterSpacing: 1.2 }, name: { ...typography.h1, color: themeColors.textPrimary, fontSize: 40, lineHeight: 42, letterSpacing: -1.8, marginTop: 20 }, namePeriod: { color: "rgba(255,255,255,0.35)" }, email: { ...typography.small, color: "rgba(255,255,255,0.52)", marginTop: 6 }, copyRule: { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.5)", marginTop: 22, paddingLeft: 14, maxWidth: 290 }, welcomeCopy: { ...typography.small, color: "rgba(255,255,255,0.66)", lineHeight: 20 },
  statGrid: { flexDirection: "row", marginHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.13)" }, stat: { flex: 1, paddingVertical: 20 }, statBorderRight: { borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.13)", paddingRight: spacing.md, marginRight: spacing.md }, statValue: { ...typography.title, color: themeColors.textPrimary, fontSize: 27, lineHeight: 30, letterSpacing: -1 }, statLabel: { ...typography.smallBold, marginTop: 7, color: "rgba(255,255,255,0.43)", fontSize: 8, letterSpacing: 1.15 },
  membership: { marginHorizontal: spacing.lg, marginTop: 22, padding: 20, backgroundColor: "#f4f4f5" }, membershipHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, membershipLabel: { ...typography.smallBold, color: "rgba(0,0,0,0.52)", fontSize: 9, letterSpacing: 1.5 }, membershipTitle: { ...typography.h2, color: "#050505", fontSize: 27, lineHeight: 30, letterSpacing: -1.2, marginTop: 20 }, membershipCopy: { ...typography.small, color: "rgba(0,0,0,0.6)", lineHeight: 19, marginTop: 8, maxWidth: 290 }, membershipAction: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 20 }, membershipActionText: { ...typography.smallBold, color: "#050505", fontSize: 11 },
  sectionHeader: { flexDirection: "row", gap: 13, alignItems: "baseline", marginTop: 32, paddingHorizontal: spacing.lg, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.15)" }, sectionIndex: { ...typography.smallBold, color: "rgba(255,255,255,0.38)", fontSize: 9, letterSpacing: 1.2 }, sectionTitle: { ...typography.smallBold, color: themeColors.textPrimary, fontSize: 16, letterSpacing: -0.2 }, listPanel: { marginHorizontal: spacing.lg }, row: { minHeight: 70, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.10)", paddingVertical: 12 }, rowPressed: { opacity: 0.68 }, rowIcon: { width: 35, height: 35, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" }, rowCopy: { flex: 1, marginLeft: 12, marginRight: spacing.sm }, rowTitle: { ...typography.smallBold, color: themeColors.textPrimary, fontSize: 14 }, rowDetail: { ...typography.small, color: "rgba(255,255,255,0.46)", fontSize: 11, marginTop: 3 }, signOut: { flexDirection: "row", justifyContent: "center", gap: 8, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", marginHorizontal: spacing.lg, marginTop: 30, paddingVertical: 14 }, signOutText: { ...typography.smallBold, color: "rgba(255,255,255,0.75)", fontSize: 12 },
  guestHero: { paddingHorizontal: spacing.lg, paddingTop: 26, paddingBottom: 32, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.14)" }, guestTitle: { ...typography.h1, color: themeColors.textPrimary, fontSize: 47, lineHeight: 43, letterSpacing: -2.3, marginTop: 25 }, guestCopy: { ...typography.small, color: "rgba(255,255,255,0.65)", lineHeight: 20 }, primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#f4f4f5", paddingVertical: 15, marginTop: 28 }, primaryButtonText: { ...typography.smallBold, color: "#050505", fontSize: 13 }, secondaryButton: { alignItems: "center", paddingVertical: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", marginTop: 9 }, secondaryButtonText: { ...typography.smallBold, color: "rgba(255,255,255,0.78)", fontSize: 13 }, guestPanel: { marginHorizontal: spacing.lg, marginTop: 25, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.14)", paddingVertical: 8 }, panelLabel: { ...typography.smallBold, color: "rgba(255,255,255,0.45)", fontSize: 9, letterSpacing: 1.5, paddingTop: 10 }, benefit: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 17 }, benefitBorder: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" }, benefitText: { ...typography.small, flex: 1, color: "rgba(255,255,255,0.73)", fontSize: 13 }, footerLinks: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 28 }, footerLink: { ...typography.small, color: "rgba(255,255,255,0.42)", fontSize: 11 }, footerDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)" },
});
