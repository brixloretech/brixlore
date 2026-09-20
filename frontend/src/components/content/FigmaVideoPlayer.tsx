"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, UserRound, Video, X } from "lucide-react";
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
  ContentSummaryDto,
  PlaybackType,
  PublicPlanDto,
} from "@/types/api";

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
  href?: string;
  planId?: string;
  billingCycle?: "monthly" | "yearly";
  featured?: boolean;
};

function PreviewGatePopup({
  contentTitle,
  returnUrl,
  onClose,
  previewCount,
  allowContinuePreview,
  onContinuePreview,
  showFreeCatalog,
  isAuthenticated,
  onJoinFree,
  freeCatalogItems,
}: {
  contentTitle: string;
  returnUrl: string;
  onClose: () => void;
  previewCount: number;
  allowContinuePreview: boolean;
  onContinuePreview: () => void;
  showFreeCatalog: boolean;
  isAuthenticated: boolean;
  onJoinFree: (details: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  freeCatalogItems: ContentSummaryDto[];
}) {
  const [view, setView] = useState<"offers" | "signup">("offers");
  const [isClosing, setIsClosing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
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
  const paidPlan = plans.find((plan) => plan.isPopular) ?? plans[0];
  const finishClose = (action: () => void) => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(action, 220);
  };
  const offers: PreviewOffer[] = [
    {
      icon: UserRound,
      label: "Free pass",
      price: "$0.00",
      description: "Unlock previews and weekly updates on Brixlore.",
      action: "Join free",
      href: `/signup?returnUrl=${encodeURIComponent(returnUrl)}`,
    },
    {
      icon: Video,
      label: "Monthly pass",
      price: paidPlan ? `$${paidPlan.price.toFixed(2)}/mo` : "View plans",
      description: "Unlimited access to every deep-dive and master file.",
      action: "Subscribe",
      href: `/subscription?returnUrl=${encodeURIComponent(returnUrl)}`,
      planId: paidPlan?.id,
      billingCycle: "monthly",
      featured: true,
    },
    {
      icon: CalendarDays,
      label: "Annual pass",
      price: paidPlan?.yearlyPrice
        ? `$${paidPlan.yearlyPrice.toFixed(2)}/yr`
        : "View plans",
      description: "One full year of unlimited access. Save 17%.",
      action: "Join & save",
      href: `/subscription?cycle=yearly&returnUrl=${encodeURIComponent(returnUrl)}`,
      planId: paidPlan?.yearlyPrice ? paidPlan.id : undefined,
      billingCycle: "yearly",
    },
  ];

  return (
    <div
      className={`preview-gate-backdrop fixed inset-0 z-[100] flex items-end bg-[#050505]/80 p-0 backdrop-blur-md sm:items-center sm:justify-center sm:p-6 ${isClosing ? "is-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-gate-title"
    >
      <div
        className={`preview-gate-panel relative mx-2 max-h-[88dvh] w-full overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0a0a0b] p-5 text-white shadow-[0_25px_90px_rgba(255,255,255,.07)] sm:max-h-[90vh] sm:max-w-5xl sm:rounded-[28px] sm:p-7 ${isClosing ? "is-closing" : ""}`}
      >
        <div className="mx-auto w-full max-w-4xl">
          {allowContinuePreview && (
            <button
              type="button"
              onClick={() => finishClose(onClose)}
              aria-label="Close access options"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <X size={17} />
            </button>
          )}

          <div className="border-b border-white/10 pb-5 pr-8">
            <h2
              id="preview-gate-title"
              className="mt-5 text-3xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-4xl"
            >
              Continue watching
            </h2>
            <p className="mt-2 text-xs leading-5 text-white/65 sm:text-sm">
              {view === "signup"
                ? "Create your free Brixlore account to keep exploring."
                : `Choose how you want to keep watching ${contentTitle}.`}
            </p>
            <p className="mt-5 inline-flex rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/42">
              Preview {Math.min(previewCount, MAX_PREVIEWS)} of {MAX_PREVIEWS}
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

          {view === "signup" ? (
            <form
              className="mt-6 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                setSignupError(null);
                setSubmitting(true);
                void onJoinFree({ name, email, password })
                  .catch((error: unknown) =>
                    setSignupError(
                      error instanceof Error
                        ? error.message
                        : "Unable to create your free account.",
                    ),
                  )
                  .finally(() => setSubmitting(false));
              }}
            >
              <input
                required
                minLength={2}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/45 focus:bg-white/[0.07]"
              />
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/45 focus:bg-white/[0.07]"
              />
              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password (8+ characters)"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/45 focus:bg-white/[0.07]"
              />
              {signupError && (
                <p className="text-xs text-red-300">{signupError}</p>
              )}
              <button
                disabled={submitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black disabled:opacity-60"
              >
                {submitting ? "Creating account…" : "Create free account"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setView("offers")}
                className="w-full text-xs text-white/50 hover:text-white"
              >
                Back to access options
              </button>
            </form>
          ) : (
            <div className="mt-6 space-y-3 sm:grid sm:grid-cols-3 sm:items-stretch sm:gap-4 sm:space-y-0">
              {offers.map((offer) => {
                const Icon = offer.icon;
                return (
                  <MagicCard
                    key={offer.label}
                    gradientSize={260}
                    gradientColor={offer.featured ? "#303030" : "#222222"}
                    gradientOpacity={0.72}
                    gradientFrom={offer.featured ? "#ffffff" : "#737373"}
                    gradientTo={offer.featured ? "#7b8498" : "#262626"}
                    className={`h-full min-h-[250px] rounded-[28px] bg-[#0a0a0b] ${offer.featured ? "shadow-[0_25px_90px_rgba(255,255,255,.07)]" : ""}`}
                  >
                    <div className="flex h-full min-h-[248px] flex-col p-4 sm:p-5 border border-white/10 rounded-[28px]">
                      <div className="mt-6 flex items-start gap-3">
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-black/25 text-white/70">
                          <Icon size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-white/85">
                              {offer.label}
                            </p>
                            <p className="text-xl font-semibold tracking-[-0.05em] text-white">
                              {offer.price}
                            </p>
                          </div>
                          <p className="mt-2 text-[11px] leading-5 text-white/42">
                            {offer.description}
                          </p>
                        </div>
                      </div>
                      {offer.label === "Free pass" && !isAuthenticated ? (
                        <button
                          type="button"
                          onClick={() => setView("signup")}
                          className={`mt-auto inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                            offer.featured
                              ? "border-white bg-white text-black hover:bg-white/82"
                              : "border-white/18 bg-white/[0.06] text-white hover:bg-white hover:text-black"
                          }`}
                        >
                          {offer.action}
                          <Check size={13} />
                        </button>
                      ) : offer.label === "Free pass" ? (
                        <span className="mt-auto inline-flex h-12 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-semibold text-neutral-400">
                          Free account active
                        </span>
                      ) : (
                        <Link
                          href={
                            isAuthenticated &&
                            offer.planId &&
                            offer.billingCycle
                              ? `/subscription/payment-details?plan=${encodeURIComponent(offer.planId)}&autostart=1&billingCycle=${offer.billingCycle}&returnUrl=${encodeURIComponent(returnUrl)}`
                              : (offer.href ?? "/subscription")
                          }
                          className={`mt-auto inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${offer.featured ? "border-white bg-white text-black hover:bg-white/82" : "border-white/18 bg-white/[0.06] text-white hover:bg-white hover:text-black"}`}
                        >
                          {offer.action}
                          <Check size={13} />
                        </Link>
                      )}
                    </div>
                  </MagicCard>
                );
              })}
            </div>
          )}

          {showFreeCatalog && freeCatalogItems.length > 0 && (
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                Explore free stories
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {freeCatalogItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/watch-2/${item.id}`}
                    className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] text-xs text-white/80 hover:bg-white/10"
                  >
                    {item.thumbnailUrl && (
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="aspect-video w-full object-cover"
                      />
                    )}
                    <span className="block truncate p-2">{item.title}</span>
                  </Link>
                ))}
              </div>
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

export function FigmaVideoPlayer({
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
  const [freeCatalogItems, setFreeCatalogItems] = useState<ContentSummaryDto[]>(
    [],
  );
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
        if (tier !== "paid" && detail.type !== "TRAILER") {
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
    if (
      !popupOpen ||
      !(previewCount >= MAX_PREVIEWS || (tier === "free" && limited))
    )
      return;
    void contentService
      .getContent({ limit: 4 }, undefined, true)
      .then((result) => setFreeCatalogItems(result.items))
      .catch(() => setFreeCatalogItems([]));
  }, [popupOpen, previewCount, tier, limited]);

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
          <Link
            href={
              error === "unauthorized"
                ? `/login?returnUrl=${encodeURIComponent(`/watch-2/${contentId}`)}`
                : "/subscription"
            }
            className="rounded-[5px] bg-white px-4 py-2 text-sm font-semibold text-black"
          >
            {error === "unauthorized" ? "Sign in" : "View plans"}
          </Link>
        )}
      </div>
    );
  const returnUrl = `/watch-2/${contentId}${episodeId ? `?episodeId=${encodeURIComponent(episodeId)}` : ""}`;
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
          returnUrl={returnUrl}
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
          onJoinFree={async (details) => {
            await previewService.signUp(details);
            await refreshUser();
            setLimited(false);
            setPopupOpen(false);
          }}
          freeCatalogItems={freeCatalogItems}
          showFreeCatalog={
            previewCount >= MAX_PREVIEWS || (tier === "free" && limited)
          }
          onClose={() => setPopupOpen(false)}
        />
      )}
    </div>
  );
}
