"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Mail } from "lucide-react";
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
import { useAuth } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api-client";
import { setLoginOrigin } from "@/lib/mock-auth";
import { authService } from "@/lib/services";
import { validateEmail } from "@/lib/validation";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const returnUrlParam = searchParams.get("returnUrl");
  const returnUrl = returnUrlParam?.startsWith("/") ? returnUrlParam : "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  function runValidation() {
    const emailError = validateEmail(email);
    const passwordError = password.trim() ? null : "Password is required.";
    setErrors({ email: emailError ?? undefined, password: passwordError ?? undefined });
    return !emailError && !passwordError;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setResendSuccess(null);
    if (!runValidation()) return;
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      setLoginOrigin("customer");
      await login({ email: response.user.email, name: response.user.name, role: response.user.role });
      setSuccess(true);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
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
      const result = await authService.resendVerification({ email });
      setResendSuccess(result.message);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    } finally {
      setResendLoading(false);
    }
  }

  useEffect(() => {
    if (success) router.replace(returnUrl);
  }, [success, returnUrl, router]);

  if (success) {
    return (
      <AuthCard>
        <AuthHeader eyebrow="Access granted" title="Welcome back." description="Your Brixlore space is ready. We’re taking you there now." />
        <AuthContent><div className="grid h-16 w-16 place-items-center rounded-full border border-white/15 bg-white text-black"><Check size={24} /></div></AuthContent>
        <AuthFooter><Link href={returnUrl} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-black">Continue <ArrowRight size={15} /></Link></AuthFooter>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader eyebrow="Member access" title="Welcome back." description="Sign in to continue watching, return to your list, and pick up exactly where you left off." />
      <form onSubmit={handleSubmit}>
        <AuthContent className="space-y-5">
          {submitError && (
            <AuthNotice>
              <p>{submitError}</p>
              {submitError.includes("verify your email address") && (
                <button type="button" onClick={handleResendVerification} disabled={resendLoading} className="mt-2 text-xs font-semibold underline underline-offset-4 disabled:opacity-50">{resendLoading ? "Sending..." : "Send verification link again"}</button>
              )}
            </AuthNotice>
          )}
          {resendSuccess && <AuthNotice tone="success">{resendSuccess}</AuthNotice>}
          <Input label="Email address" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} disabled={isLoading} placeholder="name@example.com" className={authInputClass} />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-300">Password</span>
              <Link href="/forgot-password" className="text-xs font-semibold text-white/42 transition hover:text-white">Forgot password?</Link>
            </div>
            <Input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} disabled={isLoading} placeholder="Enter your password" className={authInputClass} />
          </div>
          <AuthButton type="submit" disabled={isLoading}>{isLoading ? "Opening your space…" : "Sign in"}</AuthButton>
        </AuthContent>
        <AuthFooter className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-white/42">New to Brixlore? <Link href={`/signup?returnUrl=${encodeURIComponent(returnUrl)}`} className="font-semibold text-white transition hover:text-white/70">Create an account</Link></p>
          <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/24"><Mail size={12} /> Secure member sign-in</span>
        </AuthFooter>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthCard><div className="flex min-h-[360px] items-center justify-center"><Loader size="md" label="Loading sign in" className="text-white/55" /></div></AuthCard>}>
      <LoginPageContent />
    </Suspense>
  );
}
