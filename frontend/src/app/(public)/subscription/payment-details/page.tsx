"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts";
import { Button, Loader } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-client";
import { subscriptionService } from "@/lib/services";
import type { PublicPlanDto } from "@/types/api";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5 flex-shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5 flex-shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function SelectedBadge() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
      <CheckIcon className="h-3.5 w-3.5" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Helpers (mirror of subscription page logic)
// ---------------------------------------------------------------------------

type UiPlan = {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  trialDays: number;
  featured?: boolean;
  benefits: { label: string; value: boolean | string }[];
  extraPerks: string[];
  savePercent?: number;
};

type BillingCycle = "monthly" | "yearly";

function calculateYearlySavingsPercent(
  monthlyPrice: number,
  yearlyPrice: number,
): number {
  if (monthlyPrice <= 0 || yearlyPrice <= 0) return 0;
  const yearlyAtMonthlyRate = monthlyPrice * 12;
  if (yearlyAtMonthlyRate <= yearlyPrice) return 0;
  return Math.round(
    ((yearlyAtMonthlyRate - yearlyPrice) / yearlyAtMonthlyRate) * 100,
  );
}

function pickDescription(index: number, total: number): string {
  if (total <= 1) return "The complete experience";
  if (index === 0) return "Great for casual viewers";
  if (index === total - 1) return "The complete experience";
  return "Best for families and power viewers";
}

function buildUiPlansByCycle(
  plans: PublicPlanDto[],
): Record<BillingCycle, UiPlan[]> {
  const mapToUi = (items: PublicPlanDto[], cycle: BillingCycle): UiPlan[] => {
    const sorted = [...items].sort((a, b) => a.price - b.price);
    return sorted.map((plan, index) => {
      const perks = plan.perks ?? [];
      const primaryPerk = perks[0];
      const extraPerks = primaryPerk ? perks.slice(1) : perks;

      const displayPrice =
        cycle === "yearly" && plan.yearlyPrice != null
          ? plan.yearlyPrice
          : plan.price;
      const savePercent =
        cycle === "yearly" && plan.yearlyPrice != null
          ? calculateYearlySavingsPercent(plan.price, plan.yearlyPrice)
          : 0;

      return {
        id: plan.id,
        name: plan.name,
        description: pickDescription(index, sorted.length),
        price: displayPrice.toFixed(2),
        period: cycle === "yearly" ? "year" : "month",
        trialDays: 7,
        featured: plan.isPopular,
        benefits: [
          {
            label: "Perks",
            value: primaryPerk ?? (perks.length > 0 ? true : false),
          },
        ],
        extraPerks,
        savePercent: savePercent > 0 ? savePercent : undefined,
      };
    });
  };

  const yearlyEligible = plans.filter(
    (p) => p.yearlyPrice != null && p.yearlyPrice > 0,
  );

  return {
    monthly: mapToUi(plans, "monthly"),
    yearly: mapToUi(yearlyEligible, "yearly"),
  };
}

