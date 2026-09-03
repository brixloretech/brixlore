"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  CircleCheck,
  Download,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PlanActionButtons } from "@/components/content/PlanActionButtons";
import { MagicCard } from "@/components/ui/magic-card";
import { useAuth } from "@/contexts";
import { subscriptionService } from "@/lib/services";
import { cn } from "@/lib/utils";
import type { PublicPlanDto, SubscriptionStatusDto } from "@/types/api";

type BillingCycle = "monthly" | "yearly";

type UiPlan = {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  isFreeTier: boolean;
  features: string[];
  featured: boolean;
  savePercent?: number;
  billingNote: string;
};

const PLAN_COPY = [
  "A simple way into the Brixlore world.",
  "For your everyday stream and solo screen.",
  "Built for households that watch together.",
  "Every story, every screen, the complete experience.",
];

const FAQS = [
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can manage or cancel your membership from your account without a long-term commitment.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes. Move to another plan from your subscription settings. Any billing adjustment is handled securely.",
  },
  {
    question: "Which devices can I use?",
    answer:
      "Watch through supported web and mobile devices. The number of signed-in devices depends on your plan.",
  },
  {
    question: "How does offline viewing work?",
    answer:
      "Plans with downloads let you save selected titles for offline viewing, up to the plan's stated limit.",
  },
];

