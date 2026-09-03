"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, KeyRound, ShieldAlert } from "lucide-react";
import {
  AuthButton,
  AuthCard,
  AuthContent,
  AuthFooter,
  AuthHeader,
  AuthNotice,
  authInputClass,
} from "@/components/auth";
import { Input, Loader } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api-client";
import { authService } from "@/lib/services";
import { validatePassword, validatePasswordMatch } from "@/lib/validation";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const adminRedirect = searchParams.get("admin") === "1";
  const signInUrl = adminRedirect ? "/admin/login" : "/login";
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthCard>
        <AuthHeader
          eyebrow="Link unavailable"
          title="This link can’t be used."
          description="The reset token is missing. Request a new email and we’ll get you back on track."
        />
        <AuthContent>
          <div className="grid h-16 w-16 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white">
            <ShieldAlert size={24} />
          </div>
        </AuthContent>
        <AuthFooter>
          <Link
            href="/forgot-password"
            className="inline-flex h-14 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-black transition-colors hover:bg-white/80"
          >
            Request a new link
          </Link>
        </AuthFooter>
      </AuthCard>
    );
  }

  if (success) {
    const title = adminRedirect ? "Account activated." : "Password updated.";
    const description = adminRedirect
      ? "Your administrator account is active. You can now sign in with your new password."
      : message;

    return (
      <AuthCard>
        <AuthHeader
          eyebrow="Access restored"
          title={title}
          description={description}
        />
        <AuthContent>
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-black">
            <Check size={24} />
          </div>
        </AuthContent>
        <AuthFooter>
          <Link
            href={signInUrl}
            className="inline-flex h-14 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-black transition-colors hover:bg-white/80"
          >
            {adminRedirect ? "Go to admin sign in" : "Continue to sign in"}
          </Link>
        </AuthFooter>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        eyebrow="Secure reset"
        title="Choose a new key."
        description="Create a password you haven’t used before. It must be at least eight characters."
      />
      <form onSubmit={handleSubmit}>
        <AuthContent className="space-y-5">
          {submitError && <AuthNotice>{submitError}</AuthNotice>}
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            error={errors.newPassword}
            disabled={isLoading}
            placeholder="At least 8 characters"
            hint="Use at least 8 characters."
            className={authInputClass}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={errors.confirmPassword}
            disabled={isLoading}
            placeholder="Repeat password"
            className={authInputClass}
          />
          <AuthButton type="submit" disabled={isLoading}>
            {isLoading ? "Securing account..." : "Update password"}
          </AuthButton>
          <p className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">
            <KeyRound size={12} /> Your password stays private
          </p>
        </AuthContent>
        <AuthFooter>
          <Link
            href={signInUrl}
            className="flex items-center justify-center gap-2 text-sm font-semibold text-white/45 transition hover:text-white"
          >
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </AuthFooter>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCard>
          <div className="flex min-h-[420px] items-center justify-center">
            <Loader
              size="md"
              label="Preparing secure reset"
              className="text-white/55"
            />
          </div>
        </AuthCard>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
