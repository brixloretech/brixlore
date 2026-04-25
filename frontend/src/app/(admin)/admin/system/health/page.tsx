"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/lib/services";
import type { AdminSystemHealthDto } from "@/types/api";
import { Button, Loader } from "@/components/ui";

export default function AdminSystemHealthPage() {
  const [data, setData] = useState<AdminSystemHealthDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getSystemHealth();
      setData(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load system health.",
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
        <Loader size="lg" label="Checking system health…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 py-12 text-center">
        <p className="text-red-300">
          {error ?? "Failed to load system health."}
        </p>
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
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          System Health
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Current service status and database metrics.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Status
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {data.ok ? "Healthy" : "Degraded"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Checked {new Date(data.checkedAt).toLocaleString("en-US")}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Users
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {data.counts.users}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Content
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {data.counts.content}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Subscriptions
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {data.counts.subscriptions}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Downloads: {data.counts.downloads}
          </p>
        </div>
      </section>

      {data.error ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {data.error}
        </div>
      ) : null}
    </div>
  );
}
