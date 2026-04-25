"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/lib/services";
import type { AdminSystemLogDto } from "@/types/api";
import { Button, Loader } from "@/components/ui";
import { cn } from "@/lib/utils";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminSystemLogsPage() {
  const [logs, setLogs] = useState<AdminSystemLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getSystemLogs();
      setLogs(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs.");
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
        <Loader size="lg" label="Loading system logs…" />
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          System Logs
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Recent activity across users, uploads, and subscriptions.
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-700/50 bg-neutral-900/60 p-6">
        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-neutral-500">No logs yet.</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-3 rounded-xl border border-neutral-700/60 bg-neutral-950/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {log.message}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatDate(log.createdAt)}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    log.type === "user" && "bg-blue-900/40 text-blue-200",
                    log.type === "content" &&
                      "bg-neutral-800/70 text-neutral-200",
                    log.type === "subscription" &&
                      "bg-emerald-900/40 text-emerald-200",
                  )}
                >
                  {log.type}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
