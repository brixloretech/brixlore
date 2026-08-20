"use client";

import { useEffect, useState } from "react";
import { Loader } from "@/components/ui";
import { adminService } from "@/lib/services";
import type { AdminWaitlistEntryDto } from "@/types/api";

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<AdminWaitlistEntryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminService.getWaitlist(page, limit).then((response) => {
      if (active) {
        setEntries(response.entries);
        setTotal(response.total);
      }
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : "Unable to load waitlist");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="font-sans">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">Audience</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Early access waitlist</h1>
          <p className="mt-2 text-sm text-neutral-400">People who want to hear when Brixlore opens.</p>
        </div>
        <span className="rounded-full border border-neutral-800 px-3 py-1 text-sm text-neutral-400">{total.toLocaleString()} total</span>
      </div>
      {loading ? <div className="flex justify-center py-16"><Loader size="lg" label="Loading waitlist…" /></div> : error ? <p className="rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">{error}</p> : (
        <div className="overflow-hidden rounded-2xl border border-neutral-800/70 bg-neutral-950/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-neutral-800 bg-neutral-900/70 text-xs uppercase tracking-[0.16em] text-neutral-500">
                <tr><th className="px-5 py-4">Name</th><th className="px-5 py-4">Email</th><th className="px-5 py-4">Phone</th><th className="px-5 py-4">Email updates</th><th className="px-5 py-4">SMS</th><th className="px-5 py-4">Joined</th></tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70">
                {entries.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-neutral-500">No waitlist entries yet.</td></tr> : entries.map((entry) => <tr key={entry.id} className="text-neutral-300"><td className="px-5 py-4 font-medium text-white">{entry.name}</td><td className="px-5 py-4">{entry.email}</td><td className="px-5 py-4">{entry.phone}</td><td className="px-5 py-4">{entry.emailConsent ? "Opted in" : "—"}</td><td className="px-5 py-4">{entry.smsConsent ? "Opted in" : "—"}</td><td className="whitespace-nowrap px-5 py-4 text-neutral-500">{new Date(entry.createdAt).toLocaleDateString()}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-neutral-800/70 px-5 py-4 text-sm text-neutral-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-neutral-700 px-3 py-1.5 disabled:opacity-40">Previous</button><button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-neutral-700 px-3 py-1.5 disabled:opacity-40">Next</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
