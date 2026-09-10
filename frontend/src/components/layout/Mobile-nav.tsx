"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, House, Smartphone, User, type LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
};

function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const accountHref = isAuthenticated ? "/dashboard" : "/login";

  if (pathname === "/") return null;

  const items: NavItem[] = [
    { label: "Home", href: "/", icon: House, active: pathname === "/" },
    {
      label: "Explore",
      href: "/browse-2",
      icon: Compass,
      active: pathname.startsWith("/browse-2"),
    },
    { label: "App", href: "/get-the-app", icon: Smartphone, active: pathname.startsWith("/get-the-app") },
    {
      label: "Account",
      href: accountHref,
      icon: User,
      active:
        pathname.startsWith("/dashboard") || pathname.startsWith("/login"),
    },
  ];
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 block border-t border-white/15 bg-black/55 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 text-white shadow-[0_-12px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex h-[68px] w-full max-w-[430px] items-stretch justify-between gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              aria-label={item.label}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl  ${item.active ? "" : "border-transparent text-white/55 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"}`}
            >
              <span className="flex h-7 items-center justify-center">
                {item.label === "Account" && isLoading ? (
                  <span className="block h-5 w-5 animate-pulse rounded-md bg-white/20" />
                ) : (
                  <Icon
                    size={20}
                    strokeWidth={1.8}
                    className={item.active ? "text-white" : "text-white/70"}
                    aria-hidden="true"
                  />
                )}
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
