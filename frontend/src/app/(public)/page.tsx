// import Image from "next/image";
// import Link from "next/link";
// import type { Metadata } from "next";
// import { HomePlansSectionAuthGate } from "@/components/content/HomePlansSectionAuthGate";
// import { GuestOnly } from "@/components/content/GuestOnly";
// import {
//   SITE_BRAND,
//   SITE_DESCRIPTION,
//   SITE_KEYWORDS,
//   SITE_TAGLINE,
//   absoluteUrl,
// } from "@/lib/seo";
// import { parseBranding } from "@/lib/branding";
// import {
//   contentService,
//   siteService,
//   subscriptionService,
// } from "@/lib/services";

// export const metadata: Metadata = {
//   title: SITE_TAGLINE,
//   description: SITE_DESCRIPTION,
//   keywords: SITE_KEYWORDS,
//   openGraph: {
//     title: SITE_TAGLINE,
//     description: SITE_DESCRIPTION,
//     url: absoluteUrl("/"),
//     type: "website",
//   },
//   twitter: {
//     title: SITE_TAGLINE,
//     description: SITE_DESCRIPTION,
//   },
//   alternates: {
//     canonical: absoluteUrl("/"),
//   },
// };

// function WebSiteJsonLd() {
//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "WebSite",
//     name: SITE_BRAND,
//     description: SITE_DESCRIPTION,
//     url: absoluteUrl("/"),
//     potentialAction: {
//       "@type": "SearchAction",
//       target: {
//         "@type": "EntryPoint",
//         urlTemplate: `${absoluteUrl("/browse")}?q={search_term_string}`,
//       },
//       "query-input": "required name=search_term_string",
//     },
//   };
//   return (
//     <script
//       type="application/ld+json"
//       dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//     />
//   );
// }

// function PerkIcon({ kind }: { kind: string }) {
//   switch (kind) {
//     case "adfree":
//       return (
//         <svg
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="1.8"
//           className="h-5 w-5"
//           aria-hidden
//         >
//           <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
//           <path d="M6 18.5L18 5.5" />
//         </svg>
//       );
//     case "library":
//       return (
//         <svg
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="1.8"
//           className="h-5 w-5"
//           aria-hidden
//         >
//           <rect x="4" y="4" width="6" height="16" rx="1.5" />
//           <rect x="14" y="4" width="6" height="16" rx="1.5" />
//           <path d="M10 8h4" />
//         </svg>
//       );
//     case "early":
//       return (
//         <svg
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="1.8"
//           className="h-5 w-5"
//           aria-hidden
//         >
//           <circle cx="12" cy="12" r="8" />
//           <path d="M12 8v4l3 2" />
//         </svg>
//       );
//     case "discount":
//       return (
//         <svg
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="1.8"
//           className="h-5 w-5"
//           aria-hidden
//         >
//           <path d="M5 7h8l6 6-6 6-6-6V7z" />
//           <circle cx="9" cy="10" r="1" />
//         </svg>
//       );
//     case "bonus":
//       return (
//         <svg
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="1.8"
//           className="h-5 w-5"
//           aria-hidden
//         >
//           <rect x="4" y="6" width="16" height="12" rx="2" />
//           <path d="M10 9.5L15 12l-5 2.5v-5z" />
//         </svg>
//       );
//     case "events":
//       return (
//         <svg
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="1.8"
//           className="h-5 w-5"
//           aria-hidden
//         >
//           <rect x="4" y="5" width="16" height="15" rx="2" />
//           <path d="M8 3v4M16 3v4M4 10h16" />
//         </svg>
//       );
//     case "devices":
//       return (
//         <svg
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="1.8"
//           className="h-5 w-5"
//           aria-hidden
//         >
//           <rect x="3" y="6" width="13" height="10" rx="1.8" />
//           <rect x="17" y="9" width="4" height="7" rx="1" />
//         </svg>
//       );
//     default:
//       return (
//         <svg
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="1.8"
//           className="h-5 w-5"
//           aria-hidden
//         >
//           <circle cx="12" cy="12" r="8" />
//         </svg>
//       );
//   }
// }

