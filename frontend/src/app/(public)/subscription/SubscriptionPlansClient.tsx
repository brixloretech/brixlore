"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { PublicPlanDto } from "@/types/api";
import { PlanActionButtons } from "@/components/content/PlanActionButtons";

type BillingCycle = "monthly" | "yearly";

type UiPlan = {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  isFreeTier: boolean;
  features: string[];
  featured?: boolean;
  savePercent?: number;
  billingNote: string;
};

function formatPlanName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const normalized = word.replace(/[_-]+/g, " ");
      return normalized
        .split(" ")
        .map((part) => {
          const lower = part.toLowerCase();
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(" ");
    })
    .join(" ");
}

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

function buildFeatureLines(plan: PublicPlanDto): string[] {
  const features: string[] = [];

  for (const perk of plan.perks ?? []) {
    if (perk.trim()) features.push(perk.trim());
  }

  return Array.from(new Set(features));
}

function pickDescription(index: number, total: number): string {
  if (total <= 1) return "The complete experience";
  if (index === 0) return "Great for casual viewers";
  if (index === total - 1) return "The complete experience";
  return "Best for families and power viewers";
}

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

function isFreeTierPlan(plan: PublicPlanDto): boolean {
  const normalizedName = plan.name.trim().toLowerCase();
  return (
    plan.price <= 0 ||
    normalizedName.includes("free") ||
    normalizedName.includes("trial")
  );
}

function orderPlansWithFreeLast(plans: PublicPlanDto[]): PublicPlanDto[] {
  return [...plans].sort((a, b) => {
    const aIsFree = isFreeTierPlan(a);
    const bIsFree = isFreeTierPlan(b);
    if (aIsFree !== bIsFree) return aIsFree ? 1 : -1;
    return a.price - b.price;
  });
}

function buildUiPlansByCycle(
  plans: PublicPlanDto[],
): Record<BillingCycle, UiPlan[]> {
  const mapToUi = (items: PublicPlanDto[], cycle: BillingCycle): UiPlan[] => {
    const sorted = orderPlansWithFreeLast(items);
    return sorted.map((plan, index) => {
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
        name: formatPlanName(plan.name),
        description: pickDescription(index, sorted.length),
        price: displayPrice.toFixed(2),
        period: cycle === "yearly" ? "yr" : "mo",
        isFreeTier: plan.price <= 0,
        featured: plan.isPopular,
        features: buildFeatureLines(plan),
        savePercent: savePercent > 0 ? savePercent : undefined,
        billingNote:
          cycle === "yearly"
            ? "Billed yearly. Taxes may apply."
            : "Billed monthly. Taxes may apply.",
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

export function SubscriptionPlansClient({
  plans,
  initialCycle = "monthly",
}: {
  plans: PublicPlanDto[];
  initialCycle?: BillingCycle;
}) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle);
  const plansByCycle = useMemo(() => buildUiPlansByCycle(plans), [plans]);
  const visiblePlans = plansByCycle[billingCycle];
  const yearlySave = useMemo(() => {
    return plansByCycle.yearly.reduce(
      (max, plan) => Math.max(max, plan.savePercent ?? 0),
      0,
    );
  }, [plansByCycle]);
  const gridClassName =
    visiblePlans.length >= 4
      ? "mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
      : visiblePlans.length === 2
        ? "mx-auto mt-10 grid w-full max-w-4xl gap-5 md:grid-cols-2"
        : "mt-10 grid gap-5 sm:gap-6 lg:grid-cols-3";

  return (
    <main
      id="main"
      className="flex-1 bg-[#050505] px-4 py-12 text-white sm:px-6 lg:px-8"
      role="main"
      aria-label="Subscription plans comparison"
    >
      <div className="mx-auto max-w-[72rem]">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
            Membership
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Pick Your Premium
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-neutral-400 sm:text-base">
            Choose the BRIXLORE membership that fits how you watch, then start
            streaming with a free trial or jump straight in.
          </p>
          <div className="mt-7 inline-flex rounded-full border border-accent/30 bg-[#0d0d0d] p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "min-w-[7rem] rounded-full px-4 py-2 text-sm font-semibold transition sm:min-w-[7.5rem]",
                billingCycle === "monthly"
                  ? "bg-accent text-accent-foreground shadow-[0_10px_30px_rgba(255,255,255,0.16)]"
                  : "text-neutral-300 hover:text-white",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "min-w-[7rem] rounded-full px-4 py-2 text-sm font-semibold transition sm:min-w-[7.5rem]",
                billingCycle === "yearly"
                  ? "bg-accent text-accent-foreground shadow-[0_10px_30px_rgba(255,255,255,0.16)]"
                  : "text-neutral-300 hover:text-white",
              )}
            >
              <span className="block">Yearly</span>
              {yearlySave > 0 ? (
                <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.12em] opacity-75">
                  Save {yearlySave}%
                </span>
              ) : null}
            </button>
          </div>
        </header>

        <section className={gridClassName} aria-label="Subscription plans">
          {visiblePlans.length > 0 ? (
            visiblePlans.map((plan) => (
              <article
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-[1.5rem] border bg-[#060606] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.36)] sm:p-6",
                  plan.featured
                    ? "border-accent/55 ring-1 ring-accent/20"
                    : "border-white/16",
                )}
                aria-labelledby={`plan-${plan.id}-title`}
              >
                <div className="flex h-full flex-col">
                  {plan.featured && (
                    <div
                      className="mb-4 inline-flex items-center gap-2 self-center rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-accent"
                      aria-label="Most popular plan"
                    >
                      <span>Most Popular</span>
                    </div>
                  )}
                  <h2
                    id={`plan-${plan.id}-title`}
                    className="text-center text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl"
                  >
                    {plan.name}
                  </h2>
                  <p className="mt-2 text-center text-sm text-neutral-400 sm:text-base">
                    {plan.description}
                  </p>
                  <div className="mt-5 flex items-end justify-center gap-1">
                    <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                      ${plan.price}
                    </span>
                    <span className="pb-1 text-base font-semibold text-neutral-300 sm:text-lg">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="mt-2 text-center text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
                    {plan.billingNote}
                  </p>
                  {plan.savePercent ? (
                    <p className="mt-2 text-center text-xs font-bold uppercase tracking-[0.08em] text-accent/75">
                      Save {plan.savePercent}% with yearly billing
                    </p>
                  ) : null}

                  <PlanActionButtons
                    planId={plan.id}
                    planName={plan.name}
                    isFreeTier={plan.isFreeTier}
                    featured={plan.featured}
                    billingCycle={billingCycle}
                  />

                  <ul
                    className="mt-5 space-y-3 border-t border-white/10 pt-5"
                    aria-label={`${plan.name} features`}
                  >
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckIcon className="mt-0.5 h-4.5 w-4.5 text-accent" />
                        <span className="text-sm leading-6 text-neutral-200">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full rounded-[2rem] border border-white/12 bg-[#0a0a0a] p-8 text-center text-sm text-neutral-400">
              No {billingCycle} plans are available yet. Please check back soon.
            </div>
          )}
        </section>

        <p className="mt-10 text-center text-sm text-neutral-500">
          Cancel anytime. No commitment. Terms apply.
        </p>
      </div>
    </main>
  );
}
