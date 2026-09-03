"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, MailCheck, ShieldAlert } from "lucide-react";
import {
  AuthButton,
  AuthCard,
  AuthContent,
  AuthFooter,
  AuthHeader,
  AuthNotice,
} from "@/components/auth";
import { Loader } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api-client";
import { authService } from "@/lib/services";

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const returnUrlParam = searchParams.get("returnUrl");
  const returnUrl = returnUrlParam?.startsWith("/")
    ? returnUrlParam
    : "/dashboard";
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token was provided.");
      return;
    }

    let active = true;

    authService
      .verifyEmail({ token })
      .then((response) => {
        if (!active) return;
        setStatus("success");
        setMessage(response.message);
      })
      .catch((error) => {
        if (!active) return;
        setStatus("error");
        setMessage(getApiErrorMessage(error));
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (status === "loading") {
    return (
      <AuthCard>
        <AuthHeader
          eyebrow="Verification in progress"
          title="Opening your account."
          description="We’re confirming your private link. This should only take a moment."
        />
        <AuthContent className="pb-9">
          <div className="flex min-h-32 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025]">
            <Loader
              size="md"
              label="Verifying email"
              className="text-white/55"
            />
          </div>
        </AuthContent>
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard>
        <AuthHeader
          eyebrow="Identity confirmed"
          title="You’re ready to watch."
          description={message || "Your email address has been verified."}
        />
        <AuthContent>
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-black">
            <Check size={24} />
          </div>
        </AuthContent>
        <AuthFooter>
          <AuthButton
            type="button"
            onClick={() =>
              router.push(
                `/login?returnUrl=${encodeURIComponent(returnUrl)}`,
              )
            }
          >
            Continue to sign in
          </AuthButton>
        </AuthFooter>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        eyebrow="Verification paused"
        title="We couldn’t confirm it."
        description="The link may be incomplete, expired, or already used. You can return to sign in and request another one."
      />
      <AuthContent className="space-y-5">
        <div className="grid h-16 w-16 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white">
          <ShieldAlert size={24} />
        </div>
        <AuthNotice>{message}</AuthNotice>
      </AuthContent>
      <AuthFooter className="space-y-4">
        <AuthButton
          type="button"
          onClick={() =>
            router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
          }
        >
          Go to sign in
        </AuthButton>
        <p className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">
          <MailCheck size={12} /> New links can be requested at sign in
        </p>
      </AuthFooter>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthCard>
          <div className="flex min-h-[360px] items-center justify-center">
            <Loader
              size="md"
              label="Preparing verification"
              className="text-white/55"
            />
          </div>
        </AuthCard>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
