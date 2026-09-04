"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { MagicCard } from "@/components/ui/magic-card";
import { cn } from "@/lib/utils";

export type SubscriptionCardPlan = {
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

type SubscriptionCardsProps = {
  plans: SubscriptionCardPlan[];
  billingCycle: "monthly" | "yearly";
  renderFooter?: (plan: SubscriptionCardPlan) => ReactNode;
  emptyMessage?: string;
};

export function SubscriptionCards({
  plans,
  billingCycle,
  renderFooter,
  emptyMessage = "No plans are available right now. Please check back soon.",
}: SubscriptionCardsProps) {
  if (!plans.length) {
    return (
      <div className="col-span-full rounded-[28px] border border-white/10 bg-white/[0.035] px-6 py-16 text-center text-sm text-white/45">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {plans.map((plan, index) => (
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
          <article className="flex h-full min-h-[608px] flex-col p-6 sm:p-7" aria-labelledby={`plan-${plan.id}`}>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">0{index + 1}</span>
              {plan.featured ? (
                <span className="rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white">Most popular</span>
              ) : <span className="h-px w-8 bg-white/15" />}
            </div>

            <div className="mt-10">
              <h2 id={`plan-${plan.id}`} className="text-2xl font-semibold tracking-[-0.045em] text-white sm:text-3xl">{plan.name}</h2>
              <p className="mt-3 min-h-12 text-sm leading-6 text-white/43">{plan.description}</p>
            </div>

            <div className="mt-8 border-b border-white/10 pb-7">
              <div className="flex items-end gap-2">
                <span className="pb-2 text-xl font-medium text-white/38">$</span>
                <span className="text-[3.8rem] font-semibold leading-none tracking-[-0.07em] text-white">{plan.price}</span>
                <span className="pb-2 text-xs font-medium text-white/38">/{plan.period}</span>
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/28">{plan.billingNote}</p>
              {plan.savePercent && <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/55">Save {plan.savePercent}% annually</p>}
            </div>

            <ul className="mt-7 flex-1 space-y-4" aria-label={`${plan.name} benefits`}>
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-white/66">
                  <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-white/20"><Check size={10} strokeWidth={2.5} /></span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {renderFooter?.(plan)}
          </article>
        </MagicCard>
      ))}
    </>
  );
}