function BenefitValue({ value }: { value: boolean | string }) {
  if (value === true)
    return (
      <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
        <CheckIcon className="h-4 w-4" />
        <span className="text-xs">Included</span>
      </span>
    );
  if (value === false)
    return (
      <span className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500">
        <XIcon className="h-4 w-4" />
        <span className="text-xs">—</span>
      </span>
    );
  return (
    <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
      {value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------

function PaymentDetailsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isSubscribed } = useAuth();
  const shouldAutoStart = searchParams.get("autostart") === "1";
  const billingCycleParam =
    searchParams.get("billingCycle")?.trim().toLowerCase() ?? "monthly";
  const normalizedBillingCycle: BillingCycle =
    billingCycleParam === "yearly" || billingCycleParam === "annual"
      ? "yearly"
      : "monthly";
  const autoStartTriggeredRef = useRef(false);
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    searchParams.get("plan")?.trim() ?? "",
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    normalizedBillingCycle,
  );

  useEffect(() => {
    setBillingCycle(normalizedBillingCycle);
  }, [normalizedBillingCycle]);

  useEffect(() => {
    let active = true;
    subscriptionService
      .getPlans()
      .then((items) => {
        if (!active) return;
        setPlans(items);
        if (items.length > 0) {
          setSelectedPlanId((current) => current || items[0].id);
        }
      })
      .catch(() => {
        if (!active) return;
        setPlans([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const plansByCycle = useMemo(() => buildUiPlansByCycle(plans), [plans]);
  const uiPlans = plansByCycle[billingCycle];

  useEffect(() => {
    const hasSelectedInCycle = uiPlans.some(
      (plan) => plan.id === selectedPlanId,
    );
    if (hasSelectedInCycle) return;
    if (uiPlans.length > 0) {
      setSelectedPlanId(uiPlans[0].id);
    }
  }, [uiPlans, selectedPlanId]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );
  const selectedPlanForAuth = selectedPlan?.id ?? selectedPlanId;
  const authQuery = new URLSearchParams({
    ...(selectedPlanForAuth ? { plan: selectedPlanForAuth } : {}),
    ...(selectedPlan?.name ? { planName: selectedPlan.name } : {}),
    billingCycle,
  }).toString();
  const loginHref = `/login?returnUrl=${encodeURIComponent(`/subscription/payment-details${authQuery ? `?${authQuery}` : ""}`)}`;
  const signupHref = `/signup${authQuery ? `?${authQuery}` : ""}`;

  const handleCheckout = useCallback(async () => {
    if (!selectedPlan) {
      setError("Please choose a plan to continue.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const origin = window.location.origin;
      const successUrl = `${origin}/subscription/success?returnUrl=${encodeURIComponent("/dashboard/subscription")}`;
      const cancelUrl = `${origin}/subscription/payment-details?plan=${encodeURIComponent(selectedPlan.id)}&billingCycle=${billingCycle}`;
      const res = await subscriptionService.createCheckoutSession({
        planId: selectedPlan.id,
        successUrl,
        cancelUrl,
        billingCycle: billingCycle === "yearly" ? "YEARLY" : "MONTHLY",
      });
      if (!res?.url)
        throw new Error("Checkout URL is not available right now.");
      window.location.href = res.url;
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [selectedPlan, billingCycle]);

  useEffect(() => {
    if (!shouldAutoStart || autoStartTriggeredRef.current) return;
    if (loading || submitting) return;
    if (!isAuthenticated || isSubscribed) return;
    if (!selectedPlan) return;

    autoStartTriggeredRef.current = true;
    void handleCheckout();
  }, [
    shouldAutoStart,
    loading,
    submitting,
    isAuthenticated,
    isSubscribed,
    selectedPlan,
    handleCheckout,
  ]);

  // ---- Guard screens ----

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4 py-10">
        <Loader size="lg" label="Loading plans..." />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            Sign in to upgrade
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            To purchase a subscription, sign in first.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href={loginHref}>
              <Button type="button">Sign in</Button>
            </Link>
            <Link href={signupHref}>
              <Button type="button" variant="outline">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (isSubscribed) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-emerald-300/60 bg-emerald-50 p-6 dark:border-emerald-800/60 dark:bg-emerald-950/30">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            You already have an active subscription
          </h1>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            Manage your billing details from your subscription dashboard.
          </p>
          <div className="mt-6">
            <Link href="/dashboard/subscription">
              <Button type="button">Open subscription settings</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (shouldAutoStart) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4 py-10">
        {error ? (
          <div className="w-full max-w-xl rounded-2xl border border-red-300/50 bg-red-50/80 p-6 text-center dark:border-red-900/60 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <div className="mt-4 flex justify-center gap-3">
              <Button
                type="button"
                onClick={handleCheckout}
                disabled={submitting || !selectedPlan}
              >
                {submitting ? "Redirecting..." : "Try again"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/subscription")}
              >
                Back to plans
              </Button>
            </div>
          </div>
        ) : (
          <Loader size="lg" label="Redirecting to secure checkout..." />
        )}
      </main>
    );
  }

  // ---- Main redesigned layout ----

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
          Upgrade
        </p>
        <h1 className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
          Choose your plan
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Select a plan below, then continue to secure checkout. Cancel anytime.
        </p>
        <div className="mt-6 inline-flex rounded-full border border-neutral-300 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              billingCycle === "monthly"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              billingCycle === "yearly"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white",
            )}
          >
            Yearly
          </button>
        </div>
      </header>

      {/* Plan cards */}
      <section
        className="grid gap-6 sm:gap-8 lg:grid-cols-3"
        aria-label="Subscription plans"
      >
        {uiPlans.length > 0 ? (
          uiPlans.map((plan) => {
            const active = plan.id === selectedPlanId;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={cn(
                  "flex flex-col rounded-2xl border bg-white text-left shadow-sm transition dark:bg-neutral-900/50",
                  active
                    ? "border-2 border-accent ring-2 ring-accent/20 dark:border-accent"
                    : plan.featured
                      ? "border-2 border-neutral-300 dark:border-neutral-600 hover:border-accent/60"
                      : "border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500",
                  plan.featured && !active && "lg:scale-105 lg:shadow-lg",
                )}
                aria-pressed={active}
                aria-label={`Select ${plan.name} plan at $${plan.price} per ${plan.period}`}
              >
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  {/* Plan header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {plan.savePercent ? (
                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">
                          Save {plan.savePercent}%
                        </p>
                      ) : null}
                      {plan.featured && (
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-400/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.25)]">
                          <span aria-hidden>★</span>
                          <span>Most Popular</span>
                        </div>
                      )}
                      <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                        {plan.name}
                      </h2>
                      <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                        {plan.description}
                      </p>
                    </div>
                    {active && <SelectedBadge />}
                  </div>

                  {/* Price */}
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                    {plan.trialDays}-day free trial
                  </p>

                  {/* Benefits */}
                  <ul
                    className="mt-6 flex-1 space-y-3"
                    aria-label={`${plan.name} benefits`}
                  >
                    {plan.benefits.map((item) => (
                      <li
                        key={item.label}
                        className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0 dark:border-neutral-800"
                      >
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          {item.label}
                        </span>
                        <BenefitValue value={item.value} />
                      </li>
                    ))}
                  </ul>

                  {/* Extra perks */}
                  {plan.extraPerks.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                        Extra perks
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                        {plan.extraPerks.map((perk) => (
                          <li key={perk} className="flex items-start gap-2">
                            <CheckIcon className="mt-0.5 h-4 w-4 text-green-500 dark:text-green-400" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Select indicator */}
                  <div
                    className={cn(
                      "mt-6 rounded-lg py-2 text-center text-sm font-semibold transition",
                      active
                        ? "bg-accent text-white"
                        : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
                    )}
                  >
                    {active ? "Selected" : "Select plan"}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400">
            No plans are available yet. Please check back soon.
          </div>
        )}
      </section>

      {/* Error */}
      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {/* CTA */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button
          type="button"
          onClick={handleCheckout}
          disabled={submitting || !selectedPlan}
          className="min-w-[220px]"
        >
          {submitting ? "Redirecting..." : "Continue to secure checkout"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/subscription")}
        >
          Back to plans
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
        Cancel anytime. No commitment. Terms apply.
      </p>
    </main>
  );
}

export default function PaymentDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[50vh] items-center justify-center px-4 py-10">
          <Loader size="lg" label="Loading plans..." />
        </main>
      }
    >
      <PaymentDetailsPageContent />
    </Suspense>
  );
}
