// "use client";

// import { useEffect, useRef, useState, type ReactNode } from "react";

// // ─── Scroll reveal (same as partners page) ────────────────────────────────────
// function useReveal() {
//   const ref = useRef<HTMLDivElement>(null);
//   useEffect(() => {
//     const el = ref.current;
//     if (!el) return;
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           el.classList.add("revealed");
//           observer.disconnect();
//         }
//       },
//       { threshold: 0.1 },
//     );
//     observer.observe(el);
//     return () => observer.disconnect();
//   }, []);
//   return ref;
// }

// function Reveal({
//   children,
//   className = "",
//   delay = 0,
// }: {
//   children: ReactNode;
//   className?: string;
//   delay?: number;
// }) {
//   const ref = useReveal();
//   return (
//     <div
//       ref={ref}
//       className={`reveal-block ${className}`}
//       style={{ transitionDelay: `${delay}ms` }}
//     >
//       {children}
//     </div>
//   );
// }

// // ─── Form state ───────────────────────────────────────────────────────────────
// type FormData = {
//   fullName: string;
//   email: string;
//   filmTitle: string;
//   trailerLink: string;
//   productionStatus: string;
//   synopsis: string;
// };

// const EMPTY: FormData = {
//   fullName: "",
//   email: "",
//   filmTitle: "",
//   trailerLink: "",
//   productionStatus: "",
//   synopsis: "",
// };

// const advantages = [
//   {
//     badge: "01",
//     title: "Non-Exclusive Rights",
//     body: "You worked hard on your film. Keep your rights. Distribute on Brixlore while maintaining your presence on YouTube, Vimeo, or other platforms.",
//     icon: (
//       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7" aria-hidden>
//         <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
//         <path d="M9 12l2 2 4-4" />
//       </svg>
//     ),
//   },
//   {
//     badge: "02",
//     title: "60/40 Revenue Share",
//     body: "Get paid for every minute watched. We offer a transparent, filmmaker-first revenue split on all ad-supported views.",
//     icon: (
//       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7" aria-hidden>
//         <circle cx="12" cy="12" r="9" />
//         <path d="M12 6v6l4 2" />
//         <path d="M8 14h8" />
//       </svg>
//     ),
//   },
//   {
//     badge: "03",
//     title: "The $5.00 Bounty",
//     body: "Use your voice to grow the platform. Earn a $5.00 cash bonus for every new subscriber who joins through your content.",
//     icon: (
//       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7" aria-hidden>
//         <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
//       </svg>
//     ),
//   },
// ];

// export default function DistributePage() {
//   const [form, setForm] = useState<FormData>(EMPTY);
//   const [submitted, setSubmitted] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [charCount, setCharCount] = useState(0);

//   function handleChange(
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
//   ) {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//     if (name === "synopsis") setCharCount(value.length);
//   }

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setLoading(true);
//     // Simulate submission — wire up real API here
//     await new Promise((r) => setTimeout(r, 1400));
//     setLoading(false);
//     setSubmitted(true);
//   }

//   return (
//     <>
//       <style>{`
//         /* ── Same scroll reveal as partners page ── */
//         .reveal-block {
//           opacity: 0;
//           transform: translateY(28px);
//           transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1),
//                       transform 0.75s cubic-bezier(0.16,1,0.3,1);
//         }
//         .reveal-block.revealed { opacity: 1; transform: translateY(0); }

//         /* ── Glassmorphism ── */
//         .glass {
//           background: rgba(255,255,255,0.03);
//           backdrop-filter: blur(16px);
//           -webkit-backdrop-filter: blur(16px);
//           border: 1px solid rgba(255,255,255,0.07);
//           transition: background 0.3s, border-color 0.3s, transform 0.3s;
//         }
//         .glass:hover { background: rgba(255,255,255,0.055); border-color: rgba(255,255,255,0.13); }

//         /* ── Gradient text — white → mid-gray ── */
//         .grad-text {
//           background: linear-gradient(135deg, #ffffff 0%, #9ca3af 100%);
//           -webkit-background-clip: text;
//           -webkit-text-fill-color: transparent;
//           background-clip: text;
//         }

//         /* ── Section divider line ── */
//         .div-line {
//           background: linear-gradient(90deg, transparent 0%, rgba(229,231,235,0.5) 50%, transparent 100%);
//         }

//         /* ── Orb animations ── */
//         @keyframes floatOrb {
//           0%,100% { transform: translateY(0) scale(1); }
//           50%      { transform: translateY(-22px) scale(1.05); }
//         }
//         .orb  { animation: floatOrb  9s ease-in-out infinite; }
//         .orb2 { animation: floatOrb 13s ease-in-out infinite reverse; }
//         .orb3 { animation: floatOrb 16s ease-in-out infinite 3s; }

//         /* ── Advantage cards ── */
//         .adv-card {
//           transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s;
//         }
//         .adv-card:hover { transform: translateY(-8px); border-color: rgba(229,231,235,0.25); }

