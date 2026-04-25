/**
 * Response for GET /subscriptions/me.
 * Matches frontend GetSubscriptionResponseDto (SubscriptionStatusDto).
 */
export class SubscriptionMeResponseDto {
  isSubscribed: boolean;
  planId?: string;
  currentPeriodEnd?: string;
  createdAt?: string;
}
