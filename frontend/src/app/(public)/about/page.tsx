import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Clapperboard,
  Globe2,
  Play,
  Radio,
} from "lucide-react";
import { SITE_BRAND } from "@/lib/seo";
import { siteService } from "@/lib/services";

export const metadata: Metadata = {
  title: "About",
  description: `${SITE_BRAND} is an independent streaming home for culture-led films, original series, and stories with something real to say.`,
};

const principles = [
  {
    number: "01",
    title: "Culture leads.",
    description:
      "We begin with the people, places, and perspectives that shape a story—not a trend report.",
  },
  {
    number: "02",
    title: "Creators stay close.",
    description:
      "We build alongside emerging and established voices so the original point of view stays intact.",
  },
  {
    number: "03",
    title: "The screen disappears.",
    description:
      "Technology should make the story feel nearer. The experience stays quiet, reliable, and built for every device.",
  },
];

const signals = [
  { icon: Clapperboard, label: "Independent cinema" },
  { icon: Radio, label: "Original series" },
  { icon: Globe2, label: "Stories without borders" },
];

export default async function AboutPage() {
  const page = await siteService.getPage("about");
  const cmsNarrative = page?.content?.trim();

  return (
    <main className="overflow-hidden bg-[#050505] text-white">
      <section className="relative min-h-[92svh] border-b border-white/15 pt-[130px] md:pt-[155px] lg:pt-[175px]">
        <Image
          src="/hero-banner.png"
          alt="City skyline at night"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-65 grayscale"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.96)_0%,rgba(0,0,0,.63)_52%,rgba(0,0,0,.16)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,.25),transparent_36%,#050505_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:25%_100%]" />

        <div className="relative mx-auto flex min-h-[calc(92svh-130px)] max-w-[1800px] flex-col justify-between px-4 pb-10 sm:px-6 md:min-h-[calc(92svh-155px)] lg:min-h-[calc(92svh-175px)] lg:px-10 lg:pb-14 xl:px-[6vw]">
          <div className="flex items-center justify-between border-b border-white/20 pb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55 sm:text-xs">
            <span>About {SITE_BRAND}</span>
            <span className="hidden sm:block">Independent media · Detroit to everywhere</span>
          </div>

          <div className="grid items-end gap-10 pb-8 pt-20 lg:grid-cols-[minmax(0,1fr)_330px]">
            <div>
              <h1 className="max-w-[1200px] text-[clamp(4rem,11.5vw,11rem)] font-semibold leading-[0.75] tracking-[-0.085em]">
                Media on
                <span className="block pl-[8vw] font-light italic text-white/58">our terms.</span>
              </h1>
            </div>
            <div className="border-l border-white/20 pl-6 lg:pb-2">
              <p className="text-base leading-7 text-white/68">
                A streaming home for bold films, original series, and the voices shaping culture before the rest of the world catches up.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/browse-2" className="inline-flex h-12 items-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/82">
                  Enter the collection <Play size={15} fill="currentColor" />
                </Link>
                <a href="#our-story" aria-label="Read our story" className="grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-sm transition hover:bg-white hover:text-black">
                  <ArrowDown size={17} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="our-story" className="bg-[#f0eee8] !text-black [&_h1]:!text-black [&_h2]:!text-black [&_h3]:!text-black">
        <div className="mx-auto max-w-[1800px] px-4 py-20 sm:px-6 sm:py-24 lg:px-10 lg:py-32 xl:px-[6vw]">
          <div className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-20">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/45">Our point of view</p>
            <div>
              <h2 className="max-w-6xl text-4xl font-semibold leading-[0.96] tracking-[-0.06em] sm:text-6xl lg:text-[5.4rem]">
                The stories already exist. The platform should know how to listen.
              </h2>
              <div className="mt-12 grid gap-8 border-t border-black/20 pt-8 md:grid-cols-2 lg:mt-16">
                <p className="max-w-xl text-lg leading-8 text-black/70">
                  {cmsNarrative || `${SITE_BRAND} was built for work that lives beyond familiar categories—for creators whose perspective is the reason to watch, and audiences who want more than another feed.`}
                </p>
                <p className="max-w-xl text-sm leading-7 text-black/58 md:justify-self-end">
                  We bring cinema, documentary, conversation, and serialized storytelling into one considered experience. Every choice—from curation to playback—is designed to keep attention on the work.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-[#050505] !text-white py-20 sm:py-24 lg:py-32 [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-10 xl:px-[6vw]">
          <div className="mb-12 flex items-end justify-between gap-6 border-b border-white/15 pb-6 lg:mb-16">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/38">Behind the signal</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">Made close to the story.</h2>
            </div>
            <span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-white/32 md:block">Production / Curation / Distribution</span>
          </div>

          <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[230px] lg:auto-rows-[180px] lg:grid-cols-12 lg:gap-4">
            <figure className="group relative col-span-2 row-span-3 overflow-hidden lg:col-span-5 lg:row-span-4">
              <Image src="/Partners_HeroImg.jpeg" alt="A film production viewed through a camera monitor" fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover object-center grayscale transition duration-700 group-hover:grayscale-0" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-5 pb-5 pt-16 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">On set · stories taking shape</figcaption>
            </figure>
            <figure className="group relative col-span-2 row-span-2 overflow-hidden lg:col-span-7 lg:row-span-3 lg:mt-16">
              <Image src="/Distribute_bg.jpeg" alt="A cinematic scene from an independent production" fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover object-center grayscale transition duration-700 group-hover:grayscale-0" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              <figcaption className="absolute bottom-5 left-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">From a local frame to a wider world</figcaption>
            </figure>
            <div className="col-span-2 flex items-end border border-white/15 p-5 lg:col-span-3 lg:row-span-1">
              <p className="text-sm leading-6 text-white/48">The camera gets close. The platform carries it further.</p>
            </div>
            <div className="col-span-2 flex items-center justify-center bg-white text-black lg:col-span-4 lg:row-span-1">
              <span className="text-5xl font-semibold tracking-[-0.07em] sm:text-6xl">B / TV</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/15 bg-[#0a0a0a]">
        <div className="mx-auto grid max-w-[1800px] divide-y divide-white/15 px-4 sm:px-6 lg:grid-cols-3 lg:divide-x lg:divide-y-0 lg:px-10 xl:px-[6vw]">
          {signals.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-4 py-6 lg:px-8 lg:first:pl-0">
              <Icon size={18} strokeWidth={1.7} className="text-white/45" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/68">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#050505] !text-white [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white">
        <div className="mx-auto max-w-[1800px] px-4 py-20 sm:px-6 sm:py-24 lg:px-10 lg:py-32 xl:px-[6vw]">
          <div className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-20">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">What guides us</p>
            <div>
              {principles.map((principle) => (
                <article key={principle.number} className="grid gap-5 border-t border-white/15 py-8 sm:grid-cols-[80px_minmax(0,1fr)_minmax(240px,.65fr)] sm:items-start lg:py-10">
                  <span className="text-xs font-semibold tracking-[0.18em] text-white/28">{principle.number}</span>
                  <h3 className="text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">{principle.title}</h3>
                  <p className="max-w-md text-sm leading-7 text-white/48">{principle.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 !text-black sm:px-6 sm:py-24 lg:px-10 lg:py-28 xl:px-[6vw] [&_h1]:!text-black [&_h2]:!text-black [&_h3]:!text-black">
        <div className="mx-auto grid max-w-[1800px] gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <h2 className="max-w-5xl text-5xl font-semibold leading-[0.86] tracking-[-0.07em] sm:text-7xl lg:text-[7.5rem]">
            Find the story you didn’t know you needed.
          </h2>
          <div>
            <p className="text-sm leading-7 text-black/58">The collection is ready when you are. Start watching, or work with us to bring another point of view into focus.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/browse-2" className="inline-flex h-12 items-center gap-3 rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:bg-black/78">Browse Brixlore <ArrowUpRight size={16} /></Link>
              <Link href="/contact" className="inline-flex h-12 items-center rounded-full border border-black/25 px-6 text-sm font-semibold text-black transition hover:bg-black hover:text-white">Contact us</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
