"use client";

import { useEffect, useState, useCallback } from "react";
import { adminService } from "@/lib/services";
import type { AdminUserDto } from "@/types/api";
import type { AccountExportDto } from "@/types/api";
import { Loader, Button } from "@/components/ui";

function formatCreatedAt(iso: string): string {
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

function buildAccountExportHtml(res: AccountExportDto): string {
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const formatDate = (value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "--" : date.toLocaleString();
  };

  const profileHtml = `
    <h2>Profile</h2>
    <table>
      <tr><th>Name</th><td>${escapeHtml(res.user.name ?? "")}</td></tr>
      <tr><th>Email</th><td>${escapeHtml(res.user.email)}</td></tr>
      <tr><th>Phone</th><td>${escapeHtml(res.user.phone ?? "")}</td></tr>
      <tr><th>Bio</th><td>${escapeHtml(res.user.bio ?? "")}</td></tr>
      <tr><th>Member since</th><td>${escapeHtml(formatDate(res.user.createdAt))}</td></tr>
    </table>
  `;

  const devicesRows = res.devices.length
    ? res.devices
        .map(
          (device) => `
      <tr>
        <td>${escapeHtml(device.deviceIdentifier)}</td>
        <td>${escapeHtml(device.platform)}</td>
        <td>${escapeHtml(formatDate(device.lastActiveAt))}</td>
      </tr>
    `,
        )
        .join("")
    : `<tr><td colspan="3">No devices registered.</td></tr>`;

  const devicesHtml = `
    <h2>Devices</h2>
    <table>
      <tr><th>Device</th><th>Platform</th><th>Last active</th></tr>
      ${devicesRows}
    </table>
  `;

  const subscriptionRows = res.subscriptions.length
    ? res.subscriptions
        .map(
          (sub) => `
      <tr>
        <td>${escapeHtml(sub.planId)}</td>
        <td>${escapeHtml(sub.status)}</td>
        <td>${escapeHtml(formatDate(sub.startDate))}</td>
        <td>${escapeHtml(formatDate(sub.endDate))}</td>
      </tr>
    `,
        )
        .join("")
    : `<tr><td colspan="4">No subscriptions found.</td></tr>`;

  const subscriptionsHtml = `
    <h2>Subscriptions</h2>
    <table>
      <tr><th>Plan</th><th>Status</th><th>Start date</th><th>End date</th></tr>
      ${subscriptionRows}
    </table>
  `;

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Account data export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
          h1 { margin-bottom: 8px; }
          h2 { margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { text-align: left; border-bottom: 1px solid #e5e7eb; padding: 8px; }
          th { background: #f3f4f6; }
          .meta { color: #6b7280; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <h1>Account data export</h1>
        <p class="meta">Generated on ${escapeHtml(new Date().toLocaleString())}</p>
        ${profileHtml}
        ${devicesHtml}
        ${subscriptionsHtml}
      </body>
    </html>
  `;
}

function sanitizeFilename(email: string): string {
  return email.replace(/[^a-zA-Z0-9._@-]/g, "_").slice(0, 80) || "user";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminService
      .getUsers(page, limit)
      .then((res) => {
        if (!cancelled) {
          setUsers(res.users);
          setTotal(res.total);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load users");
          setUsers([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const handleDownloadData = useCallback(
    async (user: AdminUserDto) => {
      setDownloadingId(user.id);
      try {
        const res = await adminService.exportUserAccountData(user.id);
        const html = buildAccountExportHtml(res);
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `account-data-${sanitizeFilename(user.email)}.html`;
        link.click();
        URL.revokeObjectURL(url);
      } finally {
        setDownloadingId(null);
      }
    },
    [],
  );

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          User List
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          All registered accounts with role and created date.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-neutral-700/50 bg-neutral-900/50 py-12">
          <Loader size="lg" label="Loading users…" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 py-12 text-center">
          <p className="text-red-300">{error}</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => setPage(1)}
          >
            Try again
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 py-12 text-center">
          <p className="text-neutral-400">No users found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-900/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-700/50 bg-neutral-800/50">
                    <th className="px-4 py-3 font-medium text-neutral-300">
                      Email
                    </th>
                    <th className="px-4 py-3 font-medium text-neutral-300">
                      Name
                    </th>
                    <th className="px-4 py-3 font-medium text-neutral-300">
                      Role
                    </th>
                    <th className="px-4 py-3 font-medium text-neutral-300">
                      Created
                    </th>
                    <th className="px-4 py-3 font-medium text-neutral-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-neutral-700/50 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {user.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            user.role === "admin" ||
                            user.role === "SUPER_ADMIN" ||
                            user.role === "CONTENT_MANAGER" ||
                            user.role === "CUSTOMER_SUPPORT"
                              ? "inline-flex rounded-full bg-neutral-800/70 px-2.5 py-0.5 text-xs font-medium text-neutral-200"
                              : "text-neutral-400"
                          }
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {formatCreatedAt(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={downloadingId === user.id}
                          onClick={() => void handleDownloadData(user)}
                        >
                          {downloadingId === user.id
                            ? "Downloading…"
                            : "Download data"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-sm text-neutral-400">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)}{" "}
              of {total}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!hasPrev}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
