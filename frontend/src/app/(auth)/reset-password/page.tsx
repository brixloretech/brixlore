"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { validatePassword, validatePasswordMatch } from "@/lib/validation";
import { getApiErrorMessage } from "@/lib/api-client";
import { authService } from "@/lib/services";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const adminRedirect = searchParams.get("admin") === "1";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  function runValidation(): boolean {
    const newError = validatePassword(newPassword);
    const confirmError = validatePasswordMatch(newPassword, confirmPassword);
    setErrors({
      newPassword: newError ?? undefined,
      confirmPassword: confirmError ?? undefined,
    });
    return !newError && !confirmError;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!runValidation()) return;
    if (!token) {
      setSubmitError(
        "Invalid or missing reset link. Please request a new one.",
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword({
        token,
        newPassword,
      });
      setMessage(response.message);
      setSuccess(true);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid reset link</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            This link is missing the reset token. Please use the link from your
            email or request a new password reset.
          </p>
        </CardContent>
        <CardFooter>
          <Link
            href="/forgot-password"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Request new link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (success) {
    const title = adminRedirect ? "Account activated" : "Password reset";
    const body = adminRedirect
      ? "Your administrator account is now active. You can sign in with your new password."
      : message;
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {body}
          </p>
        </CardContent>
        <CardFooter>
          <Link
            href={adminRedirect ? "/admin/login" : "/login"}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {adminRedirect ? "Back to admin sign in" : "Back to sign in"}
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Enter your new password below. It must be at least 8 characters.
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
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={errors.newPassword}
            disabled={isLoading}
            placeholder="At least 8 characters"
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            disabled={isLoading}
            placeholder="Repeat password"
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? "Resetting…" : "Reset password"}
          </Button>
          <Link
            href={adminRedirect ? "/admin/login" : "/login"}
            className="text-center text-sm text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
