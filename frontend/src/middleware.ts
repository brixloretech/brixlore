import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Keep the waitlist landing page public while the rest of the website is
 * private during waitlist mode.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never redirect framework requests, API calls, or files served from
  // /public. These include package chunks, CSS, fonts, images, and videos.
  const isAssetRequest =
    pathname === "/" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes(".");

  if (isAssetRequest) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  // Run on all paths; the middleware function explicitly allows assets.
  matcher: ["/:path*"],
};
