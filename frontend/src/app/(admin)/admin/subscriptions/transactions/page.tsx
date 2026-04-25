"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/lib/services";
import type {
  AdminSubscriptionDto,
  AdminSubscriptionsResponseDto,
} from "@/types/api";
import { Button, Loader } from "@/components/ui";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function AdminTransactionsPage() {
  const [data, setData] = useState<AdminSubscriptionsResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getSubscriptions(1, 50);
      setData(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load transactions.",
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
        <Loader size="lg" label="Loading transactions…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 py-12 text-center">
        <p className="text-red-300">{error}</p>
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

  const summary = data?.summary;
  const subscriptions: AdminSubscriptionDto[] = data?.subscriptions ?? [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Track subscription status changes and billing periods.
        </p>
      </header>

      {summary ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Active revenue
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              ${summary.activeRevenue}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Estimated monthly</p>
          </div>
          <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Active
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {summary.activeCount}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Current subscribers</p>
          </div>
          <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Cancelled
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {summary.cancelledCount}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Cancelled plans</p>
          </div>
          <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Expired
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {summary.expiredCount}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Expired plans</p>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-900/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-700/50 bg-neutral-800/50">
                <th className="px-4 py-3 font-medium text-neutral-300">User</th>
                <th className="px-4 py-3 font-medium text-neutral-300">Plan</th>
                <th className="px-4 py-3 font-medium text-neutral-300">
                  Price
                </th>
                <th className="px-4 py-3 font-medium text-neutral-300">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-neutral-300">
                  Start
                </th>
                <th className="px-4 py-3 font-medium text-neutral-300">End</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-neutral-400" colSpan={6}>
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-neutral-700/50 last:border-0"
                  >
                    <td className="px-4 py-3 text-neutral-200">
                      <div className="font-medium text-white">
                        {sub.userName || sub.userEmail}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {sub.userEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">
                      {sub.planName}
                    </td>
                    <td className="px-4 py-3 text-neutral-300">
                      ${sub.planPrice}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-neutral-700 text-neutral-200">
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {formatDate(sub.startDate)}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {formatDate(sub.endDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
