import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clapperboard, Radio, Sparkles } from "lucide-react";
import { LOGO_HEIGHT, LOGO_WIDTH, SITE_BRAND } from "@/lib/seo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(390px,.88fr)_minmax(500px,1.12fr)]">
        <aside className="relative hidden min-h-screen overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
          <Image src="/Partners_HeroImg.jpeg" alt="A Brixlore production in progress" fill priority sizes="45vw" className="object-cover object-center opacity-65 grayscale" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.28),rgba(0,0,0,.1)_32%,rgba(0,0,0,.92)_100%),linear-gradient(90deg,rgba(0,0,0,.2),rgba(0,0,0,.55))]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:25%_25%]" />

          <Link href="/" aria-label={`${SITE_BRAND} home`} className="relative z-10 w-fit">
            <Image src="/logo-2.png" alt={SITE_BRAND} width={LOGO_WIDTH} height={LOGO_HEIGHT} className="h-10 w-auto object-contain" priority />
          </Link>

          <div className="relative z-10 max-w-xl">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/48"><Radio size={13} /> Your next story is waiting</p>
            <p className="mt-5 text-5xl font-semibold leading-[0.88] tracking-[-0.065em] xl:text-7xl">Come closer.<br /><span className="font-light italic text-white/55">Press play.</span></p>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/55">Independent films, original series, and culture-led stories—all in one considered streaming home.</p>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/20 pt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/38">
            <span className="flex items-center gap-2"><Clapperboard size={13} /> Media on our terms</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </aside>

        <section className="relative flex min-h-screen min-w-0 flex-col bg-[radial-gradient(circle_at_85%_8%,rgba(255,255,255,.09),transparent_30%),#070707] px-4 pb-10 pt-5 sm:px-6 lg:px-10 lg:py-10 xl:px-[6vw]">
          <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:url('data:image/svg+xml,%3Csvg_viewBox=%220_0_180_180%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22n%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%22.8%22_numOctaves=%223%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />
          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-white/48 transition hover:text-white"><ArrowLeft size={15} /> Back home</Link>
            <Link href="/" className="lg:hidden" aria-label={`${SITE_BRAND} home`}><Image src="/logo-2.png" alt={SITE_BRAND} width={LOGO_WIDTH} height={LOGO_HEIGHT} className="h-8 w-auto object-contain" /></Link>
            <span className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/28 sm:flex"><Sparkles size={12} /> Brixlore access</span>
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center py-12 sm:py-16">
            <div className="w-full max-w-[540px]">{children}</div>
          </div>

          <div className="relative z-10 flex justify-center gap-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">
            <Link href="/privacy-policy" className="transition hover:text-white/60">Privacy</Link>
            <Link href="/terms-of-use" className="transition hover:text-white/60">Terms</Link>
            <Link href="/help-center" className="transition hover:text-white/60">Help</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
