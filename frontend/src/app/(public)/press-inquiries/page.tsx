import type { Metadata } from "next";
import Link from "next/link";
import { SITE_BRAND } from "@/lib/seo";
import { siteService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Press Inquiries",
  description: `Press and media information for ${SITE_BRAND}.`,
};

export default async function PressInquiriesPage() {
  const page = await siteService.getPage("press-inquiries");

  return (
    <main className="flex-1 bg-[#050505] px-4 py-12 text-white sm:px-6 lg:px-8">
      <article className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-neutral-800/90 bg-gradient-to-b from-neutral-900/90 via-neutral-950/95 to-black p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Media
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {page?.title || "Press Inquiries"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300 sm:text-base">
            Press resources, media contacts, and company updates for
            journalists, editors, and production partners.
          </p>
        </div>

        {page?.content?.trim() ? (
          <div className="mt-8 rounded-[1.5rem] border border-neutral-800/90 bg-neutral-950/85 px-6 py-7 text-neutral-200 sm:px-8">
            {page.content}
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
                <h2 className="text-xl font-semibold text-white">
                  Media Contact
                </h2>
                <p className="mt-3 text-sm leading-6 text-neutral-300">
                  For interviews, speaking requests, and statements, contact our
                  media relations team.
                </p>
                <p className="mt-4 text-sm text-neutral-200">
                  <a
                    href="mailto:media@brixlore.com"
                    className="font-semibold underline decoration-neutral-500 underline-offset-4 transition-colors hover:decoration-white"
                  >
                    media@brixlore.com
                  </a>
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center rounded-full border border-neutral-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-neutral-300"
                >
                  Contact Team
                </Link>
              </div>

              <div className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
                <h2 className="text-xl font-semibold text-white">
                  Response Window
                </h2>
                <p className="mt-3 text-sm leading-6 text-neutral-300">
                  Standard media response time is 1-2 business days. Please
                  include deadline, publication, and request scope.
                </p>
                <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-xs uppercase tracking-[0.12em] text-neutral-400">
                  Priority inquiries: embargoed announcements, launch coverage,
                  and executive interviews.
                </div>
              </div>
            </section>
          </div>
        )}
      </article>
    </main>
  );
}
