"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminService } from "@/lib/services";
import type { DashboardStatsDto } from "@/lib/services";
import { Loader } from "@/components/ui";

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [contentByCategory, setContentByCategory] = useState<
    { label: string; value: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const dashboardStats = await adminService.getStats();
        setStats(dashboardStats);
        setContentByCategory(dashboardStats.contentByCategory ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="lg" label="Loading dashboard…" />
      </div>
    );
  }

  const totalCategories = contentByCategory.length;
  const topCategory = contentByCategory.reduce(
    (best, current) => (current.value > best.value ? current : best),
    { label: "—", value: 0 },
  );
  const avgPerCategory =
    totalCategories > 0
      ? (Number(stats.totalContent ?? 0) / totalCategories).toFixed(1)
      : "0";
  const sortedCategories = [...contentByCategory].sort(
    (a, b) => b.value - a.value,
  );
  const maxCategoryCount = Math.max(1, ...sortedCategories.map((c) => c.value));

  const quickActions = [
    {
      href: "/admin/content/upload",
      label: "Upload content",
      desc: "Add new content + assets",
    },
    {
      href: "/admin/content",
      label: "Manage content",
      desc: "Edit, publish, or unpublish",
    },
  ];

  const highlights = [
    {
      label: "Total users",
      value: Number(stats.totalUsers ?? 0).toLocaleString(),
      hint: "All registered accounts",
    },
    {
      label: "Total content",
      value: Number(stats.totalContent ?? 0).toLocaleString(),
      hint: "Catalog size",
    },
    {
      label: "Subscribers",
      value: Number(stats.totalSubscribers ?? 0).toLocaleString(),
      hint: "Active paying users",
    },
    {
      label: "Top category",
      value: topCategory.label,
      hint: `${topCategory.value} titles`,
    },
    {
      label: "Categories",
      value: totalCategories.toString(),
      hint: "Distinct tags",
    },
    {
      label: "Avg per category",
      value: avgPerCategory,
      hint: "Titles/category",
    },
  ];

  return (
    <div className="font-[var(--font-geist-sans)]">
      <section className="relative overflow-hidden rounded-2xl border border-neutral-800/70 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 px-6 py-8 shadow-[0_0_0_1px_rgba(255,231,0,0.05)] sm:px-10">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-20 top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
            Overview Hub
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            A live pulse of your catalog, audience, and distribution. Use quick
            actions to jump straight into the work.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group inline-flex items-center gap-3 rounded-full border border-neutral-700/80 bg-neutral-900/70 px-4 py-2 text-sm text-neutral-200 transition hover:border-accent/60 hover:text-white"
              >
                <span className="h-2 w-2 rounded-full bg-accent/70 shadow-[0_0_8px_rgba(255,231,0,0.6)]" />
                <span className="font-medium">{action.label}</span>
                <span className="hidden text-xs text-neutral-500 sm:inline">
                  {action.desc}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-label="Highlights"
      >
        {highlights.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-neutral-800/70 bg-neutral-950/70 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              {item.label}
            </p>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-2xl font-semibold text-white sm:text-3xl">
                {item.value}
              </p>
              <span className="rounded-full border border-neutral-800/70 px-2 py-1 text-[11px] text-neutral-500">
                {item.hint}
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-neutral-800/70 bg-neutral-950/70 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Category mix</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Distribution of titles across categories.
              </p>
            </div>
            <span className="rounded-full border border-neutral-800/70 px-2 py-1 text-xs text-neutral-500">
              Updated just now
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {sortedCategories.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No categories yet. Start by uploading content.
              </p>
            ) : (
              sortedCategories.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-200">{item.label}</span>
                    <span className="text-neutral-500">{item.value}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-800/80">
                    <div
                      className="h-2 rounded-full bg-accent shadow-[0_0_12px_rgba(255,231,0,0.45)]"
                      style={{
                        width: `${Math.max(
                          8,
                          (item.value / maxCategoryCount) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800/70 bg-neutral-950/70 p-6">
          <h2 className="text-lg font-semibold text-white">Focus queue</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Suggested next steps based on current stats.
          </p>
          <ul className="mt-6 space-y-4 text-sm text-neutral-300">
            <li className="rounded-xl border border-neutral-800/70 bg-neutral-900/60 px-4 py-3">
              Review unpublished content to keep the catalog fresh.
            </li>
            <li className="rounded-xl border border-neutral-800/70 bg-neutral-900/60 px-4 py-3">
              Add more categories to balance discovery.
            </li>
            <li className="rounded-xl border border-neutral-800/70 bg-neutral-900/60 px-4 py-3">
              Check subscriber trends and update promotions.
            </li>
          </ul>
          <Link
            href="/admin/content"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-white"
          >
            Go to content manager →
          </Link>
        </div>
      </section>
    </div>
  );
}
