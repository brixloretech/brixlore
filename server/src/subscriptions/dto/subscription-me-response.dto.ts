/**
 * Response for GET /subscriptions/me.
 * Matches frontend GetSubscriptionResponseDto (SubscriptionStatusDto).
 */
export class SubscriptionMeResponseDto {
  isSubscribed: boolean;
  planId?: string;
  status?: string;
  billingCycle?: string;
  currentPeriodEnd?: string;
  createdAt?: string;
  stripeSubscriptionId?: string | null;
}
