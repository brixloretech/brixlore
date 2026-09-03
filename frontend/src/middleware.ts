import {  NextResponse } from "next/server";

// Temporarily disable authentication for certain paths to allow users to access them without being redirected.
// const DISABLED_AUTH_PATHS = new Set([
//   "/login",
//   "/signup",
//   "/forgot-password",
//   "/reset-password",
//   "/verify-email",
//   "/subscription"
// ]);

export function middleware() {
  // if (DISABLED_AUTH_PATHS.has(request.nextUrl.pathname)) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/subscription"
  ],
};
