/**
 * Secure token storage for real API auth.
 * Uses sessionStorage so tokens are cleared when the tab closes (no long-lived storage).
 */

const AUTH_KEY = "auth";

export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredAuth;
    if (!data?.accessToken) return null;
    return data;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: StoredAuth): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } catch {
    // sessionStorage full or unavailable
  }
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AUTH_KEY);
  } catch {
    // ignore
  }
}
