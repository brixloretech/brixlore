"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts";
import { fetchBranding } from "@/lib/branding";
import { Button } from "@/components/ui";
import { useState } from "react";

const LOGO_HEIGHT = 80;
const LOGO_WIDTH = 140;

function NavContent({
  isAuthenticated,
  isSubscribed,
  isAdmin,
  user,
}: {
  isAuthenticated: boolean;
  isSubscribed: boolean;
  isAdmin: boolean;
  user: { name: string; email: string } | null;
}) {
  return (
    <div className="flex items-center gap-3">
      {isAuthenticated && user ? (
        <>
          <Link
            href="/dashboard"
            className="max-w-[150px] truncate text-sm text-neutral-300 transition-colors hover:text-white"
            title="Go to dashboard"
          >
            Dashboard
          </Link>
          {!isSubscribed && !isAdmin ? (
            <Link href="/subscription">
              <Button variant="outline" size="sm" type="button">
                Upgrade
              </Button>
            </Link>
          ) : null}
        </>
      ) : (
        <Link href="/login">
          <Button variant="outline" size="sm" type="button">
            Log in
          </Button>
        </Link>
      )}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { user, isAuthenticated, isSubscribed, isAdmin } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

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

  return (
    <header
      className={
        isHome
          ? "fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-transparent backdrop-blur-sm"
          : "sticky top-0 z-50 border-b border-white/10 bg-transparent backdrop-blur-sm"
      }
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between pl-0 pr-4 sm:pr-6 lg:pr-8">
        <Link
          href="/"
          className="-ml-1 flex shrink-0 items-center gap-2 text-white sm:-ml-2"
          aria-label="BRIXLORE.TV home"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="BRIXLORE.TV"
              width={LOGO_WIDTH}
              height={LOGO_HEIGHT}
              className="h-12 w-auto object-contain"
              unoptimized
            />
          ) : (
            <Image
              src="/logo.png"
              alt="BRIXLORE.TV"
              width={LOGO_WIDTH}
              height={LOGO_HEIGHT}
              className="h-9 w-auto object-contain"
              priority
            />
          )}
        </Link>
        {/* Desktop nav: hidden on small screens to avoid overflow */}
        <nav
          aria-label="Main"
          className="hidden items-center gap-4 text-sm sm:gap-6 md:flex"
        >
          <NavContent
            isAuthenticated={isAuthenticated}
            isSubscribed={isSubscribed}
            isAdmin={isAdmin}
            user={user}
          />
        </nav>
        <div className="md:hidden">
          <NavContent
            isAuthenticated={isAuthenticated}
            isSubscribed={isSubscribed}
            isAdmin={isAdmin}
            user={user}
          />
        </div>
      </div>
    </header>
  );
}
