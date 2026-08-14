import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "video.js/dist/video-js.css";
import { Providers } from "@/components/Providers";
import { SITE_NAME, SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/seo";
import { getAppUrl, getMatomoUrl, getMatomoSiteId } from "@/lib/env";
import { Noto_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const baseUrl = getAppUrl();
const matomoUrl = getMatomoUrl();
const matomoSiteId = getMatomoSiteId();

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  title: {
    default: SITE_TAGLINE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: `${SITE_NAME}`,
    title: SITE_TAGLINE,
    description: SITE_DESCRIPTION,
    images: [
      { url: "/logo.png", width: 1200, height: 630, alt: "Brixlore.TV Logo" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TAGLINE,
    description: SITE_DESCRIPTION,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", notoSans.variable)}>
      <body className="min-w-0 overflow-x-hidden antialiased">
        {matomoUrl && matomoSiteId && (
          <Script
            id="matomo-init"
            strategy="afterInteractive"
          >{`var _paq=window._paq=window._paq||[];_paq.push(['trackPageView']);_paq.push(['enableLinkTracking']);(function(){var u="${matomoUrl}/";_paq.push(['setTrackerUrl',u+'matomo.php']);_paq.push(['setSiteId','${matomoSiteId}']);var d=document,g=d.createElement('script'),s=d.getElementsByTagName('script')[0];g.async=true;g.src=u+'matomo.js';s.parentNode.insertBefore(g,s);})();`}</Script>
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
