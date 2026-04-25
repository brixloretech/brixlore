"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import { AuthLoadingScreen } from "./AuthLoadingScreen";

type AdminProtectedRouteProps = {
  children: ReactNode;
  /** Where to redirect if not authenticated. Default: /admin/login */
  loginRedirectTo?: string;
};

/**
 * Admin protected route: only renders children when the user is authenticated and has admin role.
 * - Redirects unauthenticated users to admin login (with returnUrl).
 * - Shows "Access denied" for authenticated non-admin users (restricts by role).
 * - Shows a loading state while auth is being resolved.
 */
export function AdminProtectedRoute({
  children,
  loginRedirectTo = "/admin/login",
}: AdminProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      const url = pathname
        ? `${loginRedirectTo}?returnUrl=${encodeURIComponent(pathname)}`
        : loginRedirectTo;
      router.replace(url);
    }
  }, [user, isLoading, router, loginRedirectTo, pathname]);

  if (isLoading) {
    return <AuthLoadingScreen label="Checking access" />;
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              This area is restricted to administrators. Your account does not
              have admin access.
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              Use the admin sign-in at{" "}
              <Link
                href="/admin/login"
                className="font-medium text-accent underline hover:no-underline"
              >
                /admin/login
              </Link>{" "}
              with an admin account (e.g. admin@example.com).
            </p>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Link href="/admin/login">
              <Button type="button">Go to admin sign-in</Button>
            </Link>
            <Link href="/">
              <Button type="button" variant="secondary">
                Back to home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
