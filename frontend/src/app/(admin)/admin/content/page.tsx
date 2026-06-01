"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminContent, useAuth } from "@/contexts";
import { adminService } from "@/lib/services";
import { Button, Loader } from "@/components/ui";
import { formatDuration } from "@/lib/video-utils";
import { cn } from "@/lib/utils";

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

function getHlsBadgeClasses(
  status: "ready" | "processing" | "missing",
): string {
  switch (status) {
    case "ready":
      return "bg-emerald-900/40 text-emerald-200";
    case "processing":
      return "bg-amber-900/40 text-amber-200";
    default:
      return "bg-neutral-700 text-neutral-300";
  }
}

function getHlsLabel(status: "ready" | "processing" | "missing"): string {
  switch (status) {
    case "ready":
      return "HLS ready";
    case "processing":
      return "Processing";
    default:
      return "No HLS yet";
  }
}

export default function AdminContentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, loading, error, publishContent, refresh } = useAdminContent();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isReadOnly = user?.role === "CUSTOMER_SUPPORT";
  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.role === "admin";

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleTogglePublish(id: string, current: boolean) {
    setTogglingId(id);
    try {
      await publishContent(id, !current);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!isSuperAdmin) return;
    const confirmed = window.confirm(
      `Delete "${title}"? This will permanently remove the content and all its seasons and episodes. This cannot be undone.`,
    );
    if (!confirmed) return;
    setDeleteError(null);
    setDeletingId(id);
    try {
      await adminService.deleteContent(id);
      await refresh();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete content.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Library
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Review uploads, edit metadata, and manage publish status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void refresh()}
          >
            Refresh
          </Button>
          {isReadOnly ? (
            <Button type="button" disabled>
              Upload content
            </Button>
          ) : (
            <Link href="/admin/content/upload">
              <Button type="button">Upload content</Button>
            </Link>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-neutral-700/50 bg-neutral-900/50 py-12">
          <Loader size="lg" label="Loading content…" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 py-12 text-center">
          <p className="text-red-300">{error}</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => void refresh()}
          >
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 py-12 text-center">
          <p className="text-neutral-400">
            No content yet. Upload content to get started.
          </p>
          {isReadOnly ? (
            <Button type="button" variant="secondary" disabled className="mt-4">
              Upload content
            </Button>
          ) : (
            <Link href="/admin/content/upload" className="mt-4 inline-block">
              <Button type="button" variant="secondary">
                Upload content
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div>
          {deleteError && (
            <div className="mb-4 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
              {deleteError}
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-900/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-700/50 bg-neutral-800/50">
                    <th className="px-4 py-3 font-medium text-neutral-300">
                      Title
                    </th>
                    <th className="px-4 py-3 font-medium text-neutral-300">
                      Duration
                    </th>
                    <th className="px-4 py-3 font-medium text-neutral-300">
                      Type
                    </th>
                    <th className="px-4 py-3 font-medium text-neutral-300">
                      Category
                    </th>
                    <th className="px-4 py-3 font-medium text-neutral-300">
                      Created
                    </th>
                    <th className="px-4 py-3 font-medium text-neutral-300">
                      Status
                    </th>
                    <th className="px-4 py-3 font-medium text-neutral-300">
                      HLS
                    </th>
                    <th className="min-w-[240px] px-4 py-3 font-medium text-neutral-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-neutral-700/50 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {item.title}
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {item.duration ? formatDuration(item.duration) : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {item.type}
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {item.category ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {formatCreatedAt(item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            item.isPublished
                              ? "bg-green-900/40 text-green-200"
                              : "bg-neutral-700 text-neutral-300",
                          )}
                        >
                          {item.isPublished ? "Published" : "Unpublished"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={cn(
                              "inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                              getHlsBadgeClasses(item.hlsStatus),
                              item.hlsStatus === "processing" && "animate-pulse",
                            )}
                          >
                            {item.hlsStatus === "processing" ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden />
                            ) : null}
                            {getHlsLabel(item.hlsStatus)}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {item.hlsTotalCount > 0
                              ? `${item.hlsReadyCount}/${item.hlsTotalCount} video${item.hlsTotalCount === 1 ? "" : "s"} ready`
                              : "No video uploaded"}
                          </span>
                          {item.hlsStatus === "processing" ? (
                            <span className="text-xs text-amber-300">
                              Cloudflare Stream is still preparing this upload.
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex flex-nowrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isReadOnly}
                            onClick={() =>
                              void router.push(`/admin/content/${item.id}/edit`)
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isReadOnly || togglingId === item.id}
                            onClick={() =>
                              handleTogglePublish(item.id, item.isPublished)
                            }
                          >
                            {item.isPublished ? "Unpublish" : "Publish"}
                          </Button>
                          {isSuperAdmin && (
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              disabled={deletingId === item.id}
                              onClick={() =>
                                void handleDelete(item.id, item.title)
                              }
                            >
                              {deletingId === item.id ? "Deleting…" : "Delete"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
