"use client";

import { useAuth } from "@/contexts";
import type { PublicPlanDto } from "@/types/api";
import { HomePlansSection } from "./HomePlansSection";

type BillingCycle = "monthly" | "yearly";

type HomePlansSectionAuthGateProps = {
  plans: PublicPlanDto[];
  initialCycle: BillingCycle;
};

export function HomePlansSectionAuthGate({
  plans,
  initialCycle,
}: HomePlansSectionAuthGateProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Avoid rendering plans until auth state is resolved,
  // and hide plans entirely for logged-in users.
  if (isLoading || isAuthenticated) {
    return null;
  }

  return <HomePlansSection plans={plans} initialCycle={initialCycle} />;
}
