"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  CreditCard,
  Crown,
  Headphones,
  ShieldCheck,
} from "lucide-react";
import {
  Button,
  Input,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
} from "@/components/ui";
import { PlanActionButtons } from "@/components/content/PlanActionButtons";
import { SubscriptionCards } from "@/components/content/SubscriptionCards";
import { useAuth } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api-client";
import { siteService, subscriptionService } from "@/lib/services";
import type {
  BillingSummaryDto,
  GetSubscriptionResponseDto,
  PublicPlanDto,
} from "@/types/api";
import { RainbowButton } from "@/components/ui/rainbow-button";

function date(value?: string) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Not available"
    : parsed.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
  const [subscription, setSubscription] =
    useState<GetSubscriptionResponseDto | null>(null);
  const [billing, setBilling] = useState<BillingSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportName, setSupportName] = useState(user?.name ?? "");
  const [supportEmail, setSupportEmail] = useState(user?.email ?? "");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);
  const [supportLoading, setSupportLoading] = useState(false);

  const refreshSubscription = async () => {
    const value = await subscriptionService.getSubscription(true);
    setSubscription(value ?? null);
  };
  useEffect(() => {
    let active = true;
    void Promise.all([
      subscriptionService.getPlans(),
      subscriptionService.getSubscription(true),
      subscriptionService.getBillingSummary(),
    ])
      .then(([planList, current, summary]) => {
        if (active) {
          setPlans(planList);
          setSubscription(current ?? null);
          setBilling(summary ?? { paymentMethod: null, invoices: [] });
        }
      })
      .catch(() => {
        if (active) {
          setPlans([]);
          setSubscription(null);
          setBilling({ paymentMethod: null, invoices: [] });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    setSupportName(user?.name ?? "");
    setSupportEmail(user?.email ?? "");
  }, [user]);
  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === subscription?.planId) ?? null,
    [plans, subscription?.planId],
  );
  const isCancelled = subscription?.status === "CANCELLED";
  const payment = billing?.paymentMethod;

  async function openPortal() {
    setBillingError(null);
    setBillingLoading(true);
    try {
      const result = await subscriptionService.createPortalSession(
        window.location.href,
      );
      if (result?.url) window.location.href = result.url;
      else setBillingError("Billing portal is unavailable right now.");
    } catch (error) {
      setBillingError(getApiErrorMessage(error));
    } finally {
      setBillingLoading(false);
    }
  }
  async function cancelSubscription() {
    setCancelError(null);
    setCanceling(true);
    try {
      await subscriptionService.cancelSubscription();
      await refreshSubscription();
      setCancelOpen(false);
    } catch (error) {
      setCancelError(getApiErrorMessage(error));
    } finally {
      setCanceling(false);
    }
  }
  async function submitSupport(event: React.FormEvent) {
    event.preventDefault();
    setSupportError(null);
    setSupportSuccess(null);
    if (
      ![supportName, supportEmail, supportSubject, supportMessage].every(
        (value) => value.trim(),
      )
    ) {
      setSupportError("Please fill out all fields.");
      return;
    }
    setSupportLoading(true);
    try {
      const result = await siteService.submitContact({
        name: supportName.trim(),
        email: supportEmail.trim(),
        subject: supportSubject.trim(),
        message: supportMessage.trim(),
      });
      setSupportSuccess(result.message ?? "Your request was sent.");
      setSupportSubject("");
      setSupportMessage("");
    } catch (error) {
      setSupportError(getApiErrorMessage(error));
    } finally {
      setSupportLoading(false);
    }
  }

  if (loading)
    return (
      <main className="flex min-h-[65vh] items-center justify-center">
        <Loader size="lg" label="Preparing your membership…" />
      </main>
    );

  return (
    <div className="min-h-[calc(100vh-57px)] w-full max-w-full overflow-x-hidden bg-[#050505] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/15">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_16%,rgba(255,255,255,.16),transparent_18%),linear-gradient(140deg,#151515_0%,#050505_62%)]" />
        <p
          aria-hidden="true"
          className="pointer-events-none absolute right-[-0.07em] top-[7%] -z-10 select-none text-[21vw] font-semibold leading-none tracking-[-0.14em] text-white/[0.045]"
        >
          ACCESS
        </p>
        <div className="relative mx-auto grid min-h-[550px] max-w-[1550px] items-end gap-10 px-4 pb-14 pt-24 sm:px-6 sm:pb-16 lg:min-h-[620px] lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:pb-20">
          <div>
            <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">
              <Crown size={14} /> Brixlore membership
            </p>
            <h1 className="mt-6 text-5xl font-semibold leading-[0.84] tracking-[-0.085em] sm:text-7xl lg:text-[88px]">
              More than
              <br />a <span className="text-white/40">subscription.</span>
            </h1>
            <p className="mt-7 max-w-md border-l border-white/45 pl-5 text-sm leading-7 text-white/65 sm:text-base">
              A front-row pass to every story, every screen, and the worlds
              still waiting to be discovered.
            </p>
            <Link href="#plans" className="mt-9 inline-flex ">
              <RainbowButton>
                Choose your access <ChevronRight size={16} />
              </RainbowButton>
            </Link>
          </div>
          <div className="relative overflow-hidden border border-white/20 bg-white p-6 text-black sm:p-8">
            <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full border-[25px] border-black/10" />
            <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">
              Your membership
            </p>
            <h2 className="relative mt-4 text-4xl font-semibold leading-[0.88] tracking-[-0.065em]">
              {activePlan?.name ??
                (subscription?.isSubscribed
                  ? "Brixlore member"
                  : "Free access")}
            </h2>
            <p className="relative mt-5 text-sm leading-6 text-black/60">
              {subscription?.isSubscribed
                ? isCancelled
                  ? `Access ends ${date(subscription.currentPeriodEnd)}.`
                  : "Your membership is active and ready for every story."
                : "Choose a membership to unlock the full Brixlore experience."}
            </p>
            <div className="relative mt-8 flex items-end justify-between border-t border-black/15 pt-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">
                  Next renewal
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {subscription?.isSubscribed
                    ? date(subscription.currentPeriodEnd)
                    : "—"}
                </p>
              </div>
              <ShieldCheck size={25} />
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-[1550px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
        <section id="plans" className="scroll-mt-20">
          <div className="flex flex-wrap items-end justify-between gap-5 border-b border-white/15 pb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                Choose your level
              </p>
              <h2 className="mt-3 text-4xl font-semibold leading-none tracking-[-0.065em] sm:text-5xl">
                Make every screen yours.
              </h2>
            </div>
            <div className="flex border border-white/20 p-1">
              <button
                type="button"
                onClick={() => setCycle("monthly")}
                className={`px-4 py-2 text-xs font-bold transition ${cycle === "monthly" ? "bg-white text-black" : "text-white/55"}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setCycle("yearly")}
                className={`px-4 py-2 text-xs font-bold transition ${cycle === "yearly" ? "bg-white text-black" : "text-white/55"}`}
              >
                Yearly
              </button>
            </div>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <SubscriptionCards
              plans={plans.map((plan) => ({
                id: plan.id,
                name: plan.name,
                description: "A front-row pass to every Brixlore story.",
                price: (cycle === "yearly" && plan.yearlyPrice != null ? plan.yearlyPrice : plan.price).toFixed(2),
                period: cycle === "yearly" ? "year" : "month",
                isFreeTier: plan.price <= 0,
                features: [
                  ...(plan.perks ?? []).slice(0, 5),
                  `Up to ${plan.deviceLimit} devices`,
                  ...(plan.offlineAllowed ? ["Offline downloads included"] : []),
                ],
                featured: plan.isPopular,
                billingNote: cycle === "yearly" ? "Billed annually" : "Billed monthly · cancel anytime",
              }))}
              billingCycle={cycle}
              renderFooter={(plan) => (
                <PlanActionButtons
                  planId={plan.id}
                  planName={plan.name}
                  isFreeTier={plan.isFreeTier}
                  featured={plan.featured}
                  billingCycle={cycle}
                  userSubscription={subscription}
                  onRefreshSub={() => void refreshSubscription()}
                />
              )}
            />
          </div>
        </section>
        <section className="mt-16 grid gap-px border border-white/15 bg-white/15 lg:grid-cols-[1.1fr_.9fr]">
          <div className="bg-[#0b0b0b] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  Billing control
                </p>
                <h2 className="mt-4 text-3xl font-semibold leading-none tracking-[-0.055em]">
                  Your payment, your terms.
                </h2>
              </div>
              <CreditCard size={24} className="text-white/50" />
            </div>
            <div className="mt-8 border-y border-white/15 py-5">
              {payment ? (
                <>
                  <p className="text-sm font-semibold">
                    {payment.brand
                      ? `${payment.brand.charAt(0).toUpperCase() + payment.brand.slice(1)} ending in ${payment.last4}`
                      : `Card ending in ${payment.last4}`}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    Expires {String(payment.expMonth).padStart(2, "0")}/
                    {String(payment.expYear).slice(-2)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">
                    No payment method on file
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    Add or update your card securely through the billing portal.
                  </p>
                </>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openPortal}
                disabled={billingLoading}
              >
                <RainbowButton>
                  {billingLoading ? "Opening..." : "Open billing portal"}
                </RainbowButton>
              </button>
              {subscription?.isSubscribed && !isCancelled && (
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  className="px-3 "
                >
                  <RainbowButton>Cancel membership</RainbowButton>
                </button>
              )}
            </div>
            {billingError && (
              <p className="mt-4 text-sm text-red-300" role="alert">
                {billingError}
              </p>
            )}
          </div>
          <div className="bg-white p-6 text-black sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">
              Need a human?
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-none tracking-[-0.055em]">
              We’re here for every question.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-black/60">
              Billing questions, plan changes, and account help—our team can
              take care of it.
            </p>
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              className="mt-8 inline-flex items-center gap-2 border-b border-black pb-2 text-sm font-bold"
            >
              Contact support <Headphones size={16} />
            </button>
            <div className="mt-9 border-t border-black/15 pt-5">
              <p className="text-xs text-black/55">Recent invoices</p>
              {billing?.invoices?.length ? (
                billing.invoices.slice(0, 2).map((invoice) => (
                  <a
                    key={invoice.id}
                    href={
                      invoice.hostedInvoiceUrl ||
                      invoice.invoicePdf ||
                      undefined
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center justify-between text-sm font-semibold hover:text-black/60"
                  >
                    <span>
                      {invoice.status === "paid" ? "Paid" : "Due"}{" "}
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: (invoice.currency || "usd").toUpperCase(),
                      }).format(
                        (invoice.status === "paid"
                          ? invoice.amountPaid
                          : invoice.amountDue) / 100,
                      )}
                    </span>
                    <ArrowRight size={15} />
                  </a>
                ))
              ) : (
                <p className="mt-2 text-sm text-black/55">
                  Invoices appear here after your first payment.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
      <Modal
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
        title="Contact support"
      >
        <form onSubmit={submitSupport}>
          <ModalContent className="space-y-4">
            {supportError && (
              <p className="text-sm text-red-400">{supportError}</p>
            )}
            {supportSuccess && (
              <p className="text-sm text-emerald-300">{supportSuccess}</p>
            )}
            <Input
              label="Name"
              value={supportName}
              onChange={(event) => setSupportName(event.target.value)}
              disabled={supportLoading}
            />
            <Input
              label="Email"
              type="email"
              value={supportEmail}
              onChange={(event) => setSupportEmail(event.target.value)}
              disabled={supportLoading}
            />
            <Input
              label="Subject"
              value={supportSubject}
              onChange={(event) => setSupportSubject(event.target.value)}
              disabled={supportLoading}
            />
            <textarea
              value={supportMessage}
              onChange={(event) => setSupportMessage(event.target.value)}
              disabled={supportLoading}
              placeholder="How can we help?"
              className="min-h-[120px] w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none focus:border-white/50"
            />
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
              {supportLoading ? "Sending..." : "Send request"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
      <Modal
        isOpen={cancelOpen}
        onClose={() => {
          if (!canceling) setCancelOpen(false);
        }}
        title="Cancel membership"
      >
        <ModalContent>
          <p className="text-neutral-300">
            You’ll keep your membership benefits until{" "}
            <strong className="text-white">
              {date(subscription?.currentPeriodEnd)}
            </strong>
            .
          </p>
          {cancelError && (
            <p className="mt-4 text-sm text-red-400">{cancelError}</p>
          )}
        </ModalContent>
        <ModalFooter>
          <Button
            variant="outline"
            disabled={canceling}
            onClick={() => setCancelOpen(false)}
          >
            Keep membership
          </Button>
          <Button
            disabled={canceling}
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={cancelSubscription}
          >
            {canceling ? "Canceling..." : "Cancel membership"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
