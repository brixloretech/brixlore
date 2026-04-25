"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  Loader,
} from "@/components/ui";
import { useAuth } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api-client";
import { siteService, subscriptionService } from "@/lib/services";
import type {
  BillingSummaryDto,
  GetSubscriptionResponseDto,
  PublicPlanDto,
} from "@/types/api";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
  const [subscription, setSubscription] =
    useState<GetSubscriptionResponseDto | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportName, setSupportName] = useState(user?.name ?? "");
  const [supportEmail, setSupportEmail] = useState(user?.email ?? "");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);
  const [supportLoading, setSupportLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingSummary, setBillingSummary] =
    useState<BillingSummaryDto | null>(null);
  const [billingSummaryLoading, setBillingSummaryLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      subscriptionService.getPlans(),
      subscriptionService.getSubscription(true),
      subscriptionService.getBillingSummary(),
    ])
      .then(([planList, sub, billing]) => {
        if (!active) return;
        setPlans(planList);
        setSubscription(sub ?? null);
        setBillingSummary(billing ?? { paymentMethod: null, invoices: [] });
      })
      .catch(() => {
        if (!active) return;
        setPlans([]);
        setSubscription(null);
        setBillingSummary({ paymentMethod: null, invoices: [] });
      })
      .finally(() => {
        if (!active) return;
        setBillingSummaryLoading(false);
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSupportName(user?.name ?? "");
    setSupportEmail(user?.email ?? "");
  }, [user]);

  async function handleOpenBillingPortal() {
    setBillingError(null);
    setBillingLoading(true);
    try {
      const res = await subscriptionService.createPortalSession(
        window.location.href,
      );
      if (res?.url) {
        window.location.href = res.url;
      } else {
        setBillingError("Billing portal is unavailable right now.");
      }
    } catch (err) {
      setBillingError(getApiErrorMessage(err));
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleSupportSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSupportError(null);
    setSupportSuccess(null);
    const name = supportName.trim();
    const email = supportEmail.trim();
    const subject = supportSubject.trim();
    const message = supportMessage.trim();
    if (!name || !email || !subject || !message) {
      setSupportError("Please fill out all fields.");
      return;
    }
    setSupportLoading(true);
    try {
      const res = await siteService.submitContact({
        name,
        email,
        subject,
        message,
      });
      setSupportSuccess(res.message ?? "Your request was sent.");
      setSupportSubject("");
      setSupportMessage("");
    } catch (err) {
      setSupportError(getApiErrorMessage(err));
    } finally {
      setSupportLoading(false);
    }
  }

  const activePlan = useMemo(() => {
    if (!subscription?.planId) return null;
    return plans.find((plan) => plan.id === subscription.planId) ?? null;
  }, [plans, subscription]);

  const formatNextChargeDate = (isoDate?: string): string => {
    if (!isoDate) return "Not available";
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return "Not available";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(parsed);
  };

  const inferredBillingCycle = useMemo<"monthly" | "yearly">(() => {
    if (!activePlan) return "monthly";

    const yearlyCents =
      activePlan.yearlyPrice != null
        ? Math.round(activePlan.yearlyPrice * 100)
        : null;
    const monthlyCents = Math.round(activePlan.price * 100);

    const latestInvoice = billingSummary?.invoices?.[0] ?? null;
    if (latestInvoice) {
      const invoiceAmount =
        latestInvoice.status === "paid"
          ? latestInvoice.amountPaid
          : latestInvoice.amountDue;
      if (yearlyCents != null && Math.abs(invoiceAmount - yearlyCents) <= 1) {
        return "yearly";
      }
      if (Math.abs(invoiceAmount - monthlyCents) <= 1) {
        return "monthly";
      }
    }

    if (subscription?.currentPeriodEnd && yearlyCents != null) {
      const periodEnd = new Date(subscription.currentPeriodEnd);
      if (!Number.isNaN(periodEnd.getTime())) {
        const daysUntilEnd =
          (periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilEnd > 45) {
          return "yearly";
        }
      }
    }

    return "monthly";
  }, [activePlan, billingSummary?.invoices, subscription?.currentPeriodEnd]);

  const nextCharge = formatNextChargeDate(subscription?.currentPeriodEnd);
  const priceLabel = activePlan
    ? inferredBillingCycle === "yearly" && activePlan.yearlyPrice != null
      ? `$${activePlan.yearlyPrice.toFixed(2)} / year`
      : `$${activePlan.price.toFixed(2)} / month`
    : "--";
  const paymentMethod = billingSummary?.paymentMethod ?? null;
  const invoices = billingSummary?.invoices ?? [];

  const formatCurrency = (amount: number, currency?: string) => {
    const normalized = (currency ?? "usd").toUpperCase();
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalized,
    }).format((amount ?? 0) / 100);
  };

  const formatBrand = (brand?: string) => {
    if (!brand) return "Card";
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <Loader size="lg" label="Loading subscription…" />
      </main>
    );
  }

  return (
    <div className="font-[var(--font-geist-sans)]">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
          Subscription
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Keep your plan in sync
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-400">
          Review your plan, billing, and payment methods.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-700/60 bg-neutral-900/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
              Current plan
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {activePlan?.name ??
                    (subscription?.isSubscribed ? "Active plan" : "Free")}
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  {activePlan?.perks?.[0] ??
                    (subscription?.isSubscribed
                      ? "Subscription benefits are active."
                      : "Choose a plan to unlock premium access.")}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-700/70 bg-neutral-950/60 px-4 py-3 text-right">
                <p className="text-xs text-neutral-500">Next charge</p>
                <p className="text-sm font-semibold text-white">{nextCharge}</p>
                <p className="text-xs text-neutral-500">{priceLabel}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/subscription">
                <Button type="button">Manage plan</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-700/60 bg-neutral-900/60 p-6">
            <h3 className="text-lg font-semibold text-white">Payment method</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Manage your saved payment methods in the billing portal.
            </p>
            <div className="mt-5 rounded-xl border border-neutral-700/70 bg-neutral-950/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  {billingSummaryLoading ? (
                    <>
                      <p className="text-sm font-semibold text-white">
                        Loading payment method
                      </p>
                      <p className="text-xs text-neutral-400">
                        Fetching your default card details.
                      </p>
                    </>
                  ) : paymentMethod ? (
                    <>
                      <p className="text-sm font-semibold text-white">
                        {`${formatBrand(paymentMethod.brand)} ending in ${paymentMethod.last4}`}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {`Expires ${String(paymentMethod.expMonth).padStart(2, "0")}/${String(paymentMethod.expYear).slice(-2)}`}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-white">
                        No card on file
                      </p>
                      <p className="text-xs text-neutral-400">
                        Add or update a card in the billing portal.
                      </p>
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleOpenBillingPortal}
                  disabled={billingLoading}
                >
                  {billingLoading ? "Opening..." : "Update card"}
                </Button>
              </div>
            </div>
            {billingError && (
              <p className="mt-3 text-sm text-red-400" role="alert">
                {billingError}
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-neutral-700/60 bg-neutral-900/60 p-6">
            <h3 className="text-lg font-semibold text-white">
              Billing history
            </h3>
            <p className="mt-1 text-sm text-neutral-400">
              Recent invoices for your records.
            </p>
            <div className="mt-5 space-y-3">
              {invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((invoice) => {
                    const amount =
                      invoice.status === "paid"
                        ? invoice.amountPaid
                        : invoice.amountDue;
                    const label = invoice.status === "paid" ? "Paid" : "Due";
                    const dateLabel = new Date(
                      invoice.createdAt,
                    ).toLocaleDateString();
                    const linkUrl =
                      invoice.hostedInvoiceUrl ?? invoice.invoicePdf ?? "";
                    return (
                      <div
                        key={invoice.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-700/70 bg-neutral-950/60 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {`${label} ${formatCurrency(amount, invoice.currency)}`}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {`${dateLabel} • ${invoice.status}`}
                          </p>
                        </div>
                        {linkUrl ? (
                          <a
                            href={linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-accent hover:text-accent/80"
                          >
                            View invoice
                          </a>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-neutral-700/70 bg-neutral-950/40 px-4 py-3 text-sm text-neutral-400">
                  View invoices and billing history in the billing portal.
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenBillingPortal}
                disabled={billingLoading}
              >
                {billingLoading ? "Opening..." : "Open billing portal"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-700/60 bg-neutral-900/60 p-6">
            <h3 className="text-lg font-semibold text-white">Need help?</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Billing questions or plan changes can be handled anytime.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSupportOpen(true)}
              >
                Contact support
              </Button>
            </div>
          </div>
        </aside>
      </section>

      <Modal
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
        title="Contact support"
      >
        <form onSubmit={handleSupportSubmit}>
          <ModalContent className="space-y-4">
            {supportError && (
              <p
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
                role="alert"
              >
                {supportError}
              </p>
            )}
            {supportSuccess && (
              <p
                className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                role="status"
              >
                {supportSuccess}
              </p>
            )}
            <Input
              label="Name"
              value={supportName}
              onChange={(e) => setSupportName(e.target.value)}
              disabled={supportLoading}
              placeholder="Your name"
            />
            <Input
              label="Email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              disabled={supportLoading}
              placeholder="you@example.com"
            />
            <Input
              label="Subject"
              value={supportSubject}
              onChange={(e) => setSupportSubject(e.target.value)}
              disabled={supportLoading}
              placeholder="How can we help?"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Message
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 transition-colors focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400/20 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/20"
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                disabled={supportLoading}
                placeholder="Share the details so we can help faster."
              />
            </div>
          </ModalContent>
          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSupportOpen(false)}
              disabled={supportLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={supportLoading}>
              {supportLoading ? "Sending..." : "Send"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
