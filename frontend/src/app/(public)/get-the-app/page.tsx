import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownToLine,
  Check,
  ChevronRight,
  Download,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { SITE_BRAND } from "@/lib/seo";
import { siteService } from "@/lib/services";
import { ShimmerButton } from "@/components/ui/shimmer-button";

export const metadata: Metadata = {
  title: "Get the App",
  description: `Download ${SITE_BRAND} on your preferred device.`,
};

const steps = [
  [
    "01",
    "Download the APK",
    "Save the verified Brixlore Android build to your device.",
  ],
  [
    "02",
    "Allow installation",
    "When prompted, allow installs from your browser or file manager.",
  ],
  [
    "03",
    "Open your world",
    "Install, sign in, and pick up your next story instantly.",
  ],
];

const benefits = [
  "Built for your phone",
  "Your account, synced",
  "Stream in high quality",
];

export default async function GetTheAppPage() {
  const page = await siteService.getPage("get-the-app");
  const androidApkUrl =
    process.env.NEXT_PUBLIC_ANDROID_APK_URL || "/downloads/brixlore-latest.apk";
  const title = page?.title || "Take Brixlore with you.";

  return (
    <main className="overflow-hidden bg-black text-white">
      <section className="relative isolate border-b border-white/10 bg-[#070707]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_38%,rgba(255,255,255,0.17),transparent_22%),radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.08),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 -z-10 bg-[linear-gradient(90deg,transparent_49.8%,rgba(255,255,255,0.07)_50%,transparent_50.2%)] bg-[length:100%_100%]" />
        <div className="container 2xl:!max-w-[1920px] 2xl:!px-[100px]">
          <div className="relative flex min-h-[650px] items-center py-[145px] sm:min-h-[710px] lg:min-h-[780px] lg:py-[170px]">
            <div
              className="pointer-events-none absolute bottom-10 left-0 select-none whitespace-nowrap text-[22vw] font-semibold leading-none tracking-[-0.1em] text-white/[0.035] sm:bottom-2"
              aria-hidden="true"
            >
              BRIXLORE
            </div>
            <div className="relative z-10 max-w-[1080px]">
              <h1 className="max-w-[1040px] text-5xl font-semibold leading-[0.92] tracking-[-0.065em] text-white sm:text-7xl lg:text-8xl xl:text-[112px]">
                {title}
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
                The culture, stories, and shows you love—now designed to move at
                your pace. Download the Brixlore app and keep watching wherever
                life takes you.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href={androidApkUrl}
                  className="group inline-flex min-h-14 items-center gap-3 rounded-full bg-white px-6 text-sm font-bold text-black transition hover:bg-white/80"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:translate-y-0.5">
                    <Download size={16} />
                  </span>
                  Download APK
                </a>
                <a
                  href="#how-to-install"
                  className="inline-flex items-center gap-2 px-2 text-sm font-bold text-white/70 transition hover:text-white"
                >
                  How it works <ChevronRight size={17} />
                </a>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-white/60">
                {benefits.map((benefit) => (
                  <span key={benefit} className="flex items-center gap-2">
                    <Check size={16} className="text-white" />
                    {benefit}
                  </span>
                ))}
              </div>
              <div className="mt-14 grid max-w-[850px] grid-cols-1 border-t border-white/15 sm:grid-cols-3 sm:divide-x sm:divide-white/15">
                <div className="py-5 sm:pr-6">
                  <p className="text-2xl font-semibold tracking-[-0.05em] text-white">
                    01
                  </p>
                  <p className="mt-2 text-sm text-white/55">
                    Download direct from Brixlore.
                  </p>
                </div>
                <div className="py-5 sm:px-6">
                  <p className="text-2xl font-semibold tracking-[-0.05em] text-white">
                    HD
                  </p>
                  <p className="mt-2 text-sm text-white/55">
                    A focused streaming experience.
                  </p>
                </div>
                <div className="py-5 sm:pl-6">
                  <p className="text-2xl font-semibold tracking-[-0.05em] text-white">
                    ∞
                  </p>
                  <p className="mt-2 text-sm text-white/55">
                    Your stories, always in reach.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-white text-black">
        <div className="container 2xl:!max-w-[1920px] 2xl:!px-[100px]">
          <div className="grid grid-cols-1 divide-y divide-black/10 md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              [
                Smartphone,
                "Mobile first",
                "Made for the way you actually watch.",
              ],
              [
                ShieldCheck,
                "Verified build",
                "Download directly from Brixlore.",
              ],
              [
                ArrowDownToLine,
                "One tap away",
                "Install in minutes, then press play.",
              ],
            ].map(([Icon, heading, copy]) => {
              const FeatureIcon = Icon as typeof Smartphone;
              return (
                <div
                  key={heading as string}
                  className="flex gap-5 px-0 py-8 md:px-8 md:py-10 first:md:pl-0 last:md:pr-0"
                >
                  <FeatureIcon
                    size={25}
                    strokeWidth={1.7}
                    className="mt-0.5 shrink-0"
                  />
                  <div>
                    <h2 className="text-lg font-bold tracking-[-0.03em] text-black">
                      {heading as string}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-black/60">
                      {copy as string}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="how-to-install"
        className="bg-black py-[80px] md:py-[110px] lg:py-[140px]"
      >
        <div className="container 2xl:!max-w-[1920px] 2xl:!px-[100px]">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Get started
              </p>
              <h2 className="mt-5 max-w-md text-4xl font-semibold leading-[0.96] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                Your next screen is waiting.
              </h2>
              <p className="mt-6 max-w-md leading-7 text-white/60">
                Android publishing is in progress. Until then, install the
                latest verified preview directly from Brixlore.
              </p>
              <a
                href={androidApkUrl}
                className="mt-8 inline-flex items-center gap-2 border-b border-white pb-2 text-sm font-bold transition hover:text-white/60"
              >
                Get the latest APK <Download size={16} />
              </a>
            </div>
            <div className="border-t border-white/15">
              {steps.map(([number, heading, copy]) => (
                <div
                  key={number}
                  className="grid grid-cols-[70px_1fr] gap-4 border-b border-white/15 py-7 sm:grid-cols-[110px_1fr] sm:py-9"
                >
                  <span className="text-sm font-bold text-white/40">
                    {number}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
                      {heading}
                    </h3>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-white/60 sm:text-base">
                      {copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {page?.content?.trim() && (
        <section className="border-t border-white/10 bg-[#0c0c0c] py-14 text-white/65">
          <div className="container max-w-3xl text-base leading-8">
            {page.content}
          </div>
        </section>
      )}

      <section className="py-[20px] bg-black text-white md:pb-[90px]">
        <div className="container 2xl:!max-w-[1920px] 2xl:!px-[100px]">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                Need a hand?
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                We’ll get you watching.
              </h2>
            </div>
            <Link
              href="/help-center"
              className="inline-flex"
            >
              <ShimmerButton className="inline-flex items-center justify-center">
                Visit Help Center
              </ShimmerButton>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
