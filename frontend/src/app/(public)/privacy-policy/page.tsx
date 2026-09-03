import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Database,
  Eye,
  Fingerprint,
  LockKeyhole,
  SlidersHorizontal,
} from "lucide-react";
import { siteService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for BRIXLORE.",
};

const policySections = [
  {
    id: "information",
    number: "01",
    icon: Database,
    title: "Information we collect",
    description:
      "We may collect account information such as your name and email, subscription details, device metadata, and viewing activity needed to deliver and improve the service.",
  },
  {
    id: "use",
    number: "02",
    icon: Eye,
    title: "How we use information",
    description:
      "We use data to authenticate access, manage subscriptions, personalize recommendations, support customers, and understand platform performance.",
  },
  {
    id: "security",
    number: "03",
    icon: LockKeyhole,
    title: "Sharing and security",
    description:
      "We do not sell personal information. Limited data may be shared with trusted providers for payments, analytics, and operations under contractual safeguards.",
  },
  {
    id: "choices",
    number: "04",
    icon: SlidersHorizontal,
    title: "Your rights and choices",
    description:
      "Depending on your region, you may request access, correction, or deletion of your information and adjust how non-essential cookies are used.",
  },
];

function toHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content)
    ? content
    : content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br />");
}

export default async function PrivacyPolicyPage() {
  const page = await siteService.getPage("privacy-policy");
  const content = page?.content?.trim();
  const updatedAt = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="overflow-hidden bg-[#050505] text-white">
      <section className="relative border-b border-white/15 pt-[125px] md:pt-[150px] lg:pt-[170px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_16%,rgba(255,255,255,.1),transparent_25%),linear-gradient(180deg,#0b0b0b_0%,#050505_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:25%_120px]" />

        <div className="relative mx-auto max-w-[1800px] px-4 pb-14 sm:px-6 sm:pb-20 lg:px-10 lg:pb-24 xl:px-[6vw]">
          <div className="flex items-center justify-between border-b border-white/15 pb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/38 sm:text-xs">
            <span>Legal / Privacy</span>
            <span className="hidden sm:block">Document 01 · Public record</span>
          </div>

          <div className="grid gap-10 pb-4 pt-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end lg:pt-24">
            <div>
              <div className="mb-7 grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-white/[0.04]">
                <Fingerprint size={22} strokeWidth={1.5} />
              </div>
              <h1 className="max-w-5xl text-[clamp(4rem,9vw,9rem)] font-semibold leading-[0.78] tracking-[-0.08em] !text-white">
                Privacy,
                <span className="block pl-[7vw] font-light italic text-white/55">
                  in plain sight.
                </span>
              </h1>
            </div>

            <div className="border-l border-white/20 pl-6">
              <p className="text-base leading-7 text-white/62">
                What we collect, why it matters, and the choices that stay in
                your hands—without hiding the important parts in the margins.
              </p>
              <div className="mt-7 flex items-center justify-between border-t border-white/15 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
                <span>Updated {updatedAt}</span>
                <a
                  href="#policy"
                  aria-label="Read privacy policy"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white/65 transition hover:bg-white hover:text-black"
                >
                  <ArrowDown size={15} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="policy" className="bg-[#f0eee8] !text-black [&_h2]:!text-black [&_h3]:!text-black">
        <div className="mx-auto grid max-w-[1800px] lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="border-b border-black/15 px-4 py-12 sm:px-6 lg:border-b-0 lg:border-r lg:px-10 lg:py-24 xl:pl-[6vw]">
            <div className="lg:sticky lg:top-32">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/38">
                On this page
              </p>
              <nav className="mt-7 border-t border-black/15" aria-label="Privacy policy sections">
                {policySections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="group flex items-center justify-between border-b border-black/15 py-4 text-sm font-semibold text-black/58 transition hover:text-black"
                  >
                    <span>{section.title}</span>
                    <span className="text-[10px] tracking-[0.16em] text-black/28 group-hover:text-black/55">
                      {section.number}
                    </span>
                  </a>
                ))}
              </nav>
              <p className="mt-8 max-w-[230px] text-xs leading-6 text-black/42">
                Questions about this document? Our team can help with a privacy
                request.
              </p>
              <Link
                href="/contact?subject=Privacy%20request"
                className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-black"
              >
                Contact privacy team <ArrowRight size={13} />
              </Link>
            </div>
          </aside>

          <article className="px-4 py-14 sm:px-8 sm:py-20 lg:px-14 lg:py-24 xl:px-20">
            <div className="max-w-5xl">
              <div className="grid gap-7 border-b border-black/20 pb-12 md:grid-cols-[minmax(0,1fr)_280px] md:items-end">
                <h2 className="text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl">
                  Your data should never feel like a mystery.
                </h2>
                <p className="text-sm leading-7 text-black/55">
                  This policy explains how Brixlore handles information when you
                  browse, create an account, subscribe, or watch.
                </p>
              </div>

              {content ? (
                <div
                  className="privacy-document py-12 text-[15px] leading-8 text-black/68 [&_a]:font-semibold [&_a]:text-black [&_a]:underline [&_h1]:mb-5 [&_h1]:mt-12 [&_h1]:!text-3xl [&_h1]:font-semibold [&_h1]:tracking-[-0.04em] [&_h2]:mb-4 [&_h2]:mt-12 [&_h2]:!text-2xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-9 [&_h3]:!text-xl [&_li]:my-2 [&_ol]:my-5 [&_ol]:pl-6 [&_p]:my-5 [&_strong]:text-black [&_ul]:my-5 [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: toHtml(content) }}
                />
              ) : (
                <div>
                  {policySections.map(({ id, number, icon: Icon, title, description }) => (
                    <section
                      key={id}
                      id={id}
                      className="scroll-mt-32 grid gap-6 border-b border-black/18 py-10 md:grid-cols-[70px_minmax(0,1fr)_minmax(230px,.68fr)] md:py-12"
                    >
                      <span className="text-xs font-bold tracking-[0.18em] text-black/28">
                        {number}
                      </span>
                      <div>
                        <Icon size={20} strokeWidth={1.6} className="mb-6 text-black/45" />
                        <h3 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                          {title}
                        </h3>
                      </div>
                      <p className="text-sm leading-7 text-black/58">
                        {description}
                      </p>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="border-t border-white/15 bg-[#050505] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 xl:px-[6vw]">
        <div className="mx-auto grid max-w-[1800px] gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end">
          <h2 className="max-w-5xl text-5xl font-semibold leading-[0.9] tracking-[-0.065em] !text-white sm:text-7xl">
            Control stays with you.
          </h2>
          <div>
            <p className="text-sm leading-7 text-white/48">
              Review cookie use or send a request about the personal
              information connected to your account.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/cookie-consent"
                className="inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/80"
              >
                Cookie preferences
              </Link>
              <Link
                href="/contact?subject=Privacy%20request"
                className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
              >
                Make a request
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
