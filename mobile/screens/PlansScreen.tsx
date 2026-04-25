import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors } from "../src/theme/colors";
import { spacing, typography, borderRadius } from "../constants/theme";
import {
  subscriptionService,
  type PublicPlanDto,
} from "../services/subscriptionService";
import { useSubscriptionStore } from "../store/useSubscriptionStore";
import { useAuthStore } from "../store/useAuthStore";
import { playBillingService } from "../services/playBillingService";

type BillingCycle = "MONTHLY" | "YEARLY";

function normalizeDuration(duration: string | undefined): BillingCycle | null {
  const value = duration?.trim().toUpperCase() ?? "";

  if (value.includes("YEAR")) {
    return "YEARLY";
  }

  if (value.includes("MONTH")) {
    return "MONTHLY";
  }

  return null;
}

function toYearlyPrice(plan: PublicPlanDto): number {
  const yearlyPrice = (plan as PublicPlanDto & { yearlyPrice?: number })
    .yearlyPrice;

  if (typeof yearlyPrice === "number" && Number.isFinite(yearlyPrice)) {
    return yearlyPrice;
  }

  if (plan.price <= 0) {
    return 0;
  }

  return Number((plan.price * 10).toFixed(2));
}

function selectPlansForCycle(
  plans: PublicPlanDto[],
  cycle: BillingCycle,
): PublicPlanDto[] {
  const grouped = new Map<
    string,
    {
      order: number;
      monthly?: PublicPlanDto;
      yearly?: PublicPlanDto;
      fallback?: PublicPlanDto;
    }
  >();

  plans.forEach((plan, index) => {
    const entry = grouped.get(plan.id) ?? { order: index };
    entry.fallback ??= plan;

    const duration = normalizeDuration(plan.duration);
    if (duration === "MONTHLY") {
      entry.monthly = plan;
    } else if (duration === "YEARLY") {
      entry.yearly = plan;
    }

    grouped.set(plan.id, entry);
  });

  return [...grouped.entries()]
    .sort((a, b) => a[1].order - b[1].order)
    .map(([, entry]) => {
      if (cycle === "MONTHLY") {
        return entry.monthly ?? entry.fallback ?? entry.yearly;
      }

      if (entry.yearly) {
        return entry.yearly;
      }

      const basePlan = entry.monthly ?? entry.fallback;
      if (!basePlan) {
        return null;
      }

      if (basePlan.price <= 0) {
        return basePlan;
      }

      return {
        ...basePlan,
        duration: "YEARLY",
        price: toYearlyPrice(basePlan),
      };
    })
    .filter((plan): plan is PublicPlanDto => Boolean(plan));
}

