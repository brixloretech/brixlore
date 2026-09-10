import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors as themeColors } from "../src/theme/colors";
import { spacing, typography } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";
import { subscriptionService, type BillingSummaryDto, type PublicPlanDto, type SubscriptionMeResponseDto } from "../services/subscriptionService";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function money(price: number) { return `$${price.toFixed(2)}`; }

export default function SubscriptionDetailsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionMeResponseDto | null>(null);
  const [billing, setBilling] = useState<BillingSummaryDto>({ paymentMethod: null, invoices: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cycle, setCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [portalLoading, setPortalLoading] = useState(false);
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) { setIsLoading(false); return; }
    setError(null);
    try {
      // Plans are public. Keep them independent from authenticated billing
      // endpoints so the comparison cards still render for a stale session.
      const planList = await Promise.race([
        subscriptionService.getPlans(),
        new Promise<PublicPlanDto[]>((resolve) => setTimeout(() => resolve([]), 10_000)),
      ]);
      setPlans(planList);

      const [current, billingSummary] = await Promise.race([
        Promise.all([
          subscriptionService.getSubscription().catch(() => null),
          subscriptionService.getBillingSummary().catch(() => ({ paymentMethod: null, invoices: [] })),
        ]),
        new Promise<[null, BillingSummaryDto]>((resolve) =>
          setTimeout(() => resolve([null, { paymentMethod: null, invoices: [] }]), 4_000),
        ),
      ]);
      setSubscription(current);
      setBilling(billingSummary);
      if (current?.billingCycle === "YEARLY") setCycle("YEARLY");
    } catch (loadError: any) { setError(loadError?.message || "We could not load membership details."); }
    finally { setIsLoading(false); setRefreshing(false); }
  }, [isAuthenticated]);

  useEffect(() => { void load(); }, [load]);
  const activePlan = useMemo(() => plans.find((plan) => plan.id === subscription?.planId) ?? null, [plans, subscription?.planId]);
  const isSubscribed = Boolean(subscription?.isSubscribed);
  const isCancelled = subscription?.status === "CANCELLED";
  const title = activePlan?.name || (isSubscribed ? "Brixlore member" : "Free access");

  const openPortal = async () => {
    setPortalLoading(true); setError(null);
    try { const result = await subscriptionService.createPortalSession(); if (result?.url) await Linking.openURL(result.url); else setError("Billing portal is unavailable right now."); }
    catch { setError("Could not open the billing portal."); }
    finally { setPortalLoading(false); }
  };
  const choosePlan = async (plan: PublicPlanDto) => {
    if (plan.price <= 0 || plan.id === subscription?.planId) return;
    setUpdatingPlanId(plan.id); setError(null);
    try { await subscriptionService.updatePlan(plan.id, cycle); await load(); }
    catch (updateError: any) { setError(updateError?.response?.data?.message || updateError?.message || "Plan change could not be completed."); }
    finally { setUpdatingPlanId(null); }
  };
  const cancel = () => Alert.alert("Cancel membership", `You will keep access until ${formatDate(subscription?.currentPeriodEnd)}.`, [{ text: "Keep membership", style: "cancel" }, { text: "Cancel", style: "destructive", onPress: async () => { setCancelling(true); try { await subscriptionService.cancelSubscription(); await load(); } catch { setError("Cancellation could not be completed."); } finally { setCancelling(false); } } }]);

  if (isLoading) return <SafeAreaView style={styles.screen} edges={["top"]}><View style={styles.loading}><ActivityIndicator size="large" color={themeColors.accent} /></View></SafeAreaView>;

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={themeColors.accent} />}>
      <View style={styles.topBar}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={21} color={themeColors.textPrimary} /></Pressable><Text style={styles.topTitle}>Membership</Text><View style={styles.back} /></View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>BRIXLORE MEMBERSHIP</Text>
        <Text style={styles.heroTitle}>More than{`\n`}a <Text style={styles.faded}>subscription.</Text></Text>
        <View style={styles.heroRule}><Text style={styles.heroCopy}>A front-row pass to every story, every screen, and worlds still waiting to be discovered.</Text></View>
      </View>
      <View style={styles.accessCard}>
        <View style={styles.accessTop}><Text style={styles.accessLabel}>YOUR MEMBERSHIP</Text><Ionicons name={isSubscribed ? "shield-checkmark" : "sparkles-outline"} size={21} color="#050505" /></View>
        <Text style={styles.accessTitle}>{title}</Text>
        <Text style={styles.accessCopy}>{isSubscribed ? (isCancelled ? `Access ends ${formatDate(subscription?.currentPeriodEnd)}.` : "Your membership is active and ready for every story.") : "Choose a membership to unlock the full Brixlore experience."}</Text>
        <View style={styles.accessFooter}><View><Text style={styles.accessFooterLabel}>NEXT RENEWAL</Text><Text style={styles.accessFooterValue}>{isSubscribed ? formatDate(subscription?.currentPeriodEnd) : "—"}</Text></View><View style={styles.status}><View style={[styles.statusDot, isSubscribed && styles.statusActive]} /><Text style={styles.statusText}>{isCancelled ? "ENDING" : isSubscribed ? "ACTIVE" : "FREE"}</Text></View></View>
      </View>
      <View style={styles.sectionHeader}><Text style={styles.sectionKicker}>CHOOSE YOUR LEVEL</Text><Text style={styles.sectionTitle}>Make every screen yours.</Text><View style={styles.cycle}><Pressable onPress={() => setCycle("MONTHLY")} style={[styles.cycleButton, cycle === "MONTHLY" && styles.cycleSelected]}><Text style={[styles.cycleText, cycle === "MONTHLY" && styles.cycleTextSelected]}>Monthly</Text></Pressable><Pressable onPress={() => setCycle("YEARLY")} style={[styles.cycleButton, cycle === "YEARLY" && styles.cycleSelected]}><Text style={[styles.cycleText, cycle === "YEARLY" && styles.cycleTextSelected]}>Yearly</Text></Pressable></View></View>
      <View style={styles.planList}>{plans.map((plan) => { const price = cycle === "YEARLY" && plan.yearlyPrice != null ? plan.yearlyPrice : plan.price; const selected = plan.id === subscription?.planId; return <View key={plan.id} style={[styles.plan, plan.isPopular && styles.planPopular]}>{plan.isPopular ? <Text style={styles.popular}>MOST POPULAR</Text> : null}<View style={styles.planTop}><View><Text style={styles.planName}>{plan.name}</Text><Text style={styles.planPrice}>{money(price)}<Text style={styles.planPeriod}> / {cycle === "YEARLY" ? "year" : "month"}</Text></Text></View>{selected ? <View style={styles.current}><Text style={styles.currentText}>CURRENT</Text></View> : null}</View><Text style={styles.planDescription}>{plan.perks?.[0] || "A front-row pass to every Brixlore story."}</Text><View style={styles.perks}>{[...((plan.perks || []).slice(0, 3)), `Up to ${plan.deviceLimit} devices`, ...(plan.offlineAllowed ? ["Offline downloads"] : [])].slice(0, 4).map((perk) => <View key={perk} style={styles.perk}><Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.75)" /><Text style={styles.perkText}>{perk}</Text></View>)}</View><Pressable disabled={selected || updatingPlanId === plan.id} onPress={() => void choosePlan(plan)} style={[styles.planButton, selected && styles.planButtonCurrent]}><Text style={[styles.planButtonText, selected && styles.planButtonTextCurrent]}>{updatingPlanId === plan.id ? "Updating..." : selected ? "Your current access" : plan.price <= 0 ? "Included" : "Choose this access"}</Text><Ionicons name={selected ? "checkmark" : "arrow-up"} size={15} color={selected ? "rgba(255,255,255,0.55)" : "#050505"} /></Pressable></View>; })}</View>
      <View style={styles.billing}><View style={styles.billingHeader}><View><Text style={styles.sectionKicker}>BILLING CONTROL</Text><Text style={styles.billingTitle}>Your payment, your terms.</Text></View><Ionicons name="card-outline" size={25} color="rgba(255,255,255,0.58)" /></View><View style={styles.payment}><Text style={styles.paymentTitle}>{billing.paymentMethod ? `${billing.paymentMethod.brand.toUpperCase()} ending in ${billing.paymentMethod.last4}` : "No payment method on file"}</Text><Text style={styles.paymentMeta}>{billing.paymentMethod ? `Expires ${String(billing.paymentMethod.expMonth).padStart(2, "0")}/${String(billing.paymentMethod.expYear).slice(-2)}` : "Add or update your card securely in the billing portal."}</Text></View><Pressable onPress={() => void openPortal()} disabled={portalLoading} style={styles.billingButton}><Text style={styles.billingButtonText}>{portalLoading ? "Opening..." : "Open billing portal"}</Text><Ionicons name="arrow-up" size={15} color="#050505" /></Pressable>{isSubscribed && !isCancelled ? <Pressable onPress={cancel} disabled={cancelling} style={styles.cancel}><Text style={styles.cancelText}>{cancelling ? "Cancelling..." : "Cancel membership"}</Text></Pressable> : null}</View>
      <View style={styles.support}><Text style={styles.supportKicker}>NEED A HUMAN?</Text><Text style={styles.supportTitle}>We’re here for every question.</Text><Text style={styles.supportCopy}>Billing questions, plan changes, and account help—our team can take care of it.</Text><Pressable onPress={() => router.push("/help-support")} style={styles.supportAction}><Text style={styles.supportActionText}>Contact support</Text><Ionicons name="headset-outline" size={17} color="#050505" /></Pressable></View>
      {billing.invoices.length ? <View style={styles.invoices}><Text style={styles.sectionKicker}>RECENT INVOICES</Text>{billing.invoices.slice(0, 3).map((invoice) => <Pressable key={invoice.id} onPress={() => { const url = invoice.hostedInvoiceUrl || invoice.invoicePdf; if (url) void Linking.openURL(url); }} style={styles.invoice}><View><Text style={styles.invoiceAmount}>{invoice.status === "paid" ? "Paid" : "Due"} {money((invoice.status === "paid" ? invoice.amountPaid : invoice.amountDue) / 100)}</Text><Text style={styles.invoiceMeta}>{formatDate(invoice.createdAt)}  /  {invoice.status.toUpperCase()}</Text></View><Ionicons name="arrow-up" size={15} color="rgba(255,255,255,0.5)" /></Pressable>)}</View> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050505" }, content: { paddingBottom: 52 }, loading: { flex: 1, alignItems: "center", justifyContent: "center" }, topBar: { height: 56, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 38, height: 38, alignItems: "center", justifyContent: "center" }, topTitle: { ...typography.smallBold, color: themeColors.textPrimary, fontSize: 13 },
  hero: { paddingHorizontal: spacing.lg, paddingTop: 26, paddingBottom: 30, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.13)" }, kicker: { ...typography.smallBold, color: "rgba(255,255,255,0.47)", fontSize: 10, letterSpacing: 1.7 }, heroTitle: { ...typography.h1, color: themeColors.textPrimary, fontSize: 43, lineHeight: 39, letterSpacing: -2.3, marginTop: 22 }, faded: { color: "rgba(255,255,255,0.42)" }, heroRule: { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.52)", marginTop: 22, paddingLeft: 13, maxWidth: 312 }, heroCopy: { ...typography.small, color: "rgba(255,255,255,0.68)", lineHeight: 20 },
  accessCard: { margin: spacing.lg, marginTop: 24, padding: 21, backgroundColor: "#f4f4f5" }, accessTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, accessLabel: { ...typography.smallBold, color: "rgba(0,0,0,0.5)", fontSize: 9, letterSpacing: 1.5 }, accessTitle: { ...typography.h2, color: "#050505", fontSize: 31, lineHeight: 31, letterSpacing: -1.5, marginTop: 22 }, accessCopy: { ...typography.small, color: "rgba(0,0,0,0.62)", lineHeight: 20, marginTop: 10, maxWidth: 280 }, accessFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.14)", marginTop: 24, paddingTop: 15 }, accessFooterLabel: { ...typography.smallBold, color: "rgba(0,0,0,0.46)", fontSize: 8, letterSpacing: 1.1 }, accessFooterValue: { ...typography.smallBold, color: "#050505", fontSize: 12, marginTop: 4 }, status: { flexDirection: "row", alignItems: "center", gap: 5 }, statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.36)" }, statusActive: { backgroundColor: "#65a30d" }, statusText: { ...typography.smallBold, color: "rgba(0,0,0,0.58)", fontSize: 8, letterSpacing: 1 },
  sectionHeader: { marginHorizontal: spacing.lg, marginTop: 33, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.15)" }, sectionKicker: { ...typography.smallBold, color: "rgba(255,255,255,0.43)", fontSize: 9, letterSpacing: 1.5 }, sectionTitle: { ...typography.h2, color: themeColors.textPrimary, fontSize: 27, letterSpacing: -1.3, marginTop: 9 }, cycle: { flexDirection: "row", alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", padding: 3, marginTop: 19 }, cycleButton: { paddingHorizontal: 13, paddingVertical: 8 }, cycleSelected: { backgroundColor: "#f4f4f5" }, cycleText: { ...typography.smallBold, color: "rgba(255,255,255,0.55)", fontSize: 10 }, cycleTextSelected: { color: "#050505" },
  planList: { marginHorizontal: spacing.lg, gap: 12, marginTop: 17 }, plan: { borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", padding: 17, overflow: "hidden" }, planPopular: { borderColor: "rgba(255,255,255,0.62)" }, popular: { position: "absolute", top: 0, right: 0, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: "#f4f4f5", color: "#050505", fontSize: 8, fontWeight: "800", letterSpacing: 0.8 }, planTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 }, planName: { ...typography.h3, color: themeColors.textPrimary, fontSize: 20, letterSpacing: -0.7 }, planPrice: { ...typography.title, color: themeColors.textPrimary, fontSize: 20, marginTop: 8 }, planPeriod: { ...typography.small, color: "rgba(255,255,255,0.43)", fontSize: 10 }, current: { borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", paddingHorizontal: 7, paddingVertical: 4, alignSelf: "flex-start" }, currentText: { ...typography.smallBold, color: "rgba(255,255,255,0.65)", fontSize: 8, letterSpacing: 0.9 }, planDescription: { ...typography.small, color: "rgba(255,255,255,0.56)", marginTop: 11, lineHeight: 18 }, perks: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)", marginTop: 15, paddingTop: 11, gap: 6 }, perk: { flexDirection: "row", alignItems: "center", gap: 7 }, perkText: { ...typography.small, color: "rgba(255,255,255,0.72)", fontSize: 11 }, planButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "#f4f4f5", paddingVertical: 12, marginTop: 17 }, planButtonCurrent: { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.17)" }, planButtonText: { ...typography.smallBold, color: "#050505", fontSize: 11 }, planButtonTextCurrent: { color: "rgba(255,255,255,0.58)" },
  billing: { marginHorizontal: spacing.lg, marginTop: 34, padding: 19, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", backgroundColor: "#101010" }, billingHeader: { flexDirection: "row", justifyContent: "space-between", gap: 20 }, billingTitle: { ...typography.h2, color: themeColors.textPrimary, fontSize: 25, lineHeight: 26, letterSpacing: -1, marginTop: 10, maxWidth: 235 }, payment: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.15)", paddingVertical: 15, marginTop: 22 }, paymentTitle: { ...typography.smallBold, color: themeColors.textPrimary, fontSize: 13 }, paymentMeta: { ...typography.small, color: "rgba(255,255,255,0.48)", lineHeight: 17, marginTop: 5 }, billingButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "#f4f4f5", paddingVertical: 13, marginTop: 17 }, billingButtonText: { ...typography.smallBold, color: "#050505", fontSize: 11 }, cancel: { alignItems: "center", paddingVertical: 13, borderWidth: 1, borderColor: "rgba(248,113,113,0.48)", marginTop: 9 }, cancelText: { ...typography.smallBold, color: "#fca5a5", fontSize: 11 },
  support: { marginHorizontal: spacing.lg, padding: 20, backgroundColor: "#f4f4f5", marginTop: 0 }, supportKicker: { ...typography.smallBold, color: "rgba(0,0,0,0.46)", fontSize: 9, letterSpacing: 1.4 }, supportTitle: { ...typography.h2, color: "#050505", fontSize: 26, lineHeight: 27, letterSpacing: -1.15, marginTop: 12 }, supportCopy: { ...typography.small, color: "rgba(0,0,0,0.6)", lineHeight: 19, marginTop: 10, maxWidth: 280 }, supportAction: { flexDirection: "row", gap: 8, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#050505", alignSelf: "flex-start", paddingBottom: 5, marginTop: 20 }, supportActionText: { ...typography.smallBold, color: "#050505", fontSize: 11 }, invoices: { marginHorizontal: spacing.lg, marginTop: 33 }, invoice: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.12)" }, invoiceAmount: { ...typography.smallBold, color: themeColors.textPrimary, fontSize: 13 }, invoiceMeta: { ...typography.small, color: "rgba(255,255,255,0.45)", fontSize: 10, marginTop: 4 }, error: { ...typography.small, color: "#fca5a5", marginHorizontal: spacing.lg, marginTop: 18, lineHeight: 18 },
});
