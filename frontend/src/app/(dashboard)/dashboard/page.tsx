"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Play,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { useAuth, useMyList } from "@/contexts";
import { Loader } from "@/components/ui";
import {
  contentService,
  streamingService,
  subscriptionService,
} from "@/lib/services";
import type {
  ContentSummaryDto,
  ContinueWatchingItemDto,
  PublicPlanDto,
} from "@/types/api";
import { RainbowButton } from "@/components/ui/rainbow-button";

function progressPercent(progress: number, duration: number) {
  return duration > 0
    ? Math.min(100, Math.max(0, Math.round((progress / duration) * 100)))
    : 0;
}

function RailTitle({
  index,
  title,
  href,
}: {
  index: string;
  title: string;
  href: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between border-b border-white/15 pb-4">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-xs tracking-[0.2em] text-white/35">
          {index}
        </span>
        <h2 className="text-2xl font-semibold leading-none tracking-[-0.055em] sm:text-3xl">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="group inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55 transition hover:text-white"
      >
        See all{" "}
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 transition group-hover:border-white group-hover:bg-white group-hover:text-black">
          <ArrowUpRight size={13} />
        </span>
      </Link>
    </div>
  );
}

function Poster({ item, number }: { item: ContentSummaryDto; number: number }) {
  const image = item.posterUrl || item.thumbnailUrl;
  return (
    <article className="group relative min-w-[152px] sm:min-w-[185px] lg:min-w-[205px]">
      <span className="pointer-events-none absolute -left-2 bottom-0 z-20 select-none text-7xl font-semibold leading-none tracking-[-0.1em] text-white mix-blend-difference sm:text-8xl">
        {String(number).padStart(2, "0")}
      </span>
      <Link
        href={`/watch/${item.id}`}
        className="relative ml-7 block h-[225px] overflow-hidden rounded-[4px] bg-white/10 sm:h-[275px] lg:h-[305px]"
      >
        {image ? (
          <img
            src={image}
            alt={item.title}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(145deg,#3b3b3b,#0a0a0a)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute right-4 bottom-4 flex h-10 w-10 translate-y-3 items-center justify-center rounded-full bg-white text-black opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Play size={16} fill="currentColor" />
        </span>
      </Link>
      <h3 className="ml-7 mt-3 truncate text-sm font-semibold tracking-[-0.02em] text-white">
        {item.title}
      </h3>
      <p className="ml-7 mt-1 text-xs text-white/40">
        {item.releaseYear} <span className="mx-1">/</span>{" "}
        {item.category || item.type}
      </p>
    </article>
  );
}

function ContinueWatchingCard({ item }: { item: ContinueWatchingItemDto }) {
  const percent = progressPercent(item.progress, item.duration);
  return (
    <article className="group min-w-[280px] sm:min-w-[350px]">
      <Link
        href={`/watch/${item.contentId}?episodeId=${encodeURIComponent(item.episodeId)}`}
        className="relative block aspect-[16/9] overflow-hidden rounded-[4px] bg-white/10"
      >
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.contentTitle}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(135deg,#333,#0d0d0d)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute left-4 bottom-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-black">
          <Play size={16} fill="currentColor" />
        </span>
        <span className="absolute right-4 top-4 rounded-full border border-white/25 bg-black/45 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
          {percent}% complete
        </span>
      </Link>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">
            {item.contentTitle}
          </h3>
          <p className="mt-1 truncate text-xs text-white/45">
            {item.episodeTitle !== item.contentTitle
              ? item.episodeTitle
              : item.type}
          </p>
        </div>
        <span className="font-mono text-[10px] text-white/35">RESUME</span>
      </div>
      <div className="mt-3 h-px bg-white/15">
        <div className="h-px bg-white" style={{ width: `${percent}%` }} />
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const { user, isSubscribed, setSubscribed } = useAuth();
  const { listIds } = useMyList();
  const [contentItems, setContentItems] = useState<ContentSummaryDto[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [continueItems, setContinueItems] = useState<ContinueWatchingItemDto[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "there";

  useEffect(() => {
    let active = true;
    void Promise.all([
      contentService.getContentForBrowse(),
      contentService.getCategories(),
      subscriptionService.getPlans(),
      subscriptionService.getSubscription(true),
      streamingService.getContinueWatching(),
    ])
      .then(([items, categoryList, planList, subscription, continueList]) => {
        if (!active) return;
        setContentItems(items);
        setCategories(categoryList);
        setPlans(planList);
        setPlanId(subscription.planId ?? null);
        setSubscribed(subscription.isSubscribed);
        setContinueItems(Array.isArray(continueList) ? continueList : []);
      })
      .catch(() => {
        if (active) {
          setContentItems([]);
          setCategories([]);
          setPlans([]);
          setPlanId(null);
          setContinueItems([]);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [setSubscribed]);

  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === planId) ?? null,
    [plans, planId],
  );
  const saved = useMemo(
    () => contentItems.filter((item) => listIds.includes(item.id)),
    [contentItems, listIds],
  );
  const moods = useMemo(
    () =>
      categories
        .filter((category) => category.toLowerCase() !== "all")
        .slice(0, 6),
    [categories],
  );
  const heroSlides = useMemo(
    () =>
      contentItems
        .filter((item) => item.bannerUrl || item.thumbnailUrl || item.posterUrl)
        .slice(0, 8),
    [contentItems],
  );
  const feature = heroSlides[activeFeatureIndex] ?? contentItems[0];

  useEffect(() => {
    setActiveFeatureIndex(0);
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length < 2) return;
    const interval = window.setInterval(() => {
      setActiveFeatureIndex((current) => (current + 1) % heroSlides.length);
    }, 2000);
    return () => window.clearInterval(interval);
  }, [heroSlides.length]);

  if (isLoading)
    return (
      <main className="flex min-h-[65vh] items-center justify-center">
        <Loader size="lg" label="Curating your home…" />
      </main>
    );

  return (
    <div className="min-h-[calc(100vh-57px)] w-full max-w-full overflow-x-hidden bg-[#050505] text-white">
      <section className="relative isolate min-h-[640px] overflow-hidden border-b border-white/10 sm:min-h-[720px]">
        <div className="absolute inset-0 -z-30" aria-hidden="true">
          {heroSlides.map((slide, index) => (
            <img
              key={slide.id}
              src={
                slide.bannerUrl || slide.thumbnailUrl || slide.posterUrl || ""
              }
              alt=""
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-out ${index === activeFeatureIndex ? "opacity-55" : "opacity-0"}`}
            />
          ))}
        </div>
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.94)_21%,rgba(5,5,5,0.55)_52%,rgba(5,5,5,0.04)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-20 h-[65%] bg-gradient-to-t from-[#050505] via-[#050505]/55 to-transparent" />
        <div className="absolute left-[46%] top-0 -z-10 hidden h-full w-px bg-white/10 lg:block" />
        <p
          aria-hidden="true"
          className="pointer-events-none absolute right-[-0.08em] top-[12%] hidden select-none text-[18vw] font-semibold leading-none tracking-[-0.11em] text-white/[0.045] lg:block"
        >
          PLAY
        </p>
        <div className="relative mx-auto flex min-h-[640px] max-w-[1550px] items-end px-4 pb-12 pt-28 sm:min-h-[720px] sm:px-6 sm:pb-16 lg:px-10 lg:pb-20">
          <div className="max-w-3xl">
            <div className="mb-7 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.23em] text-white/60">
              <Sparkles size={13} />
              <span>Member’s selection</span>
              <span className="h-px w-9 bg-white/40" />
              <span>
                {String(activeFeatureIndex + 1).padStart(2, "0")} /{" "}
                {String(Math.max(heroSlides.length, 1)).padStart(2, "0")}
              </span>
            </div>
            <p className="text-sm text-white/55">Welcome back</p>
            <h1 className="mt-2 text-5xl font-semibold leading-[0.86] tracking-[-0.075em] sm:text-7xl lg:text-[92px]">
              {displayName}
              <span className="text-white/35">.</span>
            </h1>
            <div className="mt-8 max-w-md border-l border-white/45 pl-5">
              <p className="text-sm leading-7 text-white/65 sm:text-base">
                Your personal front row is ready. Step back into a story, or let
                something unexpected find you.
              </p>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={feature ? `/watch/${feature.id}` : "/dashboard/explore"}
              >
                <RainbowButton>
                  {feature ? "Play now" : "Explore now"}
                </RainbowButton>
              </Link>
              <Link href="/search">
                <RainbowButton variant="outline" className="text-white">
                  <Search size={17} /> Search the catalog
                </RainbowButton>
              </Link>
            </div>
          </div>
          <div className="absolute right-4 bottom-12 hidden w-[280px] border-l border-white/25 pl-5 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Featured now
            </p>
            <p className="mt-3 text-xl font-semibold leading-tight tracking-[-0.04em]">
              {feature?.title || "Brixlore Originals"}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/50">
              {feature?.category || "A story selected for your evening."}
            </p>
          </div>
          {heroSlides.length > 1 && (
            <div
              className="absolute bottom-7 left-4 flex gap-1.5 sm:left-6 lg:left-10"
              aria-label="Featured titles"
            >
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveFeatureIndex(index)}
                  aria-label={`Show ${slide.title}`}
                  className={`h-1 transition-all duration-300 ${index === activeFeatureIndex ? "w-8 bg-white" : "w-3 bg-white/35 hover:bg-white/70"}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1550px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
        <section>
          <RailTitle
            index="01"
            title="Continue the story"
            href="/dashboard/continue-watching"
          />
          {continueItems.length ? (
            <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-5 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
              {continueItems.slice(0, 8).map((item) => (
                <ContinueWatchingCard
                  key={`${item.contentId}-${item.episodeId}`}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-[190px] place-items-center border border-dashed border-white/15 bg-white/[0.02] text-center">
              <div>
                <p className="text-lg font-semibold tracking-[-0.04em]">
                  No unfinished stories.
                </p>
                <Link
                  href="/dashboard/explore"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-white/55 hover:text-white"
                >
                  Find a new one <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="mt-16">
          <RailTitle
            index="02"
            title="Saved for later"
            href="/dashboard/my-list"
          />
          {saved.length ? (
            <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-5 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
              {saved.slice(0, 8).map((item, index) => (
                <Poster key={item.id} item={item} number={index + 1} />
              ))}
            </div>
          ) : (
            <div className="relative overflow-hidden border border-white/10 bg-white/[0.025] p-7 sm:p-10">
              <p
                aria-hidden="true"
                className="absolute right-[-0.05em] bottom-[-0.18em] select-none text-9xl font-semibold tracking-[-0.1em] text-white/[0.04]"
              >
                LIST
              </p>
              <div className="relative">
                <Plus size={24} />
                <h3 className="mt-6 text-2xl font-semibold tracking-[-0.05em]">
                  Start collecting moments.
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/55">
                  When a title catches your eye, add it to My List and return
                  when the moment is right.
                </p>
                <Link
                  href="/dashboard/explore"
                  className="mt-6 inline-flex items-center gap-2 rounded-[3px] bg-white px-4 py-3 text-sm font-bold text-black"
                >
                  Browse titles <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="mt-16 grid gap-px overflow-hidden border border-white/15 bg-white/15 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative bg-[#0d0d0d] p-7 sm:p-10">
            <p
              aria-hidden="true"
              className="pointer-events-none absolute right-5 top-0 select-none text-8xl font-semibold tracking-[-0.11em] text-white/[0.035] sm:text-9xl"
            >
              MOOD
            </p>
            <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
              The mood board
            </p>
            <h2 className="relative mt-4 max-w-md text-4xl font-semibold leading-[0.9] tracking-[-0.065em] sm:text-5xl">
              What are you in the mood for?
            </h2>
            <div className="relative mt-9 flex flex-wrap gap-2">
              {moods.length ? (
                moods.map((mood, index) => (
                  <Link
                    key={mood}
                    href={`/search?category=${encodeURIComponent(mood)}`}
                    className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${index === 0 ? "bg-white text-black" : "border border-white/15 text-white/70 hover:border-white hover:bg-white hover:text-black"}`}
                  >
                    {mood}
                  </Link>
                ))
              ) : (
                <span className="text-sm text-white/50">
                  More collections are coming soon.
                </span>
              )}
            </div>
            <Link
              href="/search"
              className="relative mt-10 inline-flex items-center gap-2 text-sm font-bold"
            >
              Browse every category <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="relative overflow-hidden bg-white p-7 text-black sm:p-10">
            <div
              aria-hidden="true"
              className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full border-[32px] border-black/10"
            />
            <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">
              Your access
            </p>
            <h2 className="relative mt-4 max-w-sm text-4xl font-semibold leading-[0.9] tracking-[-0.065em] sm:text-5xl">
              {isSubscribed
                ? activePlan?.name || "All access, active."
                : "The whole world is waiting."}
            </h2>
            <p className="relative mt-6 max-w-sm text-sm leading-7 text-black/60">
              {isSubscribed
                ? "Your membership is active. Everything on Brixlore is yours to explore."
                : "Upgrade your membership for unlimited stories and a seamless, uninterrupted watch."}
            </p>
            <Link
              href="/dashboard/subscription"
              className="relative mt-9 inline-flex text-white"
            >
              <RainbowButton variant="outline" className="text-white">
                {isSubscribed ? (
                  <>
                    <Check size={16} /> Manage membership
                  </>
                ) : (
                  <>
                    See membership <ArrowUpRight size={16} />
                  </>
                )}
              </RainbowButton>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
