"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts";
import { cn } from "@/lib/utils";
import { subscriptionService } from "@/lib/services";
import { Modal, ModalContent, ModalFooter, Button } from "@/components/ui";
import type { SubscriptionStatusDto } from "@/types/api";
import { ShinyButton } from "../ui/shiny-button";

type PlanActionButtonsProps = {
  planId: string;
  planName: string;
  isFreeTier?: boolean;
  featured?: boolean;
  billingCycle?: "monthly" | "yearly";
  userSubscription?: SubscriptionStatusDto | null;
  onRefreshSub?: () => void;
  appearance?: "default" | "cinematic";
};

export function PlanActionButtons({
  planId,
  planName,
  isFreeTier = false,
  featured,
  billingCycle = "monthly",
  userSubscription,
  onRefreshSub,
  appearance = "default",
}: PlanActionButtonsProps) {
  const { isAuthenticated, isSubscribed, isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCurrentPlan =
    userSubscription &&
    userSubscription.isSubscribed &&
    userSubscription.planId === planId &&
    userSubscription.billingCycle?.toLowerCase() === billingCycle.toLowerCase();

  const isSubscribedToOther =
    userSubscription && userSubscription.isSubscribed && !isCurrentPlan;

  const isFreeUser = isAuthenticated && !isSubscribed && !isAdmin;

  async function handlePlanChange() {
    setError(null);
    setIsUpdating(true);
    try {
      await subscriptionService.updatePlan(
        planId,
        billingCycle.toUpperCase() as "MONTHLY" | "YEARLY",
      );
      setIsModalOpen(false);
      if (onRefreshSub) {
        onRefreshSub();
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to change subscription plan.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  const actionHref = isFreeTier
    ? isAuthenticated
      ? "/dashboard"
      : "/signup"
    : isFreeUser
      ? `/subscription/payment-details?plan=${encodeURIComponent(planId)}&autostart=1&billingCycle=${billingCycle}`
      : isAuthenticated
        ? "/dashboard/subscription"
        : `/signup?plan=${planId}&planName=${encodeURIComponent(planName)}&billingCycle=${billingCycle}`;

  if (isCurrentPlan) {
    return (
      <div className="mt-5">
        <button
          disabled
          type="button"
          className="inline-flex h-10 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-semibold text-neutral-400 cursor-not-allowed"
        >
          Current Plan
        </button>
      </div>
    );
  }

  if (isSubscribedToOther) {
    return (
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={cn(
            "inline-flex h-10 w-full items-center justify-center rounded-full border px-5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent",
            appearance === "cinematic"
              ? "h-12 border-white/15 bg-white text-black transition-colors hover:bg-white/82"
              : featured
              ? "border-accent bg-accent text-accent-foreground shadow-accent-glow hover:bg-accent/90"
              : "border-accent/45 bg-accent/5 text-white hover:bg-accent/10",
          )}
        >
          Change Plan
        </button>

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            if (!isUpdating) setIsModalOpen(false);
          }}
          title="Change Subscription Plan"
        >
          <ModalContent>
            <div className="text-neutral-300">
              <p>
                Are you sure you want to change your subscription to the{" "}
                <span className="font-semibold text-white">{planName}</span> (
                {billingCycle}) plan?
              </p>
              <p className="mt-2 text-xs text-neutral-400">
                Your Stripe account will be updated immediately. Prorated
                charges or credits will be automatically calculated and applied.
              </p>
              {error && (
                <p
                  className="mt-4 text-sm font-medium text-red-500"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>
          </ModalContent>
          <ModalFooter>
            <Button
              variant="outline"
              disabled={isUpdating}
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button disabled={isUpdating} onClick={handlePlanChange}>
              {isUpdating ? "Updating..." : "Confirm Change"}
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }

  return (
    <div className="mt-5">
      {appearance === "cinematic" ? (
        <Link
          href={actionHref}
          className={cn(
            "inline-flex h-12 w-full items-center justify-center rounded-full border px-5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
            featured
              ? "border-white bg-white text-black hover:bg-white/82"
              : "border-white/18 bg-white/[0.06] text-white hover:bg-white hover:text-black",
          )}
          aria-label={`Choose ${planName}`}
        >
          Choose plan
        </Link>
      ) : (
        <Link
          href={actionHref}
          className={cn("inline-flex")}
          aria-label={`Subscribe to ${planName}`}
        >
          <ShinyButton className={cn("rounded-full" ,  featured
              ? "border-accent bg-black text-accent-foreground shadow-accent-glow hover:bg-accent/90"
              : "border-accent/45 bg-accent/55 text-white hover:bg-accent/10")}>Subscribe Now</ShinyButton>
        </Link>
      )}
    </div>
  );
}
