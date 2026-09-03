"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Info,
  Play,
} from "lucide-react";
import Swiper from "swiper";
import { A11y, Autoplay, EffectFade } from "swiper/modules";
import { contentService } from "@/lib/services/content.service";
import type { ContentDetailDto, ContentSummaryDto } from "@/types/api";

const HERO_LIMIT = 6;
const HERO_CANDIDATE_LIMIT = 12;
const AUTOPLAY_DELAY = 6500;

function heroImage(item: ContentDetailDto) {
  return item.bannerUrl || item.posterUrl || item.thumbnailUrl;
}

function mergeDetail(
  summary: ContentSummaryDto,
  detail: ContentDetailDto | undefined,
): ContentDetailDto {
  return {
    ...summary,
    ...detail,
    thumbnailUrl: detail?.thumbnailUrl || summary.thumbnailUrl,
    posterUrl: detail?.posterUrl || summary.posterUrl,
    bannerUrl: detail?.bannerUrl || summary.bannerUrl,
  };
}

function HeroSkeleton() {
  return (
    <section className="relative min-h-[88svh] overflow-hidden bg-[#080808] lg:min-h-[94svh]">
      <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_70%_25%,rgba(255,255,255,.12),transparent_45%)]" />
      <div className="relative mx-auto flex min-h-[88svh] max-w-[1800px] items-end px-4 pb-14 pt-36 sm:px-6 lg:min-h-[94svh] lg:px-10 lg:pb-20 xl:px-[6vw]">
        <div className="w-full max-w-2xl animate-pulse">
          <div className="h-4 w-32 rounded-full bg-white/10" />
          <div className="mt-6 h-16 w-4/5 rounded-2xl bg-white/10 sm:h-24" />
          <div className="mt-7 h-5 w-full rounded-full bg-white/[0.07]" />
          <div className="mt-3 h-5 w-3/4 rounded-full bg-white/[0.07]" />
        </div>
      </div>
    </section>
  );
}

