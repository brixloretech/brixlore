"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchBranding } from "@/lib/branding";
import { useAuth } from "@/contexts";

export function Footer() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const companyLinks = [
    { label: "About", href: "/about" },
    { label: "Help Center", href: "/help-center" },
    { label: "Account Deletion", href: "/account-deletion" },
    { label: "Terms of Use", href: "/terms-of-use" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Cookie Preferences", href: "/cookie-consent" },
    { label: "Press Inquiries", href: "/press-inquiries" },
    { label: "Partnerships", href: "/partners" },
    { label: "Distribute With Brixlore", href: "/distribute" },
    { label: "Get the App", href: "/get-the-app" },
  ];

  const accountLinks = [
    { label: "Create Account", href: "/signup" },
    { label: "Log In", href: "/login" },
    { label: "Start Premium", href: "/subscription" },
  ];

  const socialLinks = [
    {
      label: "YouTube",
      href: "https://youtube.com/@brixlore?si=0SyB5xL99PWqSCnW",
    },
    { label: "Facebook", href: "https://www.facebook.com/share/18RtyTkRXA/" },
    { label: "X", href: "https://x.com/Brixlore" },
    { label: "Instagram", href: "frontend/src/components/layout/Footer.tsx" },
    {
      label: "TikTok",
      href: "https://www.tiktok.com/@brixloretv?_r=1&_t=ZT-94mHGk4okzV",
    },
  ];

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
    <footer className="relative mt-auto border-t border-neutral-800/80 bg-[#09090b]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex items-center justify-between border-b border-neutral-800/90 pb-8">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="BRIXLORE"
                width={136}
                height={34}
                className="h-8 w-auto object-contain opacity-95"
                unoptimized
              />
            ) : (
              <Image
                src="/logo-2.png"
                alt="BRIXLORE"
                width={136}
                height={34}
                className="h-8 w-auto object-contain opacity-95"
              />
            )}
          </div>

          {!isAuthenticated ? (
            <></>
          ) : // <Link
          //   href="/login"
          //   className="inline-flex h-10 items-center justify-center rounded-full border border-neutral-500 px-6 text-sm font-semibold tracking-wide text-neutral-100 transition-colors hover:border-neutral-300 hover:text-white"
          // >
          //   LOG IN
          // </Link>
          null}
        </div>

        <div className="border-b border-neutral-800/90 py-8 lg:py-9">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-8">
            <section className="pt-0 lg:col-span-6">
              <h3 className="mb-4 text-base font-semibold leading-tight text-neutral-100">
                BRIXLORE
              </h3>
              <nav
                aria-label="Company links"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-8"
              >
                {companyLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm leading-relaxed text-neutral-400 transition-colors hover:text-neutral-200"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </section>

            {/* <section className="border-t border-neutral-800/80 pt-6 lg:col-span-3 lg:border-t-0 lg:pt-0">
              <h3 className="mb-4 text-base font-semibold leading-tight text-neutral-100">
                Account
              </h3>
              <nav aria-label="Account links" className="flex flex-col gap-3">
                {accountLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm leading-relaxed text-neutral-400 transition-colors hover:text-neutral-200"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </section> */}

            <section className="border-t border-neutral-800/80 pt-6 lg:col-span-3 lg:border-t-0 lg:pt-0">
              <h3 className="mb-4 text-base font-semibold leading-tight text-neutral-100">
                Connect
              </h3>
              <nav aria-label="Social links" className="flex flex-col gap-3">
                {socialLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm leading-relaxed text-neutral-400 transition-colors hover:text-neutral-200"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </section>
          </div>
        </div>

        <div className="border-b border-neutral-800/90 px-1 py-8 text-center lg:flex lg:items-center lg:justify-between lg:text-left">
          <p className="text-sm text-neutral-500">© Brixlore LLC</p>
          <p className="mt-4 text-xs font-semibold tracking-wide text-neutral-300 lg:mt-0">
            ENGLISH (US)
          </p>
        </div>

        <div className="pt-8">
          <p className="max-w-3xl text-sm leading-relaxed text-neutral-500">
            Welcome to BRIXLORE, your destination for premium urban
            storytelling, culture-first cinema, and an ever-growing catalog of
            original content.
          </p>
        </div>
      </div>
    </footer>
  );
}
