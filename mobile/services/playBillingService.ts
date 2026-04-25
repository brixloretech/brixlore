import { Linking, Platform } from "react-native";
import Constants from "expo-constants";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";
import type { PublicPlanDto } from "./subscriptionService";

type PurchasePlanResult = {
  customerInfo: CustomerInfo;
  hasActiveEntitlement: boolean;
  purchasedProductId: string;
};

const ANDROID_API_KEY =
  process.env.EXPO_PUBLIC_RC_ANDROID_API_KEY?.trim() ?? "";
const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_RC_ENTITLEMENT_ID?.trim() ?? "";

let isConfigured = false;

function parsePlanPackageMap(): Record<string, string> {
  const raw = process.env.EXPO_PUBLIC_RC_PLAN_PACKAGE_MAP?.trim();
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const entries = Object.entries(parsed).filter(
      (entry): entry is [string, string] => {
        const [key, value] = entry;
        return typeof key === "string" && typeof value === "string";
      },
    );

    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

const PLAN_PACKAGE_MAP = parsePlanPackageMap();

function getPlanMapKey(plan: PublicPlanDto): string {
  return `${plan.id}:${String(plan.duration).toUpperCase()}`;
}

function findPackageByMapping(
  offerings: PurchasesOfferings,
  mappedIdentifier: string,
): PurchasesPackage | null {
  const allPackages = Object.values(offerings.all).flatMap(
    (offering) => offering.availablePackages,
  );

  return (
    allPackages.find(
      (pkg) =>
        pkg.identifier === mappedIdentifier ||
        pkg.product.identifier === mappedIdentifier,
    ) ?? null
  );
}

function resolvePackage(
  plan: PublicPlanDto,
  offerings: PurchasesOfferings,
): PurchasesPackage | null {
  const mappedIdentifier =
    PLAN_PACKAGE_MAP[getPlanMapKey(plan)] ?? PLAN_PACKAGE_MAP[plan.id];

  if (mappedIdentifier) {
    return findPackageByMapping(offerings, mappedIdentifier);
  }

  const currentPackages = offerings.current?.availablePackages ?? [];

  if (currentPackages.length === 1) {
    return currentPackages[0];
  }

  const targetCycle = String(plan.duration).toUpperCase();
  const isYearly = targetCycle.includes("YEAR");
  const isMonthly = targetCycle.includes("MONTH");

  if (isYearly || isMonthly) {
    const matched = currentPackages.find((pkg) => {
      const haystack =
        `${pkg.identifier} ${pkg.product.identifier}`.toLowerCase();
      return isYearly ? haystack.includes("year") : haystack.includes("month");
    });

    if (matched) {
      return matched;
    }
  }

  return null;
}

function hasActiveEntitlement(customerInfo: CustomerInfo): boolean {
  if (!ENTITLEMENT_ID) {
    return Object.keys(customerInfo.entitlements.active).length > 0;
  }

  return Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
}

class PlayBillingService {
  isAvailable(): boolean {
    return Platform.OS === "android" && Boolean(ANDROID_API_KEY);
  }

  getSetupErrorMessage(): string {
    if (Platform.OS !== "android") {
      return "Google Play billing is only available on Android.";
    }

    if (!ANDROID_API_KEY) {
      return "Missing EXPO_PUBLIC_RC_ANDROID_API_KEY for Android billing.";
    }

    return "Google Play billing is not configured.";
  }

  private async ensureConfigured(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error(this.getSetupErrorMessage());
    }

    if (isConfigured) {
      return;
    }

    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
    Purchases.configure({ apiKey: ANDROID_API_KEY });
    isConfigured = true;
  }

  async purchasePlan(plan: PublicPlanDto): Promise<PurchasePlanResult> {
    await this.ensureConfigured();

    const offerings = await Purchases.getOfferings();
    const selectedPackage = resolvePackage(plan, offerings);

    if (!selectedPackage) {
      throw new Error(
        "No matching Play package found for this plan. Set EXPO_PUBLIC_RC_PLAN_PACKAGE_MAP.",
      );
    }

    const { customerInfo } = await Purchases.purchasePackage(selectedPackage);

    return {
      customerInfo,
      hasActiveEntitlement: hasActiveEntitlement(customerInfo),
      purchasedProductId: selectedPackage.product.identifier,
    };
  }

  async restorePurchases(): Promise<CustomerInfo> {
    await this.ensureConfigured();
    return Purchases.restorePurchases();
  }

  async openManageSubscriptions(): Promise<void> {
    if (Platform.OS !== "android") {
      return;
    }

    try {
      await this.ensureConfigured();
      await Purchases.showManageSubscriptions();
      return;
    } catch {
      const packageName = Constants.expoConfig?.android?.package;
      const url = packageName
        ? `https://play.google.com/store/account/subscriptions?package=${encodeURIComponent(packageName)}`
        : "https://play.google.com/store/account/subscriptions";
      await Linking.openURL(url);
    }
  }
}

export const playBillingService = new PlayBillingService();
