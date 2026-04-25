import type { Metadata } from "next";
import { contentService } from "@/lib/services";
import { SITE_BRAND, absoluteUrl } from "@/lib/seo";
import { durationToIso8601 } from "@/lib/video-utils";
import WatchPageClient from "./WatchPageClient";

type WatchPageProps = {
  params: { id: string };
};

export async function generateMetadata({
  params,
}: WatchPageProps): Promise<Metadata> {
  const { id } = params;
  const res = await contentService.getContentById(id);
  const content = res?.content;

  if (!content) {
    return {
      title: "Content Not Found",
      description: "The requested content could not be found.",
      robots: { index: false, follow: true },
    };
  }

  const title = content.title;
  const description =
    content.description?.slice(0, 160) ??
    `Watch ${content.title} on ${SITE_BRAND}.${
      content.category ? ` Category: ${content.category}.` : ""
    }`;
  const canonicalUrl = absoluteUrl(`/watch/${id}`);
  const image = content.thumbnailUrl ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${SITE_BRAND}`,
      description,
      url: canonicalUrl,
      type: "video.other",
      images: image
        ? [{ url: image, width: 1280, height: 720, alt: title }]
        : undefined,
      siteName: SITE_BRAND,
      videos: undefined, // optional: og:video for embed URL
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_BRAND}`,
      description,
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

function VideoObjectJsonLd({
  content,
  id,
}: {
  content: {
    title: string;
    description?: string;
    thumbnailUrl: string | null;
    duration?: string;
    releaseYear?: number;
  };
  id: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: content.title,
    description: content.description ?? content.title,
    thumbnailUrl: content.thumbnailUrl ?? undefined,
    uploadDate: content.releaseYear
      ? new Date(content.releaseYear, 0, 1).toISOString()
      : undefined,
    duration: content.duration
      ? durationToIso8601(content.duration)
      : undefined,
    contentUrl: undefined as string | undefined, // optional: direct video URL
    embedUrl: absoluteUrl(`/watch/${id}`),
    publisher: {
      "@type": "Organization",
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

export default async function WatchPage({ params }: WatchPageProps) {
  const { id } = params;
  const res = await contentService.getContentById(id);
  const content = res?.content;

  return (
    <>
      {content && <VideoObjectJsonLd content={content} id={id} />}
      <WatchPageClient params={{ id }} />
    </>
  );
}
