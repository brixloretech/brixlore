import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Constants from "expo-constants";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../src/theme/colors";
import { spacing, typography } from "../constants/theme";
import { useBottomNavigationInset } from "../hooks/useBottomNavigationInset";
import { authService } from "../services/authService";
import {
  subscriptionService,
  type PublicPlanDto,
} from "../services/subscriptionService";

export type PreviewGateReason =
  | "video-limit"
  | "watch-time"
  | "free-tier-limit"
  | "guest-limit";

type ViewState = "offers" | "login" | "signup" | "checkout" | "success";
type SelectedPlan = { id: string; cycle: "MONTHLY" | "YEARLY" };

type Props = {
  visible: boolean;
  reason: PreviewGateReason;
  contentTitle: string;
  isAuthenticated: boolean;
  allowContinuePreview: boolean;
  onContinuePreview: () => void;
  onAccessGranted: () => Promise<void>;
  onClose: () => void;
};

const stripePublishableKey =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  (Constants.expoConfig?.extra?.stripePublishableKey as string | undefined) ||
  "";
const checkoutBaseUrl =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  process.env.EXPO_PUBLIC_API_URL ||
  "https://brick-tales-web-production-653a.up.railway.app";

function checkoutHtml(clientSecret: string, baseUrl: string) {
  return `<!doctype html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <base href="${baseUrl.replace(/"/g, "&quot;")}/">
    <script src="https://js.stripe.com/v3/"></script>
    <style>html,body,#checkout{margin:0;min-height:100%;background:#fff}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif}</style>
  </head><body><div id="checkout"></div><script>
    (async function () {
      try {
        const stripe = Stripe(${JSON.stringify(stripePublishableKey)});
        const checkout = await stripe.initEmbeddedCheckout({
          fetchClientSecret: function () {
            return Promise.resolve(${JSON.stringify(clientSecret)});
          },
          onComplete: function () {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "complete" }));
          }
        });
        checkout.mount("#checkout");
      } catch (error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "error", message: error && error.message ? error.message : "Checkout could not load."
        }));
      }
    })();
  </script></body></html>`;
}

