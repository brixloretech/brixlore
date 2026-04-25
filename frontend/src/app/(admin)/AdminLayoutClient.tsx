"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AdminProtectedRoute } from "@/components/auth";
import { AdminContentProvider } from "@/contexts";
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

function IconDashboard({ className }: { className?: string }) {
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
        d="M4 6a2 2 0 012-2h4a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 15a2 2 0 012-2h4a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3zm10 3v-2"
      />
    </svg>
  );
}
function IconLibrary({ className }: { className?: string }) {
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
        d="M4 7h16M4 12h16M4 17h16"
      />
    </svg>
  );
}

function IconPlans({ className }: { className?: string }) {
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
        d="M3 7h18M5 11h14M5 15h8"
      />
    </svg>
  );
}

function IconUpload({ className }: { className?: string }) {
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
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

function IconTransactions({ className }: { className?: string }) {
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
        d="M7 7h10M7 11h10M7 15h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"
      />
    </svg>
  );
}

function IconAnalytics({ className }: { className?: string }) {
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
        d="M4 20V4m4 16V10m4 10V6m4 14v-8m4 8v-4"
      />
    </svg>
  );
}

function IconLogs({ className }: { className?: string }) {
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
        d="M5 7h14M5 12h14M5 17h10"
      />
    </svg>
  );
}

function IconHealth({ className }: { className?: string }) {
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
        d="M4 12h4l2-4 4 8 2-4h4"
      />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
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
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function IconCategories({ className }: { className?: string }) {
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
        d="M7 7h10M7 12h10M7 17h10"
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
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.591 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.59c1.756.427 1.756 2.925 0 3.351a1.724 1.724 0 00-1.066 2.591c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.59 1.065c-.427 1.756-2.925 1.756-3.351 0a1.724 1.724 0 00-2.591-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.59c-1.756-.427-1.756-2.925 0-3.351a1.724 1.724 0 001.066-2.591c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.59-1.065z"
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

function IconSupport({ className }: { className?: string }) {
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
        d="M18 10a6 6 0 00-12 0v4a2 2 0 002 2h1v-6H8a2 2 0 00-2 2v2a6 6 0 0012 0v-2a2 2 0 00-2-2h-1v6h1a2 2 0 002-2v-4z"
      />
    </svg>
  );
}

type AdminRole =
  | "admin"
  | "SUPER_ADMIN"
  | "CONTENT_MANAGER"
  | "CUSTOMER_SUPPORT";

const NAV_SECTIONS: {
  label: string | null;
  items: {
    href: string;
    label: string;
    icon: ({ className }: { className?: string }) => JSX.Element;
    roles?: AdminRole[];
  }[];
}[] = [
  {
    label: null,
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: IconDashboard,
        roles: ["admin", "SUPER_ADMIN", "CONTENT_MANAGER", "CUSTOMER_SUPPORT"],
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        href: "/admin/content",
        label: "Library",
        icon: IconLibrary,
        roles: ["admin", "SUPER_ADMIN", "CONTENT_MANAGER", "CUSTOMER_SUPPORT"],
      },
      {
        href: "/admin/categories",
        label: "Categories",
        icon: IconCategories,
        roles: ["admin", "SUPER_ADMIN", "CONTENT_MANAGER", "CUSTOMER_SUPPORT"],
      },
      {
        href: "/admin/content/upload",
        label: "Upload content",
        icon: IconUpload,
        roles: ["admin", "SUPER_ADMIN", "CONTENT_MANAGER", "CUSTOMER_SUPPORT"],
      },
    ],
  },
  {
    label: "Users",
    items: [
      {
        href: "/admin/users",
        label: "User List",
        icon: IconUsers,
        roles: ["admin", "SUPER_ADMIN", "CUSTOMER_SUPPORT"],
      },
    ],
  },
  {
    label: "Subscriptions",
    items: [
      {
        href: "/admin/subscriptions/plans",
        label: "Plans",
        icon: IconPlans,
        roles: ["admin", "SUPER_ADMIN", "CUSTOMER_SUPPORT"],
      },
      {
        href: "/admin/subscriptions/transactions",
        label: "Transactions",
        icon: IconTransactions,
        roles: ["admin", "SUPER_ADMIN", "CUSTOMER_SUPPORT"],
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        href: "/admin/analytics/users",
        label: "Users",
        icon: IconAnalytics,
        roles: ["admin", "SUPER_ADMIN", "CUSTOMER_SUPPORT"],
      },
      {
        href: "/admin/analytics/content",
        label: "Content",
        icon: IconAnalytics,
        roles: ["admin", "SUPER_ADMIN", "CUSTOMER_SUPPORT"],
      },
      {
        href: "/admin/analytics/revenue",
        label: "Revenue",
        icon: IconAnalytics,
        roles: ["admin", "SUPER_ADMIN", "CUSTOMER_SUPPORT"],
      },
    ],
  },
  {
    label: "Support",
    items: [
      {
        href: "/admin/support",
        label: "Customer Support",
        icon: IconSupport,
        roles: ["admin", "SUPER_ADMIN", "CUSTOMER_SUPPORT"],
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        href: "/admin/settings/app",
        label: "App Settings",
        icon: IconSettings,
        roles: ["admin", "SUPER_ADMIN", "CUSTOMER_SUPPORT"],
      },
      {
        href: "/admin/settings/users",
        label: "User Management",
        icon: IconUsers,
        roles: ["admin", "SUPER_ADMIN", "CUSTOMER_SUPPORT"],
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        href: "/admin/system/logs",
        label: "Logs",
        icon: IconLogs,
        roles: ["admin", "SUPER_ADMIN", "CUSTOMER_SUPPORT"],
      },
      {
        href: "/admin/system/health",
        label: "Health",
        icon: IconHealth,
        roles: ["admin", "SUPER_ADMIN", "CUSTOMER_SUPPORT"],
      },
    ],
  },
] as const;

