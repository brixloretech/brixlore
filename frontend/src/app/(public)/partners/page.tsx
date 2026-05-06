"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import "@/app/globals.css";
import PartnersImg from "../../../../public/Partners_HeroImg.jpeg";

// ─── Scroll reveal ────────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal-block ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const partnerPerks = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "Narrative Integration",
    description: "Your brand woven authentically into storytelling.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M10 9.5L15 12l-5 2.5v-5z" />
      </svg>
    ),
    title: "Episode-Level Brand Placement",
    description: "Visible, natural placement inside original episodes.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
      </svg>
    ),
    title: "Short-Form Content Multiplication",
    description: "Episodes repurposed into dozens of high-impact clips.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18" />
        <path d="M3 12h18" />
      </svg>
    ),
    title: "Platform Distribution (Brixlore.tv)",
    description: "Reach Brixlore's growing subscriber base directly.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
    title: "Social & Digital Amplification",
    description: "Content extended across social and partner channels.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <rect x="3" y="6" width="13" height="10" rx="1.8" />
        <rect x="17" y="9" width="4" height="7" rx="1" />
      </svg>
    ),
    title: "Multi Platform Exposure",
    description: "Visibility across every screen and syndication channel.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: "Brand Logo Integrated in Content",
    description: "Your logo featured organically inside production.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Category Exclusivity (Optional Premium)",
    description: "Lock out competitors in your category.",
  },
];