//         /* ── CTA button ── */
//         .btn-shine {
//           background: linear-gradient(110deg, #f9fafb 0%, #e5e7eb 40%, #f9fafb 60%, #e5e7eb 100%);
//           background-size: 250% auto;
//           transition: background-position 0.7s ease, box-shadow 0.3s;
//         }
//         .btn-shine:hover {
//           background-position: right center;
//           box-shadow: 0 0 36px rgba(229,231,235,0.28), 0 0 80px rgba(229,231,235,0.1);
//         }

//         /* ── Form fields ── */
//         .form-field {
//           width: 100%;
//           background: rgba(255,255,255,0.04);
//           border: 1px solid rgba(255,255,255,0.1);
//           border-radius: 0.75rem;
//           padding: 0.875rem 1.125rem;
//           color: #f5f7fb;
//           font-size: 0.9rem;
//           outline: none;
//           transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
//           -webkit-appearance: none;
//         }
//         .form-field::placeholder { color: rgba(255,255,255,0.25); }
//         .form-field:focus {
//           border-color: rgba(229,231,235,0.45);
//           background: rgba(255,255,255,0.06);
//           box-shadow: 0 0 0 3px rgba(229,231,235,0.06);
//         }
//         select.form-field option {
//           background: #0b0b0e;
//           color: #f5f7fb;
//         }
//         textarea.form-field { resize: none; min-height: 120px; }

//         /* ── Submit button loading spinner ── */
//         @keyframes spin { to { transform: rotate(360deg); } }
//         .spinner {
//           display: inline-block;
//           width: 16px; height: 16px;
//           border: 2px solid rgba(0,0,0,0.3);
//           border-top-color: #000;
//           border-radius: 50%;
//           animation: spin 0.7s linear infinite;
//           margin-right: 8px;
//         }

//         /* ── Success state pulse ── */
//         @keyframes successPulse {
//           0%   { box-shadow: 0 0 0 0 rgba(229,231,235,0.4); }
//           70%  { box-shadow: 0 0 0 20px rgba(229,231,235,0); }
//           100% { box-shadow: 0 0 0 0 rgba(229,231,235,0); }
//         }
//         .success-ring { animation: successPulse 1.5s ease-out; }
//       `}</style>

//       <main className="relative flex flex-1 flex-col overflow-hidden" style={{ background: "#0b0b0e" }}>

//         {/* HERO */}
//         <section className="relative w-full overflow-hidden px-4 py-24 sm:px-6 lg:px-8" aria-label="Hero">

//           {/* Ambient gradient mesh */}
//           <div className="pointer-events-none absolute inset-0" aria-hidden style={{
//             background: "radial-gradient(ellipse 70% 60% at 0% 0%, rgba(255,255,255,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(180,180,200,0.04) 0%, transparent 55%)",
//           }} />

//           {/* Floating orbs */}
//           <div className="orb pointer-events-none absolute -left-48 top-10 h-[500px] w-[500px] rounded-full" aria-hidden
//             style={{ background: "radial-gradient(circle, rgba(255,255,255,0.055) 0%, transparent 65%)" }} />
//           <div className="orb2 pointer-events-none absolute -right-40 top-0 h-80 w-80 rounded-full" aria-hidden
//             style={{ background: "radial-gradient(circle, rgba(200,200,220,0.04) 0%, transparent 70%)" }} />

//           {/* Hero image placeholder — full bleed cinematic background */}
//           <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
//             {/* Replace the div below with <Image> once you have the cinematic still */}
//             <div className="absolute inset-0" style={{
//               background: "linear-gradient(160deg, rgba(255,255,255,0.015) 0%, transparent 50%)",
//             }} />
//             {/* Noise grain overlay for texture */}
//             <div className="absolute inset-0 opacity-[0.03]" style={{
//               backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
//               backgroundRepeat: "repeat",
//               backgroundSize: "128px 128px",
//             }} />
//           </div>

//           <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">

//             <div className="reveal-block revealed mb-5 flex items-center justify-center gap-3">
//               <div className="h-px w-10" style={{ background: "linear-gradient(90deg, transparent, rgba(229,231,235,0.7))" }} />
//               <p className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-400">
//                 Film Distribution
//               </p>
//               <div className="h-px w-10" style={{ background: "linear-gradient(90deg, rgba(229,231,235,0.7), transparent)" }} />
//             </div>

//             <h1 className="reveal-block revealed text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl lg:leading-[1.05]"
//               style={{ transitionDelay: "70ms" }}>
//               The World&apos;s Stage for<br />
//               <span className="grad-text">Urban Storytelling.</span>
//             </h1>

//             <p className="reveal-block revealed mx-auto mt-7 max-w-2xl text-lg leading-8 text-neutral-400"
//               style={{ transitionDelay: "150ms" }}>
//               Join the premier platform for urban deep-dive cinema. We are looking for
//               feature-length documentaries that explore the culture, history, and reality
//               of cities worldwide.
//             </p>

//             <div className="reveal-block revealed mt-10" style={{ transitionDelay: "230ms" }}>
//               <a href="#submit"
//                 className="btn-shine group inline-flex h-13 items-center justify-center rounded-xl px-10 py-3.5 text-base font-black text-black shadow-[0_0_40px_rgba(229,231,235,0.1)]">
//                 Submit Your Feature
//                 <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">↓</span>
//               </a>
//             </div>

