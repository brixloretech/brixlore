import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { SITE_BRAND } from "@/lib/seo";
import { siteService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of Use for BRIXLORE.",
};

const termSections = [
  {
    id: "acceptance",
    number: "01",
    icon: BadgeCheck,
    title: "Acceptance of terms",
    description: `By using ${SITE_BRAND}, you agree to these Terms of Use. If you do not agree, you should not access or use the service.`,
  },
  {
    id: "availability",
    number: "02",
    icon: CalendarDays,
    title: "Service availability",
    description:
      "We may update, suspend, or modify features from time to time to improve quality, security, or compliance.",
  },
  {
    id: "accounts",
    number: "03",
    icon: ShieldCheck,
    title: "Accounts and conduct",
    description:
      "You are responsible for safeguarding your account and using Brixlore lawfully. Misuse, abuse, or unauthorized access may result in account suspension.",
  },
  {
    id: "billing",
    number: "04",
    icon: CircleDollarSign,
    title: "Billing and cancellation",
    description:
      "Membership billing, renewal, and cancellation terms are provided at checkout and within account settings.",
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

export default async function TermsOfUsePage() {
  const page = await siteService.getPage("terms-of-use");
  const content = page?.content?.trim();
  const updatedAt = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="overflow-hidden bg-[#050505] text-white">
      <section className="relative border-b border-white/15 pt-[125px] md:pt-[150px] lg:pt-[170px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,.1),transparent_25%),linear-gradient(180deg,#0b0b0b_0%,#050505_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:25%_100%]" />

        <div className="relative mx-auto max-w-[1800px] px-4 pb-14 sm:px-6 sm:pb-20 lg:px-10 lg:pb-24 xl:px-[6vw]">
          <div className="flex items-center justify-between border-b border-white/15 pb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/38 sm:text-xs">
            <span>Legal / Terms</span>
            <span className="hidden sm:block">Document 02 · Public record</span>
          </div>

          <div className="grid gap-10 pb-4 pt-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end lg:pt-24">
            <div>
              <div className="mb-7 grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-white/[0.04]">
                <FileText size={22} strokeWidth={1.5} />
              </div>
              <h1 className="max-w-5xl text-[clamp(4rem,9vw,9rem)] font-semibold leading-[0.78] tracking-[-0.08em] !text-white">
                The terms,
                <span className="block pl-[7vw] font-light italic text-white/55">
                  without the fog.
                </span>
              </h1>
            </div>

            <div className="border-l border-white/20 pl-6">
              <p className="text-base leading-7 text-white/62">
                The shared rules that keep Brixlore reliable, fair, and focused
                on the stories you came here to watch.
              </p>
              <div className="mt-7 flex items-center justify-between border-t border-white/15 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
                <span>Updated {updatedAt}</span>
                <a
                  href="#terms"
                  aria-label="Read terms of use"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white/65 transition hover:bg-white hover:text-black"
                >
                  <ArrowDown size={15} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="terms" className="bg-[#f0eee8] !text-black [&_h2]:!text-black [&_h3]:!text-black">
        <div className="mx-auto grid max-w-[1800px] lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="border-b border-black/15 px-4 py-12 sm:px-6 lg:border-b-0 lg:border-r lg:px-10 lg:py-24 xl:pl-[6vw]">
            <div className="lg:sticky lg:top-32">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/38">
                The agreement
              </p>
              <nav className="mt-7 border-t border-black/15" aria-label="Terms of use sections">
                {termSections.map((section) => (
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
              <p className="mt-8 max-w-[235px] text-xs leading-6 text-black/42">
                These terms apply when you browse, create an account, or use a
                Brixlore membership.
              </p>
              <Link
                href="/contact?subject=Terms%20of%20Use%20question"
                className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-black"
              >
                Ask a legal question <ArrowRight size={13} />
              </Link>
            </div>
          </aside>

          <article className="px-4 py-14 sm:px-8 sm:py-20 lg:px-14 lg:py-24 xl:px-20">
            <div className="max-w-5xl">
              <div className="grid gap-7 border-b border-black/20 pb-12 md:grid-cols-[minmax(0,1fr)_280px] md:items-end">
                <h2 className="text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl">
                  A fair frame for every member.
                </h2>
                <p className="text-sm leading-7 text-black/55">
                  These terms explain the responsibilities that come with using
                  the platform and the standards we hold ourselves to in return.
                </p>
              </div>

              {content ? (
                <div
                  className="terms-document py-12 text-[15px] leading-8 text-black/68 [&_a]:font-semibold [&_a]:text-black [&_a]:underline [&_h1]:mb-5 [&_h1]:mt-12 [&_h1]:!text-3xl [&_h1]:font-semibold [&_h1]:tracking-[-0.04em] [&_h2]:mb-4 [&_h2]:mt-12 [&_h2]:!text-2xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-9 [&_h3]:!text-xl [&_li]:my-2 [&_ol]:my-5 [&_ol]:pl-6 [&_p]:my-5 [&_strong]:text-black [&_ul]:my-5 [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: toHtml(content) }}
                />
              ) : (
                <div>
                  {termSections.map(({ id, number, icon: Icon, title, description }) => (
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
            Questions deserve clear answers.
          </h2>
          <div>
            <p className="text-sm leading-7 text-white/48">
              Get in touch about these terms or review how we handle the
              information connected to your Brixlore account.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contact?subject=Terms%20of%20Use%20question"
                className="inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/80"
              >
                Contact the team
              </Link>
              <Link
                href="/privacy-policy"
                className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
              >
                Privacy policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
