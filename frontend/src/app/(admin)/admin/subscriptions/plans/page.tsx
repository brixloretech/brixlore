"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/lib/services";
import type { AdminPlanDto } from "@/types/api";
import { Button, Loader } from "@/components/ui";
import { useAuth } from "@/contexts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlanDraft = {
  name: string;
  /** Monthly price */
  price: string;
  /** Yearly price (empty = not configured) */
  yearlyPrice: string;
  deviceLimit: number;
  offlineAllowed: boolean;
  maxOfflineDownloads: number;
  isPopular: boolean;
  perks: string[];
  /** Monthly Stripe price ID */
  stripePriceId: string;
  /** Yearly Stripe price ID */
  yearlyStripePriceId: string;
};

const EMPTY_DRAFT: PlanDraft = {
  name: "",
  price: "",
  yearlyPrice: "",
  deviceLimit: 1,
  offlineAllowed: false,
  maxOfflineDownloads: 0,
  isPopular: false,
  perks: [],
  stripePriceId: "",
  yearlyStripePriceId: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcSavePercent(monthlyStr: string, yearlyStr: string): number {
  const m = Number(monthlyStr);
  const y = Number(yearlyStr);
  if (!m || !y || m <= 0 || y <= 0) return 0;
  const rate = m * 12;
  if (rate <= y) return 0;
  return Math.round(((rate - y) / rate) * 100);
}

function toTitleCaseWords(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function planToDraft(plan: AdminPlanDto): PlanDraft {
  return {
    name: toTitleCaseWords(plan.name),
    price: plan.price,
    yearlyPrice: plan.yearlyPrice ?? "",
    deviceLimit: plan.deviceLimit,
    offlineAllowed: plan.offlineAllowed,
    maxOfflineDownloads: plan.maxOfflineDownloads,
    isPopular: plan.isPopular,
    perks: plan.perks ?? [],
    stripePriceId: plan.stripePriceId ?? "",
    yearlyStripePriceId: plan.yearlyStripePriceId ?? "",
  };
}

// ---------------------------------------------------------------------------
// Shared field components
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
  min,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  min?: number;
}) {
  return (
    <input
      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-600"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      type={type}
      min={min}
    />
  );
}

// ---------------------------------------------------------------------------
// Pricing section (shared between create + edit)
// ---------------------------------------------------------------------------

