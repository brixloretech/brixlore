"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, House, Smartphone, User, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts";

type NavItem = { label: string; href: string; icon: LucideIcon; active: boolean };

function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const accountHref = isAuthenticated ? "/dashboard" : "/login";

  const items: NavItem[] = [
    { label: "Home", href: "/", icon: House, active: pathname === "/" },
    { label: "Explore", href: "/browse-2", icon: Compass, active: pathname.startsWith("/browse-2") },
    { label: "App", href: "/get-the-app", icon: Smartphone, active: pathname.startsWith("/get-the-app") },
    { label: "Account", href: accountHref, icon: User, active: pathname.startsWith("/dashboard") || pathname.startsWith("/login") },
  ];
  const activeIndex = items.findIndex((item) => item.active);

  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 block border-t border-white/10 bg-black px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 text-white lg:hidden">
      <div className="relative mx-auto flex h-[68px] w-full max-w-[430px] items-stretch justify-between">
        {activeIndex >= 0 && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-[5px] z-0 flex h-10 w-1/4 items-center justify-center"
            initial={{ x: `${activeIndex * 100}%` }}
            animate={{ x: `${activeIndex * 100}%` }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
          >
            <span className="h-10 w-10 rounded-full bg-white" />
          </motion.span>
        )}
        {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} aria-current={item.active ? "page" : undefined} aria-label={item.label} className="relative z-[1] flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-white transition-colors hover:bg-white/10">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full text-white">
                  <span className="relative z-[1]">
                    {item.label === "Account" && isLoading ? (
                      <span className="block h-5 w-5 animate-pulse rounded-full bg-white/20" />
                    ) : (
                      <Icon size={22} strokeWidth={2} className={item.active ? "text-black" : "text-white"} aria-hidden="true" />
                    )}
                  </span>
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
      </div>
    </nav>
  );
}

export default MobileNav;
