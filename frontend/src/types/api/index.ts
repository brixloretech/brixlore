/**
 * API contract interfaces for the streaming platform.
 * Backend-ready for NestJS: use as DTOs, request/response types, and OpenAPI docs.
 *
 * Domains:
 * - auth: login, register, forgot-password, refresh
 * - subscription: status, subscribe, update
 * - content: videos list/detail, create, update, publish
 * - streaming: playback info, upload URL, transcode
 */

export * from "./common.types";
export * from "./auth.types";
export * from "./subscription.types";
export * from "./user.types";
export * from "./content.types";
export * from "./streaming.types";
export * from "./site.types";
export * from "./admin.types";
