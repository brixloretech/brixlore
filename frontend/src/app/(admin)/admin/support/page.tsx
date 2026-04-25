"use client";

import { useEffect, useMemo, useState } from "react";
import { adminService } from "@/lib/services";
import type {
  SupportPriority,
  SupportRequestDto,
  SupportStatus,
} from "@/types/api";
import { Button, Loader } from "@/components/ui";

const PRIORITY_OPTIONS: SupportPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUS_OPTIONS: SupportStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

type DraftState = {
  priority: SupportPriority;
  status: SupportStatus;
  reply: string;
};

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function AdminSupportPage() {
  const [requests, setRequests] = useState<SupportRequestDto[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getSupportRequests(1, 50);
      setRequests(res.requests);
      const nextDrafts: Record<string, DraftState> = {};
      for (const req of res.requests) {
        nextDrafts[req.id] = {
          priority: req.priority,
          status: req.status,
          reply: "",
        };
      }
      setDrafts(nextDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    if (!requests.some((req) => req.id === selectedId)) {
      setSelectedId(null);
    }
  }, [requests, selectedId]);

  const hasRequests = useMemo(() => requests.length > 0, [requests.length]);

  async function handleUpdate(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    setNotice(null);
    try {
      const updated = await adminService.updateSupportRequest(id, {
        priority: draft.priority,
        status: draft.status,
      });
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setNotice("Support request updated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update request.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleReply(id: string) {
    const draft = drafts[id];
    if (!draft?.reply.trim()) {
      setError("Reply message is required.");
      return;
    }
    setReplyingId(id);
    setNotice(null);
    setError(null);
    try {
      const updated = await adminService.replySupportRequest(id, {
        message: draft.reply.trim(),
        status: draft.status,
      });
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setDrafts((prev) => ({
        ...prev,
        [id]: { ...prev[id], reply: "" },
      }));
      setNotice("Reply sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply.");
    } finally {
      setReplyingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Customer Support
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Track, prioritize, and respond to customer support requests.
        </p>
      </header>

      {notice ? (
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-neutral-700/50 bg-neutral-900/50 py-12">
          <Loader size="lg" label="Loading requests…" />
        </div>
      ) : !hasRequests ? (
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 px-5 py-6 text-sm text-neutral-400">
          No support requests yet.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const draft = drafts[req.id];
            const isOpen = selectedId === req.id;
            return (
              <div
                key={req.id}
                className="rounded-2xl border border-neutral-700/60 bg-neutral-900/60 p-6"
              >
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Customer
                    </p>
                    <p className="mt-1 text-sm text-neutral-200">{req.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Subject
                    </p>
                    <p className="mt-1 text-sm text-neutral-200">
                      {req.subject}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Email
                    </p>
                    <p className="mt-1 text-sm text-neutral-200 break-all">
                      {req.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Priority
                    </p>
                    <p className="mt-1 text-sm text-neutral-200">
                      {req.priority}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Status
                    </p>
                    <p className="mt-1 text-sm text-neutral-200">
                      {req.status}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-end">
                    <span className="text-xs text-neutral-500">
                      {formatDateTime(req.createdAt)}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        setSelectedId((current) =>
                          current === req.id ? null : req.id,
                        )
                      }
                    >
                      {isOpen ? "Hide details" : "Show details"}
                    </Button>
                  </div>
                </div>

                {isOpen ? (
                  <div className="mt-6 space-y-5 border-t border-neutral-800 pt-5">
                    <p className="text-sm text-neutral-300">{req.message}</p>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                          Priority
                        </label>
                        <select
                          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
                          value={draft?.priority ?? req.priority}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [req.id]: {
                                ...(prev[req.id] ?? {
                                  priority: req.priority,
                                  status: req.status,
                                  reply: "",
                                }),
                                priority: e.target.value as SupportPriority,
                              },
                            }))
                          }
                        >
                          {PRIORITY_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                          Status
                        </label>
                        <select
                          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
                          value={draft?.status ?? req.status}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [req.id]: {
                                ...(prev[req.id] ?? {
                                  priority: req.priority,
                                  status: req.status,
                                  reply: "",
                                }),
                                status: e.target.value as SupportStatus,
                              },
                            }))
                          }
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          size="sm"
                          disabled={savingId === req.id}
                          onClick={() => void handleUpdate(req.id)}
                        >
                          {savingId === req.id ? "Saving…" : "Save"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                        Reply
                      </label>
                      <textarea
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
                        rows={3}
                        placeholder="Type your response to the customer..."
                        value={draft?.reply ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [req.id]: {
                              ...(prev[req.id] ?? {
                                priority: req.priority,
                                status: req.status,
                                reply: "",
                              }),
                              reply: e.target.value,
                            },
                          }))
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={replyingId === req.id}
                        onClick={() => void handleReply(req.id)}
                      >
                        {replyingId === req.id ? "Sending…" : "Send reply"}
                      </Button>
                    </div>

                    {req.replies.length > 0 ? (
                      <div className="border-t border-neutral-800 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                          Replies
                        </p>
                        <div className="mt-3 space-y-3">
                          {req.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                                <span>
                                  {reply.adminName || "Admin"} ·{" "}
                                  {formatDateTime(reply.createdAt)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-neutral-200">
                                {reply.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
