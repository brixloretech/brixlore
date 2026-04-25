"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/contexts";
import { SITE_BRAND } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { fetchBranding } from "@/lib/branding";

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4H11v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z"
      />
    </svg>
  );
}
function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
function IconList({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
      />
    </svg>
  );
}
function IconPlay({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 5l12 7-12 7V5z"
      />
    </svg>
  );
}
function IconCard({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7h18M5 11h4m-4 6h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
function IconSettings({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
function IconLogout({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 17l5-5-5-5M21 12H9"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h6a2 2 0 002-2v-2"
      />
    </svg>
  );
}

const PRIMARY_NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: IconHome },
  { href: "/dashboard/explore", label: "Search / Explore", icon: IconSearch },
  { href: "/dashboard/my-list", label: "My List", icon: IconList },
  {
    href: "/dashboard/continue-watching",
    label: "Continue Watching",
    icon: IconPlay,
  },
] as const;

const SECONDARY_NAV_ITEMS = [
  { href: "/dashboard/subscription", label: "Subscription", icon: IconCard },
  { href: "/dashboard/settings", label: "Settings", icon: IconSettings },
] as const;

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isAuthenticated, isSubscribed, isAdmin } = useAuth();
  const isFreeUser = isAuthenticated && !isSubscribed && !isAdmin;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const visiblePrimaryNavItems = isFreeUser
    ? PRIMARY_NAV_ITEMS.filter(
        (item) =>
          item.href !== "/dashboard/my-list" &&
          item.href !== "/dashboard/continue-watching",
      )
    : PRIMARY_NAV_ITEMS;

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  useEffect(() => {
    let active = true;
    fetchBranding()
      .then((branding) => {
        if (!active) return;
        setLogoUrl(branding.logoUrl ?? null);
      })
      .catch(() => {
        if (!active) return;
        setLogoUrl(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const sidebarContent = (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-neutral-700/50 px-5 lg:justify-start">
        <Link
          href="/"
          className="flex items-center gap-3 rounded focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-off-black"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded object-contain"
              unoptimized
            />
          ) : (
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded object-contain"
            />
          )}
          <span className="text-sm font-semibold tracking-tight text-white">
            {SITE_BRAND}
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {visiblePrimaryNavItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "border-l-2",
                  isActive
                    ? "border-accent bg-accent/10 text-white"
                    : "border-transparent text-neutral-300 hover:bg-neutral-800/50 hover:text-accent",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0 opacity-80" />
                {label}
              </Link>
            );
          })}
        </div>
        <div className="space-y-0.5">
          <p className="px-3 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-neutral-600">
            Account
          </p>
          {SECONDARY_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "border-l-2",
                  isActive
                    ? "border-accent bg-accent/10 text-white"
                    : "border-transparent text-neutral-300 hover:bg-neutral-800/50 hover:text-accent",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0 opacity-80" />
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800/50 hover:text-accent"
          >
            <IconLogout className="h-5 w-5 flex-shrink-0 opacity-80" />
            Logout
          </button>
        </div>
      </nav>
      <div className="border-t border-neutral-700/50 p-3">
        <Link
          href="/"
          className="flex items-center rounded-lg px-3 py-2 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-accent"
        >
          ← Back to site
        </Link>
      </div>
    </>
  );

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-off-black">
        {/* Desktop sidebar */}
        <aside
          className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-neutral-700/50 bg-off-black/95 lg:flex"
          aria-label="Dashboard navigation"
        >
          {sidebarContent}
        </aside>

        {/* Mobile drawer */}
        <div
          className={cn(
            "fixed inset-0 z-50 lg:hidden",
            drawerOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
          aria-hidden={!drawerOpen}
        >
          <div
            className={cn(
              "absolute inset-0 bg-black/60 transition-opacity duration-200",
              drawerOpen ? "opacity-100" : "opacity-0",
            )}
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside
            className={cn(
              "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-neutral-700/50 bg-off-black shadow-xl transition-transform duration-200 ease-out",
              drawerOpen ? "translate-x-0" : "-translate-x-full",
            )}
            aria-label="Dashboard navigation"
          >
            {sidebarContent}
          </aside>
        </div>

        {/* Top bar + main content */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pl-0 lg:pl-64">
          <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-neutral-700/50 bg-off-black/95 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              My account
            </p>
          </header>
          <main className="flex-1">
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
