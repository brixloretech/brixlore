import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/useAuthStore";

type Props = {
  message?: string | null;
  loginPath?: string;
};

export default function EmailVerificationPendingScreen({
  message,
  loginPath,
}: Props) {
  const router = useRouter();
  const clearPendingVerification = useAuthStore(
    (state) => state.clearPendingVerification,
  );

  const handleAlreadyVerified = () => {
    clearPendingVerification();
    router.replace((loginPath || "/login") as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.message}>
        {message ||
          "We've sent a verification link to your email address. Please check your inbox and verify your account to continue."}
      </Text>
      <Pressable style={styles.button} onPress={handleAlreadyVerified}>
        <Text style={styles.buttonText}>Already Verified? Log In</Text>
      </Pressable>
      {/* Optionally, add a resend verification button here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0b0b0e",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#f5d90a",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: "#111",
    fontWeight: "bold",
    fontSize: 16,
  },
});
