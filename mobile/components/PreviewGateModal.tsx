import React, { useEffect, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../src/theme/colors";
import { spacing, typography } from "../constants/theme";
import {
  subscriptionService,
  type PublicPlanDto,
} from "../services/subscriptionService";
import type { ContentSummaryDto } from "../services/contentService";

export type PreviewGateReason =
  | "video-limit"
  | "watch-time"
  | "free-tier-limit"
  | "guest-limit";

type Props = {
  visible: boolean;
  reason: PreviewGateReason;
  contentTitle: string;
  isAuthenticated: boolean;
  allowContinuePreview: boolean;
  onContinuePreview: () => void;
  onJoinFree: (details: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  onSubscribe: () => void;
  onClose: () => void;
  freeCatalogItems?: ContentSummaryDto[];
  onCatalogItemPress?: (item: ContentSummaryDto) => void;
};

export function PreviewGateModal({
  visible,
  reason,
  contentTitle,
  isAuthenticated,
  allowContinuePreview,
  onContinuePreview,
  onJoinFree,
  onSubscribe,
  onClose,
  freeCatalogItems = [],
  onCatalogItemPress,
}: Props) {
  const [view, setView] = useState<"offers" | "signup">("offers");
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setView("offers");
    setError(null);
    void subscriptionService
      .getPlans()
      .then((items) => setPlans(items.filter((plan) => plan.price > 0)))
      .catch(() => setPlans([]));
  }, [visible]);

  const paidPlan = plans.find((plan) => plan.isPopular) ?? plans[0];
  const description =
    reason === "free-tier-limit"
      ? "Your free preview allowance has been used. Choose how you want to keep watching."
      : reason === "video-limit"
        ? "Your preview limit has been reached. Create an account or subscribe to continue."
        : `Choose how you want to keep watching ${contentTitle}.`;

  const submitSignup = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onJoinFree({ name, email, password });
    } catch (value) {
      setError(value instanceof Error ? value.message : "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {allowContinuePreview ? (
              <Pressable onPress={onClose} style={styles.close} accessibilityLabel="Close access options">
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.65)" />
              </Pressable>
            ) : null}
            {/* Logo image */}
            <Image
              source={require("../assets/splash-icon.png")}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Brixlore.TV"
            />

            <Text style={styles.title}>Continue watching</Text>
            <Text style={styles.description}>{view === "signup" ? "Create your free Brixlore account to keep exploring." : description}</Text>

            {view === "signup" ? (
              <View style={styles.signupForm}>
                <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} autoCapitalize="words" />
                <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} keyboardType="email-address" autoCapitalize="none" />
                <TextInput value={password} onChangeText={setPassword} placeholder="Password (8+ characters)" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input} secureTextEntry />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Pressable disabled={submitting} onPress={() => void submitSignup()} style={styles.primaryButton}>
                  {submitting ? <ActivityIndicator color="#050505" /> : <Text style={styles.primaryButtonText}>Create free account</Text>}
                </Pressable>
                <Pressable disabled={submitting} onPress={() => setView("offers")} style={styles.textButton}>
                  <Text style={styles.textButtonLabel}>Back to access options</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {allowContinuePreview ? (
                  <Pressable onPress={onContinuePreview} style={styles.continueButton}>
                    <Text style={styles.primaryButtonText}>Continue preview (45s)</Text>
                  </Pressable>
                ) : null}
                <View style={styles.offerList}>
                  <OfferCard title="FREE PASS" price="$0.00" description="Unlock previews and weekly updates on Brixlore." action={isAuthenticated ? "Free account active" : "Join free"} disabled={isAuthenticated} onPress={() => setView("signup")} />
                  <OfferCard title="MONTHLY PASS" price={paidPlan ? `$${paidPlan.price.toFixed(2)}/mo` : "View plans"} description="Unlimited access to every deep-dive and master file." action="Subscribe" onPress={onSubscribe} />
                  <OfferCard featured title="ANNUAL PASS" price={paidPlan?.yearlyPrice ? `$${paidPlan.yearlyPrice.toFixed(2)}/yr` : "View plans"} description="Get one full year of unlimited access for the price of 10 months. Save 17%." action="Join & save" badge={paidPlan?.yearlyPrice ? "SAVE 17%" : undefined} onPress={onSubscribe} />
                </View>
                {freeCatalogItems.length > 0 ? (
                  <View style={styles.catalog}>
                    <Text style={styles.catalogLabel}>EXPLORE FREE STORIES</Text>
                    {freeCatalogItems.map((item) => (
                      <Pressable key={item.id} onPress={() => onCatalogItemPress?.(item)} style={styles.catalogItem}>
                        {item.thumbnailUrl ? <Image source={{ uri: item.thumbnailUrl }} style={styles.catalogImage} /> : null}
                        <Text style={styles.catalogTitle} numberOfLines={1}>{item.title}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </>
            )}
            <Text style={styles.footer}>Secure access · Your playback position will be kept</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function OfferCard({ title, price, description, action, featured, badge, disabled, onPress }: { title: string; price: string; description: string; action: string; featured?: boolean; badge?: string; disabled?: boolean; onPress: () => void }) {
  return (
    <View style={[styles.offer, featured && styles.offerFeatured]}>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      <Text style={styles.offerTitle}>{title}</Text>
      <Text style={styles.offerPrice}>{price}</Text>
      <Text style={styles.offerDescription}>{description}</Text>
      <Pressable disabled={disabled} onPress={onPress} style={[styles.offerButton, featured && styles.offerButtonFeatured, disabled && styles.offerButtonDisabled]}>
        <Text style={[styles.offerButtonText, featured && styles.offerButtonTextFeatured, disabled && styles.offerButtonTextDisabled]}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(5,5,5,0.82)" },
  panel: { maxHeight: "92%", backgroundColor: "#0a0a0b", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  logoImage: { width: 156, height: 42, alignSelf: "center", marginTop: 4, marginBottom: spacing.sm },
  close: { alignSelf: "flex-end", padding: 5 },
  logo: { color: colors.textPrimary, fontSize: 15, fontWeight: "800", letterSpacing: 2, textAlign: "center", marginTop: 4 },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: "center", marginTop: 20 },
  description: { ...typography.small, color: "rgba(255,255,255,0.62)", lineHeight: 20, textAlign: "center", marginTop: 8 },
  continueButton: { height: 48, borderRadius: 24, backgroundColor: "#f4f4f5", alignItems: "center", justifyContent: "center", marginTop: 20 },
  offerList: { gap: 10, marginTop: 14 },
  offer: { borderWidth: 1, borderColor: "rgba(255,255,255,0.13)", borderRadius: 20, padding: 16, backgroundColor: "#0d0d0f" },
  offerFeatured: { borderColor: "rgba(255,255,255,0.7)" },
  badge: { alignSelf: "flex-end", color: "white", backgroundColor: "red", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, fontSize: 9, fontWeight: "800" },
  offerTitle: { color: "rgba(255,255,255,0.78)", fontSize: 13, fontWeight: "800", letterSpacing: 1.2 },
  offerPrice: { color: colors.textPrimary, fontSize: 28, fontWeight: "700", marginTop: 10 },
  offerDescription: { color: "rgba(255,255,255,0.48)", fontSize: 12, lineHeight: 18, marginTop: 5 },
  offerButton: { height: 44, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginTop: 15 },
  offerButtonFeatured: { backgroundColor: "#f4f4f5", borderColor: "#f4f4f5" },
  offerButtonDisabled: { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" },
  offerButtonText: { color: colors.textPrimary, fontWeight: "700", fontSize: 13 },
  offerButtonTextFeatured: { color: "#050505" },
  offerButtonTextDisabled: { color: "rgba(255,255,255,0.4)" },
  signupForm: { gap: 10, marginTop: 20 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.13)", backgroundColor: "rgba(255,255,255,0.045)", color: colors.textPrimary, paddingHorizontal: 14 },
  primaryButton: { height: 48, borderRadius: 24, backgroundColor: "#f4f4f5", alignItems: "center", justifyContent: "center", marginTop: 4 },
  primaryButtonText: { color: "#050505", fontWeight: "700", fontSize: 13 },
  textButton: { alignItems: "center", padding: 8 },
  textButtonLabel: { color: "rgba(255,255,255,0.52)", fontSize: 12 },
  error: { color: "#fca5a5", fontSize: 12 },
  catalog: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", marginTop: 18, paddingTop: 14 },
  catalogLabel: { color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  catalogItem: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  catalogImage: { width: 76, height: 44, borderRadius: 7, backgroundColor: "#151515" },
  catalogTitle: { flex: 1, color: "rgba(255,255,255,0.8)", fontSize: 12 },
  footer: { color: "rgba(255,255,255,0.3)", fontSize: 10, textAlign: "center", marginTop: 18 },
});
