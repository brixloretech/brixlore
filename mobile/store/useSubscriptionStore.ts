import { create } from "zustand";
import {
  subscriptionService,
  type SubscriptionMeResponseDto,
} from "../services/subscriptionService";

interface SubscriptionState {
  subscription: SubscriptionMeResponseDto | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSubscription: () => Promise<void>;
  isFreeTier: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  isLoading: false,
  error: null,

  fetchSubscription: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await subscriptionService.getSubscription();
      set({ subscription: data, isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to fetch subscription";
      set({ error: errorMessage, isLoading: false });
    }
  },

  isFreeTier: () => {
    const { subscription } = get();
    return !subscription?.isSubscribed;
  },
}));