export function PreviewGateModal({
  visible,
  reason,
  contentTitle,
  isAuthenticated,
  allowContinuePreview,
  onContinuePreview,
  onAccessGranted,
  onClose,
}: Props) {
  const { contentBottomPadding } = useBottomNavigationInset();
  const [view, setView] = useState<ViewState>("offers");
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [authenticatedHere, setAuthenticatedHere] = useState(isAuthenticated);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setAuthenticatedHere((current) => current || isAuthenticated);
    void subscriptionService
      .getPlans()
      .then((items) => setPlans(items.filter((plan) => plan.price > 0)))
      .catch(() => setPlans([]));
  }, [visible, isAuthenticated]);

  const loreMember =
    plans.find((plan) => Math.abs(plan.price - 4.99) < 0.01) ?? plans[0];
  const monthlyPlan =
    plans.find((plan) => Math.abs(plan.price - 9.99) < 0.01) ??
    plans.find((plan) => plan.isPopular) ??
    plans[0];

  const subtitle = useMemo(() => {
    if (view === "signup") return "Create your account to continue.";
    if (view === "login") return "Sign in to continue without leaving this video.";
    if (view === "checkout") return "Complete your subscription securely below.";
    if (reason === "free-tier-limit") return "Your free preview allowance has been used.";
    return `Choose how you want to keep watching ${contentTitle}.`;
  }, [contentTitle, reason, view]);

  const startCheckout = async (
    plan: SelectedPlan,
    authenticatedOverride = false,
  ) => {
    setSelectedPlan(plan);
    setError(null);
    if (!authenticatedHere && !isAuthenticated && !authenticatedOverride) {
      setView("signup");
      return;
    }
    try {
      setSubmitting(true);
      const subscription = await subscriptionService.getSubscription();
      if (subscription.isSubscribed) {
        setAlreadySubscribed(true);
        setView("success");
        return;
      }
      if (!stripePublishableKey) {
        setError("Payment configuration is unavailable right now.");
        return;
      }
      const checkout = await subscriptionService.createEmbeddedCheckoutSession(
        plan.id,
        plan.cycle,
      );
      setCheckoutSecret(checkout.clientSecret);
      setView("checkout");
    } catch (value: any) {
      setError(
        value?.response?.data?.message ||
          value?.message ||
          "Unable to prepare checkout.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitAuth = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    if (view === "signup" && !name.trim()) {
      setError("Name is required.");
      return;
    }
    try {
      setSubmitting(true);
      if (view === "login") {
        await authService.loginInline({ email, password });
      } else {
        await authService.signUpInline({ name, email, password });
      }
      setAuthenticatedHere(true);
      if (selectedPlan) await startCheckout(selectedPlan, true);
      else setView("success");
    } catch (value: any) {
      const message = value?.message || "Unable to continue.";
      if (
        view === "signup" &&
        /already exists|already registered|email.*taken/i.test(message)
      ) {
        setView("login");
        setError("An account already exists for this email. Please sign in.");
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const completeAccess = async () => {
    setSubmitting(true);
    try {
      await onAccessGranted();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const offers = [
    {
      title: "LORE MEMBER",
      price: "$4.99/mo",
      description: "Ad-free access. Cancel anytime.",
      action: "Choose plan",
      plan: loreMember
        ? ({ id: loreMember.id, cycle: "MONTHLY" } as SelectedPlan)
        : null,
    },
    {
      title: "MONTHLY PASS",
      price: "$9.99/mo",
      description: "Unlimited streaming access.",
      action: "Subscribe",
      plan: monthlyPlan
        ? ({ id: monthlyPlan.id, cycle: "MONTHLY" } as SelectedPlan)
        : null,
    },
    {
      title: "ANNUAL PASS",
      price: "$99.99/yr",
      description: "Unlimited access. Save 17%.",
      action: "Join & save",
      featured: true,
      badge: "SAVE 17%",
      plan: monthlyPlan?.yearlyPrice
        ? ({ id: monthlyPlan.id, cycle: "YEARLY" } as SelectedPlan)
        : null,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.panel, { paddingBottom: contentBottomPadding - 72 }]}>
          <Pressable onPress={onClose} style={styles.close} accessibilityLabel="Close access options">
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.65)" />
          </Pressable>
          <Image source={require("../assets/splash-icon.png")} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.title}>Continue watching</Text>
          <Text style={styles.description}>{subtitle}</Text>

          {view === "checkout" && checkoutSecret ? (
            <View style={styles.checkoutArea}>
              <Pressable
                onPress={() => {
                  setCheckoutSecret(null);
                  setSelectedPlan(null);
                  setView("offers");
                }}
                style={styles.textButton}
              >
                <Text style={styles.textButtonLabel}>← Choose another plan</Text>
              </Pressable>
              <WebView
                source={{
                  html: checkoutHtml(checkoutSecret, checkoutBaseUrl),
                  baseUrl: checkoutBaseUrl,
                }}
                onMessage={(event) => {
                  try {
                    const message = JSON.parse(event.nativeEvent.data);
                    if (message.type === "complete") setView("success");
                    if (message.type === "error") setError(message.message);
                  } catch {
                    // Ignore WebView messages unrelated to checkout.
                  }
                }}
                onNavigationStateChange={(state) => {
                  if (state.url.includes("/subscription/success")) setView("success");
                }}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={["*"]}
                style={styles.checkoutWebView}
              />
            </View>
          ) : view === "success" ? (
            <View style={styles.success}>
              <Text style={styles.successTitle}>
                {alreadySubscribed ? "Your subscription is active." : "You’re all set."}
              </Text>
              <Text style={styles.successText}>
                {alreadySubscribed
                  ? "You already have access, so no payment is needed."
                  : "Your access is active. Continue watching where you left off."}
              </Text>
              <Pressable disabled={submitting} onPress={() => void completeAccess()} style={styles.primaryButton}>
                {submitting ? <ActivityIndicator color="#050505" /> : <Text style={styles.primaryButtonText}>Continue watching</Text>}
              </Pressable>
            </View>
          ) : view === "login" || view === "signup" ? (
            <View style={styles.form}>
              {view === "signup" ? <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} autoCapitalize="words" /> : null}
              <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} keyboardType="email-address" autoCapitalize="none" />
              <TextInput value={password} onChangeText={setPassword} placeholder="Password (8+ characters)" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} secureTextEntry />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable disabled={submitting} onPress={() => void submitAuth()} style={styles.primaryButton}>
                {submitting ? <ActivityIndicator color="#050505" /> : <Text style={styles.primaryButtonText}>{view === "login" ? "Sign in" : "Create account"}</Text>}
              </Pressable>
              <Pressable disabled={submitting} onPress={() => setView(view === "login" ? "signup" : "login")} style={styles.textButton}>
                <Text style={styles.textButtonLabel}>{view === "login" ? "New here? Create account" : "Already have an account? Sign in"}</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {allowContinuePreview ? (
                <Pressable onPress={onContinuePreview} style={styles.continueButton}>
                  <Text style={styles.primaryButtonText}>Continue preview (45s)</Text>
                </Pressable>
              ) : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.offerList}>
                {offers.map((offer) => (
                  <OfferCard
                    key={offer.title}
                    {...offer}
                    disabled={!offer.plan || submitting}
                    loading={
                      submitting &&
                      selectedPlan?.id === offer.plan?.id &&
                      selectedPlan?.cycle === offer.plan?.cycle
                    }
                    onPress={() => offer.plan && void startCheckout(offer.plan)}
                  />
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function OfferCard({ title, price, description, action, featured, badge, disabled, loading, onPress }: {
  title: string; price: string; description: string; action: string; featured?: boolean; badge?: string;
  disabled?: boolean; loading?: boolean; onPress: () => void;
}) {
  return (
    <View style={[styles.offer, featured && styles.offerFeatured]}>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      <Text style={styles.offerTitle}>{title}</Text>
      <Text style={styles.offerPrice}>{price}</Text>
      <Text style={styles.offerDescription}>{description}</Text>
      <Pressable disabled={disabled} onPress={onPress} style={[styles.offerButton, featured && styles.offerButtonFeatured, disabled && styles.offerButtonDisabled]}>
        {loading ? <ActivityIndicator color={featured ? "#050505" : "#fff"} /> : <Text style={[styles.offerButtonText, featured && styles.offerButtonTextFeatured, disabled && styles.offerButtonTextDisabled]}>{action}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(5,5,5,0.82)" },
  panel: { maxHeight: "92%", minHeight: "58%", backgroundColor: "#0a0a0b", borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", padding: spacing.lg },
  content: { paddingBottom: spacing.md },
  logoImage: { width: 112, height: 32, alignSelf: "center" },
  close: { alignSelf: "flex-end", padding: 4 },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: "center", fontSize: 23, marginTop: 8 },
  description: { ...typography.small, color: "rgba(255,255,255,0.62)", lineHeight: 18, textAlign: "center", marginTop: 6 },
  continueButton: { height: 42, borderRadius: 21, backgroundColor: "#f4f4f5", alignItems: "center", justifyContent: "center", marginTop: 14 },
  offerList: { gap: 8, marginTop: 12 },
  offer: { borderWidth: 1, borderColor: "rgba(255,255,255,0.13)", borderRadius: 16, padding: 13, backgroundColor: "#0d0d0f" },
  offerFeatured: { borderColor: "rgba(255,255,255,0.7)" },
  badge: { alignSelf: "flex-end", color: "white", backgroundColor: "#dc2626", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, fontSize: 9, fontWeight: "800" },
  offerTitle: { color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  offerPrice: { color: colors.textPrimary, fontSize: 22, fontWeight: "700", marginTop: 5 },
  offerDescription: { color: "rgba(255,255,255,0.48)", fontSize: 11, lineHeight: 15, marginTop: 3 },
  offerButton: { height: 38, borderRadius: 19, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginTop: 10 },
  offerButtonFeatured: { backgroundColor: "#f4f4f5", borderColor: "#f4f4f5" },
  offerButtonDisabled: { opacity: 0.55 },
  offerButtonText: { color: colors.textPrimary, fontWeight: "700", fontSize: 12 },
  offerButtonTextFeatured: { color: "#050505" },
  offerButtonTextDisabled: { color: "rgba(255,255,255,0.4)" },
  form: { gap: 9, marginTop: 17 },
  input: { height: 42, borderRadius: 11, borderWidth: 1, borderColor: "rgba(255,255,255,0.13)", backgroundColor: "rgba(255,255,255,0.045)", color: colors.textPrimary, paddingHorizontal: 13, fontSize: 13 },
  primaryButton: { height: 42, borderRadius: 21, backgroundColor: "#f4f4f5", alignItems: "center", justifyContent: "center", marginTop: 3 },
  primaryButtonText: { color: "#050505", fontWeight: "700", fontSize: 12 },
  textButton: { alignItems: "center", paddingVertical: 8 },
  textButtonLabel: { color: "rgba(255,255,255,0.58)", fontSize: 12 },
  error: { color: "#fca5a5", fontSize: 12, textAlign: "center", marginTop: 10 },
  success: { gap: 12, marginTop: 28 },
  successTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: "700", textAlign: "center" },
  successText: { color: "rgba(255,255,255,0.62)", fontSize: 13, lineHeight: 19, textAlign: "center" },
  checkoutArea: { flex: 1, minHeight: 510, marginTop: 10 },
  checkoutWebView: { flex: 1, backgroundColor: "#fff", borderRadius: 14, overflow: "hidden" },
});
