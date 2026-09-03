import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  CircleHelp,
  CreditCard,
  KeyRound,
  MessageCircle,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { SITE_BRAND } from "@/lib/seo";
import { siteService } from "@/lib/services";
import { HelpCenterSupportForm } from "./HelpCenterSupportForm";

export const metadata: Metadata = {
  title: "Help Center",
  description: `Get support and answers for ${SITE_BRAND}.`,
};

const quickPaths = [
  {
    icon: KeyRound,
    number: "01",
    title: "Sign in again",
    description: "Reset a password or get back into your account.",
    href: "/forgot-password",
  },
  {
    icon: CreditCard,
    number: "02",
    title: "Plan & billing",
    description: "Review plans, access, and subscription options.",
    href: "/subscription",
  },
  {
    icon: Settings2,
    number: "03",
    title: "Account settings",
    description: "Update your profile and manage your Brixlore space.",
    href: "/login?returnUrl=%2Fdashboard%2Fsettings",
  },
];

const faqs = [
  {
    question: "How do I reset my password?",
    answer: (
      <>
        Go to <Link href="/forgot-password">Forgot Password</Link> and follow
        the secure link sent to your email address.
      </>
    ),
  },
  {
    question: "How can I change my subscription plan?",
    answer: (
      <>
        Visit <Link href="/subscription">Subscription</Link> to compare plan
        options and choose the access that works for you.
      </>
    ),
  },
  {
    question: "Where can I get technical support?",
    answer: (
      <>
        Send the team a note below with your device, browser, and a short
        description of what happened. We&apos;ll help you take it from there.
      </>
    ),
  },
  {
    question: "How do I update my account information?",
    answer:
      "Sign in, then open your dashboard settings to update your profile details.",
  },
];

