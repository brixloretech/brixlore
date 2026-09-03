"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationStartedAt = useRef<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the animation on screen long enough to complete one playback cycle.
  // This also prevents fast route transitions from cutting the GIF short.
  const minimumDisplayTime = 1500;

  useEffect(() => {
    if (navigationStartedAt.current === null) return;

    const elapsed = Date.now() - navigationStartedAt.current;
    const remaining = Math.max(0, minimumDisplayTime - elapsed);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      navigationStartedAt.current = null;
      setIsNavigating(false);
    }, remaining);
  }, [pathname, searchParams]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const startNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const target = event.target as HTMLElement | null;
      const link = target?.closest("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const nextUrl = new URL(href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;
      if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) return;

      navigationStartedAt.current = Date.now();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setIsNavigating(true);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        navigationStartedAt.current = null;
        setIsNavigating(false);
      }, 10000);
    };

    const handlePopState = () => {
      navigationStartedAt.current = Date.now();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setIsNavigating(true);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        navigationStartedAt.current = null;
        setIsNavigating(false);
      }, 10000);
    };

    document.addEventListener("click", startNavigation, true);
    window.addEventListener("popstate", handlePopState);
    return () => {
      document.removeEventListener("click", startNavigation, true);
      window.removeEventListener("popstate", handlePopState);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black" role="status" aria-label="Loading page">
      <Image src="/loading.gif" alt="Loading" width={320} height={180} priority />
    </div>
  );
}
