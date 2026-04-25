export interface AdminPlanDto {
  id: string;
  name: string;
  /** Monthly price formatted as string, e.g. "9.99" */
  price: string;
  /** Yearly price formatted as string (optional) */
  yearlyPrice?: string;
  deviceLimit: number;
  offlineAllowed: boolean;
  maxOfflineDownloads: number;
  isPopular: boolean;
  perks: string[];
  /** Monthly Stripe price ID */
  stripePriceId?: string;
  /** Yearly Stripe price ID */
  yearlyStripePriceId?: string;
  activeSubscribers: number;
  createdAt: string;
  updatedAt: string;
}
