/**
 * (admin) — Admin / back-office route group
 *
 * Purpose: Platform management: content moderation, users, analytics, config.
 * Use for: /admin, /admin/content, /admin/users, /admin/analytics.
 * URL segments: (admin) does not appear (e.g. /admin/...).
 * Access: Only users with mocked role "admin" (e.g. admin@example.com). See AdminLayoutClient.
 */

import AdminLayoutClient from "./AdminLayoutClient";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
