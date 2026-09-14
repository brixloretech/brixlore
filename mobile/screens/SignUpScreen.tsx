import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  BackHandler,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../src/theme/colors";
import { spacing, typography } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";
import { useLimitedAccessStore } from "../store/useLimitedAccessStore";
import EmailVerificationPendingScreen from "./EmailVerificationPendingScreen";

export default function SignUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    returnToVideoId?: string | string[];
    returnToEpisodeId?: string | string[];
    returnToResumeAt?: string | string[];
    fromGuestPreview?: string | string[];
  }>();
  const {
    signup,
    isAuthenticated,
    error: authError,
    clearError,
    pendingVerification,
    verificationMessage,
  } = useAuthStore();
  const setFreeUnlockedVideoId = useLimitedAccessStore(
    (state) => state.setFreeUnlockedVideoId,
  );
  const saveLimitedAccessToStorage = useLimitedAccessStore(
    (state) => state.saveToStorage,
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localErrors, setLocalErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const returnToVideoId = Array.isArray(params.returnToVideoId)
    ? params.returnToVideoId[0]
    : params.returnToVideoId;
  const returnToEpisodeId = Array.isArray(params.returnToEpisodeId)
    ? params.returnToEpisodeId[0]
    : params.returnToEpisodeId;
  const returnToResumeAt = Array.isArray(params.returnToResumeAt)
    ? params.returnToResumeAt[0]
    : params.returnToResumeAt;
  const fromGuestPreview =
    (Array.isArray(params.fromGuestPreview)
      ? params.fromGuestPreview[0]
      : params.fromGuestPreview) === "1";

  const postSignupPath = React.useMemo(() => {
    if (!returnToVideoId) return "/(tabs)";
    const queryParts: string[] = [];
    if (returnToEpisodeId) {
      queryParts.push(`episodeId=${encodeURIComponent(returnToEpisodeId)}`);
    }
    if (returnToResumeAt) {
      queryParts.push(`resumeAt=${encodeURIComponent(returnToResumeAt)}`);
    }
    return `/video/${encodeURIComponent(returnToVideoId)}${
      queryParts.length ? `?${queryParts.join("&")}` : ""
    }`;
  }, [returnToEpisodeId, returnToResumeAt, returnToVideoId]);

  const loginPath = React.useMemo(() => {
    const queryParts: string[] = [];
    if (returnToVideoId) {
      queryParts.push(`returnToVideoId=${encodeURIComponent(returnToVideoId)}`);
    }
    if (returnToEpisodeId) {
      queryParts.push(
        `returnToEpisodeId=${encodeURIComponent(returnToEpisodeId)}`,
      );
    }
    if (returnToResumeAt) {
      queryParts.push(`returnToResumeAt=${encodeURIComponent(returnToResumeAt)}`);
    }
    if (fromGuestPreview) {
      queryParts.push("fromGuestPreview=1");
    }
    return `/login${queryParts.length ? `?${queryParts.join("&")}` : ""}`;
  }, [fromGuestPreview, returnToEpisodeId, returnToResumeAt, returnToVideoId]);

  const handleSafeBack = () => {
    const canGoBack =
      typeof (router as any).canGoBack === "function" &&
      (router as any).canGoBack();

    if (canGoBack) {
      router.back();
    } else {
      router.replace("/welcome");
    }

    return true;
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleSafeBack,
    );

    return () => {
      subscription.remove();
    };
  }, [router]);


  useEffect(() => {
    if (isAuthenticated) {
      if (fromGuestPreview && returnToEpisodeId) {
        setFreeUnlockedVideoId(returnToEpisodeId);
        void saveLimitedAccessToStorage();
      }
      router.replace(postSignupPath as any);
    }
  }, [
    fromGuestPreview,
    isAuthenticated,
    postSignupPath,
    returnToEpisodeId,
    router,
    saveLimitedAccessToStorage,
    setFreeUnlockedVideoId,
  ]);

  useEffect(() => {
    if (authError) {
      setError(authError);
      setIsLoading(false);
    }
  }, [authError]);

  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return "Name is required";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email";
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password.trim()) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return null;
  };

  const handleSubmit = async () => {
    clearError();
    setError(null);
    setLocalErrors({});

    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError =
      password !== confirmPassword ? "Passwords do not match" : null;

    if (nameError || emailError || passwordError || confirmPasswordError) {
      setLocalErrors({
        name: nameError || undefined,
        email: emailError || undefined,
        password: passwordError || undefined,
        confirmPassword: confirmPasswordError || undefined,
      });
      return;
    }

    try {
      setIsLoading(true);
      await signup(name.trim(), email.trim(), password);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Keep this return after all hooks to preserve hook order across renders.
  if (pendingVerification) {
    return (
      <EmailVerificationPendingScreen
        message={verificationMessage}
        loginPath={loginPath}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.topbar}>
              <Pressable accessibilityRole="button" accessibilityLabel="Back to welcome" style={styles.backButton} onPress={handleSafeBack}>
                <Ionicons name="arrow-back" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.backText}>Back home</Text>
              </Pressable>
              <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.eyebrow}>JOIN BRIXLORE</Text>
                <Text style={styles.title}>Create your space.</Text>
                <Text style={styles.subtitle}>One account for independent films, original series, your list, and every story still to come.</Text>
              </View>
              <View style={styles.form}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={themeColors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor={themeColors.muted}
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (localErrors.name) {
                        setLocalErrors({ ...localErrors, name: undefined });
                      }
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
                {localErrors.name && (
                  <Text style={styles.errorText}>{localErrors.name}</Text>
                )}
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={themeColors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={themeColors.muted}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (localErrors.email) {
                        setLocalErrors({ ...localErrors, email: undefined });
                      }
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
                {localErrors.email && (
                  <Text style={styles.errorText}>{localErrors.email}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={themeColors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={themeColors.muted}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (localErrors.password) {
                        setLocalErrors({ ...localErrors, password: undefined });
                      }
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <Pressable
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={themeColors.textSecondary}
                    />
                  </Pressable>
                </View>
                {localErrors.password && (
                  <Text style={styles.errorText}>{localErrors.password}</Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={themeColors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor={themeColors.muted}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (localErrors.confirmPassword) {
                        setLocalErrors({
                          ...localErrors,
                          confirmPassword: undefined,
                        });
                      }
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <Pressable
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-outline" : "eye-off-outline"
                      }
                      size={20}
                      color={themeColors.textSecondary}
                    />
                  </Pressable>
                </View>
                {localErrors.confirmPassword && (
                  <Text style={styles.errorText}>
                    {localErrors.confirmPassword}
                  </Text>
                )}
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle"
                    size={20}
                    color={themeColors.error}
                  />
                  <Text style={styles.errorMessage}>{error}</Text>
                </View>
              )}

              {/* Submit Button */}
              <Pressable
                style={[
                  styles.submitButton,
                  isLoading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={themeColors.background} />
                ) : (
                  <Text style={styles.submitButtonText}>Sign Up</Text>
                )}
              </Pressable>

              <View style={styles.footer}>
                <View style={styles.footerAccount}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <Pressable onPress={() => router.replace(loginPath as any)}><Text style={styles.footerLink}>Sign in</Text></Pressable>
                </View>
                <View style={styles.secureRow}>
                  <Ionicons name="shield-checkmark-outline" size={12} color="rgba(255,255,255,0.28)" />
                  <Text style={styles.secureText}>YOUR DETAILS STAY PRIVATE</Text>
                </View>
              </View>
            </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  keyboardView: {
    flex: 1,
  },
  scrollContent: { flexGrow: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 76, paddingBottom: 22, justifyContent: "center" },
  topbar: { position: "absolute", top: 14, left: 20, right: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 10, elevation: 20 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 },
  backText: { color: "rgba(255,255,255,0.58)", fontSize: 12, fontWeight: "600" },
  logo: { width: 92, height: 30, tintColor: "#fff" },
  card: { width: "100%", maxWidth: 500, alignSelf: "center", backgroundColor: "rgba(11,11,12,0.96)", borderWidth: 1, borderColor: "rgba(255,255,255,0.11)", borderRadius: 28, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 32, shadowOffset: { width: 0, height: 18 }, elevation: 12 },
  header: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 25 },
  eyebrow: { color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", letterSpacing: 2 },
  title: { color: "#fff", fontSize: 34, lineHeight: 38, letterSpacing: -1.7, fontWeight: "600", marginTop: 12 },
  subtitle: { color: "rgba(255,255,255,0.52)", fontSize: 14, lineHeight: 21, marginTop: 11 },
  form: { paddingHorizontal: 24 },
  inputContainer: { marginBottom: 19 },
  label: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: themeColors.error,
    marginTop: spacing.xs,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.22)",
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorMessage: {
    ...typography.caption,
    color: themeColors.error,
    flex: 1,
  },
  submitButton: {
    backgroundColor: "#fff",
    paddingVertical: 17,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#050505",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: { alignItems: "center", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", marginHorizontal: -24, marginTop: 27, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 24, gap: 14 },
  footerAccount: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap" },
  footerText: { color: "rgba(255,255,255,0.45)", fontSize: 14 },
  footerLink: { color: "#fff", fontSize: 14, fontWeight: "600" },
  secureRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  secureText: { color: "rgba(255,255,255,0.27)", fontSize: 9, fontWeight: "700", letterSpacing: 1.4 },
});
