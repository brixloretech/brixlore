import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors as themeColors } from "../src/theme/colors";
import { borderRadius, spacing, typography, shadows } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";
import {
  subscriptionService,
  type BillingSummaryDto,
  type PublicPlanDto,
  type SubscriptionMeResponseDto,
} from "../services/subscriptionService";

export default function SubscriptionDetailsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionMeResponseDto | null>(null);
  const [billingSummary, setBillingSummary] = useState<BillingSummaryDto>({
    paymentMethod: null,
    invoices: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const loadSubscriptionData = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setPortalError(null);
      
      const [planList, sub] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getSubscription(),
      ]);
      setPlans(planList);
      setSubscription(sub);

      try {
        const billing = await subscriptionService.getBillingSummary();
        setBillingSummary(billing);
      } catch (billingError) {
        // Gracefully fallback for free tier users who don't have a Stripe customer yet
        setBillingSummary({
          paymentMethod: null,
          invoices: [],
        });
      }
    } catch (error) {
      console.error("Failed to load subscription details:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadSubscriptionData();
  }, [loadSubscriptionData]);

  const handleOpenBillingPortal = async () => {
    setPortalError(null);
    setPortalLoading(true);
    try {
      const res = await subscriptionService.createPortalSession();
      if (res?.url) {
        await Linking.openURL(res.url);
      } else {
        setPortalError("Billing portal is currently unavailable.");
      }
    } catch (err) {
      setPortalError("Failed to open billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  const activePlan = plans.find((p) => p.id === subscription?.planId) ?? null;
  const isSubscribed = subscription?.isSubscribed ?? false;

  const nextChargeLabel = () => {
    if (activePlan?.price === 0) return "--";
    if (!isSubscribed) return "Not available";
    if (subscription?.currentPeriodEnd) {
      return new Date(subscription.currentPeriodEnd).toLocaleDateString();
    }
    return "Pending sync";
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency.toUpperCase() === "USD" ? "$" : `${currency.toUpperCase()} `;
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  if (isLoading && !isRefreshing) {
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
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Current Plan Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Current Plan</Text>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.planName}>
                {activePlan?.name ?? (isSubscribed ? "Active Plan" : "Free")}
              </Text>
              <Text style={styles.planDescription}>
                {activePlan?.perks?.[0] ??
                  (isSubscribed
                    ? "Subscription benefits are active."
                    : "Choose a plan to unlock premium access.")}
              </Text>
            </View>
            <View style={styles.nextChargeBox}>
              <Text style={styles.nextChargeLabel}>Next charge</Text>
              <Text style={styles.nextChargeValue}>{nextChargeLabel()}</Text>
              {isSubscribed && activePlan ? (
                <Text style={styles.nextChargePrice}>
                  {activePlan.price === 0 
                    ? "$0.00 / free" 
                    : `${formatCurrency(activePlan.price * 100, "USD")} / ${activePlan.duration}`}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.cardActions}>
            <Pressable
              style={styles.managePlanButton}
              onPress={() => router.push("/plans")}
            >
              <Text style={styles.managePlanText}>Manage plan</Text>
            </Pressable>
          </View>
        </View>

        {/* Payment Method Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Text style={styles.sectionSubtitle}>
            Manage your saved payment methods in the billing portal.
          </Text>

          <View style={styles.paymentMethodBox}>
            <View style={styles.paymentInfo}>
              {billingSummary.paymentMethod ? (
                <>
                  <Text style={styles.paymentTitle}>
                    {billingSummary.paymentMethod.brand.toUpperCase()} ending in{" "}
                    {billingSummary.paymentMethod.last4}
                  </Text>
                  <Text style={styles.paymentSubtitle}>
                    Expires {String(billingSummary.paymentMethod.expMonth).padStart(2, "0")}/
                    {String(billingSummary.paymentMethod.expYear).slice(-2)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.paymentTitle}>No card on file</Text>
                  <Text style={styles.paymentSubtitle}>
                    Add or update a card in the billing portal.
                  </Text>
                </>
              )}
            </View>
            <Pressable
              style={styles.updateCardButton}
              onPress={handleOpenBillingPortal}
              disabled={portalLoading}
            >
              <Text style={styles.updateCardText}>
                {portalLoading ? "Opening..." : "Update card"}
              </Text>
            </Pressable>
          </View>
          {portalError && <Text style={styles.portalError}>{portalError}</Text>}
        </View>

        {/* Billing History Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Billing History</Text>
          <Text style={styles.sectionSubtitle}>Recent invoices for your records.</Text>

          {billingSummary.invoices.length > 0 ? (
            <View style={styles.invoiceList}>
              {billingSummary.invoices.map((invoice) => {
                const amount = invoice.status === "paid" ? invoice.amountPaid : invoice.amountDue;
                const dateLabel = new Date(invoice.createdAt).toLocaleDateString();
                const viewUrl = invoice.hostedInvoiceUrl ?? invoice.invoicePdf ?? "";

                return (
                  <View key={invoice.id} style={styles.invoiceItem}>
                    <View>
                      <Text style={styles.invoiceAmount}>
                        {invoice.status === "paid" ? "Paid " : "Due "}
                        {formatCurrency(amount, invoice.currency)}
                      </Text>
                      <Text style={styles.invoiceMeta}>
                        {dateLabel} • {invoice.status.toUpperCase()}
                      </Text>
                    </View>
                    {viewUrl ? (
                      <Pressable onPress={() => Linking.openURL(viewUrl)}>
                        <Text style={styles.viewInvoiceText}>View invoice</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyInvoicesBox}>
              <Text style={styles.emptyInvoicesText}>
                View invoices and billing history in the billing portal.
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.portalButton, portalLoading && styles.disabledButton]}
            onPress={handleOpenBillingPortal}
            disabled={portalLoading}
          >
            <Text style={styles.portalButtonText}>
              {portalLoading ? "Opening..." : "Open billing portal"}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: themeColors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: themeColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  planName: {
    ...typography.title,
    fontSize: 24,
    fontWeight: "700",
    color: themeColors.textPrimary,
    marginBottom: spacing.xs,
  },
  planDescription: {
    ...typography.body,
    fontSize: 14,
    color: themeColors.textSecondary,
    lineHeight: 20,
  },
  nextChargeBox: {
    backgroundColor: themeColors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "flex-end",
    minWidth: 120,
  },
  nextChargeLabel: {
    ...typography.caption,
    fontSize: 10,
    color: themeColors.textSecondary,
    textTransform: "uppercase",
  },
  nextChargeValue: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.textPrimary,
    marginTop: 2,
  },
  nextChargePrice: {
    ...typography.caption,
    fontSize: 10,
    color: themeColors.textSecondary,
    marginTop: 2,
  },
  cardActions: {
    marginTop: spacing.lg,
  },
  managePlanButton: {
    backgroundColor: themeColors.textPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  managePlanText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.background,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 18,
    fontWeight: "600",
    color: themeColors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    fontSize: 13,
    color: themeColors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  paymentMethodBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: themeColors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.textPrimary,
  },
  paymentSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: themeColors.textSecondary,
    marginTop: 2,
  },
  updateCardButton: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  updateCardText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: themeColors.textPrimary,
  },
  portalError: {
    ...typography.caption,
    color: themeColors.error,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  invoiceList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  invoiceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: themeColors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  invoiceAmount: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.textPrimary,
  },
  invoiceMeta: {
    ...typography.caption,
    fontSize: 11,
    color: themeColors.textSecondary,
    marginTop: 2,
  },
  viewInvoiceText: {
    ...typography.caption,
    fontSize: 12,
    color: themeColors.accent,
    fontWeight: "600",
  },
  emptyInvoicesBox: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderStyle: "dashed",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emptyInvoicesText: {
    ...typography.caption,
    color: themeColors.textSecondary,
    textAlign: "center",
    fontSize: 12,
  },
  portalButton: {
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  portalButtonText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.textPrimary,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