//             {/* Cinematic stat strip */}
//             <Reveal delay={350}>
//               <div className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-14">
//                 {[
//                   { value: "60+", label: "min runtime" },
//                   { value: "60/40", label: "revenue split" },
//                   { value: "$5", label: "subscriber bounty" },
//                   { value: "5-7", label: "day review" },
//                 ].map((stat) => (
//                   <div key={stat.label} className="flex flex-col items-center gap-1">
//                     <span className="text-3xl font-black text-white sm:text-4xl">{stat.value}</span>
//                     <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">{stat.label}</span>
//                   </div>
//                 ))}
//               </div>
//             </Reveal>
//           </div>

//           {/* Bottom seamless fade */}
//           <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32" style={{
//             background: "linear-gradient(to bottom, transparent, #0b0b0e)",
//           }} aria-hidden />
//         </section>

//         {/* ════════════════════════════════════════════════════════════
//             2. THE BRIXLORE ADVANTAGE
//         ════════════════════════════════════════════════════════════ */}
//         <section className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8" aria-labelledby="advantage-heading">

//           <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
//             <div className="h-[600px] w-[600px] rounded-full opacity-[0.05]" style={{
//               background: "radial-gradient(circle, rgba(229,231,235,1) 0%, transparent 70%)",
//             }} />
//           </div>

//           {/* Ghost watermark */}
//           <div className="pointer-events-none absolute inset-0 hidden sm:flex items-center justify-center overflow-hidden select-none" aria-hidden>
//             <span className="text-[9rem] font-black uppercase leading-none tracking-tighter sm:text-[14rem]"
//               style={{ color: "rgba(255,255,255,0.018)" }}>
//               DISTRIBUTE
//             </span>
//           </div>

//           <div className="relative mx-auto max-w-6xl">
//             <Reveal className="text-center mb-14">
//               <div className="mx-auto mb-7 h-px w-20 div-line" />
//               <h2 id="advantage-heading" className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
//                 The Brixlore Advantage
//               </h2>
//               <p className="mt-3 text-neutral-500">Built for filmmakers. Designed to pay.</p>
//             </Reveal>

//             <div className="grid gap-6 sm:grid-cols-3">
//               {advantages.map((adv, i) => (
//                 <Reveal key={adv.title} delay={i * 130}>
//                   <div className="adv-card glass flex h-full flex-col rounded-2xl p-8"
//                     style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)" }}>

//                     {/* Icon + badge row */}
//                     <div className="mb-6 flex items-start justify-between">
//                       <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl text-white/80"
//                         style={{
//                           background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
//                           border: "1px solid rgba(255,255,255,0.11)",
//                         }}>
//                         {adv.icon}
//                       </div>
//                       <span className="text-[0.65rem] font-black tracking-[0.2em] text-neutral-600">{adv.badge}</span>
//                     </div>

//                     <h3 className="text-xl font-black text-white">{adv.title}</h3>
//                     <p className="mt-3 text-sm leading-7 text-neutral-400">{adv.body}</p>
//                   </div>
//                 </Reveal>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* ════════════════════════════════════════════════════════════
//             3. WHAT WE ARE LOOKING FOR
//         ════════════════════════════════════════════════════════════ */}
//         <section className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8" aria-labelledby="requirements-heading">

//           <div className="pointer-events-none absolute inset-0" aria-hidden style={{
//             background: "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(255,255,255,0.025) 0%, transparent 60%)",
//           }} />
//           <div className="orb3 pointer-events-none absolute -right-32 top-1/2 h-80 w-80 rounded-full -translate-y-1/2" aria-hidden
//             style={{ background: "radial-gradient(circle, rgba(229,231,235,0.06) 0%, transparent 70%)" }} />

//           <div className="relative mx-auto max-w-5xl">
//             <Reveal className="text-center">
//               <div className="mx-auto mb-7 h-px w-20 div-line" />
//               <h2 id="requirements-heading" className="text-3xl font-black tracking-tight text-white sm:text-4xl">
//                 What We Are Looking For
//               </h2>
//               <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-neutral-400">
//                 At this time, Brixlore is exclusively focused on{" "}
//                 <span className="font-semibold text-white">feature-length documentaries (60+ minutes)</span>.
//                 We prioritize high production value, compelling narratives, and authentic urban storytelling.
//               </p>
//             </Reveal>

