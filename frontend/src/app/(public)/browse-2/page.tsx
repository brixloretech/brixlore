"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Download,
  Headphones,
  WifiOff,
} from "lucide-react";
import { BrowseHeroSwiper } from "@/components/content/BrowseHeroSwiper";
import MoviesSwiper from "@/components/content/MoviesSwiper";
import {
  ScrollVelocityContainer,
  ScrollVelocityRow,
} from "@/components/ui/scroll-based-velocity";

type EditorialRailProps = {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
};

function EditorialRail({ number, eyebrow, title, description }: EditorialRailProps) {
  return (
    <section className="relative border-t border-white/10 py-14 sm:py-16 lg:py-20">
      <div className="mb-8 grid gap-5 sm:mb-10 lg:grid-cols-[110px_minmax(0,1fr)_360px] lg:items-end">
        <span className="text-xs font-semibold tracking-[0.24em] text-white/30">{number}</span>
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">{eyebrow}</p>
          <h2 className="max-w-2xl text-3xl font-semibold leading-[0.95] tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">{title}</h2>
        </div>
        <div className="flex items-end justify-between gap-5 lg:block">
          <p className="max-w-sm text-sm leading-6 text-white/48">{description}</p>
          <Link href="/search" className="mt-5 inline-flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/65 transition hover:text-white">
            View all <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
      <MoviesSwiper />
    </section>
  );
}

export default function BrowsePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030303] text-white">
      <BrowseHeroSwiper />

      <section className="relative border-b border-white/10 bg-[#030303] py-7">
        <div className="opacity-30">
          <ScrollVelocityContainer className="text-2xl font-semibold uppercase leading-none tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
            <ScrollVelocityRow baseVelocity={1.5} direction={1}>
              <span className="mx-4 inline-flex items-center gap-8">Stories without limits <span className="text-white/25">✦</span> Built from culture <span className="text-white/25">✦</span></span>
            </ScrollVelocityRow>
          </ScrollVelocityContainer>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-[#030303] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-[#030303] to-transparent" />
      </section>

      <div id="new-on-brixlore" className="relative mx-auto max-w-[1800px] scroll-mt-24 px-4 sm:px-6 lg:px-10 xl:px-[6vw]">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[750px] w-[900px] -translate-x-1/2 rounded-full bg-white/[0.025] blur-[110px]" />
        <div className="relative z-10">
          <EditorialRail number="01 / 03" eyebrow="New on Brixlore" title="Fresh stories, still warm." description="New releases and recent discoveries selected for the mood of the moment." />
          <EditorialRail number="02 / 03" eyebrow="The culture edit" title="Work that stays with you." description="Bold voices, lived experiences, and stories with more to say after the credits." />
          <EditorialRail number="03 / 03" eyebrow="Late-night signal" title="Press play after dark." description="A deeper cut for slower nights, longer watches, and one-more-episode energy." />
        </div>
      </div>

      <section className="relative mx-4 mb-16 mt-4 overflow-hidden rounded-[30px] border border-white/10 bg-[#0d0d0d] sm:mx-6 sm:mb-20 lg:mx-10 lg:rounded-[42px] xl:mx-[6vw] xl:mb-28">
        <div className="absolute -right-24 -top-36 h-[420px] w-[420px] rounded-full bg-white/[0.09] blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="relative grid gap-10 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:px-14 lg:py-16 xl:px-20 xl:py-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">Take the signal with you</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-5xl lg:text-7xl">Your screen. Your pace. Your stories.</h2>
          </div>
          <div className="lg:pl-8">
            <p className="max-w-md text-sm leading-7 text-white/52 sm:text-base">
              Keep watching wherever the day takes you. Download once, watch offline, and move between devices without losing your place.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-white/55">
              <span className="flex items-center gap-2"><WifiOff size={15} /> Offline viewing</span>
              <span className="flex items-center gap-2"><Headphones size={15} /> Your way to watch</span>
              <span className="flex items-center gap-2"><Download size={15} /> Direct download</span>
            </div>
            <Link href="/get-the-app" className="mt-8 inline-flex h-12 items-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/80">
              Get the app <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
