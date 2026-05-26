"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts";
import { Loader, Button } from "@/components/ui";
import { subscriptionService } from "@/lib/services";
import { useMatomo } from "@/hooks/useMatomo";

function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser, isSubscribed } = useAuth();
  const { trackEvent } = useMatomo();
  const [refreshing, setRefreshing] = useState(true);

  // Track purchase once on mount — landing on this page confirms a completed payment.
  useEffect(() => {
    trackEvent("Subscription", "purchase");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    // 1. Sync Stripe → DB (needed when webhooks can't reach localhost)
    // 2. Clear cached subscription status
    // 3. Re-fetch user/subscription from the server
    subscriptionService
      .syncSubscription()
      .catch(() => null)
      .finally(() => {
        subscriptionService.clearSubscriptionCache();
        refreshUser()
          .then(() => {
            if (!cancelled) setRefreshing(false);
          })
          .catch(() => {
            if (!cancelled) setRefreshing(false);
          });
      });
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  useEffect(() => {
    if (refreshing) return;
    const returnUrl = searchParams.get("returnUrl");
    if (returnUrl && returnUrl.startsWith("/")) {
      router.replace(returnUrl);
    } else {
      router.replace("/dashboard");
    }
  }, [refreshing, searchParams, router]);

  if (refreshing) {
    return (
      <main className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-12">
        <Loader size="lg" label="Activating subscription…" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Activating your subscription…
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[40vh] flex-col items-center justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
        Thank you for subscribing
      </h1>
      <p className="text-center text-neutral-600 dark:text-neutral-400">
        {isSubscribed
          ? "Your subscription is active. Redirecting…"
          : "If you don’t see your subscription yet, it may take a moment to activate."}
      </p>
      <Link href="/dashboard">
        <Button variant="primary">Go to dashboard</Button>
      </Link>
    </main>
  );
}

/**
 * Shown after successful Stripe checkout. Refreshes subscription state and redirects
 * to returnUrl or dashboard so the user sees active subscription.
 */
export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-12">
          <Loader size="lg" label="Loading…" />
        </main>
      }
    >
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
