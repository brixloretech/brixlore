"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts";
import { AuthLoadingScreen } from "./AuthLoadingScreen";

type ProtectedRouteProps = {
  children: ReactNode;
  /** Where to redirect if not authenticated. Default: /login */
  redirectTo?: string;
  /** Pass current path as returnUrl so login can redirect back. Default: true */
  appendReturnUrl?: boolean;
};

/**
 * Protected route: only renders children when the user is authenticated.
 * - Redirects unauthenticated users to login (with optional returnUrl).
 * - Shows a loading state while auth is being resolved (e.g. GET /me on load).
 */
export function ProtectedRoute({
  children,
  redirectTo = "/login",
  appendReturnUrl = true,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      const url =
        appendReturnUrl && pathname
          ? `${redirectTo}?returnUrl=${encodeURIComponent(pathname)}`
          : redirectTo;
      router.replace(url);
    }
  }, [user, isLoading, router, redirectTo, pathname, appendReturnUrl]);

  if (isLoading) {
    return <AuthLoadingScreen label="Checking authentication" />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
