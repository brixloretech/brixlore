"use client";

import { useEffect, useMemo, useState } from "react";
import { adminService } from "@/lib/services";
import type { AdminUsersAnalyticsDto } from "@/types/api";
import { Button, Loader } from "@/components/ui";

function formatChartDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function AdminUsersAnalyticsPage() {
  const [data, setData] = useState<AdminUsersAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsersAnalytics();
      setData(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load analytics.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const maxDaily = useMemo(() => {
    if (!data?.dailyNewUsers.length) return 1;
    return Math.max(1, ...data.dailyNewUsers.map((d) => d.count));
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-neutral-800/70 bg-neutral-950/70 py-16">
        <Loader size="lg" label="Loading user analytics…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/20 py-16 text-center">
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

  const metrics = [
    {
      label: "Total users",
      value: data.totalUsers.toLocaleString(),
      hint: "All registered accounts",
    },
    {
      label: "New (30 days)",
      value: data.newUsersLast30Days.toLocaleString(),
      hint: "Sign-ups this month",
    },
    {
      label: "Active viewers",
      value: data.activeUsersLast30Days.toLocaleString(),
      hint: "Watched in last 30 days",
    },
  ];

  return (
    <div className="font-[var(--font-geist-sans)] space-y-8">
      {/* Hero header */}
      <section className="relative overflow-hidden rounded-2xl border border-neutral-800/70 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 px-6 py-8 shadow-[0_0_0_1px_rgba(255,231,0,0.05)] sm:px-10">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-20 top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
              Analytics
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              User Analytics
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-400">
              Track sign-ups and active viewers over time.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={refreshing}
            onClick={() => void load(true)}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </section>

      {/* Metric cards */}
      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Key metrics"
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-neutral-800/70 bg-neutral-950/70 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              {m.label}
            </p>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <p className="text-2xl font-semibold text-white sm:text-3xl">
                {m.value}
              </p>
              <span className="rounded-full border border-neutral-800/70 px-2 py-1 text-[11px] text-neutral-500">
                {m.hint}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Daily sign-ups chart */}
      <section className="rounded-2xl border border-neutral-800/70 bg-neutral-950/70 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Daily sign-ups</h2>
            <p className="mt-1 text-sm text-neutral-400">Last 7 days</p>
          </div>
          <span className="rounded-full border border-neutral-800/70 px-3 py-1.5 text-xs text-neutral-500">
            Updated just now
          </span>
        </div>
        <div className="mt-8 space-y-5">
          {data.dailyNewUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              No sign-up data for the last 7 days.
            </p>
          ) : (
            data.dailyNewUsers.map((day) => {
              const pct = maxDaily > 0 ? (day.count / maxDaily) * 100 : 0;
              const width = Math.max(8, Math.min(100, pct));
              return (
                <div key={day.date} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-200">
                      {formatChartDate(day.date)}
                    </span>
                    <span className="tabular-nums text-neutral-400">
                      {day.count} {day.count === 1 ? "user" : "users"}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-800/80">
                    <div
                      className="h-full rounded-full bg-accent shadow-[0_0_12px_rgba(255,231,0,0.45)] transition-[width] duration-300 ease-out"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
