"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { PlanActionButtons } from "@/components/content/PlanActionButtons";
import type { PublicPlanDto } from "@/types/api";

type BillingCycle = "monthly" | "yearly";

type HomePlansSectionProps = {
  plans: PublicPlanDto[];
  initialCycle: BillingCycle;
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 flex-shrink-0 ${className ?? "text-accent"}`}
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

function formatPlanName(name: string): string {
  return name
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function toAnnualPrice(plan: PublicPlanDto): number {
  if (typeof plan.yearlyPrice === "number") return plan.yearlyPrice;
  return Number((plan.price * 10).toFixed(2));
}

function getAnnualSavePercent(plan: PublicPlanDto): number {
  const annualPrice = toAnnualPrice(plan);
  const yearlyWithoutDiscount = plan.price * 12;
  if (yearlyWithoutDiscount <= annualPrice) return 0;
  return Math.round(
    ((yearlyWithoutDiscount - annualPrice) / yearlyWithoutDiscount) * 100,
  );
}

function buildFeatureLines(plan: PublicPlanDto): string[] {
  const features: string[] = [];

  for (const perk of plan.perks ?? []) {
    const normalized = perk.trim();
    if (normalized) features.push(normalized);
  }

  return Array.from(new Set(features));
}

function getPlanTagline(name: string): string {
  const normalized = name.trim().toLowerCase();

  if (normalized === "free account") {
    return "Start free. Upgrade anytime.";
  }

  if (normalized === "lore member") {
    return "Pure streaming. No distractions.";
  }

  if (normalized === "brixlore collective") {
    return "Watch anywhere. Get more.";
  }

  if (normalized === "lorekeeper elite") {
    return "Go deeper. Shape the culture.";
  }

  return "Built for premium streaming.";
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

export function HomePlansSection({
  plans,
  initialCycle,
}: HomePlansSectionProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setBillingCycle(initialCycle);
  }, [initialCycle]);

  const orderedPlans = useMemo(() => orderPlansWithFreeLast(plans), [plans]);

  function switchCycle(nextCycle: BillingCycle) {
    if (nextCycle === billingCycle) return;

    setBillingCycle(nextCycle);

    startTransition(() => {
      router.replace(`${pathname}?cycle=${nextCycle}#home-plans-heading`, {
        scroll: false,
      });
    });
  }

  const gridClassName =
    orderedPlans.length >= 4
      ? "mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
      : orderedPlans.length === 2
        ? "mx-auto mt-9 grid w-full max-w-4xl gap-5 md:grid-cols-2"
        : "mt-9 grid gap-5 md:grid-cols-3";

  return (
    <section
      className="relative w-full max-w-6xl"
      aria-labelledby="home-plans-heading"
    >
      <div className="rounded-[2rem] border border-neutral-800/90 bg-gradient-to-b from-neutral-900/85 via-neutral-950/90 to-black/90 px-4 py-8 shadow-[0_35px_100px_rgba(0,0,0,0.65)] sm:px-7 sm:py-10 lg:px-10">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Membership
        </p>
        <h2
          id="home-plans-heading"
          className="mt-3 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          Pick Your Premium
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-neutral-300 sm:text-base">
          Choose a plan that fits your watch style. Start monthly or save more
          with annual billing.
        </p>

        <div className="mx-auto mt-7 flex w-fit items-center gap-2 rounded-full border border-neutral-700/80 bg-neutral-900/80 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <button
            type="button"
            onClick={() => switchCycle("monthly")}
            aria-pressed={billingCycle === "monthly"}
            className={[
              "rounded-full px-6 py-2 text-sm font-semibold transition-all duration-200",
              billingCycle === "monthly"
                ? "bg-accent text-accent-foreground hover:bg-accent/90"
                : "text-neutral-200 hover:bg-neutral-800",
            ].join(" ")}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => switchCycle("yearly")}
            aria-pressed={billingCycle === "yearly"}
            className={[
              "rounded-full px-6 py-2 text-sm font-semibold transition-all duration-200",
              billingCycle === "yearly"
                ? "bg-accent text-accent-foreground hover:bg-accent/90"
                : "text-neutral-200 hover:bg-neutral-800",
            ].join(" ")}
          >
            <span className="block">Annual</span>
          </button>
        </div>

        <div className={gridClassName}>
          {orderedPlans.length > 0 ? (
            orderedPlans.map((plan) => {
              const annualPrice = toAnnualPrice(plan);
              const annualSavePercent = getAnnualSavePercent(plan);
              const isFeatured = plan.isPopular;
              const displayPrice =
                billingCycle === "yearly" ? annualPrice : plan.price;
              const periodLabel = billingCycle === "yearly" ? "yr" : "mo";
              const features = buildFeatureLines(plan);
              const planName = formatPlanName(plan.name);

              return (
                <article
                  key={plan.id}
                  className={[
                    "group relative flex flex-col rounded-[1.5rem] border bg-[#060606] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.36)] transition-all sm:p-6",
                    isFeatured
                      ? "border-accent/55 ring-1 ring-accent/20"
                      : "border-white/16",
                  ].join(" ")}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    {isFeatured ? (
                      <div className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
                        <span>Most Popular</span>
                      </div>
                    ) : (
                      <span className="h-[28px]" aria-hidden />
                    )}

                    {billingCycle === "yearly" && annualSavePercent > 0 ? (
                      <span className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-emerald-700/50 bg-emerald-950/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 leading-none">
                        Save {annualSavePercent}%
                      </span>
                    ) : (
                      <span className="h-[28px]" aria-hidden />
                    )}
                  </div>

                  <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
                    <h3 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                      {planName}
                    </h3>
                  </div>

                  <p className="mt-2 text-sm text-neutral-400 sm:text-base">
                    {getPlanTagline(plan.name)}
                  </p>

                  <div className="mt-5 flex items-end justify-start gap-1">
                    <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                      {formatPrice(displayPrice)}
                    </span>
                    <span className="pb-1 text-base font-semibold text-neutral-300 sm:text-lg">
                      /{periodLabel}
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
                    {billingCycle === "yearly"
                      ? "Billed yearly. Taxes may apply."
                      : "Billed monthly. Taxes may apply."}
                  </p>

                  <PlanActionButtons
                    planId={plan.id}
                    planName={planName}
                    isFreeTier={plan.price <= 0}
                    featured={isFeatured}
                    billingCycle={billingCycle}
                  />

                  <ul className="mt-5 space-y-3 border-t border-white/10 pt-5">
                    {features.map((feature) => (
                      <li
                        key={`${plan.id}-${feature}`}
                        className="flex items-start gap-2.5"
                      >
                        <CheckIcon className="mt-1 text-accent" />
                        <span className="text-sm leading-6 text-neutral-200">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })
          ) : (
            <div className="col-span-full rounded-[2rem] border border-white/12 bg-[#0a0a0a] p-8 text-center text-sm text-neutral-400">
              No {billingCycle} plans are available yet. Please check back soon.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
