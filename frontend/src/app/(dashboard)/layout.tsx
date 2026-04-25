/**
 * (dashboard) — Authenticated user dashboard route group
 *
 * Purpose: Logged-in user area: library, history, settings, uploads, etc.
 * Use for: /dashboard, /dashboard/library, /dashboard/settings, /dashboard/uploads.
 * URL segments: (dashboard) does not appear (e.g. /dashboard/...).
 * Protected by ProtectedRoute; redirects to /login when not authenticated.
 */

import DashboardLayoutClient from "./DashboardLayoutClient";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