// type HomeProps = {
//   searchParams: Promise<{ cycle?: string }>;
// };

// export default async function Home({ searchParams }: HomeProps) {
//   const { cycle } = await searchParams;
//   const homeBillingCycle =
//     cycle?.toLowerCase() === "yearly" ? "yearly" : "monthly";

//   const [brandingPage, bannerVideoSrc, plans, browseItems] = await Promise.all([
//     siteService.getPage("branding", { cache: "no-store" }),
//     siteService.getBrandingBannerVideoUrl(),
//     subscriptionService.getPlans().catch(() => []),
//     contentService
//       .getContentForBrowse(undefined, { cache: "no-store" })
//       .catch(() => []),
//   ]);

//   const branding = parseBranding(brandingPage?.content ?? "");
//   const bannerSrc = branding.bannerUrl?.trim() || "/hero-banner.png";
//   const heroVideoId = "TEjHDF9QXTY";
//   const heroVideoSrc = `https://www.youtube.com/embed/${heroVideoId}?autoplay=1&mute=1&loop=1&playlist=${heroVideoId}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1`;
//   const homePlans = [...plans].sort((a, b) => a.price - b.price);
//   const showcaseItems = browseItems.slice(0, 6);

//   return (
//     <main className="flex flex-1 flex-col">
//       <WebSiteJsonLd />

//       {/* Full-screen hero: banner image + optional video (uploaded or YouTube) */}
//       <section
//         className="relative flex min-h-[100dvh] w-full max-w-full flex-col items-center justify-center overflow-hidden px-4 py-16"
//         aria-label="Hero"
//       >
//         <div className="absolute inset-0">
//           <Image
//             src={bannerSrc}
//             alt=""
//             fill
//             priority
//             className="absolute inset-0 h-full w-full object-cover object-center"
//             sizes="100vw"
//             unoptimized
//           />
//           {bannerVideoSrc ? (
//             <div className="absolute inset-0 overflow-hidden" aria-hidden>
//               <video
//                 autoPlay
//                 muted
//                 loop
//                 playsInline
//                 className="absolute inset-0 h-full w-full object-cover"
//                 src={bannerVideoSrc}
//                 title="Hero background video"
//               />
//             </div>
//           ) : (
//             <div className="absolute inset-0 overflow-hidden" aria-hidden>
//               <iframe
//                 className="absolute left-1/2 top-1/2 h-[56.25vw] w-[177.78vh] min-h-full min-w-full -translate-x-1/2 -translate-y-1/2"
//                 src={heroVideoSrc}
//                 title="Hero background video"
//                 allow="autoplay; encrypted-media; picture-in-picture"
//                 referrerPolicy="strict-origin-when-cross-origin"
//               />
//             </div>
//           )}
//           <div className="absolute inset-0 bg-black/35" aria-hidden />
//         </div>
//         <div className="relative z-10 flex flex-col items-center justify-center text-center">
//           {/* <div className="relative mb-8">
//             <Image
//               src="/logo.png"
//               alt={SITE_BRAND}
//               width={280}
//               height={96}
//               className="h-20 w-auto object-contain sm:h-24"
//               priority
//             />
//           </div> */}
//           <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl">
//             Brixlore - Built From Culture
//           </h1>
//           <p className="mt-4 max-w-xl text-center text-lg text-white/90 drop-shadow-md">
//             Join Brixlore and Access the Urban Archive
//           </p>
//           <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
//             <Link
//               href="/browse"
//               className="rounded-xl bg-accent px-8 py-4 text-base font-semibold text-accent-foreground shadow-accent-glow transition-colors hover:bg-accent/90 sm:px-9 sm:py-4.5"
//             >
//               Start Watching
//             </Link>
//           </div>
//         </div>
//       </section>

