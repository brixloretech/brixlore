/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-6ff6d4f0ab4d4f73a05a705b79f8a68e.r2.dev",
      },
      {
        protocol: "https",
        hostname: "d4fcb9a8321f585fbb68250e703eef4c.r2.cloudflarestorage.com",
      },
    ],
  },

  // Optional: add packages with many named exports for tree-shaking (e.g. "lucide-react")
  // experimental: { optimizePackageImports: [] },
};

export default nextConfig;
