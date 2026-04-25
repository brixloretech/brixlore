import type { Metadata } from "next";
import Link from "next/link";
import { siteService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for BRIXLORE.",
};

export default async function PrivacyPolicyPage() {
  const page = await siteService.getPage("privacy-policy");
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
            Privacy
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {page?.title || "Privacy Policy"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300 sm:text-base">
            This page explains what information Brixlore collects, how it is
            used, and what choices you have regarding your data.
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
          <div className="mt-8 space-y-6">
            <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
              <h2 className="text-xl font-semibold text-white">
                1. Information We Collect
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                We may collect account information (such as name and email),
                subscription details, device metadata, and usage activity needed
                to deliver and improve the service.
              </p>
            </section>

            <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
              <h2 className="text-xl font-semibold text-white">
                2. How We Use Information
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                We use data to authenticate access, manage subscriptions,
                personalize content recommendations, support customers, and
                monitor platform performance.
              </p>
            </section>

            <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
              <h2 className="text-xl font-semibold text-white">
                3. Data Sharing and Security
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                We do not sell personal information. We may share limited data
                with trusted service providers for payment, analytics, and
                operations under contractual safeguards.
              </p>
            </section>

            <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
              <h2 className="text-xl font-semibold text-white">
                4. Your Rights and Choices
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                Depending on your region, you may request access, correction, or
                deletion of data and adjust cookie settings.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/cookie-consent"
                  className="inline-flex items-center rounded-full border border-neutral-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-neutral-300"
                >
                  Cookie Preferences
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full border border-neutral-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-neutral-300"
                >
                  Privacy Request
                </Link>
              </div>
            </section>
          </div>
        )}
      </article>
    </main>
  );
}