//       <div className="relative flex flex-1 flex-col items-center bg-[#121212] px-4 py-16 sm:px-6 lg:px-8">
//         <div
//           className="pointer-events-none absolute inset-0 opacity-70"
//           aria-hidden
//           style={{
//             backgroundImage:
//               "radial-gradient(circle at 15% 0%, rgba(34,34,34,0.42), transparent 36%), radial-gradient(circle at 85% 0%, rgba(24,24,24,0.32), transparent 34%), radial-gradient(circle at 50% 100%, rgba(10,10,10,0.28), transparent 40%)",
//           }}
//         />

//         {/* 2. Plans - monthly/annual option */}
//         <HomePlansSectionAuthGate
//           plans={homePlans}
//           initialCycle={homeBillingCycle}
//         />

//         {/* 3. Browse - content showcase */}
//         <section
//           className="relative mt-16 w-full max-w-6xl"
//           aria-labelledby="home-browse-heading"
//         >
//           <div className="flex items-end justify-between gap-4">
//             <div>
//               <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
//                 Browse
//               </p>
//               <h2
//                 id="home-browse-heading"
//                 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl"
//               >
//                 Discover What to Watch Next
//               </h2>
//             </div>
//             <Link
//               href="/browse"
//               className="hidden text-sm font-semibold text-neutral-300 transition-colors hover:text-white sm:inline-flex"
//             >
//               View all
//             </Link>
//           </div>

//           <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
//             {showcaseItems.map((item) => (
//               <Link
//                 key={item.id}
//                 href={`/watch/${item.id}`}
//                 className="group transform-gpu transition-transform duration-300 hover:scale-[1.02]"
//                 aria-label={`Watch ${item.title}`}
//               >
//                 <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
//                   <Image
//                     src={item.posterUrl || bannerSrc}
//                     alt={item.title}
//                     fill
//                     className="object-contain object-center"
//                     sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
//                     unoptimized
//                   />
//                 </div>
//                 <p className="mt-2 truncate text-sm font-semibold text-white">
//                   {item.title}
//                 </p>
//                 <p className="text-xs text-neutral-400">{item.type}</p>
//               </Link>
//             ))}
//           </div>
//         </section>

//         <GuestOnly>
//           {/* 4. Already a member? - login section */}
//           <section
//             className="relative mt-16 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-neutral-800/90 bg-gradient-to-b from-neutral-900/85 to-neutral-950/95 px-6 py-10 shadow-[0_26px_70px_rgba(0,0,0,0.45)] sm:px-8 sm:py-12"
//             aria-labelledby="home-login-heading"
//           >
//             <div
//               className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/8 to-transparent"
//               aria-hidden
//             />

//             <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.9fr] lg:items-center">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
//                   Member Access
//                 </p>
//                 <h2
//                   id="home-login-heading"
//                   className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl"
//                 >
//                   Already a Member?
//                 </h2>
//                 <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base">
//                   Sign in to continue your watchlist, resume from your last
//                   scene, and access your personal recommendations.
//                 </p>

//                 <div className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-neutral-500">
//                   <span className="rounded-full border border-neutral-700 px-3 py-1.5">
//                     Secure sign-in
//                   </span>
//                   <span className="rounded-full border border-neutral-700 px-3 py-1.5">
//                     Personalized queue
//                   </span>
//                   <span className="rounded-full border border-neutral-700 px-3 py-1.5">
//                     Fast account recovery
//                   </span>
//                 </div>
//               </div>

//               <div className="rounded-2xl border border-neutral-800/90 bg-neutral-900/60 p-5 sm:p-6">
//                 <p className="text-sm font-semibold text-white">
//                   Account Portal
//                 </p>
//                 <p className="mt-2 text-sm text-neutral-400">
//                   Access your membership dashboard, billing details, and profile
//                   settings in one place.
//                 </p>

//                 <div className="mt-5 flex flex-col gap-3">
//                   <Link
//                     href="/login"
//                     className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-6 text-base font-semibold text-accent-foreground shadow-accent-glow transition-colors hover:bg-accent/90"
//                   >
//                     Log In
//                   </Link>
//                   <Link
//                     href="/contact"
//                     className="inline-flex h-10 w-full items-center justify-center rounded-full border border-neutral-600 px-6 text-sm font-semibold text-neutral-200 transition-colors hover:border-neutral-400 hover:text-white"
//                   >
//                     Need account help?
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           </section>
//         </GuestOnly>