//             {/* Criteria grid */}
//             <div className="mt-14 grid gap-3 sm:grid-cols-2">
//               {[
//                 {
//                   title: "Feature-Length Only",
//                   detail: "Minimum runtime of 60 minutes. We are not accepting short films or music videos at this time.",
//                   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden><rect x="4" y="6" width="16" height="12" rx="2" /><path d="M10 9.5L15 12l-5 2.5v-5z" /></svg>,
//                 },
//                 {
//                   title: "High Production Value",
//                   detail: "Professional-grade cinematography and audio. Stories told with craft and intention.",
//                   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden><circle cx="12" cy="12" r="3" /><path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>,
//                 },
//                 {
//                   title: "Compelling Narratives",
//                   detail: "Stories with depth, tension, and truth. Films that hold a viewer for the full runtime.",
//                   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>,
//                 },
//                 {
//                   title: "Authentic Urban Storytelling",
//                   detail: "Culture, history, and reality of cities worldwide. We live where most cameras don't go.",
//                   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
//                 },
//               ].map((item, i) => (
//                 <Reveal key={item.title} delay={i * 80}>
//                   <div className="glass flex gap-4 rounded-2xl px-6 py-5"
//                     style={{ background: "linear-gradient(100deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)", transition: "all 0.3s ease" }}
//                     onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateX(5px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
//                     onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.borderColor = ""; }}
//                   >
//                     <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/70"
//                       style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.09)" }}>
//                       {item.icon}
//                     </div>
//                     <div>
//                       <p className="font-bold text-white">{item.title}</p>
//                       <p className="mt-1 text-sm leading-6 text-neutral-400">{item.detail}</p>
//                     </div>
//                   </div>
//                 </Reveal>
//               ))}
//             </div>

//             {/* Not accepting notice */}
//             <Reveal delay={320}>
//               <div className="mt-6 flex items-center gap-3 rounded-xl px-5 py-4"
//                 style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
//                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 shrink-0 text-neutral-500" aria-hidden>
//                   <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
//                 </svg>
//                 <p className="text-sm text-neutral-500">
//                   <span className="font-semibold text-neutral-300">Note:</span>{" "}
//                   We are not accepting short films or music videos at this time.
//                 </p>
//               </div>
//             </Reveal>
//           </div>
//         </section>

//         {/* ════════════════════════════════════════════════════════════
//             4. SUBMISSION FORM
//         ════════════════════════════════════════════════════════════ */}
//         <section id="submit" className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8" aria-labelledby="form-heading">

//           {/* Centered glow */}
//           <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
//             <div className="h-[500px] w-[700px] rounded-full opacity-[0.07]" style={{
//               background: "radial-gradient(ellipse, rgba(229,231,235,1) 0%, transparent 65%)",
//               filter: "blur(60px)",
//             }} />
//           </div>
//           <div className="orb pointer-events-none absolute -left-48 top-1/3 h-[500px] w-[500px] rounded-full" aria-hidden
//             style={{ background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 65%)" }} />

//           <div className="relative mx-auto max-w-2xl">
//             <Reveal className="text-center">
//               <div className="mx-auto mb-7 h-px w-20 div-line" />
//               <h2 id="form-heading" className="text-3xl font-black tracking-tight text-white sm:text-4xl">
//                 Start the Conversation
//               </h2>
//               <p className="mt-3 text-neutral-500">
//                 Submit your feature below. Our team reviews all submissions within 5–7 business days.
//               </p>
//             </Reveal>

//             <Reveal delay={120}>
//               <div className="mt-12 overflow-hidden rounded-[2rem] px-8 py-10 sm:px-10 sm:py-12"
//                 style={{
//                   background: "linear-gradient(160deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 60%, rgba(255,255,255,0.035) 100%)",
//                   border: "1px solid rgba(255,255,255,0.1)",
//                   backdropFilter: "blur(24px)",
//                   WebkitBackdropFilter: "blur(24px)",
//                 }}>

//                 {/* Top shimmer line */}
//                 <div className="absolute inset-x-0 top-0 h-px" aria-hidden
//                   style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)" }} />

//                 {submitted ? (
//                   /* ── Success state ── */
//                   <div className="flex flex-col items-center py-10 text-center">
//                     <div className="success-ring mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full"
//                       style={{
//                         background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)",
//                         border: "1px solid rgba(255,255,255,0.2)",
//                       }}>
//                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-9 w-9 text-white" aria-hidden>
//                         <path d="M20 6L9 17l-5-5" />
//                       </svg>
//                     </div>
//                     <h3 className="text-2xl font-black text-white">Submission Received</h3>
//                     <p className="mx-auto mt-3 max-w-sm text-base leading-7 text-neutral-400">
//                       Thanks for reaching out. Our Head of Content,{" "}
//                       <span className="font-semibold text-white">Sarah</span>, will be in touch shortly.
//                     </p>
//                     <button
//                       onClick={() => { setSubmitted(false); setForm(EMPTY); setCharCount(0); }}
//                       className="mt-8 text-sm font-semibold text-neutral-500 underline underline-offset-4 transition-colors hover:text-white"
//                     >
//                       Submit another film
//                     </button>
//                   </div>
//                 ) : (
//                   /* ── Form ── */
//                   <form onSubmit={handleSubmit} className="space-y-5" noValidate>

