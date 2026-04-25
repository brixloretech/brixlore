import type { Metadata } from "next";
import { SITE_BRAND } from "@/lib/seo";
import { siteService } from "@/lib/services";
import { AdvertisingInquiryForm } from "./AdvertisingInquiryForm";

export const metadata: Metadata = {
  title: "Advertising Inquiries",
  description: `Advertising partnership details for ${SITE_BRAND}.`,
};

export default async function AdvertisingInquiriesPage() {
  const page = await siteService.getPage("advertising-inquiries");

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          {page?.title || "Advertising Inquiries"}
        </h1>

        {page?.content?.trim() ? (
          <div className="mt-6 text-neutral-600 dark:text-neutral-300">
            {page.content}
          </div>
        ) : (
          <div className="mt-8 space-y-10 text-neutral-600 dark:text-neutral-300">
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Partnership Tiers
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <li className="rounded-lg bg-neutral-900/60 p-4">
                  <h3 className="text-lg font-bold text-accent">Bronze</h3>
                  <p className="text-xs mt-2">
                    Brand placement in select series and social shoutouts.
                  </p>
                </li>
                <li className="rounded-lg bg-neutral-900/60 p-4">
                  <h3 className="text-lg font-bold text-accent">Silver</h3>
                  <p className="text-xs mt-2">
                    Featured campaign, custom content, and event sponsorship.
                  </p>
                </li>
                <li className="rounded-lg bg-neutral-900/60 p-4">
                  <h3 className="text-lg font-bold text-accent">Gold</h3>
                  <p className="text-xs mt-2">
                    Full platform integration, exclusive content, and premium
                    placement.
                  </p>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Inquiry Form
              </h2>
              <AdvertisingInquiryForm />
            </section>
          </div>
        )}
      </article>
    </main>
  );
}