function formatPlanName(name: string) {
  return name
    .trim()
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function isFreeTierPlan(plan: PublicPlanDto) {
  const name = plan.name.toLowerCase();
  return plan.price <= 0 || name.includes("free") || name.includes("trial");
}

function calculateSavings(monthlyPrice: number, yearlyPrice: number) {
  if (monthlyPrice <= 0 || yearlyPrice <= 0) return 0;
  const monthlyTotal = monthlyPrice * 12;
  if (yearlyPrice >= monthlyTotal) return 0;
  return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
}

function planFeatures(plan: PublicPlanDto) {
  const benefits = [...(plan.perks ?? [])];
  benefits.push(
    plan.deviceLimit === 1
      ? "Watch on 1 registered device"
      : `Watch across ${plan.deviceLimit} registered devices`,
  );
  if (plan.offlineAllowed) {
    benefits.push(
      plan.maxOfflineDownloads > 0
        ? `Save up to ${plan.maxOfflineDownloads} offline downloads`
        : "Download titles for offline viewing",
    );
  }
  return Array.from(new Set(benefits.filter(Boolean))).slice(0, 6);
}

function buildPlans(plans: PublicPlanDto[], cycle: BillingCycle): UiPlan[] {
  const sorted = [...plans].sort((a, b) => {
    const aFree = isFreeTierPlan(a);
    const bFree = isFreeTierPlan(b);
    if (aFree !== bFree) return aFree ? -1 : 1;
    return a.price - b.price;
  });

  return sorted.map((plan, index) => {
    const hasYearly = plan.yearlyPrice != null && plan.yearlyPrice > 0;
    const useYearly = cycle === "yearly" && hasYearly;
    const price = useYearly ? plan.yearlyPrice! : plan.price;
    const savings = hasYearly
      ? calculateSavings(plan.price, plan.yearlyPrice!)
      : 0;

    return {
      id: plan.id,
      name: formatPlanName(plan.name),
      description: PLAN_COPY[Math.min(index, PLAN_COPY.length - 1)],
      price: price.toFixed(2),
      period: useYearly ? "year" : "month",
      isFreeTier: isFreeTierPlan(plan),
      features: planFeatures(plan),
      featured: plan.isPopular,
      savePercent: useYearly && savings > 0 ? savings : undefined,
      billingNote: useYearly
        ? "One payment, billed annually"
        : plan.price <= 0
          ? "No card required"
          : "Billed monthly · cancel anytime",
    };
  });
}

export function SubscriptionPlansClient({
  plans,
  initialCycle = "monthly",
}: {
  plans: PublicPlanDto[];
  initialCycle?: BillingCycle;
}) {
  const { isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle);
  const [userSubscription, setUserSubscription] =
    useState<SubscriptionStatusDto | null>(null);

  const refreshSubscription = () => {
    if (!isAuthenticated) return;
    void subscriptionService
      .getSubscription(true)
      .then(setUserSubscription)
      .catch(() => setUserSubscription(null));
  };

  useEffect(() => {
    refreshSubscription();
    // Authentication changes are the only reason to refresh on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const visiblePlans = useMemo(
    () => buildPlans(plans, billingCycle),
    [billingCycle, plans],
  );
  const yearlySave = useMemo(
    () =>
      plans.reduce(
        (highest, plan) =>
          Math.max(
            highest,
            plan.yearlyPrice
              ? calculateSavings(plan.price, plan.yearlyPrice)
              : 0,
          ),
        0,
      ),
    [plans],
  );
  const gridClass =
    visiblePlans.length >= 4
      ? "xl:grid-cols-4"
      : visiblePlans.length === 3
        ? "lg:grid-cols-3"
        : visiblePlans.length === 2
          ? "mx-auto max-w-4xl md:grid-cols-2"
          : "mx-auto max-w-lg";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] pb-24 pt-[135px] text-white md:pt-[165px] lg:pb-32 lg:pt-[190px]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(ellipse_at_50%_-12%,rgba(255,255,255,.14),transparent_48%),radial-gradient(ellipse_at_8%_35%,rgba(104,114,137,.08),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:url('data:image/svg+xml,%3Csvg_viewBox=%220_0_180_180%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22n%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%22.8%22_numOctaves=%223%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />

      <div className="relative mx-auto max-w-[1540px] px-4 sm:px-6 lg:px-10 xl:px-[5vw]">
        <header className="mx-auto max-w-4xl text-center">
          <p className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
            <Sparkles size={13} /> Brixlore membership
          </p>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.88] tracking-[-0.068em] sm:text-6xl lg:text-[5.8rem]">
            More stories.
            <span className="block font-light italic text-white/48">
              Your way to watch.
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-white/52 sm:text-base">
            Choose the access that fits your screen time. Every paid plan
            unlocks Brixlore’s independent films, original series, and
            culture-led stories.
          </p>

          <div
            className="mt-9 inline-flex rounded-full border border-white/12 bg-white/[0.045] p-1.5 backdrop-blur-xl"
            aria-label="Billing frequency"
          >
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              aria-pressed={billingCycle === "monthly"}
              className={cn(
                "h-10 rounded-full px-5 text-xs font-semibold transition-colors sm:px-7",
                billingCycle === "monthly"
                  ? "bg-white text-black"
                  : "text-white/50 hover:text-white",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              aria-pressed={billingCycle === "yearly"}
              className={cn(
                "flex h-10 items-center gap-2 rounded-full px-5 text-xs font-semibold transition-colors sm:px-7",
                billingCycle === "yearly"
                  ? "bg-white text-black"
                  : "text-white/50 hover:text-white",
              )}
            >
              Yearly{" "}
              {yearlySave > 0 && (
                <span
                  className={cn(
                    "hidden text-[9px] font-bold uppercase tracking-[0.1em] sm:inline",
                    billingCycle === "yearly"
                      ? "text-black/55"
                      : "text-white/35",
                  )}
                >
                  Save up to {yearlySave}%
                </span>
              )}
            </button>
          </div>
        </header>

        <section
          className={cn("mt-14 grid gap-4 md:grid-cols-2 lg:mt-20", gridClass)}
          aria-label="Subscription plans"
        >
          {visiblePlans.length ? (
            visiblePlans.map((plan, index) => (
              <MagicCard
                key={`${plan.id}-${billingCycle}`}
                gradientSize={320}
                gradientColor={plan.featured ? "#303030" : "#222222"}
                gradientOpacity={0.72}
                gradientFrom={plan.featured ? "#ffffff" : "#737373"}
                gradientTo={plan.featured ? "#7b8498" : "#262626"}
                className={cn(
                  "h-full min-h-[610px] rounded-[28px] bg-[#0a0a0b]",
                  plan.featured && "shadow-[0_25px_90px_rgba(255,255,255,.07)]",
                )}
              >
                <article
                  className="flex min-h-[608px] h-full flex-col p-6 sm:p-7"
                  aria-labelledby={`plan-${plan.id}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                      0{index + 1}
                    </span>
                    {plan.featured ? (
                      <span className="rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                        Most popular
                      </span>
                    ) : (
                      <span className="h-px w-8 bg-white/15" />
                    )}
                  </div>

                  <div className="mt-10">
                    <h2
                      id={`plan-${plan.id}`}
                      className="text-2xl font-semibold tracking-[-0.045em] text-white sm:text-3xl"
                    >
                      {plan.name}
                    </h2>
                    <p className="mt-3 min-h-12 text-sm leading-6 text-white/43">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mt-8 border-b border-white/10 pb-7">
                    <div className="flex items-end gap-2">
                      <span className="pb-2 text-xl font-medium text-white/38">
                        $
                      </span>
                      <span className="text-[3.8rem] font-semibold leading-none tracking-[-0.07em] text-white">
                        {plan.price}
                      </span>
                      <span className="pb-2 text-xs font-medium text-white/38">
                        /{plan.period}
                      </span>
                    </div>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/28">
                      {plan.billingNote}
                    </p>
                    {plan.savePercent && (
                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/55">
                        Save {plan.savePercent}% annually
                      </p>
                    )}
                  </div>

                  <ul
                    className="mt-7 flex-1 space-y-4"
                    aria-label={`${plan.name} benefits`}
                  >
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm leading-6 text-white/66"
                      >
                        <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-white/20">
                          <Check size={10} strokeWidth={2.5} />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <PlanActionButtons
                    planId={plan.id}
                    planName={plan.name}
                    isFreeTier={plan.isFreeTier}
                    featured={plan.featured}
                    billingCycle={billingCycle}
                    userSubscription={userSubscription}
                    onRefreshSub={refreshSubscription}
                    appearance="cinematic"
                  />
                </article>
              </MagicCard>
            ))
          ) : (
            <div className="col-span-full rounded-[28px] border border-white/10 bg-white/[0.035] px-6 py-16 text-center text-sm text-white/45">
              No plans are available right now. Please check back soon.
            </div>
          )}
        </section>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-medium text-white/38 lg:mt-12">
          <span className="flex items-center gap-2">
            <CircleCheck size={15} /> Cancel anytime
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck size={15} /> Secure checkout
          </span>
          <span className="flex items-center gap-2">
            <MonitorPlay size={15} /> Watch across devices
          </span>
          <span className="flex items-center gap-2">
            <Download size={15} /> Offline on supported plans
          </span>
        </div>

        <section
          className="mt-24 border-t border-white/10 pt-16 sm:mt-28 lg:grid lg:grid-cols-[.72fr_1.28fr] lg:gap-20 lg:pt-20"
          aria-labelledby="membership-faq"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
              Before you press play
            </p>
            <h2
              id="membership-faq"
              className="mt-4 text-4xl font-semibold leading-[0.94] tracking-[-0.055em] sm:text-5xl"
            >
              The small print,
              <br />
              <span className="font-light italic text-white/45">
                made simple.
              </span>
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/45">
              Clear answers so you can choose your plan with confidence.
            </p>
          </div>
          <div className="mt-10 border-t border-white/10 lg:mt-0">
            {FAQS.map((item) => (
              <details
                key={item.question}
                className="group border-b border-white/10 py-1"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-base font-semibold text-white/80 transition hover:text-white [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown
                    size={17}
                    className="shrink-0 text-white/35 transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="max-w-2xl pb-6 pr-8 text-sm leading-7 text-white/45">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-20 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-white/30">
            Plans, prices, and catalog availability may change.
          </p>
          <Link
            href="/help-center"
            className="text-xs font-semibold text-white/55 transition hover:text-white"
          >
            Questions about membership?
          </Link>
        </div>
      </div>
    </main>
  );
}
