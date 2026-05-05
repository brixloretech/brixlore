import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PartnersImg from "../../../../public/Partners_HeroImg.jpeg";

export const metadata: Metadata = {
  title: "Partner Network | Brixlore",
  description:
    "The Brixlore Partner Network integrates brands directly into premium original content—distributed across our platform and amplified across digital ecosystems.",
};

const partnerPerks = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-7 w-7"
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
        strokeWidth="1.8"
        className="h-7 w-7"
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
        strokeWidth="1.8"
        className="h-7 w-7"
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
        strokeWidth="1.8"
        className="h-7 w-7"
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
        strokeWidth="1.8"
        className="h-7 w-7"
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
        strokeWidth="1.8"
        className="h-7 w-7"
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
        strokeWidth="1.8"
        className="h-7 w-7"
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
        strokeWidth="1.8"
        className="h-7 w-7"
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
        strokeWidth="1.8"
        className="h-7 w-7"
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
        strokeWidth="1.8"
        className="h-7 w-7"
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
        strokeWidth="1.8"
        className="h-7 w-7"
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
        strokeWidth="1.8"
        className="h-7 w-7"
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
        strokeWidth="1.8"
        className="h-7 w-7"
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
        strokeWidth="1.8"
        className="h-7 w-7"
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
        strokeWidth="1.8"
        className="h-7 w-7"
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

