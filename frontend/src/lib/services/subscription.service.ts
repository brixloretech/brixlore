import type {
  GetSubscriptionResponseDto,
  PublicPlanDto,
  SubscribeRequestDto,
  SubscribeResponseDto,
  UpdateSubscriptionRequestDto,
  UpdateSubscriptionResponseDto,
  BillingSummaryDto,
  CreateCheckoutSessionResponseDto,
} from "@/types/api";
import { get, post, ApiError } from "@/lib/api-client";
import { getStoredAuth } from "@/lib/auth-storage";
import { getMockSubscription, setMockSubscription } from "@/lib/mock-auth";
import { USE_MOCK_API } from "./config";
import { authService } from "./auth.service";

const SUBSCRIPTION_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** In-memory cache for GET /subscriptions/me so we don't check on every action. */
let subscriptionCache: {
  at: number;
  data: GetSubscriptionResponseDto;
} | null = null;

/**
 * Clear subscription cache (e.g. on logout so next user doesn't see stale data).
 */
function clearSubscriptionCache(): void {
  subscriptionCache = null;
}

/**
 * Subscription service. Uses real API (GET /subscriptions/me) when USE_MOCK_API is false.
 * When using the real API, subscription status is cached for 24 hours.
 */
export const subscriptionService = {
  async getPlans(): Promise<PublicPlanDto[]> {
    if (!USE_MOCK_API) {
      return get<PublicPlanDto[]>("subscriptions/plans", { cache: "no-store" });
    }
    try {
      return await get<PublicPlanDto[]>("subscriptions/plans", {
        cache: "no-store",
      });
    } catch {
      return [];
    }
  },
  async getPlanById(planId: string): Promise<PublicPlanDto | null> {
    if (!planId.trim()) return null;
    if (!USE_MOCK_API) {
      try {
        return await get<PublicPlanDto>(`subscriptions/plans/${planId}`);
      } catch {
        return null;
      }
    }
    const plans = await this.getPlans();
    return plans.find((plan) => plan.id === planId) ?? null;
  },
  async getSubscription(
    forceRefresh = false,
  ): Promise<GetSubscriptionResponseDto> {
    if (USE_MOCK_API) {
      const isSubscribed = getMockSubscription();
      return {
        isSubscribed,
        planId: isSubscribed ? "monthly" : "free",
      };
    }
    const auth = getStoredAuth();
    if (!auth?.accessToken) {
      clearSubscriptionCache();
      return { isSubscribed: false };
    }
    const now = Date.now();
    if (
      !forceRefresh &&
      subscriptionCache &&
      now - subscriptionCache.at < SUBSCRIPTION_CACHE_TTL_MS &&
      subscriptionCache.data.isSubscribed
    ) {
      return subscriptionCache.data;
    }
    try {
      const res = await get<GetSubscriptionResponseDto>("subscriptions/me", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      let data = res ?? { isSubscribed: false };

      // Self-heal for local/dev where webhook delivery can lag or be unavailable.
      if (!data.isSubscribed) {
        try {
          await post<{ synced: number }>(
            "subscriptions/sync",
            {},
            { headers: { Authorization: `Bearer ${auth.accessToken}` } },
          );
          const retried = await get<GetSubscriptionResponseDto>(
            "subscriptions/me",
            {
              headers: { Authorization: `Bearer ${auth.accessToken}` },
            },
          );
          data = retried ?? data;
        } catch {
          // Keep original response if sync is unavailable
        }
      }

      subscriptionCache = { at: now, data };
      return data;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await authService.getSession().catch(() => null);
        const refreshed = getStoredAuth();
        if (refreshed?.accessToken) {
          try {
            const res = await get<GetSubscriptionResponseDto>(
              "subscriptions/me",
              { headers: { Authorization: `Bearer ${refreshed.accessToken}` } },
            );
            const data = res ?? { isSubscribed: false };
            subscriptionCache = { at: Date.now(), data };
            return data;
          } catch {
            return { isSubscribed: false };
          }
        }
      }
      return { isSubscribed: false };
    }
  },

  /** Clear the 24h subscription cache (call on logout). */
  clearSubscriptionCache,

  async subscribe(body: SubscribeRequestDto): Promise<SubscribeResponseDto> {
    void body; // reserved for real API (plan selection, etc.)
    setMockSubscription(true);
    return {
      subscription: {
        isSubscribed: true,
        planId: "monthly",
        createdAt: new Date().toISOString(),
      },
    };
  },

  async updateSubscription(
    body: UpdateSubscriptionRequestDto,
  ): Promise<UpdateSubscriptionResponseDto> {
    void body; // reserved for real API
    const isSubscribed = getMockSubscription();
    return {
      subscription: {
        isSubscribed,
        planId: isSubscribed ? "monthly" : "free",
      },
    };
  },

  async createPortalSession(returnUrl?: string): Promise<{ url: string }> {
    if (USE_MOCK_API) {
      throw new Error("Billing portal is not available in mock mode.");
    }
    const auth = getStoredAuth();
    if (!auth?.accessToken) {
      throw new Error("Not authenticated");
    }
    try {
      return await post<{ url: string }>(
        "subscriptions/portal-session",
        { returnUrl },
        {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        },
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await authService.getSession().catch(() => null);
        const refreshed = getStoredAuth();
        if (refreshed?.accessToken) {
          return post<{ url: string }>(
            "subscriptions/portal-session",
            { returnUrl },
            {
              headers: { Authorization: `Bearer ${refreshed.accessToken}` },
            },
          );
        }
      }
      throw err;
    }
  },

  async createCheckoutSession(args: {
    planId: string;
    billingCycle?: "MONTHLY" | "YEARLY";
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<CreateCheckoutSessionResponseDto> {
    if (USE_MOCK_API) {
      setMockSubscription(true);
      return { url: args.successUrl ?? "/subscription/success" };
    }
    const auth = getStoredAuth();
    if (!auth?.accessToken) {
      throw new Error("Not authenticated");
    }
    const payload = {
      planId: args.planId,
      ...(args.billingCycle ? { billingCycle: args.billingCycle } : {}),
      ...(args.successUrl ? { successUrl: args.successUrl } : {}),
      ...(args.cancelUrl ? { cancelUrl: args.cancelUrl } : {}),
    };
    try {
      return await post<CreateCheckoutSessionResponseDto>(
        "subscriptions/checkout-session",
        payload,
        {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        },
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await authService.getSession().catch(() => null);
        const refreshed = getStoredAuth();
        if (refreshed?.accessToken) {
          return post<CreateCheckoutSessionResponseDto>(
            "subscriptions/checkout-session",
            payload,
            {
              headers: { Authorization: `Bearer ${refreshed.accessToken}` },
            },
          );
        }
      }
      throw err;
    }
  },

  async getBillingSummary(): Promise<BillingSummaryDto> {
    if (USE_MOCK_API) {
      return { paymentMethod: null, invoices: [] };
    }
    const auth = getStoredAuth();
    if (!auth?.accessToken) {
      return { paymentMethod: null, invoices: [] };
    }
    try {
      return await get<BillingSummaryDto>("subscriptions/billing-summary", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await authService.getSession().catch(() => null);
        const refreshed = getStoredAuth();
        if (refreshed?.accessToken) {
          return get<BillingSummaryDto>("subscriptions/billing-summary", {
            headers: { Authorization: `Bearer ${refreshed.accessToken}` },
          });
        }
      }
      return { paymentMethod: null, invoices: [] };
    }
  },

  /**
   * Manually sync Stripe active subscriptions to the DB.
   * Needed when webhooks can't reach the server (e.g. localhost).
   */
  async syncSubscription(): Promise<void> {
    if (USE_MOCK_API) return;
    const auth = getStoredAuth();
    if (!auth?.accessToken) return;
    try {
      await post<{ synced: number }>(
        "subscriptions/sync",
        {},
        { headers: { Authorization: `Bearer ${auth.accessToken}` } },
      );
    } catch {
      // Best-effort; ignore failures
    }
  },

  /** Local helper to set subscribed state (used by AuthContext / SubscriptionPrompt). */
  setSubscribed(subscribed: boolean): void {
    setMockSubscription(subscribed);
  },

  /** Local helper to read subscribed state from storage (used by AuthContext). */
  getSubscribed(): boolean {
    return getMockSubscription();
  },
};
