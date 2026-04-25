import type { Metadata } from "next";
import { SITE_BRAND, absoluteUrl } from "@/lib/seo";
import { subscriptionService } from "@/lib/services";
import type { PublicPlanDto } from "@/types/api";
import { SubscriptionPlansClient } from "./SubscriptionPlansClient";

type SubscriptionPageProps = {
  searchParams: Promise<{ cycle?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subscription Plans",
  description: `Compare ${SITE_BRAND} plans and start your free trial.`,
  openGraph: {
    title: `Subscription Plans | ${SITE_BRAND}`,
    description: "Compare plans and start your free trial.",
    url: absoluteUrl("/subscription"),
    type: "website",
  },
  alternates: { canonical: absoluteUrl("/subscription") },
};

export default async function SubscriptionPage({
  searchParams,
}: SubscriptionPageProps) {
  const { cycle } = await searchParams;
  const normalizedCycle =
    cycle?.toLowerCase() === "yearly" ? "yearly" : "monthly";

  const apiPlans: PublicPlanDto[] = await subscriptionService
    .getPlans()
    .catch(() => []);

  return (
    <SubscriptionPlansClient plans={apiPlans} initialCycle={normalizedCycle} />
  );
}
