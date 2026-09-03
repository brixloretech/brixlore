"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Crown,
  History,
  House,
  ListVideo,
  LogOut,
  Menu,
  PlayCircle,
  Search,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/contexts";
import { SITE_BRAND } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { fetchBranding } from "@/lib/branding";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/dashboard/explore", label: "Search / Explore", icon: Search },
  { href: "/dashboard/my-list", label: "My List", icon: ListVideo },
  { href: "/dashboard/continue-watching", label: "Continue Watching", icon: PlayCircle },
  { href: "/dashboard/watch-history", label: "Watch History", icon: History },
];

const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/subscription", label: "Subscription", icon: Crown },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function isCurrentPath(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function RailLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = isCurrentPath(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
        active
          ? "bg-white text-black shadow-[0_0_28px_rgba(255,255,255,0.22)]"
          : "text-white/45 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon size={21} strokeWidth={active ? 2.4 : 1.9} aria-hidden="true" />
      <span className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-2xl transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 lg:block">
        {item.label}
      </span>
    </Link>
  );
}

function DrawerLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate: () => void }) {
  const Icon = item.icon;
  const active = isCurrentPath(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-4 rounded-full px-4 py-3.5 text-sm font-medium transition-colors",
        active ? "bg-white text-black" : "text-white/60 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon size={20} strokeWidth={active ? 2.35 : 1.9} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

export default function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const activeItem = [...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS].find((item) => isCurrentPath(pathname, item.href));

  useEffect(() => {
    fetchBranding()
      .then((branding) => setLogoUrl(branding.logoUrl ?? null))
      .catch(() => setLogoUrl(null));
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [drawerOpen]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const handleLogout = async () => {
    setDrawerOpen(false);
    await logout();
    router.replace("/login");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[92px] flex-col items-center border-r border-white/10 bg-black/95 py-7 backdrop-blur-xl lg:flex">
          <Link href="/" aria-label={`${SITE_BRAND} home`} className="group mb-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-colors hover:border-white/35">
            {logoUrl ? (
              <Image src={logoUrl} alt={SITE_BRAND} width={38} height={38} className="max-h-8 w-auto object-contain" />
            ) : (
              <Image src="/logo.png" alt={SITE_BRAND} width={38} height={38} className="max-h-8 w-auto object-contain" priority />
            )}
          </Link>

          <nav aria-label="Dashboard navigation" className="flex flex-1 flex-col items-center gap-3">
            {PRIMARY_NAV_ITEMS.map((item) => <RailLink key={item.href} item={item} pathname={pathname} />)}
          </nav>

          <div className="flex flex-col items-center gap-3">
            <span className="h-px w-7 bg-white/15" />
            {SECONDARY_NAV_ITEMS.map((item) => <RailLink key={item.href} item={item} pathname={pathname} />)}
            <button type="button" onClick={handleLogout} aria-label="Sign out" className="group relative flex h-12 w-12 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">
              <LogOut size={20} strokeWidth={1.9} aria-hidden="true" />
              <span className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-2xl transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 lg:block">Sign out</span>
            </button>
          </div>
        </aside>

        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Link href="/" className="flex items-center gap-2" aria-label={`${SITE_BRAND} home`}>
            {logoUrl ? <Image src={logoUrl} alt="" width={30} height={30} className="h-7 w-7 object-contain" /> : <Image src="/logo.png" alt="" width={30} height={30} className="h-7 w-7 object-contain" />}
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{activeItem?.label ?? "Your space"}</span>
          </Link>
          <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open dashboard menu" aria-expanded={drawerOpen} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white transition-colors hover:bg-white hover:text-black">
            <Menu size={21} aria-hidden="true" />
          </button>
        </header>

        <div className={cn("fixed inset-0 z-50 lg:hidden", drawerOpen ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!drawerOpen}>
          <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close menu overlay" className={cn("absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300", drawerOpen ? "opacity-100" : "opacity-0")} />
          <aside aria-label="Dashboard menu" className={cn("absolute inset-y-2 left-2 flex w-[min(360px,calc(100vw-28px))] flex-col rounded-[28px] border border-white/15 bg-[#101010] p-5 shadow-2xl transition-transform duration-300 ease-out", drawerOpen ? "translate-x-0" : "-translate-x-[calc(100%+24px)]")}>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">Your space</p>
                <p className="mt-1 text-lg font-semibold text-white">{user?.name || "Member"}</p>
              </div>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close dashboard menu" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white hover:text-black"><X size={20} /></button>
            </div>

            <nav className="space-y-1" aria-label="Dashboard navigation">
              {PRIMARY_NAV_ITEMS.map((item) => <DrawerLink key={item.href} item={item} pathname={pathname} onNavigate={() => setDrawerOpen(false)} />)}
            </nav>
            <div className="my-6 h-px bg-white/10" />
            <nav className="space-y-1 mb-6" aria-label="Account navigation">
              {SECONDARY_NAV_ITEMS.map((item) => <DrawerLink key={item.href} item={item} pathname={pathname} onNavigate={() => setDrawerOpen(false)} />)}
            </nav>
            <div className=" border-t border-white/10 pt-5">
              <button type="button" onClick={handleLogout} className="flex w-full items-center gap-4 rounded-full px-4 py-3.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/10 hover:text-white"><LogOut size={20} strokeWidth={1.9} />Sign out</button>
            </div>
          </aside>
        </div>

        <main className="min-h-screen lg:pl-[92px]">
          <div className="mx-auto mb-16">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