//                     {/* Row 1 — name + email */}
//                     <div className="grid gap-5 sm:grid-cols-2">
//                       <div className="flex flex-col gap-2">
//                         <label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
//                           Full Name <span className="text-white/40">*</span>
//                         </label>
//                         <input
//                           id="fullName" name="fullName" type="text" required
//                           placeholder="Jane Smith"
//                           value={form.fullName} onChange={handleChange}
//                           className="form-field"
//                         />
//                       </div>
//                       <div className="flex flex-col gap-2">
//                         <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
//                           Email Address <span className="text-white/40">*</span>
//                         </label>
//                         <input
//                           id="email" name="email" type="email" required
//                           placeholder="you@example.com"
//                           value={form.email} onChange={handleChange}
//                           className="form-field"
//                         />
//                       </div>
//                     </div>

//                     {/* Row 2 — film title + trailer */}
//                     <div className="grid gap-5 sm:grid-cols-2">
//                       <div className="flex flex-col gap-2">
//                         <label htmlFor="filmTitle" className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
//                           Film Title <span className="text-white/40">*</span>
//                         </label>
//                         <input
//                           id="filmTitle" name="filmTitle" type="text" required
//                           placeholder="Enter your film title"
//                           value={form.filmTitle} onChange={handleChange}
//                           className="form-field"
//                         />
//                       </div>
//                       <div className="flex flex-col gap-2">
//                         <label htmlFor="trailerLink" className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
//                           Trailer Link <span className="text-white/40">*</span>
//                         </label>
//                         <input
//                           id="trailerLink" name="trailerLink" type="url" required
//                           placeholder="https://vimeo.com/..."
//                           value={form.trailerLink} onChange={handleChange}
//                           className="form-field"
//                         />
//                       </div>
//                     </div>

//                     {/* Row 3 — production status */}
//                     <div className="flex flex-col gap-2">
//                       <label htmlFor="productionStatus" className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
//                         Production Status <span className="text-white/40">*</span>
//                       </label>
//                       <select
//                         id="productionStatus" name="productionStatus" required
//                         value={form.productionStatus} onChange={handleChange}
//                         className="form-field"
//                       >
//                         <option value="" disabled>Select status…</option>
//                         <option value="completed">Completed</option>
//                         <option value="post-production">In Post-Production</option>
//                       </select>
//                     </div>

//                     {/* Row 4 — synopsis */}
//                     <div className="flex flex-col gap-2">
//                       <div className="flex items-center justify-between">
//                         <label htmlFor="synopsis" className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
//                           Brief Synopsis <span className="text-white/40">*</span>
//                         </label>
//                         <span className={`text-xs font-medium tabular-nums ${charCount > 480 ? "text-white/60" : "text-neutral-600"}`}>
//                           {charCount}/500
//                         </span>
//                       </div>
//                       <textarea
//                         id="synopsis" name="synopsis" required
//                         maxLength={500}
//                         placeholder="What is your film about? What makes it essential viewing?"
//                         value={form.synopsis} onChange={handleChange}
//                         className="form-field"
//                       />
//                     </div>

//                     {/* Submit */}
//                     <div className="pt-2">
//                       <button
//                         type="submit"
//                         disabled={loading}
//                         className="btn-shine w-full inline-flex h-13 items-center justify-center rounded-xl py-3.5 text-sm font-black text-black disabled:opacity-70 disabled:cursor-not-allowed"
//                       >
//                         {loading && <span className="spinner" />}
//                         {loading ? "Sending to Acquisitions…" : "Send to Acquisitions"}
//                       </button>
//                     </div>

//                     {/* Footer note */}
//                     <p className="text-center text-xs leading-5 text-neutral-600">
//                       By submitting, you agree to be contacted by our Content Acquisition team.
//                       We review all submissions within 5–7 business days.
//                     </p>
//                   </form>
//                 )}
//               </div>
//             </Reveal>
//           </div>
//         </section>

//       </main>
//     </>
//   );
// }



"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

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
      { threshold: 0.1 },
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

const advantages = [
  {
    badge: "01",
    title: "Non-Exclusive Rights",
    body: "You worked hard on your film. Keep your rights. Distribute on Brixlore while maintaining your presence on YouTube, Vimeo, or other platforms.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    badge: "02",
    title: "60/40 Revenue Share",
    body: "Get paid for every minute watched. We offer a transparent, filmmaker-first revenue split on all ad-supported views.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 2" />
        <path d="M8.5 15.5a5 5 0 0 0 7 0" />
      </svg>
    ),
  },
  {
    badge: "03",
    title: "The $5.00 Bounty",
    body: "Use your voice to grow the platform. Earn a $5.00 cash bonus for every new subscriber who joins through your content.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7" aria-hidden>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
];

