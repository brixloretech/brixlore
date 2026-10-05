"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, UserRound, Video, X } from "lucide-react";
import { HLSVideoPlayerLazy } from "@/components/player";
import { MagicCard } from "@/components/ui/magic-card";
import { useAuth } from "@/contexts";
import { ApiError } from "@/lib/api-client";
import {
  contentService,
  previewService,
  streamingService,
  subscriptionService,
} from "@/lib/services";
import { generateDeviceIdentifier } from "@/lib/device-utils";
import type {
  ContentDetailDto,
  PlaybackType,
  PublicPlanDto,
} from "@/types/api";
import { BorderBeam } from "../ui/border-beam";
import { LOGO_HEIGHT, LOGO_WIDTH } from "@/lib/seo";
import { useBrandLogo } from "@/hooks";
import Image from "next/image";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { authService } from "@/lib/services/auth.service";
import { getApiErrorMessage } from "@/lib/api-client";
import { validateEmail, validatePassword } from "@/lib/validation";

const PROGRESS = "guest-playback-progress-v1";
const MAX_PREVIEWS = 3;
const PREVIEW_SECONDS = 45;

type Tier = "guest" | "free" | "paid";
type PlaybackError = "unauthorized" | "forbidden" | "unavailable";

function savedProgress(id: string) {
  try {
    const value = localStorage.getItem(PROGRESS);
    const data = value ? (JSON.parse(value) as Record<string, number>) : {};
    return data[id] ?? 0;
  } catch {
    return 0;
  }
}

function saveProgress(id: string, seconds: number) {
  try {
    const value = localStorage.getItem(PROGRESS);
    const data = value ? (JSON.parse(value) as Record<string, number>) : {};
    data[id] = seconds;
    localStorage.setItem(PROGRESS, JSON.stringify(data));
  } catch {
    /* optional local progress */
  }
}

function primaryEpisode(
  content: ContentDetailDto,
  requestedEpisodeId?: string | null,
) {
  if (requestedEpisodeId) {
    const requested = content.episodes?.find(
      (episode) => episode.id === requestedEpisodeId,
    );
    if (requested) return requested;
    if (content.trailer?.id === requestedEpisodeId) return content.trailer;
  }
  if (content.seasons?.length && content.episodes?.length) {
    const season = [...content.seasons].sort(
      (a, b) => a.seasonNumber - b.seasonNumber,
    )[0];
    return (
      [...content.episodes]
        .filter((episode) => episode.seasonId === season.id)
        .sort((a, b) => a.episodeNumber - b.episodeNumber)[0] ??
      content.episodes[0]
    );
  }
  return content.episodes?.[0] ?? content.trailer;
}

type PreviewOffer = {
  icon: typeof UserRound;
  label: string;
  price: string;
  description: string;
  action: string;
  planId?: string;
  billingCycle?: "monthly" | "yearly";
  featured?: boolean;
  discountLabel?: string;
};

type PopupDraft = {
  view: "offers" | "login" | "signup" | "checkout" | "success";
  name: string;
  email: string;
  password: string;
  selectedPlan: { id: string; cycle: "monthly" | "yearly" } | null;
  checkoutSecret: string | null;
  verificationNotice: boolean;
  alreadySubscribed: boolean;
  authenticated: boolean;
};

let popupDraft: PopupDraft = {
  view: "offers",
  name: "",
  email: "",
  password: "",
  selectedPlan: null,
  checkoutSecret: null,
  verificationNotice: false,
  alreadySubscribed: false,
  authenticated: false,
};

