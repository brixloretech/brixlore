"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Elements,
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Check, CreditCard, ShieldCheck } from "lucide-react";
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
import {
  validateEmail,
  validatePassword,
  validateRequired,
  validatePasswordMatch,
} from "@/lib/validation";
import { getApiErrorMessage } from "@/lib/api-client";
import { authService, subscriptionService } from "@/lib/services";
import { useMatomo } from "@/hooks/useMatomo";
import type { PublicPlanDto } from "@/types/api";

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

function SignupFormInner() {
  const stripe = useStripe();
  const elements = useElements();

  const { trackEvent } = useMatomo();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PublicPlanDto | null>(null);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const stripeReady = Boolean(stripe);
  const hasStripeKey = stripePublishableKey.length > 0;

  const selectedPlanId = searchParams.get("plan")?.trim() ?? "";
  const planNameFromUrl = searchParams.get("planName")?.trim() ?? "";
  const billingCycleParam =
    searchParams.get("billingCycle")?.trim().toLowerCase() ?? "monthly";
  const billingCycle: "monthly" | "yearly" =
    billingCycleParam === "yearly" || billingCycleParam === "annual"
      ? "yearly"
      : "monthly";
  const trialSelected = searchParams.get("trial") === "1";
  const returnUrlParam = searchParams.get("returnUrl");
  const returnUrl =
    returnUrlParam && returnUrlParam.startsWith("/")
      ? returnUrlParam
      : "/dashboard";

  useEffect(() => {
    let active = true;
    subscriptionService
      .getPlans()
      .then((planList) => {
        if (!active) return;
        setPlans(planList);
        setPlansError(null);
      })
      .catch(() => {
        if (!active) return;
        setPlans([]);
        setPlansError("Unable to load plans. Please try again.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedPlanId) {
      setSelectedPlan(null);
      return () => {
        active = false;
      };
    }

    const fromList = plans.find((plan) => plan.id === selectedPlanId) ?? null;
    if (fromList) {
      setSelectedPlan(fromList);
      return () => {
        active = false;
      };
    }

    subscriptionService
      .getPlanById(selectedPlanId)
      .then((plan) => {
        if (!active) return;
        setSelectedPlan(plan);
      })
      .catch(() => {
        if (!active) return;
        setSelectedPlan(null);
      });

    return () => {
      active = false;
    };
  }, [plans, selectedPlanId]);

  const hasPlan = Boolean(selectedPlan);
  const requiresPayment = hasPlan;
  const displayPlanName =
    selectedPlan?.name ||
    planNameFromUrl ||
    (selectedPlanId ? "Selected plan" : "");

  function runValidation(): boolean {
    const nameError = validateRequired(name, "Name");
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validatePasswordMatch(password, confirmPassword);
    setErrors({
      name: nameError ?? undefined,
      email: emailError ?? undefined,
      password: passwordError ?? undefined,
      confirmPassword: confirmError ?? undefined,
    });
    return !nameError && !emailError && !passwordError && !confirmError;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setCardError(null);
    if (!runValidation()) return;

    setIsLoading(true);
    try {
      if (!requiresPayment) {
        const response = await authService.register({ name, email, password });
        setSuccessMessage(response.message);
        trackEvent("Auth", "signup", "free");
        setIsSuccess(true);
        return;
      }

      const plan = selectedPlan;
      if (!plan) {
        setSubmitError("Please choose a plan before creating your account.");
        return;
      }
      if (!stripe || !elements) {
        setSubmitError("Payment system is still loading. Please try again.");
        return;
      }

      const card = elements.getElement(CardElement);
      if (!card) {
        setSubmitError("Payment form is not ready. Please try again.");
        return;
      }

      const paymentMethodResult = await stripe.createPaymentMethod({
        type: "card",
        card,
        billing_details: {
          name,
          email,
        },
      });

      if (paymentMethodResult.error || !paymentMethodResult.paymentMethod) {
        setCardError(
          paymentMethodResult.error?.message ??
            "Unable to process payment details.",
        );
        return;
      }

      const sortedPlans = [...plans].sort((a, b) => a.price - b.price);
      const planIndex = sortedPlans.findIndex((p) => p.id === plan.id);
      const trialDays =
        trialSelected && planIndex >= 0
          ? planIndex === 0
            ? 7
            : 14
          : undefined;

      const intent = await authService.createSignupSubscriptionIntent({
        name,
        email,
        planId: plan.id,
        paymentMethodId: paymentMethodResult.paymentMethod.id,
        ...(trialDays != null ? { trialPeriodDays: trialDays } : {}),
        ...(billingCycle === "yearly" ? { billingCycle: "YEARLY" } : {}),
      });

      if (intent.clientSecret) {
        const confirmation = await stripe.confirmCardPayment(
          intent.clientSecret,
        );
        if (confirmation.error) {
          setCardError(
            confirmation.error.message ?? "Payment verification failed.",
          );
          return;
        }
        const status = confirmation.paymentIntent?.status;
        if (status !== "succeeded" && status !== "processing") {
          setCardError("Payment was not completed. Please try again.");
          return;
        }
      }

      const response = await authService.finalizeSignupWithSubscription({
        name,
        email,
        password,
        planId: plan.id,
        subscriptionId: intent.subscriptionId,
        customerId: intent.customerId,
      });
      setSuccessMessage(response.message);
      trackEvent("Auth", "signup", "paid");
      trackEvent("Subscription", "purchase", plan.name, plan.price);
      setIsSuccess(true);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <AuthCard>
        <AuthHeader eyebrow="One last step" title="Check your email." description={successMessage || "Registration successful. Please verify your email to open your Brixlore account."} />
        <AuthContent><div className="grid h-16 w-16 place-items-center rounded-full bg-white text-black"><Check size={24} /></div></AuthContent>
        <AuthFooter className="space-y-3">
          <AuthButton type="button" onClick={() => router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)}>Go to sign in</AuthButton>
          <p className="text-center text-xs text-white/32">Didn&apos;t receive it? Check your spam folder.</p>
        </AuthFooter>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader eyebrow="Join Brixlore" title="Create your space." description="One account for independent films, original series, your list, and every story still to come.">
        {plansError ? (
          <AuthNotice className="mt-5">{plansError}</AuthNotice>
        ) : hasPlan || displayPlanName ? (
          <AuthNotice tone="neutral" className="mt-5 flex items-center justify-between gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Selected access</span>
            <strong className="text-xs text-white/80">{selectedPlan?.name || displayPlanName}{billingCycle === "yearly" ? " · Annual" : ""}{trialSelected ? " · Trial" : ""}</strong>
          </AuthNotice>
        ) : null}
        {requiresPayment && !hasStripeKey ? (
          <AuthNotice className="mt-3">Payment configuration is unavailable right now.</AuthNotice>
        ) : null}
      </AuthHeader>
      <form onSubmit={handleSubmit}>
        <AuthContent className="space-y-5">
          {submitError && <AuthNotice>{submitError}</AuthNotice>}
          <Input
            label="Name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            disabled={isLoading}
            placeholder="Your name"
            className={authInputClass}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            disabled={isLoading}
            placeholder="you@example.com"
            className={authInputClass}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            disabled={isLoading}
            placeholder="At least 8 characters"
            hint="Must be at least 8 characters."
            className={authInputClass}
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
            className={authInputClass}
          />
          {requiresPayment && (
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-300">
                <CreditCard size={15} /> Card details
              </label>
              <div className="flex h-14 items-center rounded-xl border border-white/12 bg-white/[0.045] px-4 text-sm text-white shadow-inner shadow-black/20 transition-colors hover:border-white/22 focus-within:border-white/55 focus-within:ring-4 focus-within:ring-white/[0.07]">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: "14px",
                        color: "#f5f7fb",
                        "::placeholder": { color: "#6b7280" },
                      },
                    },
                  }}
                />
              </div>
              {cardError ? (
                <p className="mt-2 text-sm text-red-200">
                  {cardError}
                </p>
              ) : null}
            </div>
          )}
          <AuthButton
            type="submit"
            disabled={
              isLoading || (requiresPayment && (!stripeReady || !hasStripeKey))
            }
          >
            {isLoading
              ? "Creating account..."
              : requiresPayment
                ? "Create account & subscribe"
                : "Create free account"}
          </AuthButton>
          {requiresPayment && <p className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25"><ShieldCheck size={12} /> Payment details are encrypted</p>}
        </AuthContent>
        <AuthFooter>
          <p className="text-center text-sm text-white/42">Already have an account? <Link href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} className="font-semibold text-white transition hover:text-white/70">Sign in</Link></p>
        </AuthFooter>
      </form>
    </AuthCard>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <AuthCard><div className="flex min-h-[440px] items-center justify-center"><Loader size="md" label="Preparing signup" className="text-white/55" /></div></AuthCard>
      }
    >
      <Elements stripe={stripePromise}>
        <SignupFormInner />
      </Elements>
    </Suspense>
  );
}
