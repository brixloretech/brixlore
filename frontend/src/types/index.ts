/**
 * Shared TypeScript types for the streaming platform.
 * Domain types (User, Video, AdminVideo) + API contracts (see ./api).
 */

export type UserRole =
  | "user"
  | "admin"
  | "SUPER_ADMIN"
  | "CONTENT_MANAGER"
  | "CUSTOMER_SUPPORT";

export type User = {
  /** Set when user comes from API (GET /users/me). */
  id?: string;
  email: string;
  name: string;
  phone?: string | null;
  bio?: string | null;
  role?: UserRole;
  /** ISO date string when from API. */
  createdAt?: string;
};

export type Video = {
  id: string;
  title: string;
  duration?: string;
  thumbnailUrl: string | null;
  description?: string;
  category?: string;
  /** ISO date string for display (e.g. "2024-01-15"). */
  publishedAt?: string;
};

/** Video metadata as stored by admin (mock). No file upload yet. */
export type AdminVideo = {
  id: string;
  title: string;
  duration: string;
  description?: string;
  category?: string;
  /** Whether the content is visible in the catalog. */
  published: boolean;
  /** ISO date string when the record was created. */
  createdAt: string;
};

/** API contract interfaces (auth, subscriptions, content, streaming). Backend-ready for NestJS. */
export * from "./api";
