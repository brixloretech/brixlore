// import type { Metadata } from "next";
// import Link from "next/link";
// import Image from "next/image";
// import PartnersImg from "../../../../public/Partners_HeroImg.jpeg";

// export const metadata: Metadata = {
//   title: "Partner Network | Brixlore",
//   description:
//     "The Brixlore Partner Network integrates brands directly into premium original content—distributed across our platform and amplified across digital ecosystems.",
// };

// const partnerPerks = [
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <path d="M12 2L2 7l10 5 10-5-10-5z" />
//         <path d="M2 17l10 5 10-5" />
//         <path d="M2 12l10 5 10-5" />
//       </svg>
//     ),
//     title: "Narrative Integration",
//     description: "Your brand woven authentically into storytelling.",
//   },
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <rect x="4" y="6" width="16" height="12" rx="2" />
//         <path d="M10 9.5L15 12l-5 2.5v-5z" />
//       </svg>
//     ),
//     title: "Episode-Level Brand Placement",
//     description: "Visible, natural placement inside original episodes.",
//   },
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
//       </svg>
//     ),
//     title: "Short-Form Content Multiplication",
//     description: "Episodes repurposed into dozens of high-impact clips.",
//   },
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <circle cx="12" cy="12" r="9" />
//         <path d="M12 3a9 9 0 0 1 0 18" />
//         <path d="M3 12h18" />
//       </svg>
//     ),
//     title: "Platform Distribution (Brixlore.tv)",
//     description: "Reach Brixlore's growing subscriber base directly.",
//   },
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
//       </svg>
//     ),
//     title: "Social & Digital Amplification",
//     description: "Content extended across social and partner channels.",
//   },
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <rect x="3" y="6" width="13" height="10" rx="1.8" />
//         <rect x="17" y="9" width="4" height="7" rx="1" />
//       </svg>
//     ),
//     title: "Multi Platform Exposure",
//     description: "Visibility across every screen and syndication channel.",
//   },
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
//       </svg>
//     ),
//     title: "Brand Logo Integrated in Content",
//     description: "Your logo featured organically inside production.",
//   },
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
//       </svg>
//     ),
//     title: "Category Exclusivity (Optional Premium)",
//     description: "Lock out competitors in your category.",
//   },
// ];

// const whyPoints = [
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <rect x="4" y="6" width="16" height="12" rx="2" />
//         <path d="M10 9.5L15 12l-5 2.5v-5z" />
//       </svg>
//     ),
//     title: "Cultural Storytelling & Narrative Capture",
//     description:
//       "We capture the moments that define culture and turn them into stories that continue to resonate, evolve, and stay relevant over time.",
//   },
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <circle cx="12" cy="12" r="3" />
//         <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
//         <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
//       </svg>
//     ),
//     title: "Multi-Layered Distribution",
//     description:
//       "Content begins on Brixlore and expands across short-form, social, and partner platforms—creating a continuous cycle of reach and engagement.",
//   },
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
//         <polyline points="16 7 22 7 22 13" />
//       </svg>
//     ),
//     title: "Compounding Brand Value",
//     description:
//       "Traditional ads stop when spend stops. Brixlore partnerships continue to generate reach through ongoing distribution, social media amplification, and repeat exposure—creating value that builds over time.",
//   },
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
//         <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
//       </svg>
//     ),
//     title: "Built for Integration",
//     description:
//       "Our programming is designed with brands in mind from day one.",
//   },
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <circle cx="12" cy="12" r="9" />
//         <path d="M12 3a9 9 0 0 1 0 18" />
//         <path d="M3 12h18" />
//       </svg>
//     ),
//     title: "Content Ecosystem",
//     description: "Long-form → short-form → continuous exposure.",
//   },
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
//       </svg>
//     ),
//     title: "Cultural Positioning",
//     description: "We don't chase attention—we build relevance.",
//   },
//   {
//     icon: (
//       <svg
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="1.8"
//         className="h-7 w-7"
//         aria-hidden
//       >
//         <rect x="2" y="3" width="20" height="14" rx="2" />
//         <path d="M8 21h8M12 17v4" />
//       </svg>
//     ),
//     title: "Transparent Performance & Impact Data",
//     description:
//       "Every partnership includes clear, visual reporting that shows how content performs across platforms—turning distribution into measurable outcomes.",
//   },
// ];

// export default function PartnersPage() {
//   return (
//     <main className="flex flex-1 flex-col">
//       {/* HERO SECTION  */}
//       <section
//         className="relative w-full overflow-hidden bg-[#121212] px-4 py-16 sm:px-6 lg:px-8"
//         aria-label="Hero"
//       >
//         <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">
//           {/* LEFT — Text */}
//           <div className="flex flex-1 flex-col items-start">
//             <p className="text-xs mb-3 font-semibold uppercase tracking-[0.28em] text-neutral-500">
//               Brixlore Partner Network
//             </p>
//             <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
//               Where <em className="not-italic font-bold text-white">Brands</em>{" "}
//               Become Part of the Story.
//             </h1>
//             <p className="mt-5 max-w-lg text-sm leading-7 text-neutral-400 sm:text-base">
//               The Brixlore Partner Network integrates brands directly into
//               premium original content—distributed across our platform and
//               amplified across digital ecosystems.
//             </p>
//             <div className="mt-8 flex flex-wrap items-center gap-4">
//               <Link
//                 href="/contact?subject=Partnership+Inquiry"
//                 className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-7 text-md font-semibold text-black transition-colors hover:bg-white/90"
//               >
//                 Become a Partner
//               </Link>
//               <Link
//                 href="#how-it-works"
//                 className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-600 px-7 text-md font-semibold text-white transition-colors hover:border-neutral-400"
//               >
//                 View Opportunities
//               </Link>
//             </div>
//           </div>