const whyPoints = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M10 9.5L15 12l-5 2.5v-5z" />
      </svg>
    ),
    title: "Cultural Storytelling & Narrative Capture",
    description:
      "We capture the moments that define culture and turn them into stories that continue to resonate, evolve, and stay relevant over time.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
      </svg>
    ),
    title: "Multi-Layered Distribution",
    description:
      "Content begins on Brixlore and expands across short-form, social, and partner platforms—creating a continuous cycle of reach and engagement.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    title: "Compounding Brand Value",
    description:
      "Traditional ads stop when spend stops. Brixlore partnerships continue to generate reach through ongoing distribution, social media amplification, and repeat exposure—creating value that builds over time.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    title: "Built for Integration",
    description:
      "Our programming is designed with brands in mind from day one.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18" />
        <path d="M3 12h18" />
      </svg>
    ),
    title: "Content Ecosystem",
    description: "Long-form → short-form → continuous exposure.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: "Cultural Positioning",
    description: "We don't chase attention—we build relevance.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: "Transparent Performance & Impact Data",
    description:
      "Every partnership includes clear, visual reporting that shows how content performs across platforms—turning distribution into measurable outcomes.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PartnersPage() {
  return (
    <>
      <main
        className="relative flex flex-1 flex-col overflow-hidden"
        style={{ background: "#0b0b0e" }}
      >
        {/* HERO */}
        <section
          className="relative w-full overflow-hidden px-4 py-20 sm:px-6 lg:px-8"
          aria-label="Hero"
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 0% 0%, rgba(255,255,255,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(180,180,200,0.04) 0%, transparent 55%)",
            }}
          />

          <div
            className="orb pointer-events-none absolute -left-48 top-10 h-[500px] w-[500px] rounded-full"
            aria-hidden
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%)",
            }}
          />
          <div
            className="orb2 pointer-events-none absolute -right-40 top-0 h-80 w-80 rounded-full"
            aria-hidden
            style={{
              background:
                "radial-gradient(circle, rgba(200,200,220,0.04) 0%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-20">
            {/* LEFT */}
            <div className="flex flex-1 flex-col items-start">
              <div className="reveal-block revealed mb-5 flex items-center gap-3">
                <div
                  className="h-px w-10"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(229,231,235,0.8), transparent)",
                  }}
                />
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-400">
                  Brixlore Partner Network
                </p>
              </div>

              <h1
                className="reveal-block revealed text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[3.6rem] lg:leading-[1.08]"
                style={{ transitionDelay: "70ms" }}
              >
                Where <em className="grad-text">Brands</em>
                <br />
                Become Part of
                <br />
                the Story.
              </h1>

              <p
                className="reveal-block revealed mt-6 max-w-md text-base leading-7 text-neutral-400"
                style={{ transitionDelay: "150ms" }}
              >
                The Brixlore Partner Network integrates brands directly into
                premium original content—distributed across our platform and
                amplified across digital ecosystems.
              </p>

              <div
                className="reveal-block revealed mt-9 flex flex-wrap items-center gap-4"
                style={{ transitionDelay: "230ms" }}
              >
                <Link
                  href="/contact?subject=Partnership+Inquiry"
                  className="btn-shine group inline-flex h-11 items-center justify-center rounded-lg px-8 text-xd font-bold text-black"
                >
                  Become a Partner
                  <span className="text-xl ml-2 transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex h-11 items-center justify-center rounded-lg px-7 text-xd font-semibold text-neutral-300 transition-all duration-300 hover:text-white"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  View Opportunities
                </Link>
              </div>
            </div>

            {/* RIGHT */}
            <div
              className="reveal-block revealed w-full lg:w-[47%]"
              style={{ transitionDelay: "110ms" }}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl hidden md:block">
                <Image
                  src={PartnersImg}
                  alt="Brand integration behind the scenes"
                  fill
                  priority
                  className="object-cover object-center transition-transform duration-700 hover:scale-[1.04]"
                  sizes="(max-width: 1024px) 100vw, 47vw"
                  unoptimized
                />
                {/* Cinematic overlay: dark vignette + subtle gradient tint */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(11,11,14,0.55) 0%, rgba(11,11,14,0.1) 50%, rgba(11,11,14,0.4) 100%)",
                  }}
                  aria-hidden
                />
                {/* Bottom fade */}
                <div
                  className="absolute inset-x-0 bottom-0 h-2/5"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(11,11,14,0.85) 0%, transparent 100%)",
                  }}
                  aria-hidden
                />
                {/* Top edge shine */}
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                  }}
                  aria-hidden
                />

                {/* Outer frame glow */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    boxShadow:
                      "inset 0 0 0 1px rgba(255,255,255,0.09), 0 0 60px rgba(255,255,255,0.04)",
                  }}
                  aria-hidden
                />
              </div>
            </div>
          </div>

          {/* Seamless bottom fade */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
            style={{
              background: "linear-gradient(to bottom, transparent, #0b0b0e)",
            }}
            aria-hidden
          />
        </section>

        {/* THIS ISN'T ADVERTISING */}
        <section
          className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8"
          aria-labelledby="core-idea-heading"
        >
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <div
              className="h-[600px] w-[600px] rounded-full opacity-[0.06]"
              style={{
                background:
                  "radial-gradient(circle, rgba(229,231,235,1) 0%, transparent 70%)",
              }}
            />
          </div>

          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
            aria-hidden
          >
            <span
              className="text-[9rem] font-black uppercase leading-none tracking-tighter sm:text-[15rem]"
              style={{ color: "rgba(255, 255, 255, 0.05)" }}
            >
              INTEGRATE
            </span>
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="mx-auto mb-7 h-px w-20 div-line" />
              <h2
                id="core-idea-heading"
                className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                This Isn&apos;t
                <br />
                Advertising
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-6 text-xl text-neutral-500">
                Traditional ads interrupt.
              </p>
              <p className="mt-2 text-4xl font-black grad-text sm:text-5xl">
                We integrate.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <p className="mx-auto mt-7 max-w-lg text-base leading-8 text-neutral-400">
                Brixlore partners don&apos;t sit outside the content—they live
                inside it. Through narrative-driven storytelling, your brand
                becomes part of the culture, not a break from it.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                {[
                  "Story-driven placements",
                  "Cultural integration",
                  "Zero interruption",
                ].map((label) => (
                  <span
                    key={label}
                    className="glass rounded-full px-5 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:text-white"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8"
          aria-labelledby="how-it-works-heading"
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)",
            }}
          />

          <div
            className="orb3 pointer-events-none absolute -right-32 top-1/2 h-80 w-80 rounded-full -translate-y-1/2"
            aria-hidden
            style={{
              background:
                "radial-gradient(circle, rgba(229,231,235,0.07) 0%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto max-w-6xl">
            <Reveal className="text-center">
              <div className="mx-auto mb-7 h-px w-20 div-line" />
              <h2
                id="how-it-works-heading"
                className="text-3xl font-black tracking-tight text-white sm:text-4xl"
              >
                How the Brixlore Partner Network Works
              </h2>
              <p className="mt-3 text-neutral-500">
                Three phases. One seamless story.
              </p>
            </Reveal>

            <div className="relative mt-16 grid gap-6 sm:grid-cols-3">
              {/* Connector line */}
              <div
                className="pointer-events-none absolute left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] top-11 hidden h-px sm:block"
                aria-hidden
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(229,231,235,0.25) 25%, rgba(229,231,235,0.25) 75%, transparent)",
                }}
              />

              {[
                {
                  num: "01",
                  title: "Integration",
                  description:
                    "Your brand is embedded into original series through authentic, story-driven placements.",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-8 w-8"
                      aria-hidden
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  ),
                },
                {
                  num: "02",
                  title: "Distribution",
                  description:
                    "Content lives on Brixlore.tv and extends across short-form, social, and syndication channels.",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-8 w-8"
                      aria-hidden
                    >
                      <rect x="4" y="6" width="16" height="12" rx="2" />
                      <path d="M10 9.5L15 12l-5 2.5v-5z" />
                    </svg>
                  ),
                },
                {
                  num: "03",
                  title: "Amplification",
                  description:
                    "Each episode fuels dozens of high-impact clips, maximizing reach and repeat exposure.",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-8 w-8"
                      aria-hidden
                    >
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                      <polyline points="16 7 22 7 22 13" />
                    </svg>
                  ),
                },
              ].map((step, i) => (
                <Reveal key={step.num} delay={i * 130}>
                  <div
                    className="step-card glass flex h-full flex-col items-center rounded-2xl p-8 text-center"
                    style={{
                      background:
                        "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                    }}
                  >
                    <div
                      className="relative mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      <span className="text-white/80">{step.icon}</span>
                      <span
                        className="absolute -right-2 -top-1 flex h-7 w-7 items-center justify-center rounded-full text-[0.65rem] font-black text-black"
                        style={{
                          background:
                            "linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)",
                        }}
                      >
                        {step.num}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-neutral-400">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT PARTNERS RECEIVE */}
        <section
          className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8"
          aria-labelledby="partners-receive-heading"
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 65%)",
            }}
          />

          <div className="relative mx-auto max-w-6xl">
            <Reveal className="text-center">
              <div className="mx-auto mb-7 h-px w-20 div-line" />
              <h2
                id="partners-receive-heading"
                className="text-3xl font-black tracking-tight text-white sm:text-4xl"
              >
                What Partners Receive
              </h2>
              <p className="mt-3 text-neutral-500">
                Everything you need to make culture work for your brand.
              </p>
            </Reveal>

            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {partnerPerks.map((perk, i) => (
                <Reveal key={perk.title} delay={i * 55}>
                  <div
                    className="perk-card glass group flex h-full flex-col items-center rounded-2xl p-5 text-center"
                    style={{
                      background:
                        "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                    }}
                  >
                    <div
                      className="perk-icon icon-ring mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-white/75"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {perk.icon}
                    </div>
                    <p className="text-sm font-bold leading-snug text-white">
                      {perk.title}
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-neutral-500">
                      {perk.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* WHY BRIXLORE */}
        <section
          className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8"
          aria-labelledby="why-brixlore-heading"
        >
          <div
            className="orb pointer-events-none absolute -left-48 top-1/3 h-[500px] w-[500px] rounded-full"
            aria-hidden
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 65%)",
            }}
          />

          <div className="relative mx-auto max-w-5xl">
            <Reveal className="text-center">
              <div className="mx-auto mb-7 h-px w-20 div-line" />
              <h2
                id="why-brixlore-heading"
                className="text-3xl font-black tracking-tight text-white sm:text-4xl"
              >
                Why Partner With Brixlore
              </h2>
              <p className="mt-3 text-neutral-500">
                Built differently. Designed to last.
              </p>
            </Reveal>

            <div className="mt-12 space-y-2.5">
              {whyPoints.map((point, i) => (
                <Reveal key={point.title} delay={i * 60}>
                  <div
                    className="why-row glass flex gap-5 rounded-2xl px-5 py-5 sm:px-6"
                    style={{
                      background:
                        "linear-gradient(100deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                    }}
                  >
                    <div
                      className="icon-ring mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/70"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
                        border: "1px solid rgba(255,255,255,0.09)",
                      }}
                    >
                      {point.icon}
                    </div>
                    <div>
                      <p className="font-bold text-white">{point.title}</p>
                      <p className="mt-1.5 text-sm leading-6 text-neutral-400">
                        {point.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8"
          aria-labelledby="cta-heading"
        >
          {/* Large centered glow */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <div
              className="h-[500px] w-[700px] rounded-full opacity-[0.08]"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(229,231,235,1) 0%, transparent 65%)",
                filter: "blur(60px)",
              }}
            />
          </div>

          <Reveal>
            <div
              className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] px-8 py-20 text-center sm:px-16 sm:py-24"
              style={{
                background:
                  "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 60%, rgba(255,255,255,0.04) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
              }}
            >
              {/* Top shimmer line */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                aria-hidden
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                }}
              />
              {/* Bottom glow */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-48 opacity-25"
                aria-hidden
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 100%, rgba(229,231,235,0.6), transparent 70%)",
                }}
              />
              {/* Corner accents */}
              <div
                className="pointer-events-none absolute left-8 top-8 h-12 w-12 rounded-tl-xl border-l border-t border-white/15"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute right-8 top-8 h-12 w-12 rounded-tr-xl border-r border-t border-white/15"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute bottom-8 left-8 h-12 w-12 rounded-bl-xl border-b border-l border-white/15"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute bottom-8 right-8 h-12 w-12 rounded-br-xl border-b border-r border-white/15"
                aria-hidden
              />

              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500">
                  Get Started
                </p>
                <h2
                  id="cta-heading"
                  className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl"
                >
                  Ready to Build
                  <br />a Partnership?
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-neutral-400">
                  If you&apos;re looking to move beyond traditional advertising
                  and become part of the story—we should talk.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/contact?subject=Book+a+Partnership+Call"
                    className="btn-shine group inline-flex h-12 items-center justify-center rounded-xl px-9 text-xd font-bold text-black"
                  >
                    Book a Partnership Call
                    <span className="text-xl ml-2 transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                  <Link
                    href="/contact?subject=Request+the+Partner+Deck"
                    className="inline-flex h-12 items-center justify-center rounded-xl px-8 text-xd font-semibold text-neutral-300 transition-all duration-300 hover:text-white"
                    style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    Request the Partner Deck
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
    </>
  );
}
