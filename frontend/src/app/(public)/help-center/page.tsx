import type { Metadata } from "next";
import Link from "next/link";
import { SITE_BRAND } from "@/lib/seo";
import { siteService } from "@/lib/services";
import { HelpCenterSupportForm } from "./HelpCenterSupportForm";

export const metadata: Metadata = {
  title: "Help Center",
  description: `Get support and answers for ${SITE_BRAND}.`,
};

export default async function HelpCenterPage() {
  const page = await siteService.getPage("help-center");

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          {page?.title || "Help Center"}
        </h1>

        {page?.content?.trim() ? (
          <div className="mt-6 text-neutral-600 dark:text-neutral-300">
            {page.content}
          </div>
        ) : (
          <div className="mt-8 space-y-10 text-neutral-600 dark:text-neutral-300">
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Quick Links
              </h2>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
                >
                  Log In
                </Link>
                <Link
                  href="/forgot-password"
                  className="rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
                >
                  Forgot Password
                </Link>
                <Link
                  href="/subscription"
                  className="rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
                >
                  Manage Subscription
                </Link>
                <Link
                  href="/contact"
                  className="rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
                >
                  Contact Support
                </Link>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Frequently Asked Questions
              </h2>
              <div className="mt-4 space-y-4">
                <details className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                  <summary className="cursor-pointer text-base font-semibold text-neutral-100">
                    How do I reset my password?
                  </summary>
                  <p className="mt-2 text-sm">
                    Go to{" "}
                    <Link
                      href="/forgot-password"
                      className="underline hover:text-accent"
                    >
                      Forgot Password
                    </Link>{" "}
                    and follow the instructions to reset your password.
                  </p>
                </details>
                <details className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                  <summary className="cursor-pointer text-base font-semibold text-neutral-100">
                    How can I change my subscription plan?
                  </summary>
                  <p className="mt-2 text-sm">
                    Visit{" "}
                    <Link
                      href="/subscription"
                      className="underline hover:text-accent"
                    >
                      Subscription
                    </Link>{" "}
                    to view and change your plan options.
                  </p>
                </details>
                <details className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                  <summary className="cursor-pointer text-base font-semibold text-neutral-100">
                    Where can I get technical support?
                  </summary>
                  <p className="mt-2 text-sm">
                    Use our{" "}
                    <Link
                      href="/contact"
                      className="underline hover:text-accent"
                    >
                      contact form
                    </Link>{" "}
                    for technical issues and our team will assist you.
                  </p>
                </details>
                <details className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                  <summary className="cursor-pointer text-base font-semibold text-neutral-100">
                    How do I update my account information?
                  </summary>
                  <p className="mt-2 text-sm">
                    Log in and go to your account settings to update your
                    information.
                  </p>
                </details>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Contact Support
              </h2>
              <HelpCenterSupportForm />
            </section>
          </div>
        )}
      </article>
    </main>
  );
}
