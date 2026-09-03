/**
 * (public) — Public route group
 *
 * Purpose: Unauthenticated, marketing-facing routes. No login required.
 * Use for: Landing page, browse/catalog, watch page, marketing pages.
 * URL segments: (public) does not appear in the URL (e.g. /, /browse, /watch/123).
 */

import type { Metadata } from "next";
import { SITE_BRAND, SITE_DESCRIPTION } from "@/lib/seo";
import Header2 from "@/components/layout/Header-2";
import Footer2 from "@/components/layout/Footer-2";

export const metadata: Metadata = {
  openGraph: {
    siteName: SITE_BRAND,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-background dark:bg-off-black">
      <link rel="stylesheet" href="/assets/css/swiper-bundle.min.css" />
      <link rel="stylesheet" href="/assets/css/flaticon_misao.css" />
      <link rel="stylesheet" href="/assets/css/scrollCue.css" />
      <link rel="stylesheet" href="/assets/css/remixicon.css" />
      <link rel="stylesheet" href="/assets/css/style.css" />
      <Header2 />
      <div className="lg:pb-0">{children}</div>
      <Footer2 />
   
    </div>
  );
}