export default function PlansScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const subscription = useSubscriptionStore((state) => state.subscription);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchSubscription = useSubscriptionStore(
    (state) => state.fetchSubscription,
  );
  const currentPlan = subscription?.planId;
  const visiblePlans = useMemo(
    () => selectPlansForCycle(plans, billingCycle),
    [plans, billingCycle],
  );

  const isFreePlan = (plan: PublicPlanDto) => plan.price <= 0;

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await subscriptionService.getPlans();
      setPlans(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load plans");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (plan: PublicPlanDto) => {
    if (Platform.OS === "android") {
      if (!playBillingService.isAvailable()) {
        setError(playBillingService.getSetupErrorMessage());
        return;
      }

      setProcessingPlanId(plan.id);
      setError(null);

      try {
        const purchase = await playBillingService.purchasePlan(plan);
        await fetchSubscription();
        Alert.alert(
          "Purchase successful",
          purchase.hasActiveEntitlement
            ? "Your Play subscription is now active."
            : "Purchase completed. Access will update shortly.",
        );
        return;
      } catch (err: any) {
        const message =
          err?.message ?? "Failed to complete Play Store purchase.";
        setError(message);
        return;
      } finally {
        setProcessingPlanId(null);
      }
    }

    Alert.alert(
      "Upgrade on Website",
      "iOS subscriptions are managed on our website. Please upgrade from the website, then sign in again on the app to refresh your plan.",
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColors.accent} />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerContainer}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={themeColors.textPrimary}
            />
          </Pressable>
          <Text style={styles.title}>Plans</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={themeColors.accent}
          />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadPlans}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerContainer}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={themeColors.textPrimary}
          />
        </Pressable>
        <Text style={styles.title}>Choose Your Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Start streaming unlimited content today
        </Text>

        <View style={styles.billingToggleContainer}>
          <Pressable
            style={[
              styles.billingToggleButton,
              billingCycle === "MONTHLY" && styles.billingToggleButtonActive,
            ]}
            onPress={() => setBillingCycle("MONTHLY")}
          >
            <Text
              style={[
                styles.billingToggleText,
                billingCycle === "MONTHLY" && styles.billingToggleTextActive,
              ]}
            >
              Monthly
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.billingToggleButton,
              billingCycle === "YEARLY" && styles.billingToggleButtonActive,
            ]}
            onPress={() => setBillingCycle("YEARLY")}
          >
            <Text
              style={[
                styles.billingToggleText,
                billingCycle === "YEARLY" && styles.billingToggleTextActive,
              ]}
            >
              Yearly
            </Text>
          </Pressable>
        </View>

        {visiblePlans.length === 0 ? (
          <Text style={styles.noPlansText}>No plans available</Text>
        ) : (
          <View style={styles.plansContainer}>
            {visiblePlans.map((plan) => {
              const isCurrentPlan = currentPlan === plan.id;
              const isPlanFree = isFreePlan(plan);
              const isProcessingPlan = processingPlanId === plan.id;
              const shouldShowSignUpFreeButton = !isAuthenticated && isPlanFree;
              const shouldShowUpgradeButton = !isPlanFree;
              const shouldShowPlanButton =
                shouldShowSignUpFreeButton || shouldShowUpgradeButton;
              const isButtonDisabled = isCurrentPlan || isProcessingPlan;
              return (
                <View
                  key={plan.id}
                  style={[
                    styles.planCard,
                    isCurrentPlan && styles.planCardActive,
                  ]}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {isCurrentPlan && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>
                          Current Plan
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>${plan.price.toFixed(2)}</Text>
                    <Text style={styles.interval}>
                      /
                      {(normalizeDuration(plan.duration) ?? billingCycle) ===
                      "YEARLY"
                        ? "yr"
                        : "mo"}
                    </Text>
                  </View>

                  {plan.isPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>Most Popular</Text>
                    </View>
                  )}

                  <View style={styles.planDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons
                        name="desktop-outline"
                        size={16}
                        color={themeColors.textSecondary}
                      />
                      <Text style={styles.detailText}>
                        Up to {plan.deviceLimit}{" "}
                        {plan.deviceLimit === 1 ? "device" : "devices"}
                      </Text>
                    </View>
                  </View>

                  {plan.perks && plan.perks.length > 0 && (
                    <View style={styles.perksSection}>
                      <Text style={styles.perksSectionTitle}>
                        Included Features:
                      </Text>
                      <View style={styles.features}>
                        {plan.perks.map((perk, index) => (
                          <FeatureItem
                            key={index}
                            icon="checkmark-circle"
                            text={perk}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  {shouldShowPlanButton ? (
                    <Pressable
                      style={[
                        styles.upgradeButton,
                        shouldShowUpgradeButton &&
                          isCurrentPlan &&
                          styles.upgradeButtonDisabled,
                      ]}
                      onPress={() => {
                        if (shouldShowSignUpFreeButton) {
                          router.push("/signup");
                          return;
                        }
                        handleUpgrade(plan);
                      }}
                      disabled={
                        shouldShowUpgradeButton ? isButtonDisabled : false
                      }
                    >
                      {shouldShowUpgradeButton && isProcessingPlan ? (
                        <View style={styles.processingContent}>
                          <ActivityIndicator
                            size="small"
                            color={themeColors.background}
                          />
                          <Text style={styles.upgradeButtonText}>
                            Processing...
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.upgradeButtonText,
                            shouldShowUpgradeButton &&
                              isCurrentPlan &&
                              styles.upgradeButtonTextDisabled,
                          ]}
                        >
                          {shouldShowSignUpFreeButton
                            ? "Sign Up Free"
                            : isCurrentPlan
                              ? "Current Plan"
                              : "Subscribe Now"}
                        </Text>
                      )}
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.freeAccessInfo}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={themeColors.accent}
          />
          <Text style={styles.freeAccessText}>
            Free users can watch up to 2 minutes per video and view up to 3
            videos
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.feature}>
      <Ionicons name={icon as any} size={18} color={themeColors.accent} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...typography.title,
    fontSize: 20,
    fontWeight: "700",
    color: themeColors.textPrimary,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    fontSize: 16,
    color: themeColors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  billingToggleContainer: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  billingToggleButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  billingToggleButtonActive: {
    backgroundColor: themeColors.accent,
  },
  billingToggleText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.textSecondary,
  },
  billingToggleTextActive: {
    color: themeColors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: themeColors.textSecondary,
  },
  noPlansText: {
    ...typography.body,
    color: themeColors.textSecondary,
    textAlign: "center",
    marginVertical: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: themeColors.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: themeColors.accent,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    ...typography.body,
    fontWeight: "600",
    color: themeColors.background,
  },
  plansContainer: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  planCard: {
    backgroundColor: themeColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: spacing.lg,
  },
  planCardActive: {
    borderColor: themeColors.accent,
    backgroundColor: "rgba(255, 102, 0, 0.05)",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  planName: {
    ...typography.title,
    fontSize: 18,
    fontWeight: "700",
    color: themeColors.textPrimary,
  },
  currentBadge: {
    backgroundColor: themeColors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  currentBadgeText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: themeColors.background,
  },
  popularBadge: {
    backgroundColor: themeColors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  popularBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "700",
    color: themeColors.background,
    textTransform: "uppercase",
  },
  planDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
    minWidth: "45%",
  },
  detailText: {
    ...typography.caption,
    fontSize: 13,
    color: themeColors.textSecondary,
  },
  perksSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
  perksSectionTitle: {
    ...typography.body,
    fontSize: 13,
    fontWeight: "600",
    color: themeColors.textPrimary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: spacing.md,
  },
  price: {
    ...typography.title,
    fontSize: 32,
    fontWeight: "700",
    color: themeColors.accent,
  },
  interval: {
    ...typography.body,
    fontSize: 14,
    color: themeColors.textSecondary,
    marginLeft: spacing.xs,
  },
  description: {
    ...typography.body,
    fontSize: 13,
    color: themeColors.textSecondary,
    marginBottom: spacing.md,
  },
  features: {
    gap: spacing.sm,
  },
  feature: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  featureText: {
    ...typography.body,
    fontSize: 14,
    color: themeColors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: themeColors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  upgradeButtonDisabled: {
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.accent,
  },
  upgradeButtonText: {
    ...typography.body,
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.background,
  },
  upgradeButtonTextDisabled: {
    color: themeColors.accent,
  },
  processingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  freeAccessInfo: {
    backgroundColor: "rgba(255, 102, 0, 0.1)",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  freeAccessText: {
    ...typography.body,
    fontSize: 13,
    color: themeColors.textSecondary,
    flex: 1,
  },
});
