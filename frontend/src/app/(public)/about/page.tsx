import type { Metadata } from "next";
import Link from "next/link";
import { SITE_BRAND } from "@/lib/seo";
import { siteService } from "@/lib/services";

export const metadata: Metadata = {
  title: "About",
  description: `Learn more about ${SITE_BRAND}.`,
};

const corePillars = [
  {
    title: "Culture-First Storytelling",
    description:
      "We commission and curate stories that reflect diverse communities with authenticity and depth.",
  },
  {
    title: "Premium Product Experience",
    description:
      "From playback quality to personalization, we build for reliable and delightful viewing across devices.",
  },
  {
    title: "Creator Collaboration",
    description:
      "We partner with emerging and established creators to bring bold concepts to global audiences.",
  },
];

export default async function AboutPage() {
  const page = await siteService.getPage("about");
  const hasCmsContent = !!page?.content?.trim();

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
              About {SITE_BRAND}
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Stories with impact, built for modern streaming.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-300 sm:text-base">
              {SITE_BRAND} combines premium technology with culture-first
              storytelling to deliver an experience that feels personal,
              cinematic, and global.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/subscription"
                className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Explore Plans
              </Link>
              <Link
                href="/browse"
                className="inline-flex items-center justify-center rounded-md border border-neutral-600 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:border-neutral-400 hover:text-white"
              >
                Browse Catalog
              </Link>
            </div>
          </div>
        </section>

        {hasCmsContent ? (
          <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-white">Our Narrative</h2>
            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-300 sm:text-base">
              {page?.content}
            </div>
          </section>
        ) : (
          <>
            <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-white">
                What We Stand For
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {corePillars.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4"
                  >
                    <h3 className="text-sm font-semibold text-white sm:text-base">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                      {pillar.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-white">About Us</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <h3 className="text-sm font-semibold text-white sm:text-base">
                    Who We Are
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                    We are a streaming platform focused on meaningful stories,
                    reliable playback, and a viewing experience that feels
                    personal across every device.
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                  <h3 className="text-sm font-semibold text-white sm:text-base">
                    What We Deliver
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                    From curated originals to community-driven programming, we
                    bring together creators and audiences through high-quality,
                    culture-forward entertainment.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Need Help?
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">
                    Explore product guides and account support resources, or
                    reach out directly to our team.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/help-center"
                    className="inline-flex items-center justify-center rounded-md border border-neutral-600 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:border-neutral-400 hover:text-white"
                  >
                    Help Center
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </article>
    </main>
  );
}