const criteria = [
  {
    title: "Feature-Length Only",
    detail: "Minimum runtime of 60 minutes. We are not accepting short films or music videos at this time.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden>
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M10 9.5L15 12l-5 2.5v-5z" />
      </svg>
    ),
  },
  {
    title: "High Production Value",
    detail: "Professional-grade cinematography and audio. Stories told with craft and intention.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="12" r="3" />
        <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    title: "Compelling Narratives",
    detail: "Stories with depth, tension, and truth. Films that hold a viewer for the full runtime.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden>
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: "Authentic Urban Storytelling",
    detail: "Culture, history, and reality of cities worldwide. We go where most cameras don't.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

export default function DistributePage() {
  const [charCount, setCharCount] = useState(0);

  return (
    <>
      <style>{`
        .reveal-block {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1),
                      transform 0.75s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal-block.revealed { opacity: 1; transform: translateY(0); }

        .glass {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.07);
          transition: background 0.3s, border-color 0.3s, transform 0.3s;
        }
        .glass:hover {
          background: rgba(255,255,255,0.055);
          border-color: rgba(255,255,255,0.13);
        }

        .grad-text {
          background: linear-gradient(135deg, #ffffff 0%, #9ca3af 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .div-line {
          background: linear-gradient(90deg, transparent 0%, rgba(229,231,235,0.5) 50%, transparent 100%);
        }

        @keyframes floatOrb {
          0%,100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-22px) scale(1.05); }
        }
        .orb  { animation: floatOrb  9s ease-in-out infinite; }
        .orb2 { animation: floatOrb 13s ease-in-out infinite reverse; }
        .orb3 { animation: floatOrb 16s ease-in-out infinite 3s; }

        .adv-card {
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s;
        }
        .adv-card:hover {
          transform: translateY(-8px);
          border-color: rgba(229,231,235,0.25);
        }

        .criteria-row {
          transition: transform 0.3s ease, background 0.3s, border-color 0.3s;
        }
        .criteria-row:hover {
          transform: translateX(5px);
          background: rgba(255,255,255,0.05) !important;
          border-color: rgba(255,255,255,0.14) !important;
        }

        .btn-shine {
          background: linear-gradient(110deg, #f9fafb 0%, #e5e7eb 40%, #f9fafb 60%, #e5e7eb 100%);
          background-size: 250% auto;
          transition: background-position 0.7s ease, box-shadow 0.3s;
        }
        .btn-shine:hover {
          background-position: right center;
          box-shadow: 0 0 36px rgba(229,231,235,0.28), 0 0 80px rgba(229,231,235,0.1);
        }

        .form-field {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.75rem;
          padding: 0.875rem 1.125rem;
          color: #f5f7fb;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
          -webkit-appearance: none;
        }
        .form-field::placeholder { color: rgba(255,255,255,0.22); }
        .form-field:focus {
          border-color: rgba(229,231,235,0.4);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 0 0 3px rgba(229,231,235,0.06);
        }
        select.form-field option {
          background: #0b0b0e;
          color: #f5f7fb;
        }
        textarea.form-field {
          resize: none;
          min-height: 130px;
        }
        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #9ca3af;
        }
      `}</style>

      <main className="relative flex flex-1 flex-col overflow-hidden" style={{ background: "#0b0b0e" }}>

        {/* HERO */}
        <section className="relative w-full overflow-hidden px-4 py-28 sm:px-6 lg:px-8" aria-label="Hero">

          {/* Gradient mesh */}
          <div className="pointer-events-none absolute inset-0" aria-hidden style={{
            background: "radial-gradient(ellipse 70% 60% at 0% 0%, rgba(255,255,255,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(180,180,200,0.04) 0%, transparent 55%)",
          }} />

          {/* Floating orbs */}
          <div className="orb pointer-events-none absolute -left-48 top-10 h-[500px] w-[500px] rounded-full" aria-hidden
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.055) 0%, transparent 65%)" }} />
          <div className="orb2 pointer-events-none absolute -right-40 top-0 h-80 w-80 rounded-full" aria-hidden
            style={{ background: "radial-gradient(circle, rgba(200,200,220,0.04) 0%, transparent 70%)" }} />

          {/* Hero background image — full bleed, responsive, high quality */}
<div className="pointer-events-none absolute inset-0" aria-hidden>
  <Image
    src="/Distribute_bg.jpeg"
    alt=""
    fill
    priority
    quality={100}
    className="object-cover object-center"
    sizes="100vw"
  />
  {/* Dark overlay so text stays readable over any image */}
  <div
    className="absolute inset-0"
    style={{
      background:
        "linear-gradient(160deg, rgba(11,11,14,0.72) 0%, rgba(11,11,14,0.45) 50%, rgba(11,11,14,0.65) 100%)",
    }}
  />
  {/* Bottom fade into page background */}
  <div
    className="absolute inset-x-0 bottom-0 h-48"
    style={{
      background: "linear-gradient(to bottom, transparent, #0b0b0e)",
    }}
  />
  {/* Top vignette */}
  <div
    className="absolute inset-x-0 top-0 h-32"
    style={{
      background: "linear-gradient(to bottom, rgba(11,11,14,0.5), transparent)",
    }}
  />
</div>

          <div className="relative mx-auto max-w-5xl text-center">

            {/* Label */}
            <div className="reveal-block revealed mb-6 flex items-center justify-center gap-3">
              <div className="h-px w-10" style={{ background: "linear-gradient(90deg, transparent, rgba(229,231,235,0.6))" }} />
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-400">Film Distribution</p>
              <div className="h-px w-10" style={{ background: "linear-gradient(90deg, rgba(229,231,235,0.6), transparent)" }} />
            </div>

            {/* Headline */}
            <h1
              className="reveal-block revealed text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl lg:leading-[1.05]"
              style={{ transitionDelay: "70ms" }}
            >
              The World&apos;s Stage for<br />
              <span className="grad-text">Urban Storytelling.</span>
            </h1>

            {/* Sub-headline */}
            <p
              className="reveal-block revealed mx-auto mt-7 max-w-2xl text-lg leading-8 text-neutral-400"
              style={{ transitionDelay: "150ms" }}
            >
              Join the premier platform for urban deep-dive cinema. We are looking for
              feature-length documentaries that explore the culture, history, and reality
              of cities worldwide.
            </p>

            {/* CTA */}
            <div className="reveal-block revealed mt-10" style={{ transitionDelay: "230ms" }}>
              <a
                href="#submit"
                className="btn-shine group inline-flex items-center justify-center rounded-xl px-10 py-3.5 text-base font-black text-black"
              >
                Submit Your Feature
                <span className="ml-2 transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
              </a>
            </div>

            {/* Stat strip */}
            <Reveal delay={340}>
              <div className="mt-20 flex flex-wrap items-center justify-center gap-10 sm:gap-16">
                {[
                  { value: "60+", label: "min runtime" },
                  { value: "60/40", label: "revenue split" },
                  { value: "$5.00", label: "subscriber bounty" },
                  { value: "5–7", label: "day review" },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex flex-col items-center gap-1.5">
                    {i > 0 && (
                      <div className="pointer-events-none absolute -left-5 top-1/2 hidden h-4 w-px -translate-y-1/2 sm:block"
                        style={{ background: "rgba(255,255,255,0.1)" }} aria-hidden />
                    )}
                    <span className="text-3xl font-black text-white sm:text-4xl">{stat.value}</span>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-neutral-500">{stat.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Bottom fade */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32" style={{
            background: "linear-gradient(to bottom, transparent, #0b0b0e)",
          }} aria-hidden />
        </section>

        {/* THE BRIXLORE ADVANTAGE */}
        <section className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8" aria-labelledby="advantage-heading">

          {/* Center glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="h-[600px] w-[600px] rounded-full opacity-[0.05]"
              style={{ background: "radial-gradient(circle, rgba(229,231,235,1) 0%, transparent 70%)" }} />
          </div>

          {/* Ghost watermark */}
          {/* <div className="pointer-events-none absolute inset-0 hidden sm:flex items-center justify-center overflow-hidden select-none" aria-hidden>
            <span className="text-[9rem] font-black uppercase leading-none tracking-tighter sm:text-[14rem]"
              style={{ color: "rgba(255,255,255,0.016)" }}>
              DISTRIBUTE
            </span>
          </div> */}

          <div className="relative mx-auto max-w-6xl">
            <Reveal className="mb-14 text-center">
              <div className="mx-auto mb-7 h-px w-20 div-line" />
              <h2 id="advantage-heading" className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                The Brixlore Advantage
              </h2>
              <p className="mt-3 text-neutral-500">Built for filmmakers. Designed to pay.</p>
            </Reveal>

            <div className="grid gap-6 sm:grid-cols-3">
              {advantages.map((adv, i) => (
                <Reveal key={adv.title} delay={i * 130}>
                  <div
                    className="adv-card glass flex h-full flex-col rounded-2xl p-8"
                    style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)" }}
                  >
                    <div className="mb-6 flex items-start justify-between">
                      <div
                        className="inline-flex h-14 w-14 items-center justify-center rounded-xl text-white/80"
                        style={{
                          background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                          border: "1px solid rgba(255,255,255,0.11)",
                        }}
                      >
                        {adv.icon}
                      </div>
                      <span className="text-[0.65rem] font-black tracking-[0.2em] text-neutral-600">{adv.badge}</span>
                    </div>
                    <h3 className="text-xl font-black text-white">{adv.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-neutral-400">{adv.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            3. WHAT WE ARE LOOKING FOR
        ════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8" aria-labelledby="requirements-heading">

          <div className="pointer-events-none absolute inset-0" aria-hidden style={{
            background: "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(255,255,255,0.025) 0%, transparent 60%)",
          }} />
          <div className="orb3 pointer-events-none absolute -right-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full" aria-hidden
            style={{ background: "radial-gradient(circle, rgba(229,231,235,0.06) 0%, transparent 70%)" }} />

          <div className="relative mx-auto max-w-5xl">
            <Reveal className="text-center">
              <div className="mx-auto mb-7 h-px w-20 div-line" />
              <h2 id="requirements-heading" className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                What We Are Looking For
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-neutral-400">
                At this time, Brixlore is exclusively focused on{" "}
                <span className="font-semibold text-white">feature-length documentaries (60+ minutes)</span>.
                We prioritize high production value, compelling narratives, and authentic urban storytelling.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-3 sm:grid-cols-2">
              {criteria.map((item, i) => (
                <Reveal key={item.title} delay={i * 80}>
                  <div
                    className="criteria-row glass flex gap-4 rounded-2xl px-6 py-5"
                    style={{ background: "linear-gradient(100deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)" }}
                  >
                    <div
                      className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/70"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
                        border: "1px solid rgba(255,255,255,0.09)",
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-bold text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-neutral-400">{item.detail}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Not accepting notice */}
            <Reveal delay={340}>
              <div
                className="mt-5 flex items-center gap-3 rounded-xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 shrink-0 text-neutral-500" aria-hidden>
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                <p className="text-sm text-neutral-500">
                  <span className="font-semibold text-neutral-300">Note:</span>{" "}
                  We are not accepting short films or music videos at this time.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            4. SUBMISSION FORM — frontend only
        ════════════════════════════════════════════════════ */}
        <section id="submit" className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8" aria-labelledby="form-heading">

          {/* Glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="h-[500px] w-[700px] rounded-full opacity-[0.07]"
              style={{ background: "radial-gradient(ellipse, rgba(229,231,235,1) 0%, transparent 65%)", filter: "blur(60px)" }} />
          </div>
          <div className="orb pointer-events-none absolute -left-48 top-1/3 h-[500px] w-[500px] rounded-full" aria-hidden
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 65%)" }} />

          <div className="relative mx-auto max-w-2xl">
            <Reveal className="text-center">
              <div className="mx-auto mb-7 h-px w-20 div-line" />
              <h2 id="form-heading" className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Start the Conversation
              </h2>
              <p className="mt-3 text-neutral-500">
                Submit your feature below. Our team reviews all submissions within 5–7 business days.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <div
                className="relative mt-12 overflow-hidden rounded-[2rem] px-8 py-10 sm:px-10 sm:py-12"
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 60%, rgba(255,255,255,0.035) 100%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                }}
              >
                {/* Top shimmer */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px" aria-hidden
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)" }} />
                {/* Corner accents */}
                <div className="pointer-events-none absolute left-6 top-6 h-10 w-10 rounded-tl-xl border-l border-t border-white/10" aria-hidden />
                <div className="pointer-events-none absolute right-6 top-6 h-10 w-10 rounded-tr-xl border-r border-t border-white/10" aria-hidden />
                <div className="pointer-events-none absolute bottom-6 left-6 h-10 w-10 rounded-bl-xl border-b border-l border-white/10" aria-hidden />
                <div className="pointer-events-none absolute bottom-6 right-6 h-10 w-10 rounded-br-xl border-b border-r border-white/10" aria-hidden />

                <form className="space-y-6" noValidate>

                  {/* Row 1 — Full Name + Email */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="fullName" className="form-label">
                        Full Name <span className="text-white/30">*</span>
                      </label>
                      <input
                        id="fullName" name="fullName" type="text"
                        placeholder="Jane Smith"
                        className="form-field"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="form-label">
                        Email Address <span className="text-white/30">*</span>
                      </label>
                      <input
                        id="email" name="email" type="email"
                        placeholder="you@example.com"
                        className="form-field"
                      />
                    </div>
                  </div>

                  {/* Row 2 — Film Title + Trailer Link */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="filmTitle" className="form-label">
                        Film Title <span className="text-white/30">*</span>
                      </label>
                      <input
                        id="filmTitle" name="filmTitle" type="text"
                        placeholder="Enter your film title"
                        className="form-field"
                      />
                    </div>
                    <div>
                      <label htmlFor="trailerLink" className="form-label">
                        Trailer Link <span className="text-white/30">*</span>
                      </label>
                      <input
                        id="trailerLink" name="trailerLink" type="url"
                        placeholder="https://vimeo.com/..."
                        className="form-field"
                      />
                    </div>
                  </div>

                  {/* Row 3 — Production Status */}
                  <div>
                    <label htmlFor="productionStatus" className="form-label">
                      Production Status <span className="text-white/30">*</span>
                    </label>
                    <select id="productionStatus" name="productionStatus" className="form-field">
                      <option value="" disabled selected>Select status…</option>
                      <option value="completed">Completed</option>
                      <option value="post-production">In Post-Production</option>
                    </select>
                  </div>

                  {/* Row 4 — Synopsis */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label htmlFor="synopsis" className="form-label mb-0">
                        Brief Synopsis <span className="text-white/30">*</span>
                      </label>
                      <span className={`text-xs font-medium tabular-nums ${charCount > 480 ? "text-white/60" : "text-neutral-600"}`}>
                        {charCount}/500
                      </span>
                    </div>
                    <textarea
                      id="synopsis" name="synopsis"
                      maxLength={500}
                      placeholder="What is your film about? What makes it essential viewing?"
                      className="form-field"
                      onChange={(e) => setCharCount(e.target.value.length)}
                    />
                  </div>

                  {/* Submit button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      className="btn-shine w-full inline-flex items-center justify-center rounded-xl py-3.5 text-sm font-black text-black"
                    >
                      Send to Acquisitions
                    </button>
                  </div>

                  {/* Footer note */}
                  <p className="text-center text-xs leading-5 text-neutral-600">
                    By submitting, you agree to be contacted by our Content Acquisition team.
                    We review all submissions within 5–7 business days.
                  </p>
                </form>
              </div>
            </Reveal>
          </div>
        </section>

      </main>
    </>
  );
}