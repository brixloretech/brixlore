import React, { useState, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../src/theme/colors";
import { spacing, typography } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";
import { useLimitedAccessStore } from "../store/useLimitedAccessStore";
import EmailVerificationPendingScreen from "./EmailVerificationPendingScreen";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    returnToVideoId?: string | string[];
    returnToEpisodeId?: string | string[];
    returnToResumeAt?: string | string[];
    fromGuestPreview?: string | string[];
  }>();
  const { login, isLoading, error, clearError, isAuthenticated, pendingVerification, verificationMessage } = useAuthStore();
  const setFreeUnlockedVideoId = useLimitedAccessStore(
    (state) => state.setFreeUnlockedVideoId,
  );
  const saveLimitedAccessToStorage = useLimitedAccessStore(
    (state) => state.saveToStorage,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginInProgress, setIsLoginInProgress] = useState(false); // Track actual login attempt
  const [localErrors, setLocalErrors] = useState<{
    email?: string;
    password?: string;
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

  const postLoginPath = React.useMemo(() => {
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

  const signupPath = React.useMemo(() => {
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
    return `/signup${queryParts.length ? `?${queryParts.join("&")}` : ""}`;
  }, [fromGuestPreview, returnToEpisodeId, returnToResumeAt, returnToVideoId]);

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

  // Reset login state when component mounts (in case isLoading is stuck from checkAuth)
  useEffect(() => {
    // If isLoading is true but we're on login screen and not authenticated, it's probably from checkAuth
    // Reset it immediately since we're on the login screen
    if (isLoading && !isAuthenticated && !isLoginInProgress) {
      useAuthStore.setState({ isLoading: false });
    }
  }, []); // Only run on mount

  // Monitor auth state to navigate on success
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      if (fromGuestPreview && returnToEpisodeId) {
        setFreeUnlockedVideoId(returnToEpisodeId);
        void saveLimitedAccessToStorage();
      }
      router.replace(postLoginPath as any);
    }
  }, [
    fromGuestPreview,
    isAuthenticated,
    isLoading,
    postLoginPath,
    returnToEpisodeId,
    router,
    saveLimitedAccessToStorage,
    setFreeUnlockedVideoId,
  ]);

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
    // Prevent multiple simultaneous login attempts
    if (isLoginInProgress || isLoading) {
      return;
    }

    clearError();
    setLocalErrors({});

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setLocalErrors({
        email: emailError || undefined,
        password: passwordError || undefined,
      });
      return;
    }

    try {
      setIsLoginInProgress(true);
      await login(email.trim(), password);
      // Navigation will happen via useEffect when isAuthenticated changes
    } catch (err: any) {
      // Error is handled by store - isLoading should be false now
    } finally {
      setIsLoginInProgress(false);
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
            {/* Logo/Title */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
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
                    editable={!isLoginInProgress}
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
                    editable={!isLoginInProgress}
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
                <Pressable
                  style={styles.forgotPasswordButton}
                  onPress={() => router.push("/forgot-password")}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot password?
                  </Text>
                </Pressable>
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
                  isLoginInProgress && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isLoginInProgress}
              >
                {isLoginInProgress ? (
                  <ActivityIndicator color={themeColors.background} />
                ) : (
                  <Text style={styles.submitButtonText}>Sign In</Text>
                )}
              </Pressable>

              {/* Sign Up Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Pressable onPress={() => router.replace(signupPath as any)}>
                  <Text style={styles.footerLink}>Sign Up</Text>
                </Pressable>
              </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: "center",
  },
  title: {
    ...typography.title,
    color: themeColors.textPrimary,
    fontSize: 32,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: themeColors.textSecondary,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: themeColors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: themeColors.textPrimary,
    paddingVertical: spacing.md,
  },
  eyeIcon: {
    padding: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: themeColors.error,
    marginTop: spacing.xs,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginTop: spacing.sm,
  },
  forgotPasswordText: {
    ...typography.caption,
    color: themeColors.accent,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${themeColors.error}20`,
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
    backgroundColor: themeColors.accent,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.body,
    color: themeColors.background,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.body,
    color: themeColors.textSecondary,
  },
  footerLink: {
    ...typography.body,
    color: themeColors.accent,
    fontWeight: "600",
  },
});
