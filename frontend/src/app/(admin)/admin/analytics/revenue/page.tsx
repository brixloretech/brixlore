"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/lib/services";
import type { AdminRevenueAnalyticsDto } from "@/types/api";
import { Button, Loader } from "@/components/ui";

export default function AdminRevenueAnalyticsPage() {
  const [data, setData] = useState<AdminRevenueAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getRevenueAnalytics();
      setData(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load analytics.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-neutral-700/50 bg-neutral-900/50 py-12">
        <Loader size="lg" label="Loading revenue analytics…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 py-12 text-center">
        <p className="text-red-300">{error ?? "Failed to load analytics."}</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => void load()}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Revenue Analytics
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Monitor recurring revenue and plan performance.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Active revenue
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            ${data.activeRevenue}
          </p>
          <p className="mt-1 text-xs text-neutral-500">Estimated monthly</p>
        </div>
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Active subs
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {data.activeSubscriptions}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Cancelled
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {data.cancelledSubscriptions}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Expired
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {data.expiredSubscriptions}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-700/50 bg-neutral-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">Revenue by plan</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Active subscriptions split by tier.
        </p>
        <div className="mt-6 space-y-3">
          {data.revenueByPlan.length === 0 ? (
            <p className="text-sm text-neutral-500">No active plans yet.</p>
          ) : (
            data.revenueByPlan.map((plan) => (
              <div
                key={plan.planId}
                className="flex items-center justify-between rounded-xl border border-neutral-700/60 bg-neutral-950/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {plan.planName}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {plan.activeCount} active
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    ${plan.revenue}
                  </p>
                  <p className="text-xs text-neutral-500">Monthly</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
