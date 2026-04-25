import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors as themeColors } from "../src/theme/colors";
import { borderRadius, spacing, typography } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";
import { siteService } from "../services/siteService";

export default function HelpSupportScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formDisabled = useMemo(() => submitting, [submitting]);

  const validateEmail = (value: string): string | null => {
    if (!value.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) return "Enter a valid email";
    return null;
  };

  const validateRequired = (value: string, label: string): string | null => {
    if (!value.trim()) return `${label} is required`;
    return null;
  };

  const runValidation = (): boolean => {
    const nextErrors = {
      name: validateRequired(name, "Name") ?? undefined,
      email: validateEmail(email) ?? undefined,
      subject: validateRequired(subject, "Subject") ?? undefined,
      message: validateRequired(message, "Message") ?? undefined,
    };
    setErrors(nextErrors);
    return (
      !nextErrors.name &&
      !nextErrors.email &&
      !nextErrors.subject &&
      !nextErrors.message
    );
  };

  const handleSubmit = async () => {
    setNotice(null);
    setSubmitError(null);
    if (!runValidation()) return;

    setSubmitting(true);
    try {
      const res = await siteService.submitContact({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setNotice(res.message);
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setSubmitError(err?.message ?? "Failed to send request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactEmail = () => {
    Alert.alert(
      "Support email",
      "For urgent issues, email support@brixlore.com",
    );
  };

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons
                name="help-circle-outline"
                size={22}
                color={themeColors.textPrimary}
              />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>We are here to help</Text>
              <Text style={styles.heroSubtitle}>
                Tell us what is going on and our support team will respond soon.
              </Text>
            </View>
          </View>

          {notice ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          {submitError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact support</Text>
            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={themeColors.textSecondary}
                editable={!formDisabled}
              />
              {errors.name ? (
                <Text style={styles.fieldError}>{errors.name}</Text>
              ) : null}

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={themeColors.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!formDisabled}
              />
              {errors.email ? (
                <Text style={styles.fieldError}>{errors.email}</Text>
              ) : null}

              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                style={styles.input}
                placeholder="How can we help?"
                placeholderTextColor={themeColors.textSecondary}
                editable={!formDisabled}
              />
              {errors.subject ? (
                <Text style={styles.fieldError}>{errors.subject}</Text>
              ) : null}

              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                style={[styles.input, styles.textArea]}
                placeholder="Describe your issue"
                placeholderTextColor={themeColors.textSecondary}
                multiline
                editable={!formDisabled}
              />
              {errors.message ? (
                <Text style={styles.fieldError}>{errors.message}</Text>
              ) : null}

              <Pressable
                style={styles.primaryButton}
                onPress={handleSubmit}
                disabled={formDisabled}
              >
                <Text style={styles.primaryButtonText}>
                  {submitting ? "Sending..." : "Send request"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={handleContactEmail}
                disabled={formDisabled}
              >
                <Text style={styles.secondaryButtonText}>
                  Email support directly
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
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
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: themeColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    ...typography.sectionTitle,
    color: themeColors.textPrimary,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.body,
    color: themeColors.textSecondary,
    lineHeight: 20,
  },
  noticeCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#155e37",
    backgroundColor: "#052e16",
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: {
    ...typography.body,
    color: "#86efac",
  },
  errorCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.error,
    backgroundColor: "#3b0d0d",
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: themeColors.error,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: themeColors.textPrimary,
    marginBottom: spacing.md,
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
    minHeight: 120,
    textAlignVertical: "top",
  },
  fieldError: {
    ...typography.caption,
    color: themeColors.error,
  },
  primaryButton: {
    backgroundColor: themeColors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    marginTop: spacing.sm,
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
});