function PreviewGatePopup({
  contentTitle,
  onClose,
  allowContinuePreview,
  onContinuePreview,
  isAuthenticated,
  onAuthenticated,
  onPurchaseComplete,
}: {
  contentTitle: string;
  onClose: () => void;
  previewCount: number;
  allowContinuePreview: boolean;
  onContinuePreview: () => void;
  isAuthenticated: boolean;
  onAuthenticated: () => Promise<void>;
  onPurchaseComplete: () => void;
}) {
  const logoUrl = useBrandLogo();
  const [view, setView] = useState<
    "offers" | "login" | "signup" | "checkout" | "success"
  >(popupDraft.view);
  const [isClosing, setIsClosing] = useState(false);
  const [name, setName] = useState(popupDraft.name);
  const [email, setEmail] = useState(popupDraft.email);
  const [password, setPassword] = useState(popupDraft.password);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState(popupDraft.verificationNotice);
  const [alreadySubscribed, setAlreadySubscribed] = useState(popupDraft.alreadySubscribed);
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    cycle: "monthly" | "yearly";
  } | null>(popupDraft.selectedPlan);
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(popupDraft.checkoutSecret);
  const [authenticatedInPopup, setAuthenticatedInPopup] = useState(
    isAuthenticated || popupDraft.authenticated,
  );
  const resumedCheckoutRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const ensureStripe = () => {
    if (stripePromise) return stripePromise;
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) return null;
    const promise = loadStripe(key);
    setStripePromise(promise);
    return promise;
  };
  useEffect(() => {
    popupDraft = {
      view, name, email, password, selectedPlan, checkoutSecret,
      verificationNotice, alreadySubscribed, authenticated: authenticatedInPopup,
    };
  }, [view, name, email, password, selectedPlan, checkoutSecret, verificationNotice, alreadySubscribed, authenticatedInPopup]);
  useEffect(() => {
    if (authenticatedInPopup) return;
    void authService.getSession().then((session) => {
      if (!session) return;
      setAuthenticatedInPopup(true);
      if (selectedPlan) setView("checkout");
    }).catch(() => undefined);
  }, [authenticatedInPopup, selectedPlan]);
  useEffect(() => {
    let active = true;
    void subscriptionService
      .getPlans()
      .then((items) => {
        if (active) setPlans(items.filter((plan) => plan.price > 0));
      })
      .catch(() => {
        if (active) setPlans([]);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        setIsClosing(true);
        window.setTimeout(onClose, 220);
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [submitting, onClose]);
  const monthlyPlan =
    plans.find((plan) => Math.abs(plan.price - 9.99) < 0.01) ??
    plans.find((plan) => plan.isPopular) ??
    plans[0];
  const rentalPlan =
    plans.find((plan) => Math.abs(plan.price - 4.99) < 0.01) ?? plans[0];
  const offers: PreviewOffer[] = [
    {
      icon: Video,
      label: "Single Rental Pass",
      price: "$4.99",
      description: "Ad-free access. Cancel anytime.",
      action: "Choose plan",
      planId: rentalPlan?.id,
      billingCycle: "monthly",
    },
    {
      icon: Video,
      label: "Monthly pass",
      price: "$9.99/mo",
      description:
        "Unlimited streaming access to all Brixlore original series, shorts & releases.",
      action: "Subscribe",
      planId: monthlyPlan?.id,
      billingCycle: "monthly",
      featured: false,
    },
    {
      icon: CalendarDays,
      label: "Annual pass",
      price: "$99.99/yr",
      description:
        "Get one full year of unlimited access for the price of 10 months. Save 17%.",
      action: "Join & save",
      planId: monthlyPlan?.yearlyPrice ? monthlyPlan.id : undefined,
      billingCycle: "yearly",
      discountLabel: "Save 17%",
      featured: true,
    },
  ];

  const beginCheckout = async (planId: string, cycle: "monthly" | "yearly") => {
    setSelectedPlan({ id: planId, cycle });
    setFormError(null);
    if (!isAuthenticated && !authenticatedInPopup) {
      setView("signup");
      return;
    }
    try {
      setSubmitting(true);
      const subscription = await subscriptionService.getSubscription(true);
      if (subscription.isSubscribed) {
        setAlreadySubscribed(true);
        setView("success");
        return;
      }
      if (!ensureStripe()) {
        setFormError("Payment configuration is unavailable right now.");
        return;
      }
      const result = await subscriptionService.createEmbeddedCheckoutSession({
        planId,
        billingCycle: cycle === "yearly" ? "YEARLY" : "MONTHLY",
      });
      setCheckoutSecret(result.clientSecret);
      setView("checkout");
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (
      resumedCheckoutRef.current ||
      view !== "checkout" ||
      checkoutSecret ||
      !selectedPlan ||
      (!isAuthenticated && !authenticatedInPopup)
    ) return;
    resumedCheckoutRef.current = true;
    void beginCheckout(selectedPlan.id, selectedPlan.cycle);
  }, [view, checkoutSecret, selectedPlan, isAuthenticated, authenticatedInPopup]);

  const submitAuth = async (
    event: React.FormEvent,
    mode: "login" | "signup",
  ) => {
    event.preventDefault();
    setFormError(null);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if (emailError || passwordError || (mode === "signup" && !name.trim())) {
      setFormError(emailError ?? passwordError ?? "Name is required.");
      return;
    }
    try {
      setSubmitting(true);
      await (mode === "login"
          ? authService.loginInline({ email, password })
          : await authService.registerInline({
              name: name.trim(),
              email,
              password,
            }));
      setAuthenticatedInPopup(true);
      if (mode === "signup") setVerificationNotice(true);
      const subscription = await subscriptionService.getSubscription(true);
      if (subscription.isSubscribed) {
        setAlreadySubscribed(true);
        setView("success");
        return;
      }
      if (selectedPlan) {
        if (!ensureStripe()) {
          setFormError("Payment configuration is unavailable right now.");
          return;
        }
        const checkout =
          await subscriptionService.createEmbeddedCheckoutSession({
            planId: selectedPlan.id,
            billingCycle:
              selectedPlan.cycle === "yearly" ? "YEARLY" : "MONTHLY",
          });
        setCheckoutSecret(checkout.clientSecret);
        setView("checkout");
      } else setView("success");
    } catch (error) {
      const message = getApiErrorMessage(error);
      if (mode === "signup" && /already exists|already registered|email.*taken/i.test(message)) {
        setView("login");
        setFormError("An account already exists for this email. Please sign in.");
        return;
      }
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const finishClose = (action: () => void) => {
    if (isClosing || submitting) return;
    setIsClosing(true);
    window.setTimeout(action, 220);
  };

  const chooseAnotherPlan = () => {
    setCheckoutSecret(null);
    setSelectedPlan(null);
    setFormError(null);
    setView("offers");
  };

  const clearDraft = () => {
    popupDraft = {
      view: "offers", name: "", email: "", password: "", selectedPlan: null,
      checkoutSecret: null, verificationNotice: false, alreadySubscribed: false,
      authenticated: false,
    };
  };

  return (
    <div
      className={`preview-gate-backdrop fixed inset-0 z-[100] flex items-end bg-[#050505]/80 p-0 backdrop-blur-md sm:items-center sm:justify-center sm:p-6 ${isClosing ? "is-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-gate-title"
    >
      <div
        ref={panelRef}
        className={`preview-gate-panel relative mx-2 max-h-[88dvh] w-full overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0a0a0b] p-5 text-white shadow-[0_25px_90px_rgba(255,255,255,.07)] sm:max-h-[90vh] sm:max-w-5xl sm:rounded-[28px] sm:p-7 ${isClosing ? "is-closing" : ""}`}
      >
        <div className="mx-auto w-full max-w-4xl">
          <button
            type="button"
            onClick={() => finishClose(onClose)}
            aria-label="Close access options"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X size={17} />
          </button>

          <div className="border-b border-white/10 pb-5 flex justify-center flex-col">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="BRIXLORE.TV"
                width={LOGO_WIDTH}
                height={LOGO_HEIGHT}
                className="h-12 w-auto object-contain"
                unoptimized
              />
            ) : (
              <Image
                src="/logo-2.png"
                alt="BRIXLORE.TV"
                width={LOGO_WIDTH}
                height={LOGO_HEIGHT}
                className="h-9 w-auto object-contain"
                priority
              />
            )}
            <h2
              id="preview-gate-title"
              className="mt-5 text-3xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-4xl text-center"
            >
              Continue watching
            </h2>
            <p className="mt-2 text-md leading-5 text-white/65 sm:text-md text-center">
              {view === "signup"
                ? "Create your account to continue."
                : view === "login"
                  ? "Sign in to continue without leaving this page."
                  : view === "checkout"
                    ? "Complete your subscription securely below."
                    : `Choose how you want to keep watching ${contentTitle}.`}
            </p>
          </div>

          {view === "offers" && allowContinuePreview && (
            <button
              type="button"
              onClick={() => finishClose(onContinuePreview)}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Continue preview ({PREVIEW_SECONDS}s)
            </button>
          )}

          {view === "checkout" && checkoutSecret && stripePromise ? (
            <div className="mt-6 space-y-3">
              <button type="button" onClick={chooseAnotherPlan} className="w-full text-sm text-white/65 hover:text-white">
                ← Choose another plan
              </button>
              <div className="rounded-2xl bg-white p-3 text-black">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{
                  clientSecret: checkoutSecret,
                  onComplete: () => setView("success"),
                }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
              </div>
            </div>
          ) : view === "success" ? (
            <div className="mt-8 space-y-4 text-center">
              <p className="text-2xl font-semibold">
                {alreadySubscribed
                  ? "Your subscription is active."
                  : "You’re all set."}
              </p>
              <p className="text-sm text-white/60">
                {alreadySubscribed
                  ? "You already have access, so no additional payment is needed."
                  : "Your access is active. You can close this window and continue watching."}
              </p>
              {alreadySubscribed && (
                <Link
                  href="/dashboard/subscription"
                  onClick={() => {
                    clearDraft();
                    onPurchaseComplete();
                    onClose();
                  }}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/20 bg-white/[0.08] font-semibold text-white hover:bg-white/15"
                >
                  Upgrade your plan
                </Link>
              )}
              {verificationNotice && (
                <p className="text-xs text-white/50">
                  We sent a verification link to {email}. You can verify it
                  anytime.
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  void onAuthenticated().finally(() => {
                    clearDraft();
                    onPurchaseComplete();
                    onClose();
                  });
                }}
                className="h-12 w-full rounded-full bg-white font-semibold text-black"
              >
                Continue watching
              </button>
            </div>
          ) : view === "login" || view === "signup" ? (
            <form
              key={view}
              className="mt-6 space-y-3"
              onSubmit={(event) => void submitAuth(event, view)}
            >
              {view === "signup" && (
                <input
                  required
                  minLength={2}
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Name"
                  aria-label="Name"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/45 focus:bg-white/[0.07]"
                />
              )}
              <input
                required
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                autoFocus={view === "login"}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                aria-label="Email"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/45 focus:bg-white/[0.07]"
              />
              <input
                required
                minLength={8}
                type="password"
                name="password"
                autoComplete={
                  view === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password (8+ characters)"
                aria-label="Password"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/45 focus:bg-white/[0.07]"
              />
              {formError && (
                <p role="alert" className="text-xs text-red-300">
                  {formError}
                </p>
              )}
              <button
                disabled={submitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black disabled:opacity-60"
              >
                {submitting
                  ? "Please wait…"
                  : view === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  const nextView = view === "login" ? "signup" : "login";
                  if (nextView === "login") setName("");
                  setView(nextView);
                }}
                className="w-full text-xs text-white/50 hover:text-white"
              >
                {view === "login"
                  ? "New here? Create account"
                  : "Already have an account? Sign in"}
              </button>
            </form>
          ) : (
            <div className="mt-6 space-y-3 sm:grid sm:grid-cols-3 sm:items-stretch sm:gap-4 sm:space-y-0">
              {offers.map((offer) => {
                return (
                  <MagicCard
                    key={offer.label}
                    gradientSize={260}
                    gradientColor={offer.featured ? "#303030" : "#222222"}
                    gradientOpacity={0.72}
                    gradientFrom={offer.featured ? "#ffffff" : "#737373"}
                    gradientTo={offer.featured ? "#7b8498" : "#262626"}
                    className={`h-full rounded-[28px] bg-[#0a0a0b] ${offer.featured ? "shadow-[0_25px_90px_rgba(255,255,255,.07)]" : ""}`}
                  >
                    <div className="relative flex h-full flex-col p-6 sm:p-5 border border-white/10 rounded-[28px]">
                      {offer.featured && (
                        <BorderBeam
                          colorFrom="#ffffff"
                          colorTo="#9ca3af"
                          duration={6}
                          delay={3}
                          size={400}
                          borderWidth={2}
                          className="from-transparent #9ca3af to-transparent"
                        />
                      )}
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <p className="text-lg font-bold uppercase tracking-[0.1em] text-white/85">
                              {offer.label}
                            </p>
                            {offer.discountLabel && (
                              <p className="text-sm bg-red-600 font-medium text-white rounded-md px-2 py-1">
                                {offer.discountLabel}
                              </p>
                            )}
                          </div>
                          <div className="flex justify-between items-center gap-4 mt-4 md:flex-col md:items-start md:gap-1">
                            <p className="text-3xl font-semibold text-white m-0">
                              {offer.price}
                            </p>
                            <p className="text-sm leading-5 text-white/42">
                              {offer.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!offer.planId || submitting}
                        onClick={() =>
                          offer.planId &&
                          offer.billingCycle &&
                          void beginCheckout(offer.planId, offer.billingCycle)
                        }
                        className={`mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${offer.featured ? "border-white bg-white text-black hover:bg-white/82" : "border-white/18 bg-white/[0.06] text-white hover:bg-white hover:text-black"}`}
                      >
                        {submitting &&
                        selectedPlan?.id === offer.planId &&
                        selectedPlan?.cycle === offer.billingCycle ? (
                          <>
                            <span
                              aria-hidden="true"
                              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                            />
                            Checkout…
                          </>
                        ) : (
                          offer.action
                        )}
                      </button>
                    </div>
                  </MagicCard>
                );
              })}
            </div>
          )}

          <p className="mt-4 text-center text-[10px] text-white/35">
            Secure access · Your playback position will be kept
          </p>
        </div>
      </div>
    </div>
  );
}