//           {/* RIGHT — Image */}
//           <div className="w-full lg:w-[45%]">
//             <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
//               <Image
//                 src={PartnersImg}
//                 alt="Brand integration behind the scenes"
//                 fill
//                 priority
//                 className="object-cover object-center"
//                 sizes="(max-width: 1024px) 100vw, 45vw"
//                 unoptimized
//               />
//             </div>
//           </div>
//         </div>
//       </section>
//       {/* ADVERTISING SECTION  */}
//       <div className="relative flex flex-1 flex-col items-center bg-[#121212] px-4 pb-16 sm:px-6 lg:px-8">
//         <div
//           className="pointer-events-none absolute inset-0 opacity-70"
//           aria-hidden
//           style={{
//             backgroundImage:
//               "radial-gradient(circle at 15% 0%, rgba(34,34,34,0.42), transparent 36%), radial-gradient(circle at 85% 0%, rgba(24,24,24,0.32), transparent 34%), radial-gradient(circle at 50% 100%, rgba(10,10,10,0.28), transparent 40%)",
//           }}
//         />
//         <section
//           className="relative mt-16 w-full max-w-3xl text-center"
//           aria-labelledby="core-idea-heading"
//         >
//           <div className="mx-auto mb-4 h-0.5 w-10 bg-accent" />
//           <h2
//             id="core-idea-heading"
//             className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
//           >
//             This Isn&apos;t Advertising
//           </h2>
//           <p className="mt-4 text-lg text-neutral-400">
//             Traditional ads interrupt.
//           </p>
//           <p className="mt-1 text-2xl font-bold text-[#A46233] sm:text-3xl">
//             We integrate.
//           </p>
//           <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-neutral-300 sm:text-base">
//             Brixlore partners don&apos;t sit outside the content—they live
//             inside it. Through narrative-driven storytelling, your brand becomes
//             part of the culture, not a break from it.
//           </p>
//         </section>
//       </div>
//       {/* HOW IT WORKS  */}
//       <section
//         id="how-it-works"
//         className="relative mt-16 w-full max-w-6xl mx-auto flex flex-1 flex-col items-center px-4 pb-16 sm:px-6 lg:px-8"
//         aria-labelledby="how-it-works-heading"
//       >
//         <div className="mx-auto mb-4 h-0.5 w-10 bg-accent" />
//         <h2
//           id="how-it-works-heading"
//           className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
//         >
//           How the Brixlore Partner Network Works
//         </h2>
//         <div className="relative mt-10 grid gap-6 sm:grid-cols-3 ">
//           <div
//             className="absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] hidden h-px bg-gradient-to-r from-accent/40 via-accent to-accent/40 sm:block"
//             aria-hidden
//           />
//           {[
//             {
//               num: "01",
//               title: "Integration",
//               description:
//                 "Your brand is embedded into original series through authentic, story-driven placements.",
//               icon: (
//                 <svg
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="1.8"
//                   className="h-10 w-10"
//                   aria-hidden
//                 >
//                   <path d="M12 2L2 7l10 5 10-5-10-5z" />
//                   <path d="M2 17l10 5 10-5" />
//                   <path d="M2 12l10 5 10-5" />
//                 </svg>
//               ),
//             },
//             {
//               num: "02",
//               title: "Distribution",
//               description:
//                 "Content lives on Brixlore.tv and extends across short-form, social, and syndication channels.",
//               icon: (
//                 <svg
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="1.8"
//                   className="h-10 w-10"
//                   aria-hidden
//                 >
//                   <rect x="4" y="6" width="16" height="12" rx="2" />
//                   <path d="M10 9.5L15 12l-5 2.5v-5z" />
//                 </svg>
//               ),
//             },
//             {
//               num: "03",
//               title: "Amplification",
//               description:
//                 "Each episode fuels dozens of high-impact clips, maximizing reach and repeat exposure.",
//               icon: (
//                 <svg
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="1.8"
//                   className="h-10 w-10"
//                   aria-hidden
//                 >
//                   <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
//                   <polyline points="16 7 22 7 22 13" />
//                 </svg>
//               ),
//             },
//           ].map((step) => (
//             <div
//               key={step.num}
//               className="cursor-pointer group relative flex flex-col items-center rounded-2xl border border-neutral-800/90 bg-gradient-to-b from-neutral-900/90 to-neutral-950/95 p-6 text-center shadow-[0_16px_34px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-1 hover:border-neutral-600"
//             >
//               <div className="relative mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-neutral-900/80 text-accent">
//                 {step.icon}
//                 <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[0.8rem] font-bold text-accent-foreground">
//                   {step.num}
//                 </span>
//               </div>
//               <h3 className="text-xl font-bold text-white">{step.title}</h3>
//               <p className="mt-2 text-md leading-6 text-neutral-400">
//                 {step.description}
//               </p>
//             </div>
//           ))}
//         </div>
//       </section>
//       {/* WHAT PARTNERS RECEIVE */}
//       <div className="relative flex flex-1 flex-col items-center bg-[#121212] px-4 pb-16 sm:px-6 lg:px-8">
//         <div
//           className="pointer-events-none absolute inset-0 opacity-70"
//           aria-hidden
//           style={{
//             backgroundImage:
//               "radial-gradient(circle at 15% 0%, rgba(34,34,34,0.42), transparent 36%), radial-gradient(circle at 85% 0%, rgba(24,24,24,0.32), transparent 34%), radial-gradient(circle at 50% 100%, rgba(10,10,10,0.28), transparent 40%)",
//           }}
//         />
//         <section
//           className="relative mt-16 w-full max-w-6xl"
//           aria-labelledby="partners-receive-heading"
//         >
//           <div className="mx-auto mb-4 h-0.5 w-10 bg-accent" />
//           <h2
//             id="partners-receive-heading"
//             className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
//           >
//             What Partners Receive
//           </h2>
//           <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
//             {partnerPerks.map((perk) => (
//               <div
//                 key={perk.title}
//                 className="group flex flex-col cursor-pointer items-center rounded-2xl border border-neutral-800/90 bg-gradient-to-b from-neutral-900/90 to-neutral-950/95 p-5 text-center shadow-[0_16px_34px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-1 hover:border-neutral-600"
//               >
//                 <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900/80 text-neutral-200">
//                   {perk.icon}
//                 </div>
//                 <p className="text-xd font-semibold leading-snug text-white">
//                   {perk.title}
//                 </p>
//                 <p className="mt-1.5 text-sm leading-5 text-neutral-500">
//                   {perk.description}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </section>
//       </div>
//       {/* WHY BRIXLORE */}
//       <section
//         className="relative mt-16 w-full max-w-6xl mx-auto flex flex-1 flex-col items-center px-4 pb-16 sm:px-6 lg:px-8"
//         aria-labelledby="why-brixlore-heading"
//       >
//         <div className="mx-auto mb-4 h-0.5 w-10 bg-accent" />
//         <h2
//           id="why-brixlore-heading"
//           className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
//         >
//           Why Partner With Brixlore
//         </h2>
//         <div className="mt-8 space-y-3">
//           {whyPoints.map((point) => (
//             <div
//               key={point.title}
//               className="group flex gap-5 rounded-2xl border border-neutral-800/90 bg-gradient-to-b from-neutral-900/85 to-neutral-950/95 px-5 py-5 shadow-[0_16px_34px_rgba(0,0,0,0.35)] transition-all hover:border-neutral-700 sm:px-6"
//             >
//               <div className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900/80 text-accent">
//                 {point.icon}
//               </div>
//               <div>
//                 <p className="font-semibold text-white">{point.title}</p>
//                 <p className="mt-1.5 text-sm leading-6 text-neutral-400">
//                   {point.description}
//                 </p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>
//       {/* CTA SECTION */}
//       <div className="relative flex flex-1 flex-col items-center bg-[#121212] px-4 pb-16 sm:px-6 lg:px-8">
//         <div
//           className="pointer-events-none absolute inset-0 opacity-70"
//           aria-hidden
//           style={{
//             backgroundImage:
//               "radial-gradient(circle at 15% 0%, rgba(34,34,34,0.42), transparent 36%), radial-gradient(circle at 85% 0%, rgba(24,24,24,0.32), transparent 34%), radial-gradient(circle at 50% 100%, rgba(10,10,10,0.28), transparent 40%)",
//           }}
//         />
//         <section
//           className="relative mt-16 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-neutral-800/90 bg-gradient-to-b from-neutral-900/85 to-neutral-950/95 px-6 py-14 shadow-[0_26px_70px_rgba(0,0,0,0.45)] sm:px-8 sm:py-16"
//           aria-labelledby="cta-heading"
//         >
//           {/* <div
//             className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/8 to-transparent"
//             aria-hidden
//           /> */}
//           <div
//             className="pointer-events-none absolute inset-x-0 bottom-0 h-32 opacity-20"
//             aria-hidden
//             style={{
//               background:
//                 "radial-gradient(ellipse at 50% 100%, var(--color-accent, #A46233), transparent 70%)",
//             }}
//           />
//           <div className="relative z-10 flex flex-col items-center text-center">
//             <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
//               Get Started
//             </p>
//             <h2
//               id="cta-heading"
//               className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
//             >
//               Ready to Build a Partnership?
//             </h2>
//             <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-neutral-300 sm:text-base">
//               If you&apos;re looking to move beyond traditional advertising and
//               become part of the story—we should talk.
//             </p>
//             <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
//               <Link
//                 href="/contact?subject=Book+a+Partnership+Call"
//                 className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-8 text-xd font-semibold text-accent-foreground shadow-accent-glow transition-colors hover:bg-accent/90"
//               >
//                 Book a Partnership Call
//               </Link>
//               <Link
//                 href="/contact?subject=Request+the+Partner+Deck"
//                 className="inline-flex h-12 items-center justify-center rounded-xl border border-neutral-600 px-8 text-xd font-semibold text-neutral-200 transition-colors hover:border-neutral-400 hover:text-white"
//               >
//                 Request the Partner Deck
//               </Link>
//             </div>
//           </div>
//         </section>
//       </div>
//     </main>
//   );
// }

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import PartnersImg from "../../../../public/Partners_HeroImg.jpeg";
import type { Metadata } from "next";

// ─── Scroll reveal hook ───────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal-block ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const partnerPerks = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "Narrative Integration",
    description: "Your brand woven authentically into storytelling.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M10 9.5L15 12l-5 2.5v-5z" />
      </svg>
    ),
    title: "Episode-Level Brand Placement",
    description: "Visible, natural placement inside original episodes.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
      </svg>
    ),
    title: "Short-Form Content Multiplication",
    description: "Episodes repurposed into dozens of high-impact clips.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18" />
        <path d="M3 12h18" />
      </svg>
    ),
    title: "Platform Distribution (Brixlore.tv)",
    description: "Reach Brixlore's growing subscriber base directly.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
    title: "Social & Digital Amplification",
    description: "Content extended across social and partner channels.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <rect x="3" y="6" width="13" height="10" rx="1.8" />
        <rect x="17" y="9" width="4" height="7" rx="1" />
      </svg>
    ),
    title: "Multi Platform Exposure",
    description: "Visibility across every screen and syndication channel.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: "Brand Logo Integrated in Content",
    description: "Your logo featured organically inside production.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Category Exclusivity (Optional Premium)",
    description: "Lock out competitors in your category.",
  },
];

