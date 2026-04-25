"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Loader,
} from "@/components/ui";
import { validateEmail } from "@/lib/validation";
import { authService } from "@/lib/services";
import { setLoginOrigin } from "@/lib/mock-auth";
import { useAuth } from "@/contexts";

const ADMIN_DEFAULT_REDIRECT = "/admin";

/** Return URL is only allowed to be an admin path; otherwise use default. */
function getAdminRedirect(returnUrl: string | null): string {
  if (returnUrl && returnUrl.startsWith("/admin")) return returnUrl;
  return ADMIN_DEFAULT_REDIRECT;
}

function AdminLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isAdmin } = useAuth();
  const returnUrlParam = searchParams.get("returnUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const redirectTo = getAdminRedirect(returnUrlParam);

  // If already logged in as admin, redirect to admin dashboard
  useEffect(() => {
    if (user && isAdmin) {
      router.replace(redirectTo);
    }
  }, [user, isAdmin, router, redirectTo]);

  function runValidation(): boolean {
    const emailError = validateEmail(email);
    const passwordError = password.trim() ? null : "Password is required.";
    setErrors({
      email: emailError ?? undefined,
      password: passwordError ?? undefined,
    });
    return !emailError && !passwordError;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!runValidation()) return;

    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      const isAdminRole =
        response.user.role === "admin" ||
        response.user.role === "SUPER_ADMIN" ||
        response.user.role === "CONTENT_MANAGER" ||
        response.user.role === "CUSTOMER_SUPPORT";
      if (!isAdminRole) {
        setSubmitError(
          "This sign-in is for administrators only. Use the customer sign-in at /login.",
        );
        setIsLoading(false);
        return;
      }
      setLoginOrigin("admin");
      await login({
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
      });
      setSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!success) return;
    router.replace(redirectTo);
  }, [success, router, redirectTo]);

  if (user && isAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader size="lg" label="Redirecting to admin…" />
      </div>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md border-neutral-700/50 bg-neutral-900/50">
        <CardHeader>
          <CardTitle className="text-white">Signed in</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-400">
            Redirecting to admin dashboard…
          </p>
        </CardContent>
        <CardFooter>
          <Link href={redirectTo}>
            <Button type="button">Continue</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-neutral-700/50 bg-neutral-900/50">
      <CardHeader>
        <CardTitle className="text-white">Admin sign in</CardTitle>
        <p className="mt-1 text-sm text-neutral-400">
          Sign in with your administrator account to access the admin dashboard.
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {submitError && (
            <p
              className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400"
              role="alert"
            >
              {submitError}
            </p>
          )}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            disabled={isLoading}
            placeholder="admin@example.com"
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            disabled={isLoading}
            placeholder="••••••••"
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
          <Link
            href="/login"
            className="text-center text-sm text-neutral-400 underline hover:text-accent"
          >
            Customer? Sign in here
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md border-neutral-700/50 bg-neutral-900/50">
          <CardContent className="flex items-center justify-center py-12">
            <Loader size="md" label="Loading…" />
          </CardContent>
        </Card>
      }
    >
      <AdminLoginPageContent />
    </Suspense>
  );
}