//         {/* 5. Get more with membership - benefits */}
//         <section
//           className="relative mt-16 w-full max-w-6xl"
//           aria-labelledby="home-benefits-heading"
//         >
//           <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
//             Premium Perks
//           </p>
//           <h2
//             id="home-benefits-heading"
//             className="mt-3 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
//           >
//             Get More with Membership
//           </h2>
//           <p className="mx-auto mt-3 max-w-3xl text-center text-sm text-neutral-300 sm:text-base">
//             Enjoy a smoother, ad-free experience with faster access and extra
//             value across the BRIXLORE platform.
//           </p>

//           <div className="mx-auto mt-7 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

//           <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//             {[
//               {
//                 title: "Ad-free playback",
//                 detail: "Watch without interruptions.",
//                 icon: "adfree",
//               },
//               {
//                 title: "Full library access",
//                 detail: "BRIXLORE originals and exclusives.",
//                 icon: "library",
//               },
//               {
//                 title: "Early premieres",
//                 detail: "Selected drops available first.",
//                 icon: "early",
//               },
//               {
//                 title: "Member discounts",
//                 detail: "Extra savings on partner merch.",
//                 icon: "discount",
//               },
//               {
//                 title: "Bonus content",
//                 detail: "Scenes, commentary, and extras.",
//                 icon: "bonus",
//               },
//               {
//                 title: "Special event access",
//                 detail: "Limited releases and live sessions.",
//                 icon: "events",
//               },
//               {
//                 title: "Multi-device streaming",
//                 detail: "Screen limits vary by plan.",
//                 icon: "devices",
//               },
//               {
//                 title: "Continue watching",
//                 detail: "Save titles and continue from any device.",
//                 icon: "devices",
//               },
//             ].map((perk, index) => (
//               <div
//                 key={perk.title}
//                 className="group rounded-2xl border border-neutral-800/90 bg-gradient-to-b from-neutral-900/90 to-neutral-950/95 p-5 shadow-[0_16px_34px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-1 hover:border-neutral-600 hover:shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
//               >
//                 <div className="mb-4 flex items-center justify-between">
//                   <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900/80 text-neutral-200">
//                     <PerkIcon kind={perk.icon} />
//                   </div>
//                   <span className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-neutral-500">
//                     {String(index + 1).padStart(2, "0")}
//                   </span>
//                 </div>
//                 <p className="text-base font-semibold leading-snug text-white">
//                   {perk.title}
//                 </p>
//                 <p className="mt-2 text-sm leading-5 text-neutral-400">
//                   {perk.detail}
//                 </p>
//               </div>
//             ))}
//           </div>

//           <div className="mt-8 text-center">
//             <Link
//               href="/subscription"
//               className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-accent-glow transition-colors hover:bg-accent/90"
//             >
//               Compare All Plans
//             </Link>
//           </div>
//         </section>

//         {/* 6. FAQ */}
//         <section
//           className="relative mt-16 w-full max-w-4xl"
//           aria-labelledby="home-faq-heading"
//         >
//           <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
//             Support
//           </p>
//           <h2
//             id="home-faq-heading"
//             className="mt-3 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
//           >
//             Frequently Asked Questions
//           </h2>
//           <p className="mx-auto mt-3 max-w-3xl text-center text-sm text-neutral-300 sm:text-base">
//             Quick answers about billing, plans, and account access. If your
//             question is not listed, contact our support team.
//           </p>

