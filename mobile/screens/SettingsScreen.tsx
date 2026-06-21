import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Switch,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../src/theme/colors";
import { spacing, typography, borderRadius } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";
import { accountService } from "../services/accountService";
import { subscriptionService } from "../services/subscriptionService";
import { deviceService } from "../services/deviceService";
import { authService } from "../services/authService";
import { playBillingService } from "../services/playBillingService";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { generateAccountDataPdf } from "../utils/pdfExport";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuthStore();
  const [profileDraft, setProfileDraft] = useState({
    name: "",
    phone: "",
    bio: "",
  });
  const [profileEmail, setProfileEmail] = useState("");
  const [profileCreatedAt, setProfileCreatedAt] = useState<string | null>(null);
  // Preferences removed
  const [devices, setDevices] = useState<
    Array<{
      id: string;
      deviceIdentifier: string;
      platform: string;
      lastActiveAt?: string | null;
    }>
  >([]);
  const [plans, setPlans] = useState<Array<{ id: string; name: string }>>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [nextChargeLabel, setNextChargeLabel] = useState("--");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  // Preferences removed
  const [securitySaving, setSecuritySaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNext, setPasswordNext] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const planName = useMemo(
    () => plans.find((plan) => plan.id === planId)?.name ?? null,
    [plans, planId],
  );
  const memberSince = profileCreatedAt
    ? new Date(profileCreatedAt).getFullYear()
    : user?.createdAt
      ? new Date(user.createdAt).getFullYear()
      : null;

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      setLoading(true);
      setSettingsError(null);
      try {
        const [planList, subscriptionRes, profileRes, devicesRes] =
          await Promise.all([
            subscriptionService.getPlans(),
            subscriptionService.getSubscription(),
            accountService.getProfile(),
            // Preferences removed
            deviceService.listDevices(),
          ]);
        const resolvedDevices =
          devicesRes && devicesRes.length > 0
            ? devicesRes
            : ((await accountService.exportAccountData()).devices ?? []);
        if (!active) return;
        setPlans(planList.map((plan) => ({ id: plan.id, name: plan.name })));
        setPlanId(subscriptionRes.planId ?? null);
        setNextChargeLabel(
          subscriptionRes.currentPeriodEnd
            ? new Date(subscriptionRes.currentPeriodEnd).toLocaleDateString()
            : "--",
        );
        setProfileEmail(profileRes.email ?? "");
        setProfileCreatedAt(profileRes.createdAt ?? null);
        setProfileDraft({
          name: profileRes.name ?? "",
          phone: profileRes.phone ?? "",
          bio: profileRes.bio ?? "",
        });
        // Preferences removed
        setDevices(resolvedDevices);
      } catch (err: any) {
        if (!active) return;
        setSettingsError(err?.message ?? "Failed to load settings.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };
    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  const handleSaveProfile = useCallback(async () => {
    setSettingsError(null);
    setSettingsSuccess(null);
    setSavingProfile(true);
    try {
      await accountService.updateProfile(profileDraft);
      await refreshUser();
      setSettingsSuccess("Profile updated.");
    } catch (err: any) {
      setSettingsError(err?.message ?? "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }, [profileDraft, refreshUser]);

  // Preferences save removed

  const handleChangePassword = useCallback(async () => {
    setSettingsError(null);
    setSettingsSuccess(null);
    if (!passwordCurrent || !passwordNext) {
      setSettingsError("Enter your current and new password.");
      return;
    }
    if (passwordNext !== passwordConfirm) {
      setSettingsError("New passwords do not match.");
      return;
    }
    setSecuritySaving(true);
    try {
      await authService.changePassword({
        currentPassword: passwordCurrent,
        newPassword: passwordNext,
      });
      await authService.revokeSessions();
      setPasswordCurrent("");
      setPasswordNext("");
      setPasswordConfirm("");
      setSettingsSuccess("Password updated and sessions reset.");
    } catch (err: any) {
      setSettingsError(err?.message ?? "Failed to change password.");
    } finally {
      setSecuritySaving(false);
    }
  }, [passwordCurrent, passwordNext, passwordConfirm]);

  const handleResetSessions = useCallback(async () => {
    setSettingsError(null);
    setSettingsSuccess(null);
    setSecuritySaving(true);
    try {
      const res = await authService.revokeSessions();
      setSettingsSuccess(res?.message ?? "Sessions reset.");
    } catch (err: any) {
      setSettingsError(err?.message ?? "Failed to reset sessions.");
    } finally {
      setSecuritySaving(false);
    }
  }, []);

  const handleRemoveDevice = useCallback((id: string, label: string) => {
    Alert.alert(
      "Remove device",
      `Are you sure you want to remove ${label}? This device may need to sign in again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setSettingsError(null);
            setSettingsSuccess(null);
            try {
              await deviceService.removeDevice(id);
              setDevices((prev) => prev.filter((device) => device.id !== id));
              setSettingsSuccess("Device removed.");
            } catch (err: any) {
              setSettingsError(err?.message ?? "Failed to remove device.");
            }
          },
        },
      ],
    );
  }, []);

  const handleManagePlan = useCallback(async () => {
    setSettingsError(null);
    try {
      if (Platform.OS === "android") {
        if (!playBillingService.isAvailable()) {
          setSettingsError(playBillingService.getSetupErrorMessage());
          return;
        }
        await playBillingService.openManageSubscriptions();
        return;
      }

      Alert.alert(
        "Manage on Website",
        "iOS subscriptions are managed on our website. Please upgrade or manage your plan on the website, then sign in again on the app to refresh your subscription status.",
      );
    } catch (err: any) {
      setSettingsError(err?.message ?? "Failed to open subscription options.");
    }
  }, []);

  const handleExportData = useCallback(async () => {
    setSettingsError(null);
    setSettingsSuccess(null);
    try {
      const res = await accountService.exportAccountData();
      const pdfBytes = await generateAccountDataPdf(res);
      const fileUri = `${FileSystem.cacheDirectory}account-data.pdf`;
      // Convert Uint8Array to base64 string
      const base64 =
        typeof Buffer !== "undefined"
          ? Buffer.from(pdfBytes).toString("base64")
          : btoa(String.fromCharCode(...pdfBytes));
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: "application/pdf" });
      }
      setSettingsSuccess("Account data exported as PDF.");
    } catch (err: any) {
      setSettingsError(err?.message ?? "Failed to export data.");
    }
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete account",
      "This will permanently delete your account and data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await accountService.deleteAccount();
              await logout();
              router.replace("/login");
            } catch (err: any) {
              setSettingsError(err?.message ?? "Failed to delete account.");
            }
          },
        },
      ],
    );
  }, [logout, router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accent} />
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.headerLabel}>Account settings</Text>
          <Text style={styles.headerHeading}>
            Shape your viewing experience
          </Text>
          <Text style={styles.headerSubtitle}>
            Update your profile, tune playback, and keep your account secure
            across devices.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account overview</Text>
          <View style={styles.infoCard}>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  Plan: {planName ?? (planId ? "Active" : "Free")}
                </Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {memberSince
                    ? `Member since ${memberSince}`
                    : "Member profile"}
                </Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {profileEmail ? "Email on file" : "Add an email"}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Plan</Text>
              <Text style={styles.infoValue}>{planName ?? "Free"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Next billing date</Text>
              <Text style={styles.infoValue}>{nextChargeLabel}</Text>
            </View>
            <Pressable style={styles.primaryButton} onPress={handleManagePlan}>
              <Text style={styles.primaryButtonText}>Manage plan</Text>
            </Pressable>
          </View>
        </View>

        {(settingsError || settingsSuccess) && (
          <View style={styles.alertCard}>
            {settingsError ? (
              <Text style={styles.alertError}>{settingsError}</Text>
            ) : (
              <Text style={styles.alertSuccess}>{settingsSuccess}</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              value={profileDraft.name}
              onChangeText={(text) =>
                setProfileDraft((prev) => ({ ...prev, name: text }))
              }
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={themeColors.textSecondary}
            />
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              value={profileDraft.phone}
              onChangeText={(text) =>
                setProfileDraft((prev) => ({ ...prev, phone: text }))
              }
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor={themeColors.textSecondary}
            />
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              value={profileDraft.bio}
              onChangeText={(text) =>
                setProfileDraft((prev) => ({ ...prev, bio: text }))
              }
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about yourself"
              placeholderTextColor={themeColors.textSecondary}
              multiline
            />
            <Pressable style={styles.primaryButton} onPress={handleSaveProfile}>
              <Text style={styles.primaryButtonText}>
                {savingProfile ? "Saving..." : "Save changes"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Current password</Text>
            <TextInput
              value={passwordCurrent}
              onChangeText={setPasswordCurrent}
              style={styles.input}
              placeholder="Current password"
              placeholderTextColor={themeColors.textSecondary}
              secureTextEntry
            />
            <Text style={styles.inputLabel}>New password</Text>
            <TextInput
              value={passwordNext}
              onChangeText={setPasswordNext}
              style={styles.input}
              placeholder="New password"
              placeholderTextColor={themeColors.textSecondary}
              secureTextEntry
            />
            <Text style={styles.inputLabel}>Confirm new password</Text>
            <TextInput
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={themeColors.textSecondary}
              secureTextEntry
            />
            <Pressable
              style={styles.primaryButton}
              onPress={handleChangePassword}
            >
              <Text style={styles.primaryButtonText}>
                {securitySaving ? "Saving..." : "Change password"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={handleResetSessions}
            >
              <Text style={styles.secondaryButtonText}>Reset all sessions</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Devices</Text>
          <View style={styles.formCard}>
            {devices.length === 0 ? (
              <Text style={styles.mutedText}>No devices registered.</Text>
            ) : (
              devices.map((device) => (
                <View key={device.id} style={styles.deviceRow}>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>
                      {device.deviceIdentifier}
                    </Text>
                    <Text style={styles.deviceMeta}>{device.platform}</Text>
                  </View>
                  <Pressable
                    style={styles.iconAction}
                    onPress={() =>
                      handleRemoveDevice(device.id, device.deviceIdentifier)
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={themeColors.error}
                    />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account data</Text>
          <View style={styles.formCard}>
            <Pressable
              style={styles.secondaryButton}
              onPress={handleExportData}
            >
              <Text style={styles.secondaryButtonText}>
                Export account data
              </Text>
            </Pressable>
            <Pressable
              style={styles.dangerButton}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.dangerButtonText}>Delete account</Text>
            </Pressable>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push("/help-support")}
          >
            <Ionicons
              name="help-circle-outline"
              size={24}
              color={themeColors.textPrimary}
            />
            <Text style={styles.actionButtonTextNeutral}>Help & Support</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={themeColors.textSecondary}
            />
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleLogout}>
            <Ionicons
              name="log-out-outline"
              size={24}
              color={themeColors.error}
            />
            <Text style={styles.actionButtonText}>Logout</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={themeColors.textSecondary}
            />
          </Pressable>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    color: themeColors.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  headerBlock: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerLabel: {
    ...typography.caption,
    color: themeColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  headerHeading: {
    ...typography.title,
    fontSize: 26,
    fontWeight: "700",
    color: themeColors.textPrimary,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    ...typography.body,
    color: themeColors.textSecondary,
    lineHeight: 20,
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: themeColors.textPrimary,
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tag: {
    borderWidth: 1,
    borderColor: themeColors.border,
    backgroundColor: themeColors.card,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagText: {
    ...typography.caption,
    color: themeColors.textSecondary,
    fontSize: 11,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  formCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    gap: spacing.sm,
  },
  inputLabel: {
    ...typography.caption,
    color: themeColors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: themeColors.border,
    backgroundColor: themeColors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: themeColors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionPill: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: themeColors.card,
  },
  optionPillActive: {
    borderColor: themeColors.accent,
    backgroundColor: themeColors.accent,
  },
  optionText: {
    ...typography.caption,
    color: themeColors.textSecondary,
  },
  optionTextActive: {
    ...typography.caption,
    color: themeColors.background,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  toggleLabel: {
    ...typography.body,
    color: themeColors.textPrimary,
  },
  primaryButton: {
    backgroundColor: themeColors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  primaryButtonText: {
    ...typography.body,
    color: themeColors.background,
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  secondaryButtonText: {
    ...typography.body,
    color: themeColors.textPrimary,
    fontWeight: "600",
  },
  dangerButton: {
    backgroundColor: themeColors.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  dangerButtonText: {
    ...typography.body,
    color: themeColors.textPrimary,
    fontWeight: "600",
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    ...typography.body,
    color: themeColors.textPrimary,
    fontWeight: "600",
  },
  deviceMeta: {
    ...typography.caption,
    color: themeColors.textSecondary,
  },
  iconAction: {
    padding: spacing.sm,
  },
  mutedText: {
    ...typography.body,
    color: themeColors.textSecondary,
  },
  alertCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    backgroundColor: themeColors.surface,
  },
  alertError: {
    ...typography.body,
    color: themeColors.error,
  },
  alertSuccess: {
    ...typography.body,
    color: "#22c55e",
  },
  infoLabel: {
    ...typography.body,
    color: themeColors.textSecondary,
  },
  infoValue: {
    ...typography.body,
    color: themeColors.textPrimary,
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    gap: spacing.md,
  },
  actionButtonText: {
    ...typography.body,
    color: themeColors.error,
    fontWeight: "600",
    flex: 1,
  },
  actionButtonTextNeutral: {
    ...typography.body,
    color: themeColors.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
});
