/**
 * Mock authentication. Simulates API responses without a backend.
 * Replace with real API calls when integrating with your auth service.
 */

const MOCK_DELAY_MS = 800;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import type { User, UserRole } from "@/types";

export type MockLoginResult =
  | { success: true; user: User }
  | { success: false; error: string };

/** Mock: admin@example.com gets role "admin", all others "user". */
function mockRoleForEmail(email: string): UserRole {
  return email.trim().toLowerCase() === "admin@example.com"
    ? "SUPER_ADMIN"
    : "user";
}

export async function mockLogin(
  email: string,
  password: string,
): Promise<MockLoginResult> {
  await delay(MOCK_DELAY_MS);
  if (password === "password123") {
    const trimmedEmail = email.trim();
    return {
      success: true,
      user: {
        email: trimmedEmail,
        name: email.split("@")[0] ?? "User",
        role: mockRoleForEmail(trimmedEmail),
      },
    };
  }
  return { success: false, error: "Invalid email or password." };
}

export type MockSignupResult =
  | { success: true; user: User }
  | { success: false; error: string };

export async function mockSignup(
  name: string,
  email: string,
  password: string,
): Promise<MockSignupResult> {
  await delay(MOCK_DELAY_MS);
  void password; // reserved for real validation
  const trimmedEmail = email.trim();
  return {
    success: true,
    user: {
      email: trimmedEmail,
      name: name.trim(),
      role: mockRoleForEmail(trimmedEmail),
    },
  };
}

export type MockForgotPasswordResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function mockForgotPassword(
  email: string,
): Promise<MockForgotPasswordResult> {
  await delay(MOCK_DELAY_MS);
  void email; // reserved for real lookup
  return {
    success: true,
    message:
      "If an account exists for this email, you will receive a reset link.",
  };
}

/** Store mock session in localStorage for demo (includes optional role). */
export function setMockSession(user: User): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("mockAuthUser", JSON.stringify(user));
  }
}

const LOGIN_ORIGIN_KEY = "loginOrigin";

/** Set where the user signed in: "admin" = /admin/login, "customer" = /login. Used by Header to show/hide Admin tab. */
export function setLoginOrigin(origin: "admin" | "customer"): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(LOGIN_ORIGIN_KEY, origin);
  }
}

/** Get login origin; null if not set (e.g. restored session from another tab). */
export function getLoginOrigin(): "admin" | "customer" | null {
  if (typeof window === "undefined") return null;
  const v = window.sessionStorage.getItem(LOGIN_ORIGIN_KEY);
  return v === "admin" || v === "customer" ? v : null;
}

export function clearMockSession(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("mockAuthUser");
    window.localStorage.removeItem("mockSubscription");
    window.sessionStorage.removeItem(LOGIN_ORIGIN_KEY);
  }
}

const SUBSCRIPTION_KEY = "mockSubscription";

/** Read mocked subscription status from localStorage. */
export function getMockSubscription(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SUBSCRIPTION_KEY) === "true";
  } catch {
    return false;
  }
}

/** Set mocked subscription status (e.g. after "Subscribe" action). */
export function setMockSubscription(subscribed: boolean): void {
  if (typeof window !== "undefined") {
    if (subscribed) {
      window.localStorage.setItem(SUBSCRIPTION_KEY, "true");
    } else {
      window.localStorage.removeItem(SUBSCRIPTION_KEY);
    }
  }
}