export function VideoPlayer({
  contentId,
  episodeId,
}: {
  contentId: string;
  episodeId?: string | null;
}) {
  const {
    isAuthenticated,
    isSubscribed,
    isAdmin,
    isLoading: authLoading,
    refreshUser,
  } = useAuth();
  const tier: Tier = !isAuthenticated
    ? "guest"
    : isSubscribed || isAdmin
      ? "paid"
      : "free";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [content, setContent] = useState<ContentDetailDto | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [type, setType] = useState<PlaybackType>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PlaybackError | null>(null);
  const [limited, setLimited] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [previewCount, setPreviewCount] = useState(0);
  const [start, setStart] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [episodeTitle, setEpisodeTitle] = useState<string | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const [, setFreeRemaining] = useState(0);
  const [freeCatalog, setFreeCatalog] = useState(false);
  const currentTimeRef = useRef(0);
  const resumePlaybackRef = useRef(false);
  const freeLastPositionRef = useRef<number | null>(null);
  const freePendingSecondsRef = useRef(0);
  const freeReportingRef = useRef(false);
  const freeRemainingRef = useRef(0);
  const pauseHlsRef = useRef<(() => void) | null>(null);
  const limitedRef = useRef(false);

  const deviceFingerprint = useRef(
    typeof window === "undefined"
      ? "unknown-device"
      : generateDeviceIdentifier(),
  );

  async function beginGuestPreview(episodeId: string): Promise<boolean> {
    const preview = await previewService.startGuestPreview(
      episodeId,
      deviceFingerprint.current,
    );
    setPreviewCount(preview.previewsUsed);
    if (!preview.allowed || !preview.sessionId) {
      setLimited(true);
      setPopupOpen(true);
      return false;
    }
    setPreviewSessionId(preview.sessionId);
    if (preview.url) {
      setUrl(preview.url);
      setType(preview.type);
    }
    return true;
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setUrl(null);
    setType(undefined);
    setError(null);
    setLimited(false);
    setPopupOpen(false);
    setPreviewCount(0);
    setPreviewSessionId(null);
    setActiveEpisodeId(null);
    setStartedAt(null);
    setFreeRemaining(0);
    setFreeCatalog(false);
    currentTimeRef.current = 0;
    freeLastPositionRef.current = null;
    freePendingSecondsRef.current = 0;
    freeReportingRef.current = false;
    freeRemainingRef.current = 0;
    resumePlaybackRef.current = false;
    async function load() {
      try {
        const result = await contentService.getContentById(contentId);
        if (!active || !result?.content) return;
        let detail = result.content;
        if (
          !detail.episodes?.length ||
          (episodeId && !detail.episodes.some((item) => item.id === episodeId))
        ) {
          const episodes = await contentService.getEpisodes(detail.id);
          if (!active) return;
          if (episodes?.length) detail = { ...detail, episodes };
        }
        setContent(detail);
        const episode = primaryEpisode(detail, episodeId);
        if (!episode) return;
        setActiveEpisodeId(episode.id);
        setEpisodeTitle(episode.title);
        // All non-paid playback is preview-gated, including trailers. A
        // trailer must not provide a way around an exhausted guest allowance.
        if (tier !== "paid") {
          if (tier === "guest") {
            const allowed = await beginGuestPreview(episode.id);
            if (!active || !allowed) return;
            setStart(savedProgress(episode.id));
            return;
          } else {
            const freePreview = await previewService.startFreePreview(
              episode.id,
            );
            if (!active) return;
            setFreeRemaining(freePreview.remainingSeconds);
            freeRemainingRef.current = freePreview.remainingSeconds;
            setFreeCatalog(freePreview.freeCatalog);
            if (!freePreview.allowed) {
              setLimited(true);
              setPopupOpen(true);
              return;
            }
            if (freePreview.streamKey) {
              setUrl(freePreview.streamKey);
              setType(freePreview.type ?? "hls");
            }
            setStart(savedProgress(episode.id));
            return;
          }
        }
        const playback = await streamingService.getPlaybackInfo(
          episode.id,
          undefined,
          { asGuest: tier !== "paid" },
        );
        if (!active) return;
        if (!playback?.url) {
          setError("unavailable");
          return;
        }
        setUrl(playback.url);
        setType(playback.type);
        setStart(playback.progress ?? savedProgress(episode.id));
      } catch (value) {
        if (!active) return;
        setError(
          value instanceof ApiError && value.status === 401
            ? "unauthorized"
            : value instanceof ApiError && value.status === 403
              ? "forbidden"
              : "unavailable",
        );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [contentId, episodeId, tier]);

  useEffect(() => {
    if (!popupOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [popupOpen]);

  useEffect(() => {
    limitedRef.current = limited;
  }, [limited]);

  function reportFreeConsumption() {
    if (freeReportingRef.current || freePendingSecondsRef.current <= 0) return;
    const seconds = Math.min(
      freePendingSecondsRef.current,
      freeRemainingRef.current,
    );
    if (seconds <= 0) return;
    freePendingSecondsRef.current -= seconds;
    freeReportingRef.current = true;
    void previewService
      .consumeFreePreview(seconds)
      .then((result) => {
        freeRemainingRef.current = result.remainingSeconds;
        setFreeRemaining(result.remainingSeconds);
        if (result.remainingSeconds > 0 || limitedRef.current) return;
        videoRef.current?.pause();
        pauseHlsRef.current?.();
        setLimited(true);
        setPopupOpen(true);
      })
      .catch(() => {
        // Keep the local gate conservative if the allowance cannot be updated.
        freePendingSecondsRef.current += seconds;
      })
      .finally(() => {
        freeReportingRef.current = false;
      });
  }

  useEffect(() => {
    if (tier !== "free" || freeCatalog || limited) return;
    const interval = window.setInterval(reportFreeConsumption, 10_000);
    return () => {
      window.clearInterval(interval);
      reportFreeConsumption();
    };
  }, [tier, freeCatalog, limited]);

  useEffect(() => {
    if (!resumePlaybackRef.current || limited || !url || type !== "mp4") return;
    const video = videoRef.current;
    if (!video) return;
    resumePlaybackRef.current = false;
    void video.play().catch(() => undefined);
  }, [limited, type, url]);

  function onTimeUpdate(seconds: number) {
    currentTimeRef.current = seconds;
    if (!content || content.type === "TRAILER") return;
    if (tier === "free" && !freeCatalog) {
      if (freeLastPositionRef.current === null)
        freeLastPositionRef.current = seconds;
      const elapsed = Math.max(
        0,
        Math.min(15, seconds - (freeLastPositionRef.current ?? seconds)),
      );
      freeLastPositionRef.current = seconds;
      freePendingSecondsRef.current += elapsed;
      if (freePendingSecondsRef.current >= 10) reportFreeConsumption();
      if (freeRemainingRef.current <= 0 && !limited) {
        videoRef.current?.pause();
        pauseHlsRef.current?.();
        setLimited(true);
        setPopupOpen(true);
      }
      return;
    }
    if (tier !== "guest") return;
    saveProgress(content.id, Math.floor(seconds));
    if (startedAt === null && seconds > 0) setStartedAt(seconds);
    if (
      startedAt !== null &&
      seconds - startedAt >= PREVIEW_SECONDS &&
      !limited
    ) {
      videoRef.current?.pause();
      pauseHlsRef.current?.();
      if (previewSessionId) {
        void previewService.completeGuestPreview(
          previewSessionId,
          PREVIEW_SECONDS,
          deviceFingerprint.current,
        );
      }
      setLimited(true);
      setPopupOpen(true);
    }
  }

  if (authLoading || loading)
    return (
      <div className="aspect-video w-full animate-pulse rounded-t-[10px] bg-white/10 md:rounded-[10px]" />
    );
  if (error)
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-[10px] bg-black px-5 text-center text-white">
        <p className="text-lg font-semibold">
          {error === "unauthorized"
            ? "Sign in to watch"
            : error === "forbidden"
              ? "Active subscription required"
              : "Playback not available"}
        </p>
        <p className="text-sm text-white/60">
          {error === "unauthorized"
            ? "You need to sign in to stream this video."
            : error === "forbidden"
              ? "An active subscription is required to watch this video."
              : "This video cannot be played right now."}
        </p>
        {error !== "unavailable" && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setLimited(true);
              setPopupOpen(true);
            }}
            className="rounded-[5px] bg-white px-4 py-2 text-sm font-semibold text-black"
          >
            {error === "unauthorized" ? "Sign in" : "View plans"}
          </button>
        )}
      </div>
    );
  return (
    <div className="w-full space-y-3">
      <div className="aspect-video w-full overflow-hidden rounded-[10px] md:rounded-[10px]">
        {limited ? (
          <div className="relative h-full w-full overflow-hidden bg-black">
            {content?.thumbnailUrl && (
              <div
                aria-hidden="true"
                className="absolute inset-[-16px] scale-110 bg-cover bg-center blur-xl"
                style={{ backgroundImage: `url(${content.thumbnailUrl})` }}
              />
            )}
            <div className="absolute inset-0 bg-black/65" />
            <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-sm font-medium text-white/80">
              <p>Preview access is required to continue watching</p>
              {!popupOpen && (
                <button
                  type="button"
                  onClick={() => setPopupOpen(true)}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {tier === "guest" && previewCount < MAX_PREVIEWS
                    ? "Continue watching"
                    : "View access options"}
                </button>
              )}
            </div>
          </div>
        ) : url ? (
          type === "mp4" ? (
            <video
              ref={videoRef}
              src={url}
              controls
              playsInline
              preload="auto"
              className="h-full w-full"
              poster={content?.thumbnailUrl ?? undefined}
              onLoadedMetadata={(event) => {
                event.currentTarget.currentTime = start;
              }}
              onTimeUpdate={(event) =>
                onTimeUpdate(event.currentTarget.currentTime)
              }
              onPlay={(event) => {
                if (!limitedRef.current) return;
                event.currentTarget.pause();
                setPopupOpen(true);
              }}
            />
          ) : (
            <HLSVideoPlayerLazy
              src={url}
              type={type}
              title={episodeTitle ?? content?.title ?? "Video"}
              className="vjs-theme-stream"
              startTime={start}
              onTimeUpdate={onTimeUpdate}
              onReady={(player) => {
                if (!player) return;
                pauseHlsRef.current = () => player.pause();
                if (resumePlaybackRef.current) {
                  resumePlaybackRef.current = false;
                  void Promise.resolve(player.play()).catch(() => undefined);
                }
                player.on("play", () => {
                  if (!limitedRef.current) return;
                  player.pause();
                  setPopupOpen(true);
                });
              }}
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black text-center text-white/60">
            {limited ? "Preview ended" : "Video unavailable"}
          </div>
        )}
      </div>
      {limited && popupOpen && (
        <PreviewGatePopup
          contentTitle={content?.title ?? "this story"}
          previewCount={previewCount}
          allowContinuePreview={tier === "guest" && previewCount < MAX_PREVIEWS}
          onContinuePreview={() => {
            if (!activeEpisodeId) return;
            void beginGuestPreview(activeEpisodeId)
              .then((allowed) => {
                if (!allowed) return;
                // Keep the handoff position when the limited player is replaced.
                setStart(Math.floor(currentTimeRef.current));
                setStartedAt(currentTimeRef.current);
                setLimited(false);
                setPopupOpen(false);
                resumePlaybackRef.current = true;
              })
              .catch(() => {
                setLimited(true);
                setPopupOpen(true);
              });
          }}
          isAuthenticated={isAuthenticated}
          onAuthenticated={refreshUser}
          onPurchaseComplete={() => setLimited(false)}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </div>
  );
}
