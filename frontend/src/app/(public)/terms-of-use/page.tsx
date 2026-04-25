import type { Metadata } from "next";
import Link from "next/link";
import { SITE_BRAND } from "@/lib/seo";
import { siteService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of Use for BRIXLORE.",
};

export default async function TermsOfUsePage() {
  const page = await siteService.getPage("terms-of-use");
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
            Legal
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {page?.title || "Terms of Use"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300 sm:text-base">
            These terms outline the rules and responsibilities for using{" "}
            {SITE_BRAND}. Please review them before creating an account or
            subscribing.
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
            <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
              <h2 className="text-xl font-semibold text-white">
                1. Acceptance of Terms
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                By using {SITE_BRAND}, you agree to these Terms of Use. If you
                do not agree, you should not access or use the service.
              </p>
            </section>

            <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
              <h2 className="text-xl font-semibold text-white">
                2. Service Availability
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                We may update, suspend, or modify features from time to time to
                improve quality, security, or compliance.
              </p>
            </section>

            <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
              <h2 className="text-xl font-semibold text-white">
                3. Accounts and Conduct
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                You are responsible for safeguarding your account and using
                Brixlore lawfully. Misuse, abuse, or unauthorized access may
                result in account suspension.
              </p>
            </section>

            <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
              <h2 className="text-xl font-semibold text-white">
                4. Billing and Cancellation
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">
                Membership billing, renewal, and cancellation terms are provided
                at checkout and within account settings.
              </p>
            </section>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-neutral-800/90 bg-neutral-900/60 px-6 py-4 text-sm text-neutral-300">
          Questions about these terms? Visit our{" "}
          <Link
            href="/contact"
            className="font-semibold text-white underline decoration-neutral-500 underline-offset-4 transition-colors hover:decoration-white"
          >
            contact page
          </Link>{" "}
          for legal support.
        </div>
      </article>
    </main>
  );
}