export function BrowseHeroSwiper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<Swiper | null>(null);
  const [items, setItems] = useState<ContentDetailDto[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let active = true;
    void contentService
      .getContentForBrowse(undefined, { cache: "no-store" })
      .then(async (catalog) => {
        const candidates = [...catalog].slice(0, HERO_CANDIDATE_LIMIT);
        const details = await Promise.all(
          candidates.map((item) => contentService.getContentById(item.id)),
        );
        if (!active) return;
        setItems(
          candidates
            .map((summary, index) =>
              mergeDetail(summary, details[index]?.content),
            )
            .filter((item) => Boolean(heroImage(item)))
            .sort(
              (a, b) =>
                Number(Boolean(b.bannerUrl)) - Number(Boolean(a.bannerUrl)),
            )
            .slice(0, HERO_LIMIT),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || items.length < 2) return;
    const swiper = new Swiper(containerRef.current, {
      modules: [A11y, Autoplay, EffectFade],
      effect: "fade",
      fadeEffect: { crossFade: true },
      loop: true,
      speed: reducedMotion ? 0 : 1100,
      allowTouchMove: true,
      autoplay: reducedMotion
        ? false
        : {
            delay: AUTOPLAY_DELAY,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
      a11y: { enabled: true },
      on: {
        realIndexChange(instance) {
          setActiveIndex(instance.realIndex);
        },
      },
    });
    swiperRef.current = swiper;
    return () => {
      swiper.destroy(true, true);
      swiperRef.current = null;
    };
  }, [items, reducedMotion]);

  if (loading) return <HeroSkeleton />;

  if (!items.length) {
    return (
      <section className="flex min-h-[78svh] items-end bg-[radial-gradient(circle_at_75%_30%,#252525,transparent_48%),#050505] px-4 pb-16 pt-36 sm:px-6 lg:px-10 xl:px-[6vw]">
        <div className="mx-auto w-full max-w-[1800px]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Brixlore originals</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.88] tracking-[-0.065em] sm:text-7xl lg:text-8xl">Stories that move culture.</h1>
          <Link href="/search" className="mt-8 inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-black">Explore the collection</Link>
        </div>
      </section>
    );
  }

  const item = items[activeIndex] ?? items[0];
  const isSeries = item.type === "SERIES";

  return (
    <section className="relative isolate min-h-[88svh] overflow-hidden border-b border-white/10 bg-black lg:min-h-[94svh]">
      <div className="absolute inset-0 z-0">
      <div ref={containerRef} className="swiper !h-full !w-full" aria-label="Featured titles">
        <div className="swiper-wrapper !h-full">
          {items.map((slide, index) => (
            <div key={slide.id} className="swiper-slide relative h-full overflow-hidden bg-[#090909]">
              <div className="absolute inset-[-6%] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImage(slide) ?? ""}
                  alt=""
                  className="h-full w-full scale-110 object-cover opacity-55 blur-2xl saturate-75"
                />
              </div>
              <div
                className={`absolute inset-0 overflow-hidden ${
                  slide.bannerUrl
                    ? ""
                    : "left-[20%] sm:left-[32%] lg:left-[38%]"
                }`}
                style={{
                  WebkitMaskImage: slide.bannerUrl
                    ? "linear-gradient(to bottom, black 0%, black 76%, transparent 100%)"
                    : "linear-gradient(to right, transparent 0%, black 20%, black 100%)",
                  maskImage: slide.bannerUrl
                    ? "linear-gradient(to bottom, black 0%, black 76%, transparent 100%)"
                    : "linear-gradient(to right, transparent 0%, black 20%, black 100%)",
                }}
              >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage(slide) ?? ""}
                alt=""
                className={`h-full w-full transition-transform ease-out motion-reduce:transition-none ${
                  slide.bannerUrl
                    ? "object-cover object-[center_28%]"
                    : "object-contain object-right"
                } ${index === activeIndex ? "scale-[1.035] duration-[7000ms]" : "scale-100 duration-1000"}`}
              />
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(255,255,255,.08),transparent_34%)]" />
            </div>
          ))}
        </div>
      </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,#030303_0%,rgba(3,3,3,.9)_24%,rgba(3,3,3,.48)_48%,rgba(3,3,3,.06)_76%)] sm:bg-[linear-gradient(90deg,#030303_0%,rgba(3,3,3,.88)_27%,rgba(3,3,3,.38)_52%,rgba(3,3,3,.02)_78%)]" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(0,0,0,.18)_0%,transparent_32%,rgba(3,3,3,.08)_55%,#030303_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-[88svh] w-full max-w-[1800px] items-end px-4 pb-12 pt-36 sm:px-6 sm:pb-16 lg:min-h-[94svh] lg:px-10 lg:pb-20 xl:px-[6vw]">
        <div className="w-full">
          

          <div key={item.id} className="reveal max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65 sm:text-xs">
              <span className="rounded-full bg-white px-3 py-1.5 text-black">{isSeries ? "Featured series" : "Featured film"}</span>
              <span>{item.releaseYear}</span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>{item.ageRating || "NR"}</span>
              {item.category && <><span className="h-1 w-1 rounded-full bg-white/40" /><span>{item.category}</span></>}
            </div>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.84] tracking-[-0.07em] text-white [text-shadow:0_8px_34px_rgba(0,0,0,.55)] sm:text-7xl lg:text-8xl xl:text-[7rem]">{item.title}</h1>
            <p className="mt-6 line-clamp-3 max-w-2xl text-sm leading-7 text-white/68 sm:text-base sm:leading-8">
              {item.description || `Discover ${item.title}, now streaming as part of the Brixlore collection.`}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={`/watch-2/${item.id}`} className="inline-flex h-12 items-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-white/85 active:scale-[.98]">
                <Play size={16} fill="currentColor" /> {isSeries ? "Start series" : "Play now"}
              </Link>
              <Link href={`/watch-2/${item.id}`} className="inline-flex h-12 items-center gap-3 rounded-full border border-white/20 bg-black/25 px-6 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white hover:text-black">
                <Info size={17} /> More details
              </Link>
            </div>
          </div>

          <div className="mt-10 flex items-end justify-between gap-6 sm:mt-12">
            <a href="#new-on-brixlore" className="hidden items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 transition hover:text-white sm:inline-flex">
              Explore the collection <ArrowDown size={14} />
            </a>
            <div className="ml-auto flex items-center gap-3">
              <button type="button" onClick={() => swiperRef.current?.slidePrev()} aria-label="Previous featured title" className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-md transition hover:bg-white hover:text-black"><ArrowLeft size={17} /></button>
              <button type="button" onClick={() => swiperRef.current?.slideNext()} aria-label="Next featured title" className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-md transition hover:bg-white hover:text-black"><ArrowRight size={17} /></button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {items.map((featured, index) => (
              <button key={featured.id} type="button" onClick={() => swiperRef.current?.slideToLoop(index)} aria-label={`Show ${featured.title}`} aria-current={index === activeIndex ? "true" : undefined} className="group min-w-0 text-left">
                <span className="block h-px overflow-hidden bg-white/20">
                  {index === activeIndex && (
                    <span key={`${featured.id}-${activeIndex}`} className={`block h-full bg-white ${reducedMotion ? "w-full" : "browse-hero-progress"}`} style={{ animationDuration: `${AUTOPLAY_DELAY}ms` }} />
                  )}
                </span>
                <span className={`mt-2 hidden truncate text-[10px] font-medium uppercase tracking-[0.08em] transition sm:block ${index === activeIndex ? "text-white" : "text-white/30 group-hover:text-white/65"}`}>{featured.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
