import type { Metadata } from "next";
import Link from "next/link";
import { SITE_BRAND } from "@/lib/seo";
import { siteService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Get the App",
  description: `Download ${SITE_BRAND} on your preferred device.`,
};

export default async function GetTheAppPage() {
  const page = await siteService.getPage("get-the-app");
  const androidApkUrl =
    process.env.NEXT_PUBLIC_ANDROID_APK_URL || "/downloads/brixlore-latest.apk";

  return (
    <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          {page?.title || "Get the App"}
        </h1>

        <section className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 p-6 shadow-sm dark:border-neutral-700 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Android Early Access
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">
                Install {SITE_BRAND} Preview APK
              </h2>
              <p className="mt-2 max-w-xl text-sm text-neutral-600 dark:text-neutral-300">
                Play Store publishing is in progress. You can install the latest
                verified Android build directly from this page.
              </p>
            </div>
            <div className="shrink-0">
              <a
                href={androidApkUrl}
                className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
              >
                Download APK
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-neutral-200 bg-white/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Step 1
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
                Download the APK
              </p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                Tap the download button and wait for the file to complete.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Step 2
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
                Allow unknown apps
              </p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                If prompted, enable Install unknown apps for your browser or
                file manager.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Step 3
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
                Install and sign in
              </p>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                Open the APK from Downloads, install, then sign in with your
                existing account.
              </p>
            </div>
          </div>
        </section>

        {page?.content?.trim() ? (
          <div className="mt-6 text-neutral-600 dark:text-neutral-300">
            {page.content}
          </div>
        ) : (
          <div className="mt-8 space-y-10 text-neutral-600 dark:text-neutral-300">
            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                More Download Options
              </h2>
              <div className="mt-4 flex flex-wrap gap-4">
                <a
                  href="#"
                  className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
                >
                  iOS (Coming Soon)
                </a>
                <a
                  href={androidApkUrl}
                  className="rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
                >
                  Android APK (Direct)
                </a>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                FAQ
              </h2>
              <div className="mt-4 space-y-4">
                <details className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                  <summary className="cursor-pointer text-base font-semibold text-neutral-100">
                    Is the app free to download?
                  </summary>
                  <p className="mt-2 text-sm">
                    Yes, the app is free to download. Some content requires a
                    premium subscription.
                  </p>
                </details>
                <details className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                  <summary className="cursor-pointer text-base font-semibold text-neutral-100">
                    Can I use my account on multiple devices?
                  </summary>
                  <p className="mt-2 text-sm">
                    Yes, you can sign in on multiple devices and your progress
                    will sync automatically.
                  </p>
                </details>
                <details className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                  <summary className="cursor-pointer text-base font-semibold text-neutral-100">
                    Where can I get installation help?
                  </summary>
                  <p className="mt-2 text-sm">
                    Visit the{" "}
                    <Link
                      href="/help-center"
                      className="underline hover:text-accent"
                    >
                      Help Center
                    </Link>{" "}
                    for guides and troubleshooting.
                  </p>
                </details>
              </div>
            </section>
          </div>
        )}
      </article>
    </main>
  );
}
