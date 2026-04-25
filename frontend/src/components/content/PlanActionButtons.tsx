"use client";

import Link from "next/link";
import { useAuth } from "@/contexts";
import { cn } from "@/lib/utils";

type PlanActionButtonsProps = {
  planId: string;
  planName: string;
  isFreeTier?: boolean;
  featured?: boolean;
  billingCycle?: "monthly" | "yearly";
};

export function PlanActionButtons({
  planId,
  planName,
  isFreeTier = false,
  featured,
  billingCycle = "monthly",
}: PlanActionButtonsProps) {
  const { isAuthenticated, isSubscribed, isAdmin } = useAuth();

  const isFreeUser = isAuthenticated && !isSubscribed && !isAdmin;

  const actionHref = isFreeTier
    ? isAuthenticated
      ? "/dashboard"
      : "/signup"
    : isFreeUser
      ? `/subscription/payment-details?plan=${encodeURIComponent(planId)}&autostart=1&billingCycle=${billingCycle}`
      : `/signup?plan=${planId}&planName=${encodeURIComponent(planName)}&billingCycle=${billingCycle}`;

  return (
    <div className="mt-5">
      <Link
        href={actionHref}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-full border px-5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent dark:focus-visible:ring-offset-off-black",
          featured
            ? "border-accent bg-accent text-accent-foreground shadow-accent-glow hover:bg-accent/90"
            : "border-accent/45 bg-accent/5 text-white hover:bg-accent/10",
        )}
        aria-label={`Subscribe to ${planName}`}
      >
        Subscribe Now
      </Link>
    </div>
  );
}
