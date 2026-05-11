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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from "@/components/ui";
import {
  validateEmail,
  validatePassword,
  validateRequired,
  validatePasswordMatch,
} from "@/lib/validation";
import { getApiErrorMessage } from "@/lib/api-client";
import { authService, subscriptionService } from "@/lib/services";
import { useAuth } from "@/contexts";
import type { PublicPlanDto } from "@/types/api";

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

function SignupFormInner() {
  const stripe = useStripe();
  const elements = useElements();

  const { login, setSubscribed } = useAuth();
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
      setIsSuccess(true);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <CardTitle>Check your email</CardTitle>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {successMessage || "Registration successful. Please check your email to verify your account."}
          </p>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3">
          <Button fullWidth onClick={() => router.push("/login")}>
            Go to Login
          </Button>
          <p className="text-center text-xs text-neutral-500">
            Didn't receive an email? Check your spam folder.
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Enter your details to create a new account.
        </p>
        {plansError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-300">
            {plansError}
          </div>
        ) : hasPlan || displayPlanName ? (
          <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300">
            <span>
              Selected plan:{" "}
              <strong>{selectedPlan?.name || displayPlanName}</strong>
              {billingCycle === "yearly" ? " (annual)" : ""}
              {trialSelected ? " (trial)" : ""}
            </span>
          </div>
        ) : null}
        {requiresPayment && !hasStripeKey ? (
          <p className="mt-3 text-xs text-red-600 dark:text-red-400">
            Stripe publishable key is missing. Add
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your env.
          </p>
        ) : null}
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
            label="Name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            disabled={isLoading}
            placeholder="Your name"
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
          {requiresPayment && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Card details
              </label>
              <div className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100">
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
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                  {cardError}
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            fullWidth
            disabled={
              isLoading || (requiresPayment && (!stripeReady || !hasStripeKey))
            }
          >
            {isLoading
              ? "Creating account..."
              : requiresPayment
                ? "Create account & subscribe"
                : "Create free account"}
          </Button>
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="underline hover:text-neutral-900 dark:hover:text-white"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Loading signup details...
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Preparing the payment form.
            </p>
          </CardContent>
        </Card>
      }
    >
      <Elements stripe={stripePromise}>
        <SignupFormInner />
      </Elements>
    </Suspense>
  );
}
