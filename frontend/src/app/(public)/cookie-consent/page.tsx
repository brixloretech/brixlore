import type { Metadata } from "next";
import Link from "next/link";
import { SITE_BRAND } from "@/lib/seo";
import { siteService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Cookie Consent",
  description: `Cookie and tracking preferences for ${SITE_BRAND}.`,
};

export default async function CookieConsentPage() {
  const page = await siteService.getPage("cookie-consent");
  const content = page?.content?.trim();
  const html = content
    ? /<\/?[a-z][\s\S]*>/i.test(content)
      ? content
      : content
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br />")
    : "";
  return (
    <main className="flex-1 bg-[#050505] px-4 py-12 text-white sm:px-6 lg:px-8">
      <article className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-neutral-800/90 bg-gradient-to-b from-neutral-900/90 via-neutral-950/95 to-black p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Cookies
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {page?.title || "Cookie Consent and Preferences"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300 sm:text-base">
            Learn how cookies and related technologies are used on Brixlore, and
            review the options available for controlling preferences.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-neutral-500">
            Last updated: {new Date().toLocaleDateString("en-US")}
          </p>
        </div>

        {content ? (
          <div
            className="mt-8 rounded-[1.5rem] border border-neutral-800/90 bg-neutral-950/85 px-6 py-7 text-neutral-200 sm:px-8"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6 md:col-span-2">
              <h2 className="text-xl font-semibold text-white">
                1. What Are Cookies?
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                Cookies are small text files saved to your browser. They help us
                keep your session active, remember preferences, and improve site
                reliability and performance for {SITE_BRAND}.
              </p>
            </section>

            <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
              <h2 className="text-xl font-semibold text-white">
                2. Essential Cookies
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                Required for secure login, account access, checkout, and core
                platform operations.
              </p>
            </section>

            <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
              <h2 className="text-xl font-semibold text-white">
                3. Functional and Analytics Cookies
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                Used to remember preferences and measure platform usage so we
                can improve navigation, recommendations, and performance.
              </p>
            </section>

            <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6 md:col-span-2">
              <h2 className="text-xl font-semibold text-white">
                4. Managing Cookie Preferences
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                You can manage non-essential cookies through browser settings
                and consent controls where available. Disabling certain cookies
                may affect portions of the experience.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/privacy-policy"
                  className="inline-flex items-center rounded-full border border-neutral-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-neutral-300"
                >
                  View Privacy Policy
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full border border-neutral-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-neutral-300"
                >
                  Contact Support
                </Link>
              </div>
            </section>
          </div>
        )}
      </article>
    </main>
  );
}