export default async function HelpCenterPage() {
  const page = await siteService.getPage("help-center");
  const content = page?.content?.trim();

  return (
    <main className="overflow-hidden bg-[#050505] text-white">
      <section className="relative border-b border-white/15 pt-[125px] md:pt-[150px] lg:pt-[170px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_12%,rgba(255,255,255,.1),transparent_26%),linear-gradient(180deg,#0c0c0c_0%,#050505_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:25%_100%]" />

        <div className="relative mx-auto max-w-[1800px] px-4 pb-14 sm:px-6 sm:pb-20 lg:px-10 lg:pb-24 xl:px-[6vw]">
          <div className="flex items-center justify-between border-b border-white/15 pb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/38 sm:text-xs">
            <span>Support / Brixlore</span>
            <span className="hidden sm:block">A real team behind the screen</span>
          </div>

          <div className="grid gap-10 pt-16 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end lg:pt-24">
            <div>
              <div className="mb-7 grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/85">
                <CircleHelp size={23} strokeWidth={1.5} />
              </div>
              <h1 className="max-w-5xl text-[clamp(4rem,9vw,9rem)] font-semibold leading-[0.78] tracking-[-0.08em] !text-white">
                Need a hand?
                <span className="block pl-[7vw] font-light italic text-white/55">
                  We&apos;re here.
                </span>
              </h1>
            </div>

            <div className="border-l border-white/20 pl-6">
              <p className="text-base leading-7 text-white/62">
                Find a fast answer, manage your account, or send our support
                team the details. Every route starts here.
              </p>
              <a
                href="#quick-paths"
                className="mt-7 inline-flex h-12 items-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/80"
              >
                Find your route <ArrowDown size={15} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {content ? (
        <section className="bg-[#f0eee8] !text-black [&_h1]:!text-black [&_h2]:!text-black [&_h3]:!text-black">
          <article className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28 xl:px-[6vw]">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/38">
              Help desk notes
            </p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
              {page?.title || "Help Center"}
            </h2>
            <div className="mt-10 border-t border-black/20 pt-8 text-[15px] leading-8 text-black/65 whitespace-pre-line">
              {content}
            </div>
          </article>
        </section>
      ) : (
        <>
          <section id="quick-paths" className="border-b border-white/15 bg-[#080808]">
            <div className="mx-auto max-w-[1800px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:px-[6vw]">
              <div className="flex items-end justify-between gap-6 border-b border-white/15 pb-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
                    Common routes
                  </p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em] !text-white sm:text-5xl">
                    Start with the obvious.
                  </h2>
                </div>
                <span className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-white/32 md:block">
                  Account / access / billing
                </span>
              </div>

              <div className="grid border-l border-white/15 md:grid-cols-3">
                {quickPaths.map(({ icon: Icon, number, title, description, href }) => (
                  <Link
                    key={title}
                    href={href}
                    className="group relative min-h-64 border-b border-r border-white/15 p-6 transition-colors hover:bg-white hover:text-black sm:p-8"
                  >
                    <span className="text-[10px] font-semibold tracking-[0.18em] text-white/35 transition group-hover:text-black/40">
                      {number}
                    </span>
                    <Icon size={22} strokeWidth={1.5} className="mt-12 text-white/70 transition group-hover:text-black" />
                    <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] !text-white transition group-hover:!text-black">
                      {title}
                    </h3>
                    <p className="mt-3 max-w-xs text-sm leading-6 text-white/45 transition group-hover:text-black/60">
                      {description}
                    </p>
                    <ArrowRight size={17} className="absolute bottom-7 right-7 text-white/45 transition-transform group-hover:translate-x-1 group-hover:text-black" />
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[#050505]">
            <div className="mx-auto grid max-w-[1800px] lg:grid-cols-[minmax(280px,.75fr)_minmax(0,1.25fr)]">
              <aside className="border-b border-white/15 px-4 py-16 sm:px-6 sm:py-20 lg:border-b-0 lg:border-r lg:px-10 lg:py-28 xl:pl-[6vw] xl:pr-14">
                <div className="lg:sticky lg:top-32">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
                    Fast answers
                  </p>
                  <h2 className="mt-5 max-w-md text-4xl font-semibold leading-[0.95] tracking-[-0.055em] !text-white sm:text-5xl">
                    A few questions we hear often.
                  </h2>
                  <p className="mt-6 max-w-sm text-sm leading-7 text-white/45">
                    If your question is not here, the support desk is just below.
                  </p>
                  <a
                    href="#support-desk"
                    className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:text-white/60"
                  >
                    Message the team <ArrowRight size={14} />
                  </a>
                </div>
              </aside>

              <div className="px-4 py-16 sm:px-6 sm:py-20 lg:px-14 lg:py-28 xl:px-20">
                <div className="mx-auto max-w-3xl border-t border-white/15">
                  {faqs.map(({ question, answer }, index) => (
                    <details
                      key={question}
                      className="group border-b border-white/15"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-5 py-6 text-lg font-semibold tracking-[-0.025em] text-white/82 transition hover:text-white [&::-webkit-details-marker]:hidden sm:text-xl">
                        <span className="text-[10px] font-semibold tracking-[0.16em] text-white/28">
                          0{index + 1}
                        </span>
                        <span className="flex-1">{question}</span>
                        <span className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-base font-normal text-white/65 transition group-open:rotate-45 group-open:bg-white group-open:text-black">
                          +
                        </span>
                      </summary>
                      <div className="pb-7 pl-[42px] pr-12 text-sm leading-7 text-white/48 [&_a]:font-semibold [&_a]:text-white [&_a]:underline [&_a]:underline-offset-4">
                        {answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="support-desk" className="border-t border-white/15 bg-[#f0eee8] !text-black [&_h2]:!text-black">
            <div className="mx-auto grid max-w-[1800px] lg:grid-cols-[minmax(280px,.7fr)_minmax(0,1.3fr)]">
              <div className="border-b border-black/15 px-4 py-16 sm:px-6 sm:py-20 lg:border-b-0 lg:border-r lg:px-10 lg:py-28 xl:pl-[6vw] xl:pr-14">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/38">
                  Support desk
                </p>
                <h2 className="mt-5 max-w-md text-5xl font-semibold leading-[0.9] tracking-[-0.065em] sm:text-6xl">
                  Send the signal.
                </h2>
                <p className="mt-6 max-w-sm text-sm leading-7 text-black/56">
                  Tell us what you need. Adding your device, browser, and the
                  issue you saw helps us get to the right answer faster.
                </p>
                <div className="mt-10 flex items-center gap-3 border-t border-black/15 pt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-black/45">
                  <ShieldCheck size={15} /> Your message goes directly to support
                </div>
              </div>

              <div className="px-4 py-16 sm:px-6 sm:py-20 lg:px-14 lg:py-28 xl:px-20">
                <div className="mx-auto max-w-3xl">
                  <div className="mb-9 flex items-end justify-between border-b border-black/20 pb-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/38">
                        New request
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                        What can we help with?
                      </h2>
                    </div>
                    <MessageCircle size={22} className="text-black/42" />
                  </div>
                  <HelpCenterSupportForm />
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