function PricingFields({
  draft,
  onChange,
  disabled,
}: {
  draft: PlanDraft;
  onChange: (patch: Partial<PlanDraft>) => void;
  disabled?: boolean;
}) {
  const savePercent = calcSavePercent(draft.price, draft.yearlyPrice);
  return (
    <div className="space-y-4">
      {/* Monthly */}
      <div className="rounded-lg border border-neutral-700/60 bg-neutral-950/50 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
          Monthly pricing
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <FieldLabel>Monthly price ($)</FieldLabel>
            <TextInput
              value={draft.price}
              onChange={(v) => onChange({ price: v })}
              placeholder="e.g. 9.99"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Monthly Stripe price ID</FieldLabel>
            <TextInput
              value={draft.stripePriceId}
              onChange={(v) => onChange({ stripePriceId: v })}
              placeholder="price_..."
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Yearly */}
      <div className="rounded-lg border border-neutral-700/60 bg-neutral-950/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Yearly pricing
          </p>
          <span className="text-xs text-neutral-500">(optional)</span>
          {savePercent > 0 ? (
            <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Save {savePercent}%
            </span>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <FieldLabel>Yearly price ($)</FieldLabel>
            <TextInput
              value={draft.yearlyPrice}
              onChange={(v) => onChange({ yearlyPrice: v })}
              placeholder="e.g. 89.99 (leave blank to hide)"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Yearly Stripe price ID</FieldLabel>
            <TextInput
              value={draft.yearlyStripePriceId}
              onChange={(v) => onChange({ yearlyStripePriceId: v })}
              placeholder="price_..."
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminPlansPage() {
  const { user } = useAuth();
  const isReadOnly = user?.role === "CUSTOMER_SUPPORT";

  const [plans, setPlans] = useState<AdminPlanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, PlanDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<PlanDraft>(EMPTY_DRAFT);
  const [createPerkInput, setCreatePerkInput] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [perkInputs, setPerkInputs] = useState<Record<string, string>>({});

  // ---- Data loading ----

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getPlans();
      setPlans(data);
      const seeded: Record<string, PlanDraft> = {};
      for (const plan of data) {
        seeded[plan.id] = planToDraft(plan);
      }
      setDrafts(seeded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  // ---- Edit helpers ----

  function startEdit(plan: AdminPlanDto) {
    if (isReadOnly) {
      setSaveError("Customer Support accounts have read-only access.");
      return;
    }
    setNotice(null);
    setSaveError(null);
    setEditingId(plan.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setSaveError(null);
  }

  function updateDraft(id: string, patch: Partial<PlanDraft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveDraft(id: string) {
    const next = drafts[id];
    if (!next) return;
    if (isReadOnly) {
      setSaveError("Customer Support accounts have read-only access.");
      return;
    }
    setSavingId(id);
    setSaveError(null);
    try {
      const updated = await adminService.updatePlan(id, {
        name: toTitleCaseWords(next.name),
        price: next.price,
        yearlyPrice: next.yearlyPrice.trim() || undefined,
        deviceLimit: next.deviceLimit,
        offlineAllowed: false,
        maxOfflineDownloads: 0,
        isPopular: next.isPopular,
        perks: next.perks,
        stripePriceId: next.stripePriceId.trim() || undefined,
        yearlyStripePriceId: next.yearlyStripePriceId.trim() || undefined,
      });
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id === id) return updated;
          if (updated.isPopular) return { ...p, isPopular: false };
          return p;
        }),
      );
      setDrafts((prev) => {
        if (!updated.isPopular) return prev;
        const next2: Record<string, PlanDraft> = { ...prev };
        for (const k of Object.keys(next2)) {
          if (k !== id) next2[k] = { ...next2[k], isPopular: false };
        }
        return next2;
      });
      setNotice("Plan changes saved.");
      setEditingId(null);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to update plan.",
      );
    } finally {
      setSavingId(null);
    }
  }

  // ---- Perk helpers (edit) ----

  function addDraftPerk(id: string) {
    const input = (perkInputs[id] ?? "").trim();
    if (!input) return;
    updateDraft(id, {
      perks: Array.from(new Set([...(drafts[id]?.perks ?? []), input])).slice(
        0,
        12,
      ),
    });
    setPerkInputs((prev) => ({ ...prev, [id]: "" }));
  }

  function removeDraftPerk(id: string, perk: string) {
    updateDraft(id, {
      perks: (drafts[id]?.perks ?? []).filter((item) => item !== perk),
    });
  }

  // ---- Create helpers ----

  function resetCreateForm() {
    setCreateDraft(EMPTY_DRAFT);
    setCreatePerkInput("");
    setCreateError(null);
  }

  function addCreatePerk() {
    const value = createPerkInput.trim();
    if (!value) return;
    setCreateDraft((prev) => ({
      ...prev,
      perks: Array.from(new Set([...(prev.perks ?? []), value])).slice(0, 12),
    }));
    setCreatePerkInput("");
  }

  function removeCreatePerk(perk: string) {
    setCreateDraft((prev) => ({
      ...prev,
      perks: prev.perks.filter((p) => p !== perk),
    }));
  }

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (isReadOnly) {
      setCreateError("Customer Support accounts have read-only access.");
      return;
    }
    setCreateError(null);
    setNotice(null);

    if (!createDraft.name.trim()) {
      setCreateError("Plan name is required.");
      return;
    }
    if (!createDraft.price.trim()) {
      setCreateError("Monthly price is required.");
      return;
    }

    setCreating(true);
    try {
      const created = await adminService.createPlan({
        name: toTitleCaseWords(createDraft.name),
        price: createDraft.price.trim(),
        yearlyPrice: createDraft.yearlyPrice.trim() || undefined,
        deviceLimit: createDraft.deviceLimit,
        offlineAllowed: false,
        maxOfflineDownloads: 0,
        isPopular: createDraft.isPopular,
        perks: createDraft.perks,
        stripePriceId: createDraft.stripePriceId.trim() || undefined,
        yearlyStripePriceId:
          createDraft.yearlyStripePriceId.trim() || undefined,
      });
      setPlans((prev) => {
        const next = [created, ...prev];
        if (!created.isPopular) return next;
        return next.map((p) =>
          p.id === created.id ? p : { ...p, isPopular: false },
        );
      });
      setDrafts((prev) => {
        const next: Record<string, PlanDraft> = { ...prev };
        if (created.isPopular) {
          for (const k of Object.keys(next))
            next[k] = { ...next[k], isPopular: false };
        }
        next[created.id] = planToDraft(created);
        return next;
      });
      setNotice("Plan created successfully.");
      setCreateOpen(false);
      resetCreateForm();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create plan.",
      );
    } finally {
      setCreating(false);
    }
  }

  // ---- Delete ----

  async function handleDelete(plan: AdminPlanDto) {
    if (isReadOnly) {
      setSaveError("Customer Support accounts have read-only access.");
      return;
    }
    const ok = window.confirm(
      `Delete plan "${plan.name}"? This cannot be undone.`,
    );
    if (!ok) return;
    setDeletingId(plan.id);
    setSaveError(null);
    setNotice(null);
    try {
      const res = await adminService.deletePlan(plan.id);
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      setNotice(res.message);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to delete plan.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ---- Guards ----

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-neutral-700/50 bg-neutral-900/50 py-12">
        <Loader size="lg" label="Loading plans…" />
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

  // ---- Render ----

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Plans
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Manage subscription tiers, pricing, and access limits.
        </p>
      </header>

      {notice ? (
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      ) : null}
      {saveError ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {saveError}
        </div>
      ) : null}
      {isReadOnly ? (
        <div className="rounded-xl border border-neutral-700/60 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-300">
          Read-only access: Customer Support accounts can view plans but cannot
          create or edit them.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          Each plan supports both monthly and yearly pricing. Fill in yearly
          pricing to unlock the annual billing option for subscribers.
        </p>
        <Button
          type="button"
          onClick={() => setCreateOpen((prev) => !prev)}
          disabled={isReadOnly}
        >
          {createOpen ? "Close" : "New plan"}
        </Button>
      </div>

      {/* ---- Create form ---- */}
      {createOpen ? (
        <div className="rounded-2xl border border-neutral-700/50 bg-neutral-900/60 p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Create plan</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Define pricing and access limits.
            </p>
          </div>
          <form onSubmit={handleCreatePlan} className="space-y-5">
            {createError ? (
              <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400">
                {createError}
              </p>
            ) : null}

            <div className="space-y-1">
              <FieldLabel>Plan name</FieldLabel>
              <TextInput
                value={createDraft.name}
                onChange={(v) => setCreateDraft((p) => ({ ...p, name: v }))}
                placeholder="e.g. Fan, Mega Fan, Ultimate"
                disabled={isReadOnly || creating}
              />
            </div>

            <PricingFields
              draft={createDraft}
              onChange={(patch) => setCreateDraft((p) => ({ ...p, ...patch }))}
              disabled={isReadOnly || creating}
            />

            <div className="space-y-1">
              <div className="space-y-1">
                <FieldLabel>Device limit</FieldLabel>
                <TextInput
                  value={createDraft.deviceLimit}
                  onChange={(v) =>
                    setCreateDraft((p) => ({
                      ...p,
                      deviceLimit: Number(v) || 0,
                    }))
                  }
                  type="number"
                  min={0}
                  disabled={isReadOnly || creating}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="create-popular"
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-950"
                checked={createDraft.isPopular}
                onChange={(e) =>
                  setCreateDraft((p) => ({ ...p, isPopular: e.target.checked }))
                }
                disabled={isReadOnly || creating}
              />
              <label
                htmlFor="create-popular"
                className="text-sm text-neutral-300"
              >
                Mark as Most Popular
              </label>
            </div>

            <div className="space-y-3">
              <FieldLabel>Extra perks</FieldLabel>
              <div className="flex flex-wrap gap-2">
                <input
                  className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-600"
                  value={createPerkInput}
                  onChange={(e) => setCreatePerkInput(e.target.value)}
                  placeholder="Add a perk (e.g. Early access)"
                  disabled={isReadOnly || creating}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCreatePerk();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addCreatePerk}
                  disabled={isReadOnly || creating}
                >
                  Add perk
                </Button>
              </div>
              {createDraft.perks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {createDraft.perks.map((perk) => (
                    <button
                      key={perk}
                      type="button"
                      className="rounded-full border border-neutral-700/60 px-3 py-1 text-xs text-neutral-300 hover:border-accent hover:text-accent"
                      onClick={() => removeCreatePerk(perk)}
                      disabled={creating}
                    >
                      {perk} ×
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">No perks added yet.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={creating || isReadOnly}>
                {creating ? "Creating…" : "Create plan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetCreateForm}
                disabled={creating}
              >
                Reset
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {/* ---- Plan cards ---- */}
      {plans.length === 0 ? (
        <div className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 py-12 text-center">
          <p className="text-neutral-400">No plans configured yet.</p>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const isEditing = editingId === plan.id;
            const current = drafts[plan.id];
            const savePercent = calcSavePercent(
              plan.price,
              plan.yearlyPrice ?? "",
            );
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border bg-neutral-900/60 p-6 ${
                  isEditing
                    ? "border-accent/70 shadow-[0_0_0_1px_rgba(229,231,235,0.35)]"
                    : "border-neutral-700/50"
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">
                      {toTitleCaseWords(plan.name)}
                    </h2>
                    {plan.isPopular ? (
                      <span className="rounded-full border border-neutral-500/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-200">
                        Most popular
                      </span>
                    ) : null}
                    {savePercent > 0 ? (
                      <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        Save {savePercent}% yearly
                      </span>
                    ) : null}
                  </div>
                  <span className="rounded-full border border-neutral-700/60 px-2 py-1 text-xs text-neutral-300 whitespace-nowrap">
                    {plan.activeSubscribers} active
                  </span>
                </div>

                {/* Pricing summary */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-blue-900/40 bg-blue-950/10 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-400">
                      Monthly
                    </p>
                    <p className="mt-1 text-xl font-bold text-white">
                      ${plan.price}
                    </p>
                    {plan.stripePriceId ? (
                      <p
                        className="mt-1 truncate text-[10px] text-neutral-500"
                        title={plan.stripePriceId}
                      >
                        {plan.stripePriceId}
                      </p>
                    ) : (
                      <p className="mt-1 text-[10px] italic text-neutral-600">
                        No Stripe ID
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/10 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-400">
                      Yearly
                    </p>
                    {plan.yearlyPrice ? (
                      <>
                        <p className="mt-1 text-xl font-bold text-white">
                          ${plan.yearlyPrice}
                        </p>
                        {plan.yearlyStripePriceId ? (
                          <p
                            className="mt-1 truncate text-[10px] text-neutral-500"
                            title={plan.yearlyStripePriceId}
                          >
                            {plan.yearlyStripePriceId}
                          </p>
                        ) : (
                          <p className="mt-1 text-[10px] italic text-neutral-600">
                            No Stripe ID
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-2 text-xs italic text-neutral-600">
                        Not configured
                      </p>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-1.5 text-sm text-neutral-300">
                  <p>Device limit: {plan.deviceLimit}</p>
                  {plan.perks.length > 0 ? (
                    <div className="pt-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                        Perks
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-neutral-300">
                        {plan.perks.map((perk) => (
                          <li key={perk}>• {perk}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                {/* Buttons */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => startEdit(plan)}
                    disabled={isReadOnly}
                  >
                    Edit plan
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleDelete(plan)}
                    disabled={isReadOnly || deletingId === plan.id}
                  >
                    {deletingId === plan.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>

                {/* ---- Inline edit form ---- */}
                {isEditing && current ? (
                  <div className="mt-6 space-y-5 border-t border-neutral-800 pt-5">
                    <div className="space-y-1">
                      <FieldLabel>Plan name</FieldLabel>
                      <TextInput
                        value={current.name}
                        onChange={(v) => updateDraft(plan.id, { name: v })}
                        placeholder="Plan name"
                        disabled={savingId === plan.id}
                      />
                    </div>

                    <PricingFields
                      draft={current}
                      onChange={(patch) => updateDraft(plan.id, patch)}
                      disabled={savingId === plan.id}
                    />

                    <div className="space-y-1">
                      <div className="space-y-1">
                        <FieldLabel>Device limit</FieldLabel>
                        <TextInput
                          value={current.deviceLimit}
                          onChange={(v) =>
                            updateDraft(plan.id, {
                              deviceLimit: Number(v) || 0,
                            })
                          }
                          type="number"
                          min={0}
                          disabled={savingId === plan.id}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        id={`popular-${plan.id}`}
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-700 bg-neutral-950"
                        checked={current.isPopular}
                        onChange={(e) =>
                          updateDraft(plan.id, { isPopular: e.target.checked })
                        }
                        disabled={savingId === plan.id}
                      />
                      <label
                        htmlFor={`popular-${plan.id}`}
                        className="text-sm text-neutral-300"
                      >
                        Mark as Most Popular
                      </label>
                    </div>

                    <div className="space-y-3">
                      <FieldLabel>Extra perks</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        <input
                          className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-600"
                          value={perkInputs[plan.id] ?? ""}
                          onChange={(e) =>
                            setPerkInputs((prev) => ({
                              ...prev,
                              [plan.id]: e.target.value,
                            }))
                          }
                          placeholder="Add a perk"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addDraftPerk(plan.id);
                            }
                          }}
                          disabled={savingId === plan.id}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => addDraftPerk(plan.id)}
                          disabled={savingId === plan.id}
                        >
                          Add perk
                        </Button>
                      </div>
                      {current.perks.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {current.perks.map((perk) => (
                            <button
                              key={perk}
                              type="button"
                              className="rounded-full border border-neutral-700/60 px-3 py-1 text-xs text-neutral-300 hover:border-accent hover:text-accent"
                              onClick={() => removeDraftPerk(plan.id, perk)}
                              disabled={savingId === plan.id}
                            >
                              {perk} ×
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500">
                          No perks added yet.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={savingId === plan.id}
                        onClick={() => void saveDraft(plan.id)}
                      >
                        {savingId === plan.id ? "Saving…" : "Save changes"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
