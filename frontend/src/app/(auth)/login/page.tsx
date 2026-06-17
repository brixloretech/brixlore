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
import { getApiErrorMessage } from "@/lib/api-client";
import { authService } from "@/lib/services";
import { setLoginOrigin } from "@/lib/mock-auth";
import { useAuth } from "@/contexts";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const returnUrlParam = searchParams.get("returnUrl");
  const returnUrl =
    returnUrlParam && returnUrlParam.startsWith("/")
      ? returnUrlParam
      : "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

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
    setResendSuccess(null);
    if (!runValidation()) return;

    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      setLoginOrigin("customer");
      await login({
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
      });
      setSuccess(true);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!email) return;
    setResendLoading(true);
    setResendSuccess(null);
    setSubmitError(null);
    try {
      const res = await authService.resendVerification({ email });
      setResendSuccess(res.message);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setResendLoading(false);
    }
  }

  useEffect(() => {
    if (!success) return;
    router.replace(returnUrl);
  }, [success, returnUrl, router]);

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Signed in</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Redirecting…
          </p>
        </CardContent>
        <CardFooter>
          <Link
            href={returnUrl}
            className="inline-flex h-8 items-center justify-center rounded-md bg-neutral-900 px-3 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Continue
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Enter your credentials to access your account.
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {submitError && (
            <div
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400 space-y-2"
              role="alert"
            >
              <p>{submitError}</p>
              {submitError.includes("verify your email address") && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="text-xs font-semibold underline text-red-800 hover:text-red-900 dark:text-red-300 dark:hover:text-red-200 disabled:opacity-50 block"
                >
                  {resendLoading ? "Sending..." : "Send verification link again"}
                </button>
              )}
            </div>
          )}
          {resendSuccess && (
            <p
              className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
              role="status"
            >
              {resendSuccess}
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
            placeholder="you@example.com"
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
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <Link
              href="/forgot-password"
              className="text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Forgot password?
            </Link>
            <Link
              href={`/signup?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Create an account
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader size="md" label="Loading…" />
          </CardContent>
        </Card>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
