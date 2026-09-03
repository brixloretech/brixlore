"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Mail } from "lucide-react";
import {
  AuthButton,
  AuthCard,
  AuthContent,
  AuthFooter,
  AuthHeader,
  AuthNotice,
  authInputClass,
} from "@/components/auth";
import { Input } from "@/components/ui";
import { authService } from "@/lib/services";
import { validateEmail } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.forgotPassword({ email });
      setMessage(response.message);
      setSuccess(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <AuthCard>
        <AuthHeader
          eyebrow="Message sent"
          title="Check your inbox."
          description={
            message ||
            "We sent a private reset link to your email. Follow it to choose a new password."
          }
        />
        <AuthContent>
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-black">
            <Check size={24} />
          </div>
          <p className="mt-5 text-sm leading-6 text-white/40">
            The link may take a minute to arrive. Check your spam folder if you
            do not see it.
          </p>
        </AuthContent>
        <AuthFooter>
          <Link
            href="/login"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-black transition-colors hover:bg-white/80"
          >
            Back to sign in <ArrowLeft size={15} />
          </Link>
        </AuthFooter>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        eyebrow="Account recovery"
        title="Find your way back."
        description="Tell us where to reach you and we’ll send a secure link to reset your password."
      />
      <form onSubmit={handleSubmit}>
        <AuthContent className="space-y-5">
          {error && <AuthNotice>{error}</AuthNotice>}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading}
            placeholder="you@example.com"
            className={authInputClass}
          />
          <AuthButton type="submit" disabled={isLoading}>
            {isLoading ? "Sending secure link..." : "Send reset link"}
          </AuthButton>
          <p className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">
            <Mail size={12} /> One secure email, no spam
          </p>
        </AuthContent>
        <AuthFooter>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm font-semibold text-white/45 transition hover:text-white"
          >
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </AuthFooter>
      </form>
    </AuthCard>
  );
}
