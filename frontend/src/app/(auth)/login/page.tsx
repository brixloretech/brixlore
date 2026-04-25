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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  useEffect(() => {
    if (!success) return;
    const returnUrl =
      returnUrlParam && returnUrlParam.startsWith("/")
        ? returnUrlParam
        : "/dashboard";
    router.replace(returnUrl);
  }, [success, returnUrlParam, router]);

  if (success) {
    const returnUrl =
      returnUrlParam && returnUrlParam.startsWith("/")
        ? returnUrlParam
        : "/dashboard";
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
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
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
              href="/signup"
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
