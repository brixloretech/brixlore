import type { Metadata } from "next";
import { SITE_BRAND } from "@/lib/seo";
import { siteService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Do Not Sell or Share My Personal Information",
  description: `Your choices regarding the sale or sharing of personal information on ${SITE_BRAND}.`,
};

export default async function DoNotSellPage() {
  const page = await siteService.getPage("do-not-sell");
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
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          {page?.title || "Do Not Sell or Share My Personal Information"}
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Last updated: {new Date().toLocaleDateString("en-US")}
        </p>
        {content ? (
          <div
            className="mt-8 text-neutral-600 dark:text-neutral-300"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="mt-8 space-y-8 text-neutral-600 dark:text-neutral-300">
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Your Choice
              </h2>
              <p className="mt-2 leading-relaxed">
                {SITE_BRAND} does not sell your personal information in the
                traditional sense. Under certain privacy laws (e.g., CCPA/CPRA),
                “sale” and “share” can have broad definitions that include
                activities like targeted advertising or analytics with third
                parties.
              </p>
              <p className="mt-2 leading-relaxed">
                If you would like to opt out of the “sale” or “sharing” of your
                personal information as defined under applicable law, you may do
                so using the options below.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                How to Opt Out
              </h2>
              <ul className="mt-2 list-inside list-disc space-y-2 leading-relaxed">
                <li>
                  Use the cookie and preference settings on the Service to limit
                  non-essential tracking and analytics. See our{" "}
                  <a
                    href="/cookie-consent"
                    className="font-medium text-neutral-900 underline dark:text-white"
                  >
                    Cookie Consent
                  </a>{" "}
                  page.
                </li>
                <li>
                  Contact us with the subject “Do Not Sell or Share My Personal
                  Information” and we will process your request in accordance
                  with applicable law.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Additional Rights
              </h2>
              <p className="mt-2 leading-relaxed">
                Depending on where you live, you may have additional rights
                (e.g., access, deletion, correction). These are described in our{" "}
                <a
                  href="/privacy-policy"
                  className="font-medium text-neutral-900 underline dark:text-white"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Contact
              </h2>
              <p className="mt-2 leading-relaxed">
                For requests or questions about this page, please contact us
                through the contact information provided on the Service.
              </p>
            </section>
          </div>
        )}
      </article>
    </main>
  );
}