const whyPoints = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M10 9.5L15 12l-5 2.5v-5z" />
      </svg>
    ),
    title: "Cultural Storytelling & Narrative Capture",
    description:
      "We capture the moments that define culture and turn them into stories that continue to resonate, evolve, and stay relevant over time.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
      </svg>
    ),
    title: "Multi-Layered Distribution",
    description:
      "Content begins on Brixlore and expands across short-form, social, and partner platforms—creating a continuous cycle of reach and engagement.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    title: "Compounding Brand Value",
    description:
      "Traditional ads stop when spend stops. Brixlore partnerships continue to generate reach through ongoing distribution, social media amplification, and repeat exposure—creating value that builds over time.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    title: "Built for Integration",
    description:
      "Our programming is designed with brands in mind from day one.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18" />
        <path d="M3 12h18" />
      </svg>
    ),
    title: "Content Ecosystem",
    description: "Long-form → short-form → continuous exposure.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: "Cultural Positioning",
    description: "We don't chase attention—we build relevance.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
        aria-hidden
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: "Transparent Performance & Impact Data",
    description:
      "Every partnership includes clear, visual reporting that shows how content performs across platforms—turning distribution into measurable outcomes.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PartnersPage() {
  return (
    <>
      {/* Global animation styles */}
      <style>{`
        .reveal-block {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal-block.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .glass-card {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .glass-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.13);
        }
        .accent-line {
          background: linear-gradient(90deg, transparent, #A46233, transparent);
        }
        .perk-card:hover .perk-icon {
          transform: scale(1.15) rotate(-4deg);
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        .perk-icon {
          transition: transform 0.25s ease;
        }
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-18px) scale(1.04); }
        }
        .orb { animation: floatOrb 8s ease-in-out infinite; }
        .orb-2 { animation: floatOrb 11s ease-in-out infinite reverse; }
        .orb-3 { animation: floatOrb 14s ease-in-out infinite 2s; }
        .step-card:hover {
          transform: translateY(-6px);
          border-color: rgba(164,98,51,0.4);
        }
        .step-card { transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s ease; }
        .why-row:hover {
          background: rgba(164,98,51,0.04);
          border-color: rgba(164,98,51,0.25);
          transform: translateX(4px);
        }
        .why-row { transition: all 0.3s ease; }
      `}</style>

      <main className="flex flex-1 flex-col overflow-hidden bg-[#0e0e0e]">
        {/* ── 1. HERO ──────────────────────────────────────────────────── */}
        <section
          className="relative w-full overflow-hidden px-4 py-20 sm:px-6 lg:px-8"
          aria-label="Hero"
        >
          {/* Ambient orbs */}
          <div
            className="orb pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, #A46233 0%, transparent 70%)",
            }}
            aria-hidden
          />
          <div
            className="orb-2 pointer-events-none absolute -right-32 top-10 h-64 w-64 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #A46233 0%, transparent 70%)",
            }}
            aria-hidden
          />

          <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-20">
            {/* LEFT */}
            <div className="flex flex-1 flex-col items-start">
              <div className="reveal-block revealed mb-4 flex items-center gap-2">
                <div className="h-px w-8 bg-[#A46233]" />
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#A46233]">
                  Brixlore Partner Network
                </p>
              </div>
              <h1
                className="reveal-block revealed text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]"
                style={{ transitionDelay: "80ms" }}
              >
                Where{" "}
                <em
                  //   className="not-italic"
                  style={{
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #A46233 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Brands
                </em>{" "}
                Become Part of the Story.
              </h1>
              <p
                className="reveal-block revealed mt-5 max-w-lg text-base leading-7 text-neutral-400"
                style={{ transitionDelay: "160ms" }}
              >
                The Brixlore Partner Network integrates brands directly into
                premium original content—distributed across our platform and
                amplified across digital ecosystems.
              </p>
              <div
                className="reveal-block revealed mt-8 flex flex-wrap items-center gap-4"
                style={{ transitionDelay: "240ms" }}
              >
                <Link
                  href="/contact?subject=Partnership+Inquiry"
                  className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-lg bg-white px-7 text-xd font-semibold text-black transition-all duration-300 hover:shadow-[0_0_24px_rgba(255,255,255,0.25)]"
                >
                  Become a Partner
                  <span className="text-xl ml-2 transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-700 px-7 text-xd font-semibold text-neutral-300 transition-all duration-300 hover:border-[#A46233] hover:text-white"
                >
                  View Opportunities
                </Link>
              </div>
            </div>

            {/* RIGHT — image with glass overlay */}
            <div
              className="reveal-block revealed w-full lg:w-[46%]"
              style={{ transitionDelay: "120ms" }}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src={PartnersImg}
                  alt="Brand integration behind the scenes"
                  fill
                  priority
                  className="object-cover object-center transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  unoptimized
                />
                {/* Glass caption overlay */}
                <div
                  className="absolute inset-x-0 bottom-0 p-5"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
                  }}
                >
                  <div className="glass-card inline-flex items-center gap-2 rounded-full px-4 py-2">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#A46233]" />
                    <span className="text-xs font-medium text-white/80">
                      Production in progress
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom fade into next section */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#0e0e0e]"
            aria-hidden
          />
        </section>

        {/* ── 2. THIS ISN'T ADVERTISING ────────────────────────────────── */}
        <section
          className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
          aria-labelledby="core-idea-heading"
        >
          {/* Big background text */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
            aria-hidden
          >
            <span className="text-[12rem] font-black uppercase leading-none tracking-tighter text-white/[0.02] sm:text-[18rem]">
              INTEGRATE
            </span>
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="mx-auto mb-6 h-px w-16 accent-line" />
              <h2
                id="core-idea-heading"
                className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
              >
                This Isn&apos;t Advertising
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-5 text-xl text-neutral-500">
                Traditional ads interrupt.
              </p>
              <p
                className="mt-2 text-3xl font-bold"
                style={{ color: "#A46233" }}
              >
                We integrate.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-neutral-400">
                Brixlore partners don&apos;t sit outside the content—they live
                inside it. Through narrative-driven storytelling, your brand
                becomes part of the culture, not a break from it.
              </p>
            </Reveal>

            {/* Floating stat pills */}
            <Reveal delay={300}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                {[
                  { label: "Story-driven placements" },
                  { label: "Cultural integration" },
                  { label: "Zero interruption" },
                ].map((pill) => (
                  <div
                    key={pill.label}
                    className="glass-card rounded-full px-5 py-2.5 text-sm font-medium text-neutral-300 transition-all duration-300 hover:text-white"
                  >
                    {pill.label}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── 3. HOW IT WORKS ──────────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
          aria-labelledby="how-it-works-heading"
        >
          {/* Orb */}
          <div
            className="orb-3 pointer-events-none absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #A46233 0%, transparent 65%)",
            }}
            aria-hidden
          />

          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <div className="mx-auto mb-6 h-px w-16 accent-line" />
              <h2
                id="how-it-works-heading"
                className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
              >
                How the Brixlore Partner Network Works
              </h2>
              <p className="mt-3 text-neutral-500">
                Three phases. One seamless story.
              </p>
            </Reveal>

            <div className="relative mt-14 grid gap-6 sm:grid-cols-3">
              {/* Connector line */}
              <div
                className="absolute left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] top-12 hidden h-px sm:block"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #A46233 30%, #A46233 70%, transparent)",
                }}
                aria-hidden
              />

              {[
                {
                  num: "01",
                  title: "Integration",
                  description:
                    "Your brand is embedded into original series through authentic, story-driven placements.",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-8 w-8"
                      aria-hidden
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  ),
                },
                {
                  num: "02",
                  title: "Distribution",
                  description:
                    "Content lives on Brixlore.tv and extends across short-form, social, and syndication channels.",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-8 w-8"
                      aria-hidden
                    >
                      <rect x="4" y="6" width="16" height="12" rx="2" />
                      <path d="M10 9.5L15 12l-5 2.5v-5z" />
                    </svg>
                  ),
                },
                {
                  num: "03",
                  title: "Amplification",
                  description:
                    "Each episode fuels dozens of high-impact clips, maximizing reach and repeat exposure.",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-8 w-8"
                      aria-hidden
                    >
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                      <polyline points="16 7 22 7 22 13" />
                    </svg>
                  ),
                },
              ].map((step, i) => (
                <Reveal key={step.num} delay={i * 120}>
                  <div className="step-card glass-card group flex h-full flex-col items-center rounded-2xl p-7 text-center">
                    <div
                      className="relative mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full"
                      style={{
                        background: "rgba(164,98,51,0.08)",
                        border: "1px solid rgba(164,98,51,0.2)",
                      }}
                    >
                      <span className="text-[#A46233]">{step.icon}</span>
                      <span
                        className="absolute -right-2 -top-1 flex h-8 w-8 items-center justify-center rounded-full text-[0.7rem] font-bold text-black"
                        style={{ background: "#A46233" }}
                      >
                        {step.num}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-neutral-400">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. WHAT PARTNERS RECEIVE ─────────────────────────────────── */}
        <section
          className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
          aria-labelledby="partners-receive-heading"
        >
          {/* Glass panel bg */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(164,98,51,0.06) 0%, transparent 60%)",
            }}
            aria-hidden
          />

          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <div className="mx-auto mb-6 h-px w-16 accent-line" />
              <h2
                id="partners-receive-heading"
                className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
              >
                What Partners Receive
              </h2>
              <p className="mt-3 text-neutral-500">
                Everything you need to make culture work for your brand.
              </p>
            </Reveal>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {partnerPerks.map((perk, i) => (
                <Reveal key={perk.title} delay={i * 60}>
                  <div className="perk-card glass-card group flex h-full flex-col items-center rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-1">
                    <div
                      className="perk-icon mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl text-[#A46233]"
                      style={{
                        background: "rgba(164,98,51,0.08)",
                        border: "1px solid rgba(164,98,51,0.15)",
                      }}
                    >
                      {perk.icon}
                    </div>
                    <p className="text-xd font-semibold leading-snug text-white">
                      {perk.title}
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-neutral-500">
                      {perk.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. WHY BRIXLORE ──────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
          aria-labelledby="why-brixlore-heading"
        >
          <div
            className="orb pointer-events-none absolute -left-40 top-1/3 h-80 w-80 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #A46233 0%, transparent 70%)",
            }}
            aria-hidden
          />

          <div className="mx-auto max-w-5xl">
            <Reveal className="text-center">
              <div className="mx-auto mb-6 h-px w-16 accent-line" />
              <h2
                id="why-brixlore-heading"
                className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
              >
                Why Partner With Brixlore
              </h2>
              <p className="mt-3 text-neutral-500">
                Built differently. Designed to last.
              </p>
            </Reveal>

            <div className="mt-10 space-y-3">
              {whyPoints.map((point, i) => (
                <Reveal key={point.title} delay={i * 70}>
                  <div className="why-row glass-card flex gap-5 rounded-2xl px-5 py-5 sm:px-6">
                    <div
                      className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#A46233]"
                      style={{
                        background: "rgba(164,98,51,0.08)",
                        border: "1px solid rgba(164,98,51,0.15)",
                      }}
                    >
                      {point.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{point.title}</p>
                      <p className="mt-1.5 text-sm leading-6 text-neutral-400">
                        {point.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. CTA ───────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
          aria-labelledby="cta-heading"
        >
          {/* Glow behind CTA card */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <div
              className="h-64 w-96 rounded-full opacity-20 blur-3xl"
              style={{ background: "#A46233" }}
            />
          </div>

          <Reveal>
            <div
              className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] px-8 py-16 text-center sm:px-12 sm:py-20"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              {/* Inner glow top */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(164,98,51,0.6), transparent)",
                }}
                aria-hidden
              />
              {/* Inner glow bottom */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32 opacity-30"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 100%, #A46233, transparent 70%)",
                }}
                aria-hidden
              />

              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                Get Started
              </p>
              <h2
                id="cta-heading"
                className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl"
              >
                Ready to Build a Partnership?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-neutral-400">
                If you&apos;re looking to move beyond traditional advertising
                and become part of the story—we should talk.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/contact?subject=Book+a+Partnership+Call"
                  className="group inline-flex h-12 items-center justify-center rounded-xl px-8 text-xd font-bold text-black transition-all duration-300 hover:shadow-[0_0_32px_rgba(164,98,51,0.4)]"
                  style={{
                    background:
                      "linear-gradient(135deg, #c97f45 0%, #A46233 100%)",
                  }}
                >
                  Book a Partnership Call
                  <span className="text-xl ml-2 transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="/contact?subject=Request+the+Partner+Deck"
                  className="inline-flex h-12 items-center justify-center rounded-xl border px-8 text-xd font-semibold text-neutral-300 transition-all duration-300 hover:border-[#A46233] hover:text-white"
                  style={{ borderColor: "rgba(255,255,255,0.12)" }}
                >
                  Request the Partner Deck
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
    </>
  );
}

// "use client";

// import { useEffect, useRef, useState, type ReactNode } from "react";
// import Link from "next/link";
// import Image from "next/image";

// /* ─── Magnetic cursor ────────────────────────────────────────────────────── */
// function MagneticCursor() {
//   const cursorRef = useRef(null);
//   const dotRef = useRef(null);
//   useEffect(() => {
//     let mx = window.innerWidth / 2,
//       my = window.innerHeight / 2;
//     let cx = mx,
//       cy = my;
//     const onMove = (e) => {
//       mx = e.clientX;
//       my = e.clientY;
//     };
//     document.addEventListener("mousemove", onMove);
//     let raf;
//     const tick = () => {
//       cx += (mx - cx) * 0.12;
//       cy += (my - cy) * 0.12;
//       if (cursorRef.current)
//         cursorRef.current.style.transform = `translate(${cx - 20}px, ${cy - 20}px)`;
//       if (dotRef.current)
//         dotRef.current.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
//       raf = requestAnimationFrame(tick);
//     };
//     tick();
//     return () => {
//       document.removeEventListener("mousemove", onMove);
//       cancelAnimationFrame(raf);
//     };
//   }, []);
//   return (
//     <>
//       <div
//         ref={cursorRef}
//         style={{
//           position: "fixed",
//           top: 0,
//           left: 0,
//           width: 40,
//           height: 40,
//           borderRadius: "50%",
//           border: "1px solid rgba(164,98,51,0.6)",
//           pointerEvents: "none",
//           zIndex: 9999,
//           transition: "width .3s,height .3s,border-color .3s",
//           mixBlendMode: "difference",
//         }}
//       />
//       <div
//         ref={dotRef}
//         style={{
//           position: "fixed",
//           top: 0,
//           left: 0,
//           width: 6,
//           height: 6,
//           borderRadius: "50%",
//           background: "#A46233",
//           pointerEvents: "none",
//           zIndex: 9999,
//         }}
//       />
//     </>
//   );
// }

// /* ─── Particle field ─────────────────────────────────────────────────────── */
// function ParticleField() {
//   const canvasRef = useRef(null);
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     let W,
//       H,
//       particles = [],
//       raf;
//     const resize = () => {
//       W = canvas.width = window.innerWidth;
//       H = canvas.height = window.innerHeight;
//     };
//     resize();
//     window.addEventListener("resize", resize);
//     for (let i = 0; i < 80; i++)
//       particles.push({
//         x: Math.random() * W,
//         y: Math.random() * H,
//         r: Math.random() * 1.5 + 0.3,
//         vx: (Math.random() - 0.5) * 0.3,
//         vy: (Math.random() - 0.5) * 0.3,
//         alpha: Math.random() * 0.4 + 0.1,
//       });
//     const draw = () => {
//       ctx.clearRect(0, 0, W, H);
//       particles.forEach((p) => {
//         p.x += p.vx;
//         p.y += p.vy;
//         if (p.x < 0) p.x = W;
//         if (p.x > W) p.x = 0;
//         if (p.y < 0) p.y = H;
//         if (p.y > H) p.y = 0;
//         ctx.beginPath();
//         ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
//         ctx.fillStyle = `rgba(164,98,51,${p.alpha})`;
//         ctx.fill();
//       });
//       // Draw connections
//       for (let i = 0; i < particles.length; i++) {
//         for (let j = i + 1; j < particles.length; j++) {
//           const dx = particles[i].x - particles[j].x;
//           const dy = particles[i].y - particles[j].y;
//           const dist = Math.sqrt(dx * dx + dy * dy);
//           if (dist < 120) {
//             ctx.beginPath();
//             ctx.strokeStyle = `rgba(164,98,51,${0.06 * (1 - dist / 120)})`;
//             ctx.lineWidth = 0.5;
//             ctx.moveTo(particles[i].x, particles[i].y);
//             ctx.lineTo(particles[j].x, particles[j].y);
//             ctx.stroke();
//           }
//         }
//       }
//       raf = requestAnimationFrame(draw);
//     };
//     draw();
//     return () => {
//       cancelAnimationFrame(raf);
//       window.removeEventListener("resize", resize);
//     };
//   }, []);
//   return (
//     <canvas
//       ref={canvasRef}
//       style={{
//         position: "fixed",
//         inset: 0,
//         pointerEvents: "none",
//         zIndex: 0,
//         opacity: 0.6,
//       }}
//     />
//   );
// }

// /* ─── Animated counter ───────────────────────────────────────────────────── */
// function Counter({ to, suffix = "" }) {
//   const [val, setVal] = useState(0);
//   const ref = useRef(null);
//   useEffect(() => {
//     const obs = new IntersectionObserver(
//       ([e]) => {
//         if (!e.isIntersecting) return;
//         obs.disconnect();
//         let start = 0;
//         const step = () => {
//           start += to / 60;
//           if (start >= to) {
//             setVal(to);
//             return;
//           }
//           setVal(Math.floor(start));
//           requestAnimationFrame(step);
//         };
//         step();
//       },
//       { threshold: 0.5 },
//     );
//     obs.observe(ref.current);
//     return () => obs.disconnect();
//   }, [to]);
//   return (
//     <span ref={ref}>
//       {val}
//       {suffix}
//     </span>
//   );
// }

// /* ─── Scroll reveal ──────────────────────────────────────────────────────── */
// function Reveal({ children, className = "", delay = 0, direction = "up" }) {
//   const ref = useRef(null);
//   useEffect(() => {
//     const el = ref.current;
//     if (!el) return;
//     const obs = new IntersectionObserver(
//       ([e]) => {
//         if (e.isIntersecting) {
//           el.classList.add("bp-revealed");
//           obs.disconnect();
//         }
//       },
//       { threshold: 0.08 },
//     );
//     obs.observe(el);
//     return () => obs.disconnect();
//   }, []);
//   const dir =
//     direction === "left"
//       ? "translateX(-40px)"
//       : direction === "right"
//         ? "translateX(40px)"
//         : direction === "scale"
//           ? "scale(0.88) translateY(20px)"
//           : "translateY(40px)";
//   return (
//     <div
//       ref={ref}
//       className={`bp-reveal ${className}`}
//       style={{ "--dir": dir, transitionDelay: `${delay}ms` }}
//     >
//       {children}
//     </div>
//   );
// }

// /* ─── Tilt card ──────────────────────────────────────────────────────────── */
// function TiltCard({ children, className = "" }) {
//   const ref = useRef(null);
//   const onMove = (e) => {
//     const r = ref.current.getBoundingClientRect();
//     const x = (e.clientX - r.left) / r.width - 0.5;
//     const y = (e.clientY - r.top) / r.height - 0.5;
//     ref.current.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.02)`;
//   };
//   const onLeave = () => {
//     ref.current.style.transform =
//       "perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)";
//   };
//   return (
//     <div
//       ref={ref}
//       onMouseMove={onMove}
//       onMouseLeave={onLeave}
//       className={className}
//       style={{
//         transition: "transform 0.2s ease",
//         transformStyle: "preserve-3d",
//       }}
//     >
//       {children}
//     </div>
//   );
// }

// /* ─── Glitch text ────────────────────────────────────────────────────────── */
// function GlitchText({ text, className = "" }) {
//   return (
//     <span
//       className={`bp-glitch ${className}`}
//       data-text={text}
//       style={{ position: "relative", display: "inline-block" }}
//     >
//       {text}
//     </span>
//   );
// }

// /* ─── Data ───────────────────────────────────────────────────────────────── */
// const partnerPerks = [
//   {
//     icon: "◈",
//     title: "Narrative Integration",
//     description: "Your brand woven authentically into storytelling.",
//   },
//   {
//     icon: "▶",
//     title: "Episode-Level Placement",
//     description: "Visible, natural placement inside original episodes.",
//   },
//   {
//     icon: "⊞",
//     title: "Short-Form Multiplication",
//     description: "Episodes repurposed into high-impact clips.",
//   },
//   {
//     icon: "◉",
//     title: "Platform Distribution",
//     description: "Reach Brixlore's growing subscriber base directly.",
//   },
//   {
//     icon: "⟳",
//     title: "Social Amplification",
//     description: "Content extended across social and partner channels.",
//   },
//   {
//     icon: "⊡",
//     title: "Multi-Platform Exposure",
//     description: "Visibility across every screen and syndication channel.",
//   },
//   {
//     icon: "✦",
//     title: "Brand Logo Integrated",
//     description: "Your logo featured organically inside production.",
//   },
//   {
//     icon: "◆",
//     title: "Category Exclusivity",
//     description: "Lock out competitors in your category.",
//   },
// ];

// const stats = [
//   { val: 12, suffix: "M+", label: "Monthly Impressions" },
//   { val: 340, suffix: "%", label: "Avg. Brand Recall Lift" },
//   { val: 8, suffix: "x", label: "Content Multiplier" },
//   { val: 98, suffix: "%", label: "Partner Satisfaction" },
// ];

// const whyPoints = [
//   {
//     num: "01",
//     title: "Cultural Storytelling",
//     desc: "We capture the moments that define culture and turn them into stories that resonate, evolve, and stay relevant over time.",
//   },
//   {
//     num: "02",
//     title: "Multi-Layered Distribution",
//     desc: "Content begins on Brixlore and expands across short-form, social, and partner platforms—creating a continuous cycle of reach.",
//   },
//   {
//     num: "03",
//     title: "Compounding Brand Value",
//     desc: "Traditional ads stop when spend stops. Brixlore partnerships continue to generate reach through ongoing distribution and repeat exposure.",
//   },
//   {
//     num: "04",
//     title: "Built for Integration",
//     desc: "Our programming is designed with brands in mind from day one—no retrofitting, no awkward placements.",
//   },
//   {
//     num: "05",
//     title: "Content Ecosystem",
//     desc: "Long-form → short-form → continuous exposure. Every episode becomes a universe of touchpoints.",
//   },
//   {
//     num: "06",
//     title: "Transparent Impact Data",
//     desc: "Every partnership includes clear, visual reporting that turns distribution into measurable, undeniable outcomes.",
//   },
// ];

// /* ─── Page ───────────────────────────────────────────────────────────────── */
// export default function PartnersPage() {
//   const [loaded, setLoaded] = useState(false);
//   useEffect(() => {
//     setTimeout(() => setLoaded(true), 100);
//   }, []);

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;900&display=swap');

//         *, *::before, *::after { box-sizing: border-box; }

//         .bp-root {
//           font-family: 'Outfit', sans-serif;
//           background: #080808;
//           color: #fff;
//           overflow-x: hidden;
//           cursor: none;
//         }

//         /* ── Reveal ── */
//         .bp-reveal {
//           opacity: 0;
//           transform: var(--dir, translateY(40px));
//           transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1);
//         }
//         .bp-reveal.bp-revealed { opacity: 1; transform: none; }

//         /* ── Glitch ── */
//         .bp-glitch::before,
//         .bp-glitch::after {
//           content: attr(data-text);
//           position: absolute; inset: 0;
//           background: transparent;
//         }
//         .bp-glitch::before {
//           color: #ff6b35; clip-path: polygon(0 0,100% 0,100% 35%,0 35%);
//           animation: glitch1 3.5s infinite steps(1);
//         }
//         .bp-glitch::after {
//           color: #00d4ff; clip-path: polygon(0 65%,100% 65%,100% 100%,0 100%);
//           animation: glitch2 3.5s infinite steps(1) 0.05s;
//         }
//         @keyframes glitch1 {
//           0%,94%,100% { transform: none; opacity: 0; }
//           95% { transform: translate(-3px,1px); opacity: 1; }
//           97% { transform: translate(2px,-1px); opacity: 1; }
//           99% { transform: translate(-1px,2px); opacity: 1; }
//         }
//         @keyframes glitch2 {
//           0%,94%,100% { transform: none; opacity: 0; }
//           95% { transform: translate(3px,-1px); opacity: 1; }
//           97% { transform: translate(-2px,1px); opacity: 1; }
//           99% { transform: translate(2px,-2px); opacity: 1; }
//         }

//         /* ── Hero load animation ── */
//         .hero-word {
//           display: inline-block;
//           opacity: 0;
//           transform: translateY(100%) skewY(6deg);
//           transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1);
//         }
//         .loaded .hero-word { opacity: 1; transform: translateY(0) skewY(0); }

//         /* ── Noise overlay ── */
//         .bp-noise::before {
//           content:''; position:fixed; inset:0; pointer-events:none; z-index:1;
//           background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E");
//           opacity: 0.4;
//         }

//         /* ── Orbs ── */
//         @keyframes orbFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.06)} }
//         @keyframes orbFloat2 { 0%,100%{transform:translateY(0) scale(1) rotate(0deg)} 50%{transform:translateY(20px) scale(0.95) rotate(180deg)} }
//         .orb-a { animation: orbFloat 10s ease-in-out infinite; }
//         .orb-b { animation: orbFloat 14s ease-in-out infinite reverse; }
//         .orb-c { animation: orbFloat2 18s linear infinite; }

//         /* ── Scanline ── */
//         .hero-scanline::after {
//           content:''; position:absolute; inset:0; pointer-events:none;
//           background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
//         }

//         /* ── Glass card ── */
//         .glass {
//           background: rgba(255,255,255,0.03);
//           backdrop-filter: blur(16px);
//           -webkit-backdrop-filter: blur(16px);
//           border: 1px solid rgba(255,255,255,0.07);
//         }
//         .glass-amber {
//           background: rgba(164,98,51,0.06);
//           backdrop-filter: blur(16px);
//           -webkit-backdrop-filter: blur(16px);
//           border: 1px solid rgba(164,98,51,0.15);
//         }

//         /* ── Perk card ── */
//         .perk-card {
//           position: relative; overflow: hidden;
//           transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s;
//         }
//         .perk-card::before {
//           content:''; position:absolute; inset:0;
//           background: radial-gradient(circle at 50% 0%, rgba(164,98,51,0.18) 0%, transparent 70%);
//           opacity:0; transition: opacity 0.4s;
//         }
//         .perk-card:hover { transform: translateY(-8px) scale(1.02); border-color: rgba(164,98,51,0.4) !important; }
//         .perk-card:hover::before { opacity:1; }
//         .perk-icon-wrap {
//           font-size: 1.5rem; line-height:1;
//           transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
//         }
//         .perk-card:hover .perk-icon-wrap { transform: scale(1.3) rotate(-8deg); }

//         /* ── Why row ── */
//         .why-row {
//           position: relative; overflow: hidden;
//           transition: transform 0.35s ease, border-color 0.3s;
//         }
//         .why-row::before {
//           content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
//           background: linear-gradient(180deg, #A46233, #ff6b35);
//           transform: scaleY(0); transform-origin: bottom;
//           transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
//         }
//         .why-row:hover { transform: translateX(8px); border-color: rgba(164,98,51,0.35) !important; }
//         .why-row:hover::before { transform: scaleY(1); }

//         /* ── Step card ── */
//         .step-card {
//           position: relative; overflow: hidden;
//           transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s;
//         }
//         .step-card::after {
//           content:''; position:absolute; inset:0;
//           background: radial-gradient(ellipse at 50% 120%, rgba(164,98,51,0.15) 0%, transparent 60%);
//           opacity:0; transition: opacity 0.4s;
//         }
//         .step-card:hover { transform: translateY(-12px) scale(1.03); box-shadow: 0 40px 80px rgba(164,98,51,0.2); }
//         .step-card:hover::after { opacity:1; }

//         /* ── Stat card ── */
//         .stat-card {
//           transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
//         }
//         .stat-card:hover { transform: translateY(-6px) scale(1.04); }

//         /* ── CTA glow ── */
//         .cta-btn {
//           position: relative; overflow: hidden;
//           transition: box-shadow 0.4s, transform 0.3s;
//         }
//         .cta-btn::after {
//           content:''; position:absolute; inset:0;
//           background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
//           opacity:0; transition: opacity 0.3s;
//         }
//         .cta-btn:hover { box-shadow: 0 0 60px rgba(164,98,51,0.6); transform: translateY(-2px); }
//         .cta-btn:hover::after { opacity:1; }

//         /* ── Section divider ── */
//         .section-divider {
//           height: 1px;
//           background: linear-gradient(90deg, transparent, rgba(164,98,51,0.4) 30%, rgba(255,107,53,0.4) 50%, rgba(164,98,51,0.4) 70%, transparent);
//         }

//         /* ── Marquee ── */
//         @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
//         .marquee-inner { display: flex; width: max-content; animation: marquee 18s linear infinite; }
//         .marquee-inner:hover { animation-play-state: paused; }

//         /* ── Hero BG grid ── */
//         .hero-grid {
//           background-image:
//             linear-gradient(rgba(164,98,51,0.04) 1px, transparent 1px),
//             linear-gradient(90deg, rgba(164,98,51,0.04) 1px, transparent 1px);
//           background-size: 60px 60px;
//         }

//         /* ── Floating badge ── */
//         @keyframes badgePulse { 0%,100%{box-shadow:0 0 0 0 rgba(164,98,51,0.4)} 50%{box-shadow:0 0 0 12px rgba(164,98,51,0)} }
//         .badge-pulse { animation: badgePulse 2.5s ease infinite; }

//         /* ── Image parallax layer ── */
//         .hero-img-wrap { position: relative; }
//         .hero-img-wrap::before {
//           content:''; position:absolute; inset:0; z-index:1; pointer-events:none;
//           background: radial-gradient(ellipse at 30% 50%, rgba(164,98,51,0.3) 0%, transparent 60%);
//         }

//         /* ── Number display ── */
//         .bebas { font-family: 'Bebas Neue', sans-serif; }

//         /* ── Section header badge ── */
//         .section-tag {
//           display: inline-flex; align-items: center; gap: 8px;
//           padding: 4px 14px; border-radius: 999px;
//           background: rgba(164,98,51,0.1); border: 1px solid rgba(164,98,51,0.25);
//           font-size: 0.7rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
//           color: #A46233;
//         }
//       `}</style>

//       {/* Global noise & cursor */}
//       <div
//         className="bp-noise"
//         style={{
//           position: "fixed",
//           inset: 0,
//           pointerEvents: "none",
//           zIndex: 2,
//         }}
//       />
//       <MagneticCursor />
//       <ParticleField />

//       <main
//         className={`bp-root bp-noise ${loaded ? "loaded" : ""}`}
//         style={{ position: "relative", zIndex: 3 }}
//       >
//         {/* ════ 1. HERO ════════════════════════════════════════════════════════ */}
//         <section
//           className="hero-grid hero-scanline"
//           style={{
//             position: "relative",
//             minHeight: "100vh",
//             display: "flex",
//             alignItems: "center",
//             overflow: "hidden",
//             padding: "0 clamp(1.5rem,5vw,4rem)",
//           }}
//         >
//           {/* Ambient orbs */}
//           <div
//             className="orb-a"
//             style={{
//               position: "absolute",
//               top: "10%",
//               left: "-10%",
//               width: 600,
//               height: 600,
//               borderRadius: "50%",
//               background:
//                 "radial-gradient(circle, rgba(164,98,51,0.25) 0%, transparent 65%)",
//               filter: "blur(40px)",
//               pointerEvents: "none",
//             }}
//           />
//           <div
//             className="orb-b"
//             style={{
//               position: "absolute",
//               bottom: "5%",
//               right: "-8%",
//               width: 500,
//               height: 500,
//               borderRadius: "50%",
//               background:
//                 "radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 65%)",
//               filter: "blur(60px)",
//               pointerEvents: "none",
//             }}
//           />
//           <div
//             className="orb-c"
//             style={{
//               position: "absolute",
//               top: "50%",
//               left: "45%",
//               width: 300,
//               height: 300,
//               borderRadius: "50%",
//               background:
//                 "radial-gradient(circle, rgba(164,98,51,0.08) 0%, transparent 65%)",
//               filter: "blur(30px)",
//               pointerEvents: "none",
//             }}
//           />

//           <div
//             style={{
//               maxWidth: 1280,
//               margin: "0 auto",
//               width: "100%",
//               display: "grid",
//               gridTemplateColumns: "1fr 1fr",
//               gap: "4rem",
//               alignItems: "center",
//               padding: "6rem 0",
//             }}
//           >
//             {/* LEFT */}
//             <div
//               style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
//             >
//               <div>
//                 <div className="section-tag" style={{ marginBottom: "1.5rem" }}>
//                   <span
//                     style={{
//                       width: 6,
//                       height: 6,
//                       borderRadius: "50%",
//                       background: "#A46233",
//                       display: "inline-block",
//                     }}
//                   />
//                   Brixlore Partner Network
//                 </div>

//                 {/* Giant headline with staggered reveal */}
//                 <div style={{ overflow: "hidden", lineHeight: 1 }}>
//                   <div
//                     className="bebas"
//                     style={{
//                       fontSize: "clamp(4rem,9vw,8.5rem)",
//                       letterSpacing: "-0.01em",
//                       lineHeight: 0.92,
//                       color: "#fff",
//                     }}
//                   >
//                     {"WHERE".split("").map((c, i) => (
//                       <span
//                         key={i}
//                         className="hero-word"
//                         style={{ transitionDelay: `${i * 40}ms` }}
//                       >
//                         {c}
//                       </span>
//                     ))}
//                   </div>
//                   <div
//                     className="bebas"
//                     style={{
//                       fontSize: "clamp(4rem,9vw,8.5rem)",
//                       lineHeight: 0.92,
//                     }}
//                   >
//                     {["BRANDS"].map((w, i) => (
//                       <span
//                         key={i}
//                         className="hero-word"
//                         style={{
//                           transitionDelay: `${200 + i * 60}ms`,
//                           background:
//                             "linear-gradient(135deg, #ff6b35, #A46233, #ffcc88)",
//                           WebkitBackgroundClip: "text",
//                           WebkitTextFillColor: "transparent",
//                         }}
//                       >
//                         {w}
//                       </span>
//                     ))}
//                   </div>
//                   <div
//                     className="bebas"
//                     style={{
//                       fontSize: "clamp(4rem,9vw,8.5rem)",
//                       lineHeight: 0.92,
//                       color: "#fff",
//                     }}
//                   >
//                     <span
//                       className="hero-word"
//                       style={{ transitionDelay: "360ms" }}
//                     >
//                       BECOME{" "}
//                     </span>
//                     <span
//                       className="hero-word"
//                       style={{
//                         transitionDelay: "420ms",
//                         color: "transparent",
//                         WebkitTextStroke: "2px rgba(164,98,51,0.6)",
//                       }}
//                     >
//                       STORY.
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div
//                 className="hero-word"
//                 style={{
//                   transitionDelay: "600ms",
//                   maxWidth: 500,
//                   color: "#888",
//                   lineHeight: 1.75,
//                   fontSize: "1.05rem",
//                 }}
//               >
//                 The Brixlore Partner Network integrates brands directly into
//                 premium original content—distributed across our platform and
//                 amplified across digital ecosystems.
//               </div>

//               <div
//                 className="hero-word"
//                 style={{
//                   transitionDelay: "720ms",
//                   display: "flex",
//                   gap: "1rem",
//                   flexWrap: "wrap",
//                 }}
//               >
//                 <a
//                   href="/contact?subject=Partnership+Inquiry"
//                   className="cta-btn"
//                   style={{
//                     display: "inline-flex",
//                     alignItems: "center",
//                     gap: "0.5rem",
//                     padding: "0.875rem 2rem",
//                     background: "linear-gradient(135deg, #c97f45, #A46233)",
//                     borderRadius: 12,
//                     fontWeight: 700,
//                     fontSize: "0.9rem",
//                     color: "#000",
//                     textDecoration: "none",
//                   }}
//                 >
//                   Become a Partner{" "}
//                   <span style={{ transition: "transform 0.3s" }}>→</span>
//                 </a>
//                 <a
//                   href="#how-it-works"
//                   style={{
//                     display: "inline-flex",
//                     alignItems: "center",
//                     gap: "0.5rem",
//                     padding: "0.875rem 2rem",
//                     border: "1px solid rgba(164,98,51,0.3)",
//                     borderRadius: 12,
//                     fontWeight: 600,
//                     fontSize: "0.9rem",
//                     color: "#ccc",
//                     textDecoration: "none",
//                     transition: "all 0.3s",
//                     backdropFilter: "blur(8px)",
//                   }}
//                   onMouseEnter={(e) => {
//                     e.currentTarget.style.borderColor = "#A46233";
//                     e.currentTarget.style.color = "#fff";
//                   }}
//                   onMouseLeave={(e) => {
//                     e.currentTarget.style.borderColor = "rgba(164,98,51,0.3)";
//                     e.currentTarget.style.color = "#ccc";
//                   }}
//                 >
//                   View Opportunities
//                 </a>
//               </div>

//               {/* Mini stats */}
//               <div
//                 className="hero-word"
//                 style={{
//                   transitionDelay: "840ms",
//                   display: "flex",
//                   gap: "2rem",
//                 }}
//               >
//                 {[
//                   ["12M+", "Monthly Reach"],
//                   ["8x", "Content Multiplier"],
//                   ["98%", "Satisfaction"],
//                 ].map(([n, l]) => (
//                   <div key={l}>
//                     <div
//                       className="bebas"
//                       style={{
//                         fontSize: "2rem",
//                         color: "#A46233",
//                         lineHeight: 1,
//                       }}
//                     >
//                       {n}
//                     </div>
//                     <div
//                       style={{
//                         fontSize: "0.7rem",
//                         color: "#555",
//                         textTransform: "uppercase",
//                         letterSpacing: "0.15em",
//                         marginTop: 2,
//                       }}
//                     >
//                       {l}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* RIGHT — 3D image stack */}
//             <div className="hero-word" style={{ transitionDelay: "200ms" }}>
//               <div style={{ position: "relative" }}>
//                 {/* Main image */}
//                 <TiltCard>
//                   <div
//                     className="hero-img-wrap glass"
//                     style={{
//                       borderRadius: 24,
//                       overflow: "hidden",
//                       aspectRatio: "4/3",
//                       position: "relative",
//                     }}
//                   >
//                     <div
//                       style={{
//                         position: "absolute",
//                         inset: 0,
//                         background:
//                           "linear-gradient(135deg, rgba(164,98,51,0.2) 0%, transparent 50%, rgba(0,0,0,0.5) 100%)",
//                         zIndex: 2,
//                         borderRadius: 24,
//                       }}
//                     />
//                     <div
//                       style={{
//                         width: "100%",
//                         height: "100%",
//                         background:
//                           "linear-gradient(135deg, #1a0f07 0%, #0e0e0e 100%)",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                       }}
//                     >
//                       {/* Placeholder visual — swap for <Image src={PartnersImg} ... /> */}
//                       <div
//                         style={{
//                           textAlign: "center",
//                           color: "rgba(164,98,51,0.4)",
//                         }}
//                       >
//                         <div
//                           className="bebas"
//                           style={{ fontSize: "5rem", lineHeight: 1 }}
//                         >
//                           BRIX
//                         </div>
//                         <div
//                           className="bebas"
//                           style={{
//                             fontSize: "5rem",
//                             lineHeight: 1,
//                             color: "rgba(164,98,51,0.2)",
//                           }}
//                         >
//                           LORE
//                         </div>
//                       </div>
//                     </div>

//                     {/* Glass overlays */}
//                     <div
//                       className="badge-pulse"
//                       style={{
//                         position: "absolute",
//                         bottom: 20,
//                         left: 20,
//                         zIndex: 3,
//                         background: "rgba(0,0,0,0.7)",
//                         backdropFilter: "blur(12px)",
//                         border: "1px solid rgba(164,98,51,0.3)",
//                         borderRadius: 999,
//                         padding: "8px 16px",
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 8,
//                       }}
//                     >
//                       <span
//                         style={{
//                           width: 8,
//                           height: 8,
//                           borderRadius: "50%",
//                           background: "#A46233",
//                           display: "inline-block",
//                         }}
//                       />
//                       <span
//                         style={{
//                           fontSize: "0.75rem",
//                           color: "rgba(255,255,255,0.8)",
//                           fontWeight: 600,
//                         }}
//                       >
//                         Production Live
//                       </span>
//                     </div>

//                     <div
//                       style={{
//                         position: "absolute",
//                         top: 20,
//                         right: 20,
//                         zIndex: 3,
//                         background: "rgba(164,98,51,0.15)",
//                         backdropFilter: "blur(12px)",
//                         border: "1px solid rgba(164,98,51,0.3)",
//                         borderRadius: 12,
//                         padding: "10px 14px",
//                         textAlign: "center",
//                       }}
//                     >
//                       <div
//                         className="bebas"
//                         style={{
//                           fontSize: "1.8rem",
//                           color: "#A46233",
//                           lineHeight: 1,
//                         }}
//                       >
//                         340%
//                       </div>
//                       <div
//                         style={{
//                           fontSize: "0.65rem",
//                           color: "#888",
//                           textTransform: "uppercase",
//                           letterSpacing: "0.12em",
//                         }}
//                       >
//                         Brand Recall
//                       </div>
//                     </div>
//                   </div>
//                 </TiltCard>

//                 {/* Decorative floating cards */}
//                 <div
//                   className="orb-b glass-amber"
//                   style={{
//                     position: "absolute",
//                     bottom: -24,
//                     right: -24,
//                     borderRadius: 16,
//                     padding: "1rem 1.25rem",
//                     zIndex: -1,
//                     minWidth: 150,
//                   }}
//                 >
//                   <div
//                     style={{
//                       fontSize: "0.65rem",
//                       color: "#A46233",
//                       textTransform: "uppercase",
//                       letterSpacing: "0.15em",
//                       marginBottom: 4,
//                     }}
//                   >
//                     Platforms
//                   </div>
//                   <div style={{ display: "flex", gap: 6 }}>
//                     {["TV", "IG", "TK", "YT", "X"].map((p) => (
//                       <div
//                         key={p}
//                         style={{
//                           width: 28,
//                           height: 28,
//                           borderRadius: 6,
//                           background: "rgba(164,98,51,0.15)",
//                           border: "1px solid rgba(164,98,51,0.2)",
//                           display: "flex",
//                           alignItems: "center",
//                           justifyContent: "center",
//                           fontSize: "0.55rem",
//                           fontWeight: 700,
//                           color: "#A46233",
//                         }}
//                       >
//                         {p}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Scroll indicator */}
//           <div
//             style={{
//               position: "absolute",
//               bottom: 40,
//               left: "50%",
//               transform: "translateX(-50%)",
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "center",
//               gap: 8,
//               color: "#333",
//             }}
//           >
//             <div
//               style={{
//                 width: 1,
//                 height: 60,
//                 background: "linear-gradient(180deg, transparent, #A46233)",
//                 animation: "orbFloat 2s ease-in-out infinite",
//               }}
//             />
//             <span
//               style={{
//                 fontSize: "0.6rem",
//                 textTransform: "uppercase",
//                 letterSpacing: "0.3em",
//               }}
//             >
//               Scroll
//             </span>
//           </div>
//         </section>

//         {/* ════ MARQUEE STRIP ══════════════════════════════════════════════════ */}
//         <div
//           style={{
//             borderTop: "1px solid rgba(164,98,51,0.15)",
//             borderBottom: "1px solid rgba(164,98,51,0.15)",
//             padding: "1rem 0",
//             overflow: "hidden",
//             background: "rgba(164,98,51,0.03)",
//           }}
//         >
//           <div className="marquee-inner">
//             {[...Array(3)].map((_, ri) =>
//               [
//                 "Narrative Integration",
//                 "•",
//                 "Cultural Storytelling",
//                 "•",
//                 "Content Ecosystem",
//                 "•",
//                 "Brand Amplification",
//                 "•",
//                 "Multi-Platform Reach",
//                 "•",
//                 "Zero Interruption",
//                 "•",
//               ].map((t, i) => (
//                 <span
//                   key={`${ri}-${i}`}
//                   style={{
//                     padding: "0 2rem",
//                     fontSize: "0.75rem",
//                     fontWeight: 600,
//                     textTransform: "uppercase",
//                     letterSpacing: "0.25em",
//                     color: t === "•" ? "#A46233" : "#444",
//                     whiteSpace: "nowrap",
//                   }}
//                 >
//                   {t}
//                 </span>
//               )),
//             )}
//           </div>
//         </div>

//         {/* ════ 2. THIS ISN'T ADVERTISING ══════════════════════════════════════ */}
//         <section
//           style={{
//             position: "relative",
//             padding: "clamp(5rem,10vw,9rem) clamp(1.5rem,5vw,4rem)",
//             overflow: "hidden",
//           }}
//         >
//           <div
//             style={{
//               position: "absolute",
//               inset: 0,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               pointerEvents: "none",
//             }}
//           >
//             <div
//               className="bebas"
//               style={{
//                 fontSize: "clamp(8rem,22vw,20rem)",
//                 color: "rgba(255,255,255,0.018)",
//                 letterSpacing: "-0.04em",
//                 userSelect: "none",
//                 whiteSpace: "nowrap",
//               }}
//             >
//               INTEGRATE
//             </div>
//           </div>

//           <div
//             style={{
//               maxWidth: 900,
//               margin: "0 auto",
//               textAlign: "center",
//               position: "relative",
//             }}
//           >
//             <Reveal>
//               <div className="section-tag" style={{ margin: "0 auto 2rem" }}>
//                 The Brixlore Difference
//               </div>
//             </Reveal>

//             <Reveal delay={80}>
//               <h2
//                 className="bebas"
//                 style={{
//                   fontSize: "clamp(3.5rem,8vw,7rem)",
//                   lineHeight: 0.9,
//                   letterSpacing: "-0.01em",
//                 }}
//               >
//                 <span style={{ color: "#444" }}>This Isn't</span>
//                 <br />
//                 <GlitchText
//                   text="ADVERTISING"
//                   className="bebas"
//                   style={{
//                     background: "linear-gradient(135deg, #ff6b35, #A46233)",
//                     WebkitBackgroundClip: "text",
//                     WebkitTextFillColor: "transparent",
//                   }}
//                 />
//               </h2>
//             </Reveal>

//             <Reveal delay={200}>
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   gap: "3rem",
//                   margin: "3rem 0",
//                   flexWrap: "wrap",
//                 }}
//               >
//                 <div style={{ textAlign: "center" }}>
//                   <div
//                     className="bebas"
//                     style={{ fontSize: "1.8rem", color: "#333", lineHeight: 1 }}
//                   >
//                     Traditional ads
//                   </div>
//                   <div
//                     style={{ fontSize: "1.1rem", color: "#222", marginTop: 4 }}
//                   >
//                     interrupt
//                   </div>
//                 </div>
//                 <div style={{ fontSize: "3rem", color: "rgba(164,98,51,0.3)" }}>
//                   vs
//                 </div>
//                 <div style={{ textAlign: "center" }}>
//                   <div
//                     className="bebas"
//                     style={{
//                       fontSize: "1.8rem",
//                       color: "#A46233",
//                       lineHeight: 1,
//                     }}
//                   >
//                     We
//                   </div>
//                   <div
//                     style={{
//                       fontSize: "1.5rem",
//                       fontWeight: 900,
//                       color: "#A46233",
//                     }}
//                   >
//                     integrate
//                   </div>
//                 </div>
//               </div>
//             </Reveal>

//             <Reveal delay={300}>
//               <p
//                 style={{
//                   fontSize: "1.15rem",
//                   color: "#555",
//                   lineHeight: 1.8,
//                   maxWidth: 600,
//                   margin: "0 auto 3rem",
//                 }}
//               >
//                 Brixlore partners don't sit outside the content—they live inside
//                 it. Through narrative-driven storytelling, your brand becomes
//                 part of the culture, not a break from it.
//               </p>
//             </Reveal>

//             <Reveal delay={400}>
//               <div
//                 style={{
//                   display: "flex",
//                   flexWrap: "wrap",
//                   gap: "0.75rem",
//                   justifyContent: "center",
//                 }}
//               >
//                 {[
//                   "Story-driven placements",
//                   "Cultural integration",
//                   "Zero interruption",
//                   "Authentic narrative",
//                   "Organic visibility",
//                 ].map((pill) => (
//                   <div
//                     key={pill}
//                     className="glass"
//                     style={{
//                       borderRadius: 999,
//                       padding: "0.6rem 1.4rem",
//                       fontSize: "0.8rem",
//                       fontWeight: 600,
//                       color: "#aaa",
//                       transition: "all 0.3s",
//                       cursor: "default",
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.color = "#fff";
//                       e.currentTarget.style.borderColor = "rgba(164,98,51,0.4)";
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.color = "#aaa";
//                       e.currentTarget.style.borderColor =
//                         "rgba(255,255,255,0.07)";
//                     }}
//                   >
//                     {pill}
//                   </div>
//                 ))}
//               </div>
//             </Reveal>
//           </div>
//         </section>

//         {/* ════ STATS BAR ══════════════════════════════════════════════════════ */}
//         <div className="section-divider" />
//         <section style={{ padding: "4rem clamp(1.5rem,5vw,4rem)" }}>
//           <div
//             style={{
//               maxWidth: 1280,
//               margin: "0 auto",
//               display: "grid",
//               gridTemplateColumns: "repeat(4, 1fr)",
//               gap: "2rem",
//             }}
//           >
//             {stats.map((s, i) => (
//               <Reveal key={s.label} delay={i * 80} direction="scale">
//                 <TiltCard>
//                   <div
//                     className="stat-card glass-amber"
//                     style={{
//                       borderRadius: 20,
//                       padding: "2rem",
//                       textAlign: "center",
//                     }}
//                   >
//                     <div
//                       className="bebas"
//                       style={{
//                         fontSize: "clamp(3rem,6vw,5rem)",
//                         lineHeight: 1,
//                         background:
//                           "linear-gradient(135deg, #ffcc88, #A46233, #ff6b35)",
//                         WebkitBackgroundClip: "text",
//                         WebkitTextFillColor: "transparent",
//                       }}
//                     >
//                       <Counter to={s.val} suffix={s.suffix} />
//                     </div>
//                     <div
//                       style={{
//                         fontSize: "0.75rem",
//                         color: "#666",
//                         textTransform: "uppercase",
//                         letterSpacing: "0.2em",
//                         marginTop: 8,
//                         fontWeight: 600,
//                       }}
//                     >
//                       {s.label}
//                     </div>
//                   </div>
//                 </TiltCard>
//               </Reveal>
//             ))}
//           </div>
//         </section>
//         <div className="section-divider" />

//         {/* ════ 3. HOW IT WORKS ════════════════════════════════════════════════ */}
//         <section
//           id="how-it-works"
//           style={{
//             position: "relative",
//             padding: "clamp(5rem,10vw,9rem) clamp(1.5rem,5vw,4rem)",
//             overflow: "hidden",
//           }}
//         >
//           <div
//             className="orb-b"
//             style={{
//               position: "absolute",
//               right: -200,
//               top: "20%",
//               width: 600,
//               height: 600,
//               borderRadius: "50%",
//               background:
//                 "radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 65%)",
//               filter: "blur(60px)",
//               pointerEvents: "none",
//             }}
//           />

//           <div style={{ maxWidth: 1280, margin: "0 auto" }}>
//             <Reveal
//               className="text-center"
//               style={{ textAlign: "center", marginBottom: "4rem" }}
//             >
//               <div className="section-tag" style={{ margin: "0 auto 1.5rem" }}>
//                 The Process
//               </div>
//               <h2
//                 className="bebas"
//                 style={{
//                   fontSize: "clamp(3rem,7vw,6rem)",
//                   lineHeight: 1,
//                   color: "#fff",
//                   letterSpacing: "-0.01em",
//                 }}
//               >
//                 How the Partner
//                 <br />
//                 <span style={{ color: "#A46233" }}>Network Works</span>
//               </h2>
//               <p style={{ color: "#444", marginTop: "1rem", fontSize: "1rem" }}>
//                 Three phases. One seamless story.
//               </p>
//             </Reveal>

//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "repeat(3,1fr)",
//                 gap: "1.5rem",
//                 position: "relative",
//               }}
//             >
//               {/* Connector */}
//               <div
//                 style={{
//                   position: "absolute",
//                   top: 60,
//                   left: "calc(16.67% + 1rem)",
//                   right: "calc(16.67% + 1rem)",
//                   height: 1,
//                   background:
//                     "linear-gradient(90deg, transparent, rgba(164,98,51,0.5) 20%, rgba(255,107,53,0.5) 50%, rgba(164,98,51,0.5) 80%, transparent)",
//                   pointerEvents: "none",
//                 }}
//               />

//               {[
//                 {
//                   num: "01",
//                   title: "Integration",
//                   desc: "Your brand embedded into original series through authentic, story-driven narrative placements.",
//                   emoji: "◈",
//                 },
//                 {
//                   num: "02",
//                   title: "Distribution",
//                   desc: "Content lives on Brixlore.tv and extends across short-form, social, and syndication channels.",
//                   emoji: "▶",
//                 },
//                 {
//                   num: "03",
//                   title: "Amplification",
//                   desc: "Each episode fuels dozens of high-impact clips, maximizing reach and creating compounding value.",
//                   emoji: "⟳",
//                 },
//               ].map((step, i) => (
//                 <Reveal key={step.num} delay={i * 150}>
//                   <TiltCard>
//                     <div
//                       className="step-card glass"
//                       style={{
//                         borderRadius: 24,
//                         padding: "2.5rem 2rem",
//                         height: "100%",
//                         textAlign: "center",
//                         border: "1px solid rgba(255,255,255,0.06)",
//                       }}
//                     >
//                       <div
//                         style={{
//                           position: "relative",
//                           display: "inline-flex",
//                           alignItems: "center",
//                           justifyContent: "center",
//                           width: 80,
//                           height: 80,
//                           borderRadius: "50%",
//                           background: "rgba(164,98,51,0.08)",
//                           border: "1px solid rgba(164,98,51,0.2)",
//                           marginBottom: "1.5rem",
//                         }}
//                       >
//                         <span style={{ fontSize: "1.8rem", color: "#A46233" }}>
//                           {step.emoji}
//                         </span>
//                         <span
//                           className="bebas"
//                           style={{
//                             position: "absolute",
//                             top: -8,
//                             right: -8,
//                             width: 28,
//                             height: 28,
//                             borderRadius: "50%",
//                             background:
//                               "linear-gradient(135deg, #ff6b35, #A46233)",
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             fontSize: "0.7rem",
//                             color: "#000",
//                             fontWeight: 900,
//                           }}
//                         >
//                           {step.num}
//                         </span>
//                       </div>
//                       <h3
//                         className="bebas"
//                         style={{
//                           fontSize: "2rem",
//                           color: "#fff",
//                           lineHeight: 1,
//                           marginBottom: "1rem",
//                         }}
//                       >
//                         {step.title}
//                       </h3>
//                       <p
//                         style={{
//                           color: "#555",
//                           fontSize: "0.9rem",
//                           lineHeight: 1.7,
//                         }}
//                       >
//                         {step.desc}
//                       </p>
//                     </div>
//                   </TiltCard>
//                 </Reveal>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* ════ 4. WHAT PARTNERS RECEIVE ═══════════════════════════════════════ */}
//         <section
//           style={{
//             position: "relative",
//             padding: "clamp(5rem,10vw,9rem) clamp(1.5rem,5vw,4rem)",
//             overflow: "hidden",
//             background: "rgba(164,98,51,0.02)",
//           }}
//         >
//           <div style={{ maxWidth: 1280, margin: "0 auto" }}>
//             <Reveal style={{ textAlign: "center", marginBottom: "4rem" }}>
//               <div className="section-tag" style={{ margin: "0 auto 1.5rem" }}>
//                 Partnership Benefits
//               </div>
//               <h2
//                 className="bebas"
//                 style={{
//                   fontSize: "clamp(3rem,7vw,6rem)",
//                   lineHeight: 1,
//                   color: "#fff",
//                 }}
//               >
//                 What Partners
//                 <br />
//                 <span
//                   style={{
//                     background: "linear-gradient(135deg, #ffcc88, #A46233)",
//                     WebkitBackgroundClip: "text",
//                     WebkitTextFillColor: "transparent",
//                   }}
//                 >
//                   Receive
//                 </span>
//               </h2>
//               <p style={{ color: "#444", marginTop: "1rem" }}>
//                 Everything you need to make culture work for your brand.
//               </p>
//             </Reveal>

//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "repeat(4, 1fr)",
//                 gap: "1rem",
//               }}
//             >
//               {partnerPerks.map((perk, i) => (
//                 <Reveal
//                   key={perk.title}
//                   delay={i * 50}
//                   direction={i % 2 === 0 ? "up" : "scale"}
//                 >
//                   <div
//                     className="perk-card glass"
//                     style={{
//                       borderRadius: 20,
//                       padding: "1.75rem 1.25rem",
//                       height: "100%",
//                       textAlign: "center",
//                       border: "1px solid rgba(255,255,255,0.06)",
//                     }}
//                   >
//                     <div
//                       className="perk-icon-wrap glass-amber"
//                       style={{
//                         width: 52,
//                         height: 52,
//                         borderRadius: 14,
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         margin: "0 auto 1rem",
//                         fontSize: "1.4rem",
//                         color: "#A46233",
//                       }}
//                     >
//                       {perk.icon}
//                     </div>
//                     <p
//                       style={{
//                         fontSize: "0.9rem",
//                         fontWeight: 700,
//                         color: "#fff",
//                         lineHeight: 1.3,
//                         marginBottom: "0.5rem",
//                       }}
//                     >
//                       {perk.title}
//                     </p>
//                     <p
//                       style={{
//                         fontSize: "0.75rem",
//                         color: "#444",
//                         lineHeight: 1.6,
//                       }}
//                     >
//                       {perk.description}
//                     </p>
//                   </div>
//                 </Reveal>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* ════ 5. WHY BRIXLORE ════════════════════════════════════════════════ */}
//         <section
//           style={{
//             position: "relative",
//             padding: "clamp(5rem,10vw,9rem) clamp(1.5rem,5vw,4rem)",
//             overflow: "hidden",
//           }}
//         >
//           <div
//             className="orb-a"
//             style={{
//               position: "absolute",
//               left: -200,
//               top: "30%",
//               width: 500,
//               height: 500,
//               borderRadius: "50%",
//               background:
//                 "radial-gradient(circle, rgba(164,98,51,0.1) 0%, transparent 65%)",
//               filter: "blur(60px)",
//               pointerEvents: "none",
//             }}
//           />

//           <div style={{ maxWidth: 1100, margin: "0 auto" }}>
//             <Reveal style={{ textAlign: "center", marginBottom: "4rem" }}>
//               <div className="section-tag" style={{ margin: "0 auto 1.5rem" }}>
//                 Why Choose Us
//               </div>
//               <h2
//                 className="bebas"
//                 style={{
//                   fontSize: "clamp(3rem,7vw,6rem)",
//                   lineHeight: 1,
//                   color: "#fff",
//                 }}
//               >
//                 Why Partner With
//                 <br />
//                 <span style={{ color: "#A46233" }}>Brixlore</span>
//               </h2>
//               <p style={{ color: "#444", marginTop: "1rem" }}>
//                 Built differently. Designed to last.
//               </p>
//             </Reveal>

//             <div
//               style={{
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: "0.75rem",
//               }}
//             >
//               {whyPoints.map((pt, i) => (
//                 <Reveal
//                   key={pt.num}
//                   delay={i * 60}
//                   direction={i % 2 === 0 ? "left" : "right"}
//                 >
//                   <div
//                     className="why-row glass"
//                     style={{
//                       borderRadius: 18,
//                       padding: "1.5rem 1.75rem",
//                       display: "flex",
//                       gap: "1.5rem",
//                       alignItems: "flex-start",
//                       border: "1px solid rgba(255,255,255,0.05)",
//                       paddingLeft: "1.75rem",
//                     }}
//                   >
//                     <div
//                       className="bebas"
//                       style={{
//                         fontSize: "2.5rem",
//                         color: "rgba(164,98,51,0.25)",
//                         lineHeight: 1,
//                         minWidth: 48,
//                         flexShrink: 0,
//                       }}
//                     >
//                       {pt.num}
//                     </div>
//                     <div>
//                       <p
//                         style={{
//                           fontWeight: 700,
//                           fontSize: "1.05rem",
//                           color: "#fff",
//                           marginBottom: "0.4rem",
//                         }}
//                       >
//                         {pt.title}
//                       </p>
//                       <p
//                         style={{
//                           fontSize: "0.9rem",
//                           color: "#555",
//                           lineHeight: 1.7,
//                         }}
//                       >
//                         {pt.desc}
//                       </p>
//                     </div>
//                   </div>
//                 </Reveal>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* ════ 6. CTA ═════════════════════════════════════════════════════════ */}
//         <section
//           style={{
//             position: "relative",
//             padding: "clamp(5rem,10vw,9rem) clamp(1.5rem,5vw,4rem)",
//             overflow: "hidden",
//           }}
//         >
//           {/* Massive glow */}
//           <div
//             style={{
//               position: "absolute",
//               inset: 0,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               pointerEvents: "none",
//             }}
//           >
//             <div
//               style={{
//                 width: 700,
//                 height: 400,
//                 borderRadius: "50%",
//                 background:
//                   "radial-gradient(ellipse, rgba(164,98,51,0.18) 0%, transparent 65%)",
//                 filter: "blur(60px)",
//               }}
//             />
//           </div>

//           <Reveal direction="scale">
//             <div
//               style={{
//                 maxWidth: 900,
//                 margin: "0 auto",
//                 position: "relative",
//                 borderRadius: 32,
//                 overflow: "hidden",
//                 padding: "clamp(3rem,6vw,5rem) clamp(2rem,5vw,4rem)",
//                 textAlign: "center",
//                 background: "rgba(255,255,255,0.02)",
//                 backdropFilter: "blur(24px)",
//                 border: "1px solid rgba(255,255,255,0.07)",
//               }}
//             >
//               {/* Top shimmer */}
//               <div
//                 style={{
//                   position: "absolute",
//                   inset: "0 0 auto 0",
//                   height: 1,
//                   background:
//                     "linear-gradient(90deg, transparent, rgba(164,98,51,0.8), rgba(255,107,53,0.5), rgba(164,98,51,0.8), transparent)",
//                 }}
//               />
//               {/* Bottom glow */}
//               <div
//                 style={{
//                   position: "absolute",
//                   inset: "auto 0 0 0",
//                   height: 120,
//                   background:
//                     "radial-gradient(ellipse at 50% 100%, rgba(164,98,51,0.2) 0%, transparent 70%)",
//                 }}
//               />

//               <div className="section-tag" style={{ margin: "0 auto 2rem" }}>
//                 Get Started
//               </div>

//               <h2
//                 className="bebas"
//                 style={{
//                   fontSize: "clamp(3.5rem,8vw,7rem)",
//                   lineHeight: 0.92,
//                   color: "#fff",
//                   letterSpacing: "-0.01em",
//                   marginBottom: "1.5rem",
//                 }}
//               >
//                 Ready to Build
//                 <br />
//                 <span
//                   style={{
//                     background:
//                       "linear-gradient(135deg, #ff6b35, #A46233, #ffcc88)",
//                     WebkitBackgroundClip: "text",
//                     WebkitTextFillColor: "transparent",
//                   }}
//                 >
//                   a Partnership?
//                 </span>
//               </h2>

//               <p
//                 style={{
//                   color: "#555",
//                   fontSize: "1.1rem",
//                   lineHeight: 1.8,
//                   maxWidth: 560,
//                   margin: "0 auto 3rem",
//                 }}
//               >
//                 If you're looking to move beyond traditional advertising and
//                 become part of the story—we should talk.
//               </p>

//               <div
//                 style={{
//                   display: "flex",
//                   gap: "1rem",
//                   justifyContent: "center",
//                   flexWrap: "wrap",
//                 }}
//               >
//                 <a
//                   href="/contact?subject=Book+a+Partnership+Call"
//                   className="cta-btn"
//                   style={{
//                     display: "inline-flex",
//                     alignItems: "center",
//                     gap: "0.5rem",
//                     padding: "1rem 2.5rem",
//                     background: "linear-gradient(135deg, #ff6b35, #A46233)",
//                     borderRadius: 16,
//                     fontWeight: 800,
//                     fontSize: "1rem",
//                     color: "#000",
//                     textDecoration: "none",
//                   }}
//                 >
//                   Book a Partnership Call →
//                 </a>
//                 <a
//                   href="/contact?subject=Request+the+Partner+Deck"
//                   style={{
//                     display: "inline-flex",
//                     alignItems: "center",
//                     gap: "0.5rem",
//                     padding: "1rem 2.5rem",
//                     border: "1px solid rgba(164,98,51,0.3)",
//                     borderRadius: 16,
//                     fontWeight: 600,
//                     fontSize: "1rem",
//                     color: "#aaa",
//                     textDecoration: "none",
//                     backdropFilter: "blur(8px)",
//                     transition: "all 0.3s",
//                   }}
//                   onMouseEnter={(e) => {
//                     e.currentTarget.style.color = "#fff";
//                     e.currentTarget.style.borderColor = "#A46233";
//                   }}
//                   onMouseLeave={(e) => {
//                     e.currentTarget.style.color = "#aaa";
//                     e.currentTarget.style.borderColor = "rgba(164,98,51,0.3)";
//                   }}
//                 >
//                   Request the Partner Deck ↓
//                 </a>
//               </div>
//             </div>
//           </Reveal>
//         </section>
//       </main>
//     </>
//   );