/**
 * Protected admin layout with sidebar. Only renders when user is authenticated
 * and has mocked role "admin". Sidebar navigation for Overview, Content, Upload, Users.
 */
export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const isAdminLoginPage = pathname === "/admin/login";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const role = (user?.role ?? "admin") as AdminRole;

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

  // Admin login page: minimal layout, no protection (no sidebar/drawer)
  if (isAdminLoginPage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-off-black px-4">
        {children}
      </div>
    );
  }

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
            {SITE_BRAND} Admin
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
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) =>
            item.roles ? item.roles.includes(role) : true,
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.label ?? "section"} className="space-y-0.5">
              {section.label ? (
                <p className="px-3 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-neutral-600">
                  {section.label}
                </p>
              ) : null}
              {visibleItems.map(({ href, label, icon: Icon }) => {
                let isActive = false;
                if (href === "/admin") {
                  isActive = pathname === "/admin";
                } else if (href === "/admin/content") {
                  isActive =
                    pathname === "/admin/content" ||
                    pathname.startsWith("/admin/content/");
                } else if (href === "/admin/subscriptions/transactions") {
                  isActive =
                    pathname.startsWith("/admin/subscriptions/transactions") ||
                    pathname === "/admin/subscriptions";
                } else if (href === "/admin/settings/app") {
                  isActive =
                    pathname.startsWith("/admin/settings/app") ||
                    pathname === "/admin/settings";
                } else if (href === "/admin/settings/users") {
                  isActive = pathname.startsWith("/admin/settings/users");
                } else {
                  isActive = pathname.startsWith(href);
                }
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
          );
        })}
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/admin/login");
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800/50 hover:text-accent"
        >
          <IconLogout className="h-5 w-5 flex-shrink-0 opacity-80" />
          Logout
        </button>
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
    <AdminProtectedRoute loginRedirectTo="/admin/login">
      <AdminContentProvider>
        <div className="flex min-h-screen bg-off-black">
          {/* Desktop sidebar */}
          <aside
            className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-neutral-700/50 bg-off-black/95 lg:flex"
            aria-label="Admin navigation"
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
              aria-label="Admin navigation"
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
                Admin
              </p>
            </header>
            <main className="flex-1">
              <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </AdminContentProvider>
    </AdminProtectedRoute>
  );
}
