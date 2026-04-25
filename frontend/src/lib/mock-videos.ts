import type { Video } from "@/types";

/**
 * Mock video catalog for the content listing page.
 * Replace with API data when backend is available.
 */
export const mockVideos: Video[] = [
  {
    id: "1",
    title: "Getting Started with Streaming",
    duration: "12:34",
    thumbnailUrl: null,
    description: "Learn the basics of video streaming.",
    category: "Tutorial",
  },
  {
    id: "2",
    title: "Advanced Encoding Techniques",
    duration: "28:15",
    thumbnailUrl: null,
    description: "Optimize your video encoding pipeline.",
    category: "Technical",
  },
  {
    id: "3",
    title: "Live Streaming Best Practices",
    duration: "45:00",
    thumbnailUrl: null,
    description: "Tips for reliable live broadcasts.",
    category: "Best Practices",
  },
  {
    id: "4",
    title: "Building a Video Platform",
    duration: "1:22:10",
    thumbnailUrl: null,
    description:
      "A deep dive into architecture and design patterns for video platforms. We cover ingest pipelines, transcoding strategies, storage and CDN choices, API design, and scaling to millions of viewers. This long-form session includes real-world case studies and Q&A.",
    category: "Architecture",
    publishedAt: "2024-03-15",
  },
  {
    id: "5",
    title: "CDN and Global Delivery",
    duration: "18:42",
    thumbnailUrl: null,
    description: "Scale delivery worldwide.",
    category: "Infrastructure",
  },
  {
    id: "6",
    title: "Analytics and Metrics",
    duration: "24:08",
    thumbnailUrl: null,
    description: "Measure engagement and performance.",
    category: "Analytics",
  },
  {
    id: "7",
    title: "Accessibility in Video",
    duration: "15:30",
    thumbnailUrl: null,
    description: "Captions, audio description, and more.",
    category: "Best Practices",
  },
  {
    id: "8",
    title: "Mobile-First Streaming",
    duration: "32:55",
    thumbnailUrl: null,
    description: "Adaptive bitrate and mobile UX.",
    category: "Technical",
  },
  {
    id: "9",
    title: "Security and DRM",
    duration: "41:20",
    thumbnailUrl: null,
    description: "Protect your content.",
    category: "Security",
  },
];

/** Unique categories from mock data, sorted. Used for filter pills. */
export const mockCategories = [
  "All",
  ...(Array.from(
    new Set(mockVideos.map((v) => v.category).filter(Boolean)),
  ).sort() as string[]),
];
