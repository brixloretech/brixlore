import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { SITE_BRAND, SITE_DESCRIPTION, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Browse Videos",
  description: `Browse and discover video content. ${SITE_DESCRIPTION}`,
  openGraph: {
    title: `Browse Videos | ${SITE_BRAND}`,
    description: `Browse and discover video content. ${SITE_DESCRIPTION}`,
    url: absoluteUrl("/browse"),
    type: "website",
  },
  twitter: {
    title: `Browse Videos | ${SITE_BRAND}`,
    description: `Browse and discover video content. ${SITE_DESCRIPTION}`,
  },
  alternates: {
    canonical: absoluteUrl("/browse"),
  },
  robots: {
    index: true,
    follow: true,
  },
};

function CollectionPageJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Browse Videos",
    description: `Browse and discover video content. ${SITE_DESCRIPTION}`,
    url: absoluteUrl("/browse"),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_BRAND,
      url: absoluteUrl("/"),
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-background dark:bg-off-black">
      <Header />
      <CollectionPageJsonLd />
      {children}
      <Footer />
    </div>
  );
}