//           <div className="mt-8 space-y-3">
//             {[
//               {
//                 q: "What is Brixlore.TV?",
//                 a: "Brixlore.TV is a direct-to-consumer subscription platform for urban-centric original content. Featuring documentaries, original series, and curated programming, Brixlore.TV is built for viewers who want deeper stories shaped by culture.",
//               },
//               {
//                 q: "What kind of content is on Brixlore?",
//                 a: "Brixlore features original series, documentaries, and editorial storytelling centered around contemporary, historical, and the future of culture. Everything from hip hop, pop culture, sports, entertainment, to gritty street tales and more.",
//               },
//               {
//                 q: "How often are new episodes released?",
//                 a: "New episodes are released every month, with new shows and series added as the Brixlore library continues to grow.",
//               },
//               {
//                 q: "Is there a free account?",
//                 a: "Yes. You can create a free Brixlore account to explore previews, trailers, and featured content before choosing a membership.",
//               },
//               {
//                 q: "Can I cancel anytime?",
//                 a: "Yes. Brixlore memberships are month-to-month, and you can cancel anytime directly from your account.",
//               },
//               {
//                 q: "Where can I watch Brixlore?",
//                 a: "You can watch Brixlore on your TV, phone, tablet, or desktop browser. Simply log in to your Brixlore account and stream anytime from anywhere.",
//               },
//             ].map((item) => (
//               <details
//                 key={item.q}
//                 className="group rounded-2xl border border-neutral-800/90 bg-gradient-to-b from-neutral-900/85 to-neutral-950/95"
//               >
//                 <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:content-none sm:px-6">
//                   <span className="text-sm font-semibold text-white sm:text-base">
//                     {item.q}
//                   </span>
//                   <span
//                     className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-neutral-700 text-lg leading-none text-neutral-300 transition-transform duration-200 group-open:rotate-45 group-open:border-neutral-500 group-open:text-white"
//                     aria-hidden
//                   >
//                     +
//                   </span>
//                 </summary>
//                 <div className="border-t border-neutral-800/90 px-5 pb-5 pt-3 sm:px-6">
//                   <p className="text-sm leading-6 text-neutral-300">{item.a}</p>
//                 </div>
//               </details>
//             ))}
//           </div>

//           <div className="mt-6 rounded-2xl border border-neutral-800/90 bg-neutral-900/70 px-5 py-4 sm:px-6">
//             <p className="text-sm text-neutral-300">
//               Still need help? Visit our
//               <Link
//                 href="/contact"
//                 className="ml-1 font-semibold text-white underline decoration-neutral-500 underline-offset-4 transition-colors hover:decoration-white"
//               >
//                 help center
//               </Link>{" "}
//               for direct support.
//             </p>
//           </div>
//         </section>

//         {/* 7. Questions/help center -> contact form */}
//         <section
//           className="relative mt-16 w-full max-w-4xl text-center"
//           aria-labelledby="home-help-heading"
//         >
//           <h2
//             id="home-help-heading"
//             className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
//           >
//             Questions?
//           </h2>
//           <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-300 sm:text-base">
//             Need help with plans, billing, or streaming? Reach out and we will
//             guide you.
//           </p>
//           <div className="mt-6">
//             <Link
//               href="/contact"
//               className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-accent-glow transition-colors hover:bg-accent/90"
//             >
//               Contact Us
//             </Link>
//           </div>
//         </section>
//       </div>
//     </main>
//   );
// }

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { HomePlansSectionAuthGate } from "@/components/content/HomePlansSectionAuthGate";
import { GuestOnly } from "@/components/content/GuestOnly";
import {
  SITE_BRAND,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_TAGLINE,
  absoluteUrl,
} from "@/lib/seo";
import { parseBranding } from "@/lib/branding";
import { HeroVideo } from "@/components/content/HeroVideo";
import {
  contentService,
  siteService,
  subscriptionService,
} from "@/lib/services";

export const metadata: Metadata = {
  title: SITE_TAGLINE,
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  openGraph: {
    title: SITE_TAGLINE,
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    type: "website",
  },
  twitter: {
    title: SITE_TAGLINE,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: absoluteUrl("/"),
  },
};

function WebSiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_BRAND,
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/browse")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function PerkIcon({ kind }: { kind: string }) {
  switch (kind) {
    case "adfree":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden
        >
          <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
          <path d="M6 18.5L18 5.5" />
        </svg>
      );
    case "library":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden
        >
          <rect x="4" y="4" width="6" height="16" rx="1.5" />
          <rect x="14" y="4" width="6" height="16" rx="1.5" />
          <path d="M10 8h4" />
        </svg>
      );
    case "early":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden
        >
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      );
    case "discount":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M5 7h8l6 6-6 6-6-6V7z" />
          <circle cx="9" cy="10" r="1" />
        </svg>
      );
    case "bonus":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden
        >
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="M10 9.5L15 12l-5 2.5v-5z" />
        </svg>
      );
    case "events":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden
        >
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      );
    case "devices":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden
        >
          <rect x="3" y="6" width="13" height="10" rx="1.8" />
          <rect x="17" y="9" width="4" height="7" rx="1" />
        </svg>
      );
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden
        >
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

type HomeProps = {
  searchParams: Promise<{ cycle?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { cycle } = await searchParams;
  const homeBillingCycle =
    cycle?.toLowerCase() === "yearly" ? "yearly" : "monthly";

  const [brandingPage, bannerVideoSrc, plans, browseItems] = await Promise.all([
    siteService.getPage("branding", { cache: "no-store" }),
    siteService.getBrandingBannerVideoUrl(),
    subscriptionService.getPlans().catch(() => []),
    contentService
      .getContentForBrowse(undefined, { cache: "no-store" })
      .catch(() => []),
  ]);

  const branding = parseBranding(brandingPage?.content ?? "");
  const bannerSrc = branding.bannerUrl?.trim() || "/hero-banner.png";
  // const heroVideoId = "TEjHDF9QXTY";
  // const heroVideoSrc = `https://www.youtube.com/embed/${heroVideoId}?autoplay=1&mute=1&loop=1&playlist=${heroVideoId}&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1`;
  const homePlans = [...plans].sort((a, b) => a.price - b.price);
  const showcaseItems = browseItems.slice(0, 6);

  return (
    <main className="flex flex-1 flex-col">
      <WebSiteJsonLd />

      {/* Full-screen hero: banner image + optional video (uploaded or YouTube) */}
      <section
        className="relative flex min-h-[100dvh] w-full max-w-full flex-col items-center justify-center overflow-hidden px-4 py-16"
        aria-label="Hero"
      >
        <div className="absolute inset-0">
          <Image
            src={bannerSrc}
            alt=""
            fill
            priority
            className="absolute inset-0 h-full w-full object-cover object-center"
            sizes="100vw"
            unoptimized
          />
          {/* {bannerVideoSrc ? (
            <div className="absolute inset-0 overflow-hidden" aria-hidden>
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
                src={bannerVideoSrc}
                title="Hero background video"
              />
            </div>
          ) : (
            <div className="absolute inset-0 overflow-hidden" aria-hidden>
              <iframe
                className="absolute left-1/2 top-1/2 h-[56.25vw] w-[177.78vh] min-h-full min-w-full -translate-x-1/2 -translate-y-1/2"
                src={heroVideoSrc}
                title="Hero background video"
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          )} */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden>
            <HeroVideo
              uploadedSrc={bannerVideoSrc ?? "/LandingPageBanner.mp4"}
            />
          </div>
          <div className="absolute inset-0 bg-black/35" aria-hidden />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          {/* <div className="relative mb-8">
            <Image
              src="/logo.png"
              alt={SITE_BRAND}
              width={280}
              height={96}
              className="h-20 w-auto object-contain sm:h-24"
              priority
            />
          </div> */}
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl">
            Built From Culture
          </h1>
          <p className="mt-4 max-w-xl text-center text-lg text-white/90 drop-shadow-md">
            Join Brixlore and Access the Urban Archive
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/browse"
              className="rounded-xl bg-accent px-8 py-4 text-base font-semibold text-accent-foreground shadow-accent-glow transition-colors hover:bg-accent/90 sm:px-9 sm:py-4.5"
            >
              Start Watching
            </Link>
          </div>
        </div>
      </section>

      <div className="relative flex flex-1 flex-col items-center bg-[#121212] px-4 py-16 sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 0%, rgba(34,34,34,0.42), transparent 36%), radial-gradient(circle at 85% 0%, rgba(24,24,24,0.32), transparent 34%), radial-gradient(circle at 50% 100%, rgba(10,10,10,0.28), transparent 40%)",
          }}
        />

        {/* 2. Plans - monthly/annual option */}
        <HomePlansSectionAuthGate
          plans={homePlans}
          initialCycle={homeBillingCycle}
        />

        {/* 3. Browse - content showcase */}
        <section
          className="relative mt-16 w-full max-w-6xl"
          aria-labelledby="home-browse-heading"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
                Browse
              </p>
              <h2
                id="home-browse-heading"
                className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl"
              >
                Discover What to Watch Next
              </h2>
            </div>
            <Link
              href="/browse"
              className="hidden text-sm font-semibold text-neutral-300 transition-colors hover:text-white sm:inline-flex"
            >
              View all
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {showcaseItems.map((item) => (
              <Link
                key={item.id}
                href={`/watch/${item.id}`}
                className="group transform-gpu transition-transform duration-300 hover:scale-[1.02]"
                aria-label={`Watch ${item.title}`}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
                  <Image
                    src={item.posterUrl || bannerSrc}
                    alt={item.title}
                    fill
                    className="object-contain object-center"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    unoptimized
                  />
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-white">
                  {item.title}
                </p>
                <p className="text-xs text-neutral-400">{item.type}</p>
              </Link>
            ))}
          </div>
        </section>

        <GuestOnly>
          {/* 4. Already a member? - login section */}
          <section
            className="relative mt-16 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-neutral-800/90 bg-gradient-to-b from-neutral-900/85 to-neutral-950/95 px-6 py-10 shadow-[0_26px_70px_rgba(0,0,0,0.45)] sm:px-8 sm:py-12"
            aria-labelledby="home-login-heading"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/8 to-transparent"
              aria-hidden
            />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.9fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
                  Member Access
                </p>
                <h2
                  id="home-login-heading"
                  className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl"
                >
                  Already a Member?
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base">
                  Sign in to continue your watchlist, resume from your last
                  scene, and access your personal recommendations.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-neutral-500">
                  <span className="rounded-full border border-neutral-700 px-3 py-1.5">
                    Secure sign-in
                  </span>
                  <span className="rounded-full border border-neutral-700 px-3 py-1.5">
                    Personalized queue
                  </span>
                  <span className="rounded-full border border-neutral-700 px-3 py-1.5">
                    Fast account recovery
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800/90 bg-neutral-900/60 p-5 sm:p-6">
                <p className="text-sm font-semibold text-white">
                  Account Portal
                </p>
                <p className="mt-2 text-sm text-neutral-400">
                  Access your membership dashboard, billing details, and profile
                  settings in one place.
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    href="/login"
                    className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-6 text-base font-semibold text-accent-foreground shadow-accent-glow transition-colors hover:bg-accent/90"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex h-10 w-full items-center justify-center rounded-full border border-neutral-600 px-6 text-sm font-semibold text-neutral-200 transition-colors hover:border-neutral-400 hover:text-white"
                  >
                    Need account help?
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </GuestOnly>

        {/* 5. Get more with membership - benefits */}
        <section
          className="relative mt-16 w-full max-w-6xl"
          aria-labelledby="home-benefits-heading"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
            Premium Perks
          </p>
          <h2
            id="home-benefits-heading"
            className="mt-3 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Get More with Membership
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-center text-sm text-neutral-300 sm:text-base">
            Enjoy a smoother, ad-free experience with faster access and extra
            value across the BRIXLORE platform.
          </p>

          <div className="mx-auto mt-7 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Ad-free playback",
                detail: "Watch without interruptions.",
                icon: "adfree",
              },
              {
                title: "Full library access",
                detail: "BRIXLORE originals and exclusives.",
                icon: "library",
              },
              {
                title: "Early premieres",
                detail: "Selected drops available first.",
                icon: "early",
              },
              {
                title: "Member discounts",
                detail: "Extra savings on partner merch.",
                icon: "discount",
              },
              {
                title: "Bonus content",
                detail: "Scenes, commentary, and extras.",
                icon: "bonus",
              },
              {
                title: "Special event access",
                detail: "Limited releases and live sessions.",
                icon: "events",
              },
              {
                title: "Multi-device streaming",
                detail: "Screen limits vary by plan.",
                icon: "devices",
              },
              {
                title: "Continue watching",
                detail: "Save titles and continue from any device.",
                icon: "devices",
              },
            ].map((perk, index) => (
              <div
                key={perk.title}
                className="group rounded-2xl border border-neutral-800/90 bg-gradient-to-b from-neutral-900/90 to-neutral-950/95 p-5 shadow-[0_16px_34px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-1 hover:border-neutral-600 hover:shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900/80 text-neutral-200">
                    <PerkIcon kind={perk.icon} />
                  </div>
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="text-base font-semibold leading-snug text-white">
                  {perk.title}
                </p>
                <p className="mt-2 text-sm leading-5 text-neutral-400">
                  {perk.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/subscription"
              className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-accent-glow transition-colors hover:bg-accent/90"
            >
              Compare All Plans
            </Link>
          </div>
        </section>

        {/* 6. FAQ */}
        <section
          className="relative mt-16 w-full max-w-4xl"
          aria-labelledby="home-faq-heading"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
            Support
          </p>
          <h2
            id="home-faq-heading"
            className="mt-3 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-center text-sm text-neutral-300 sm:text-base">
            Quick answers about billing, plans, and account access. If your
            question is not listed, contact our support team.
          </p>

          <div className="mt-8 space-y-3">
            {[
              {
                q: "What is Brixlore.TV?",
                a: "Brixlore.TV is a direct-to-consumer subscription platform for urban-centric original content. Featuring documentaries, original series, and curated programming, Brixlore.TV is built for viewers who want deeper stories shaped by culture.",
              },
              {
                q: "What kind of content is on Brixlore?",
                a: "Brixlore features original series, documentaries, and editorial storytelling centered around contemporary, historical, and the future of culture. Everything from hip hop, pop culture, sports, entertainment, to gritty street tales and more.",
              },
              {
                q: "How often are new episodes released?",
                a: "New episodes are released every month, with new shows and series added as the Brixlore library continues to grow.",
              },
              {
                q: "Is there a free account?",
                a: "Yes. You can create a free Brixlore account to explore previews, trailers, and featured content before choosing a membership.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Brixlore memberships are month-to-month, and you can cancel anytime directly from your account.",
              },
              {
                q: "Where can I watch Brixlore?",
                a: "You can watch Brixlore on your TV, phone, tablet, or desktop browser. Simply log in to your Brixlore account and stream anytime from anywhere.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-neutral-800/90 bg-gradient-to-b from-neutral-900/85 to-neutral-950/95"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:content-none sm:px-6">
                  <span className="text-sm font-semibold text-white sm:text-base">
                    {item.q}
                  </span>
                  <span
                    className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-neutral-700 text-lg leading-none text-neutral-300 transition-transform duration-200 group-open:rotate-45 group-open:border-neutral-500 group-open:text-white"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <div className="border-t border-neutral-800/90 px-5 pb-5 pt-3 sm:px-6">
                  <p className="text-sm leading-6 text-neutral-300">{item.a}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-neutral-800/90 bg-neutral-900/70 px-5 py-4 sm:px-6">
            <p className="text-sm text-neutral-300">
              Still need help? Visit our
              <Link
                href="/contact"
                className="ml-1 font-semibold text-white underline decoration-neutral-500 underline-offset-4 transition-colors hover:decoration-white"
              >
                help center
              </Link>{" "}
              for direct support.
            </p>
          </div>
        </section>

        {/* 7. Questions/help center -> contact form */}
        <section
          className="relative mt-16 w-full max-w-4xl text-center"
          aria-labelledby="home-help-heading"
        >
          <h2
            id="home-help-heading"
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Questions?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-300 sm:text-base">
            Need help with plans, billing, or streaming? Reach out and we will
            guide you.
          </p>
          <div className="mt-6">
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-accent-glow transition-colors hover:bg-accent/90"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