export default function PartnersPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* HERO SECTION  */}
      <section
        className="relative w-full overflow-hidden bg-[#121212] px-4 py-16 sm:px-6 lg:px-8"
        aria-label="Hero"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">
          {/* LEFT — Text */}
          <div className="flex flex-1 flex-col items-start">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Where <em className="not-italic font-bold text-white">Brands</em>{" "}
              Become Part of the Story.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-neutral-400 sm:text-base">
              The Brixlore Partner Network integrates brands directly into
              premium original content—distributed across our platform and
              amplified across digital ecosystems.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/contact?subject=Partnership+Inquiry"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-7 text-md font-semibold text-black transition-colors hover:bg-white/90"
              >
                Become a Partner
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-600 px-7 text-md font-semibold text-white transition-colors hover:border-neutral-400"
              >
                View Opportunities
              </Link>
            </div>
          </div>

          {/* RIGHT — Image */}
          <div className="w-full lg:w-[45%]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image
                src={PartnersImg}
                alt="Brand integration behind the scenes"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 45vw"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>
      {/* ADVERTISING SECTION  */}
      <div className="relative flex flex-1 flex-col items-center bg-[#121212] px-4 pb-16 sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 0%, rgba(34,34,34,0.42), transparent 36%), radial-gradient(circle at 85% 0%, rgba(24,24,24,0.32), transparent 34%), radial-gradient(circle at 50% 100%, rgba(10,10,10,0.28), transparent 40%)",
          }}
        />
        <section
          className="relative mt-16 w-full max-w-3xl text-center"
          aria-labelledby="core-idea-heading"
        >
          <div className="mx-auto mb-4 h-0.5 w-10 bg-accent" />
          <h2
            id="core-idea-heading"
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            This Isn&apos;t Advertising
          </h2>
          <p className="mt-4 text-lg text-neutral-400">
            Traditional ads interrupt.
          </p>
          <p className="mt-1 text-2xl font-bold text-[#A46233] sm:text-3xl">
            We integrate.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-neutral-300 sm:text-base">
            Brixlore partners don&apos;t sit outside the content—they live
            inside it. Through narrative-driven storytelling, your brand becomes
            part of the culture, not a break from it.
          </p>
        </section>
      </div>
      {/* HOW IT WORKS  */}
      <section
        id="how-it-works"
        className="relative mt-16 w-full max-w-6xl mx-auto flex flex-1 flex-col items-center px-4 pb-16 sm:px-6 lg:px-8"
        aria-labelledby="how-it-works-heading"
      >
        <div className="mx-auto mb-4 h-0.5 w-10 bg-accent" />
        <h2
          id="how-it-works-heading"
          className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          How the Brixlore Partner Network Works
        </h2>
        <div className="relative mt-10 grid gap-6 sm:grid-cols-3 ">
          <div
            className="absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] hidden h-px bg-gradient-to-r from-accent/40 via-accent to-accent/40 sm:block"
            aria-hidden
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
                  strokeWidth="1.8"
                  className="h-10 w-10"
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
                  strokeWidth="1.8"
                  className="h-10 w-10"
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
                  strokeWidth="1.8"
                  className="h-10 w-10"
                  aria-hidden
                >
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              ),
            },
          ].map((step) => (
            <div
              key={step.num}
              className="cursor-pointer group relative flex flex-col items-center rounded-2xl border border-neutral-800/90 bg-gradient-to-b from-neutral-900/90 to-neutral-950/95 p-6 text-center shadow-[0_16px_34px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-1 hover:border-neutral-600"
            >
              <div className="relative mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-neutral-900/80 text-accent">
                {step.icon}
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[0.8rem] font-bold text-accent-foreground">
                  {step.num}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-md leading-6 text-neutral-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>
      {/* WHAT PARTNERS RECEIVE */}
      <div className="relative flex flex-1 flex-col items-center bg-[#121212] px-4 pb-16 sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 0%, rgba(34,34,34,0.42), transparent 36%), radial-gradient(circle at 85% 0%, rgba(24,24,24,0.32), transparent 34%), radial-gradient(circle at 50% 100%, rgba(10,10,10,0.28), transparent 40%)",
          }}
        />
        <section
          className="relative mt-16 w-full max-w-6xl"
          aria-labelledby="partners-receive-heading"
        >
          <div className="mx-auto mb-4 h-0.5 w-10 bg-accent" />
          <h2
            id="partners-receive-heading"
            className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            What Partners Receive
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {partnerPerks.map((perk) => (
              <div
                key={perk.title}
                className="group flex flex-col cursor-pointer items-center rounded-2xl border border-neutral-800/90 bg-gradient-to-b from-neutral-900/90 to-neutral-950/95 p-5 text-center shadow-[0_16px_34px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-1 hover:border-neutral-600"
              >
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900/80 text-neutral-200">
                  {perk.icon}
                </div>
                <p className="text-xd font-semibold leading-snug text-white">
                  {perk.title}
                </p>
                <p className="mt-1.5 text-sm leading-5 text-neutral-500">
                  {perk.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
      {/* WHY BRIXLORE */}
      <section
        className="relative mt-16 w-full max-w-6xl mx-auto flex flex-1 flex-col items-center px-4 pb-16 sm:px-6 lg:px-8"
        aria-labelledby="why-brixlore-heading"
      >
        <div className="mx-auto mb-4 h-0.5 w-10 bg-accent" />
        <h2
          id="why-brixlore-heading"
          className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          Why Partner With Brixlore
        </h2>
        <div className="mt-8 space-y-3">
          {whyPoints.map((point) => (
            <div
              key={point.title}
              className="group flex gap-5 rounded-2xl border border-neutral-800/90 bg-gradient-to-b from-neutral-900/85 to-neutral-950/95 px-5 py-5 shadow-[0_16px_34px_rgba(0,0,0,0.35)] transition-all hover:border-neutral-700 sm:px-6"
            >
              <div className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900/80 text-accent">
                {point.icon}
              </div>
              <div>
                <p className="font-semibold text-white">{point.title}</p>
                <p className="mt-1.5 text-sm leading-6 text-neutral-400">
                  {point.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* CTA SECTION */}
      <div className="relative flex flex-1 flex-col items-center bg-[#121212] px-4 pb-16 sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 0%, rgba(34,34,34,0.42), transparent 36%), radial-gradient(circle at 85% 0%, rgba(24,24,24,0.32), transparent 34%), radial-gradient(circle at 50% 100%, rgba(10,10,10,0.28), transparent 40%)",
          }}
        />
        <section
          className="relative mt-16 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-neutral-800/90 bg-gradient-to-b from-neutral-900/85 to-neutral-950/95 px-6 py-14 shadow-[0_26px_70px_rgba(0,0,0,0.45)] sm:px-8 sm:py-16"
          aria-labelledby="cta-heading"
        >
          {/* <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/8 to-transparent"
            aria-hidden
          /> */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 opacity-20"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse at 50% 100%, var(--color-accent, #A46233), transparent 70%)",
            }}
          />
          <div className="relative z-10 flex flex-col items-center text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
              Get Started
            </p>
            <h2
              id="cta-heading"
              className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Ready to Build a Partnership?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-neutral-300 sm:text-base">
              If you&apos;re looking to move beyond traditional advertising and
              become part of the story—we should talk.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contact?subject=Book+a+Partnership+Call"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-8 text-xd font-semibold text-accent-foreground shadow-accent-glow transition-colors hover:bg-accent/90"
              >
                Book a Partnership Call
              </Link>
              <Link
                href="/contact?subject=Request+the+Partner+Deck"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-neutral-600 px-8 text-xd font-semibold text-neutral-200 transition-colors hover:border-neutral-400 hover:text-white"
              >
                Request the Partner Deck
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
