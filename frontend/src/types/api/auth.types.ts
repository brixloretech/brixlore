/**
 * API contract types for authentication.
 * Backend-ready for NestJS (e.g. AuthModule, DTOs, guards).
 */

/** User as returned by the API (includes id when persisted). */
export interface UserDto {
  id: string;
  email: string;
  name: string;
  role:
    | "user"
    | "admin"
    | "SUPER_ADMIN"
    | "CONTENT_MANAGER"
    | "CUSTOMER_SUPPORT";
  /** ISO date string. */
  createdAt?: string;
}

/** Request body for POST /auth/login */
export interface LoginRequestDto {
  email: string;
  password: string;
}

/** Response for POST /auth/login */
export interface LoginResponseDto {
  user: UserDto;
  accessToken: string;
  /** Optional; used for refresh flow. */
  refreshToken?: string;
  /** Token expiry in seconds. */
  expiresIn?: number;
}

/** Request body for POST /auth/register */
export interface RegisterRequestDto {
  name: string;
  email: string;
  password: string;
}

/** Request body for POST /auth/signup-with-subscription */
export interface RegisterWithSubscriptionRequestDto extends RegisterRequestDto {
  planId: string;
  paymentMethodId: string;
  /** Optional billing cycle: MONTHLY or YEARLY. Defaults to MONTHLY. */
  billingCycle?: "MONTHLY" | "YEARLY";
}

/** Request body for POST /auth/signup-subscription-intent */
export interface SignupSubscriptionIntentRequestDto {
  name: string;
  email: string;
  planId: string;
  paymentMethodId: string;
  /** Optional free trial length in days (e.g. 7 or 14). When set, Stripe creates subscription in trialing state. */
  trialPeriodDays?: number;
  /** Optional billing cycle: MONTHLY or YEARLY. Defaults to MONTHLY. */
  billingCycle?: "MONTHLY" | "YEARLY";
}

/** Response for POST /auth/signup-subscription-intent */
export interface SignupSubscriptionIntentResponseDto {
  customerId: string;
  subscriptionId: string;
  clientSecret: string | null;
}

/** Request body for POST /auth/signup-subscription-finalize */
export interface SignupSubscriptionFinalizeRequestDto extends RegisterRequestDto {
  planId: string;
  subscriptionId: string;
  customerId: string;
}

/** Response for POST /auth/register. */
export interface RegisterResponseDto {
  message: string;
}

/** Request body for POST /auth/verify-email */
export interface VerifyEmailRequestDto {
  token: string;
}

/** Response for POST /auth/verify-email */
export interface VerifyEmailResponseDto {
  message: string;
}

/** Request body for POST /auth/forgot-password */
export interface ForgotPasswordRequestDto {
  email: string;
}

/** Response for POST /auth/forgot-password */
export interface ForgotPasswordResponseDto {
  message: string;
}

/** Request body for POST /auth/reset-password */
export interface ResetPasswordRequestDto {
  token: string;
  newPassword: string;
}

/** Response for POST /auth/reset-password */
export interface ResetPasswordResponseDto {
  message: string;
}

/** Request body for POST /auth/change-password */
export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

/** Response for POST /auth/change-password */
export interface ChangePasswordResponseDto {
  message: string;
}

/** Request body for POST /auth/refresh (if using refresh tokens). */
export interface RefreshTokenRequestDto {
  refreshToken: string;
}

/** Response for POST /auth/refresh */
export type RefreshTokenResponseDto = Pick<
  LoginResponseDto,
  "accessToken" | "refreshToken" | "expiresIn"
>;
