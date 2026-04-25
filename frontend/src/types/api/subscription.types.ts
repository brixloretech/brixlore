/**
 * API contract types for subscriptions.
 * Backend-ready for NestJS (e.g. SubscriptionsModule, Stripe/webhook integration).
 */

/** Subscription plan identifier. */
export type PlanId = "free" | "monthly" | "yearly";

/** Subscription status as returned by the API. */
export interface SubscriptionStatusDto {
  isSubscribed: boolean;
  planId?: PlanId;
  /** ISO date string; when the current period ends. */
  currentPeriodEnd?: string;
  /** ISO date string; when the subscription was created. */
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Billing summary
// ---------------------------------------------------------------------------

export interface BillingPaymentMethodDto {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface BillingInvoiceDto {
  id: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string;
  hostedInvoiceUrl?: string | null;
  invoicePdf?: string | null;
  createdAt: string;
}

export interface BillingSummaryDto {
  paymentMethod?: BillingPaymentMethodDto | null;
  invoices: BillingInvoiceDto[];
}

export interface CreateCheckoutSessionRequestDto {
  planId: string;
  /** Which billing cycle to use — 'MONTHLY' | 'YEARLY'. Defaults to 'MONTHLY'. */
  billingCycle?: "MONTHLY" | "YEARLY";
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateCheckoutSessionResponseDto {
  url: string;
}

/** Request body for POST /subscriptions (subscribe). */
export interface SubscribeRequestDto {
  planId: PlanId;
  /** Optional payment method or session id from payment provider. */
  paymentMethodId?: string;
}

/** Response for POST /subscriptions */
export interface SubscribeResponseDto {
  subscription: SubscriptionStatusDto;
  /** Optional client secret for payment confirmation. */
  clientSecret?: string;
}

/** Response for GET /subscriptions/me */
export type GetSubscriptionResponseDto = SubscriptionStatusDto;

/** Request body for PATCH /subscriptions/me (e.g. cancel, change plan). */
export interface UpdateSubscriptionRequestDto {
  planId?: PlanId;
  cancelAtPeriodEnd?: boolean;
}

/** Response for PATCH /subscriptions/me */
export interface UpdateSubscriptionResponseDto {
  subscription: SubscriptionStatusDto;
}

// ---------------------------------------------------------------------------
// Public plans
// ---------------------------------------------------------------------------

export interface PublicPlanDto {
  id: string;
  name: string;
  /** Monthly price */
  price: number;
  /** Yearly price (optional; undefined if not set) */
  yearlyPrice?: number;
  deviceLimit: number;
  offlineAllowed: boolean;
  maxOfflineDownloads: number;
  isPopular: boolean;
  perks: string[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Admin subscriptions
// ---------------------------------------------------------------------------

export interface AdminSubscriptionDto {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  planId: string;
  planName: string;
  planPrice: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  stripeSubscriptionId?: string;
}

export interface AdminSubscriptionsSummaryDto {
  totalCount: number;
  activeCount: number;
  cancelledCount: number;
  expiredCount: number;
  activeRevenue: string;
}

export interface AdminSubscriptionsResponseDto {
  total: number;
  subscriptions: AdminSubscriptionDto[];
  summary: AdminSubscriptionsSummaryDto;
}
