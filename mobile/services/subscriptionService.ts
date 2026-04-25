import { api } from "./api";

export type PublicPlanDto = {
  id: string;
  name: string;
  price: number;
  duration: string;
  deviceLimit: number;
  offlineAllowed: boolean;
  maxOfflineDownloads: number;
  isPopular: boolean;
  perks: string[];
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionMeResponseDto = {
  isSubscribed: boolean;
  planId?: string | null;
  currentPeriodEnd?: string | null;
  createdAt?: string | null;
};

class SubscriptionService {
  async getPlans(): Promise<PublicPlanDto[]> {
    const response = await api.get<PublicPlanDto[]>("/subscriptions/plans");
    return Array.isArray(response.data) ? response.data : [];
  }

  async getSubscription(): Promise<SubscriptionMeResponseDto> {
    const response =
      await api.get<SubscriptionMeResponseDto>("/subscriptions/me");
    return response.data ?? { isSubscribed: false };
  }

  async createPortalSession(
    returnUrl?: string,
  ): Promise<{ url: string } | null> {
    const response = await api.post<{ url: string }>(
      "/subscriptions/portal-session",
      {
        returnUrl,
      },
    );
    return response.data ?? null;
  }
}

export const subscriptionService = new SubscriptionService();
