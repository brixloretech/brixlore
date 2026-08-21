"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchBranding } from "@/lib/branding";
import { useAuth } from "@/contexts";

function SocialIcon({ label }: { label: string }) {
  const common = {
    className: "h-5 w-5 fill-current",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  } as const;

  if (label === "YouTube") {
    return <svg {...common}><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" /></svg>;
  }
  if (label === "Facebook") {
    return <svg {...common}><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.7-1.6h1.8V3.8c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V10H8v3h2.6v8h2.9Z" /></svg>;
  }
  if (label === "X") {
    return <svg {...common}><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.4L2.2 2h6.5l4.4 5.8L18.9 2Zm-1.1 17.6h1.7L7.6 4.3H5.8l12 15.3Z" /></svg>;
  }
  if (label === "Instagram") {
    return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.5" cy="6.5" r="1.2" /></svg>;
  }
  return <svg {...common}><path d="M15.5 3c.3 1.8 1.3 3 3.2 3.2v3a7.2 7.2 0 0 1-3.2-1v6.3a5.5 5.5 0 1 1-4.8-5.4v3.1a2.5 2.5 0 1 0 1.8 2.4V3h3Z" /></svg>;
}

export function Footer() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // const accountLinks = [
  //   { label: "Create Account", href: "/signup" },
  //   { label: "Log In", href: "/login" },
  //   { label: "Start Premium", href: "/subscription" },
  // ];

  const socialLinks = [
    {
      label: "YouTube",
      href: "https://youtube.com/@brixlore?si=0SyB5xL99PWqSCnW",
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/share/18RtyTkRXA/",
    },
    { label: "X", href: "https://x.com/Brixlore" },
    {
      label: "Instagram",
      href: "frontend/src/components/layout/Footer.tsx",
    },
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
        <div className="flex items-center justify-center border-b border-neutral-800/90 pb-8">
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

        <div className="border-b border-neutral-800/90 px-1 py-8 text-center flex items-center justify-center">
          {/* Social media Icons Links */}
          <div className="flex items-center justify-center gap-6 ">
            {socialLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                title={item.label}
                className="text-neutral-400 transition-colors hover:text-neutral-200"
              >
                <SocialIcon label={item.label} />
              </Link>
            ))}
          </div>
        </div>

        {/* <div className="border-b border-neutral-800/90 py-8 lg:py-9">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-8"> */}
        {/* <section className="pt-0 lg:col-span-6">
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
            </section> */}

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

        {/* <section className="border-t border-neutral-800/80 pt-6 lg:col-span-3 lg:border-t-0 lg:pt-0">
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
        </div> */}

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
