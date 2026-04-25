/**
 * Centralized service layer. Use these services instead of calling mock APIs directly.
 * When the backend is ready, set NEXT_PUBLIC_USE_MOCK_API=false and implement
 * real fetch/axios calls in each service (or swap implementations per service).
 */

export { USE_MOCK_API } from "./config";
export { authService, getStoredSubscription } from "./auth.service";
export { subscriptionService } from "./subscription.service";
export { contentService } from "./content.service";
export { streamingService } from "./streaming.service";
export { analyticsService } from "./analytics.service";
export type { CategoryCountDto } from "./analytics.service";
export { adminService } from "./admin.service";
export type {
  DashboardStatsDto,
  AdminContentItemDto,
  AdminPlanDto,
  AdminUsersAnalyticsDto,
  AdminContentAnalyticsDto,
  AdminRevenueAnalyticsDto,
  AdminSystemHealthDto,
  AdminSystemLogDto,
} from "./admin.service";
export { siteService } from "./site.service";
export { accountService } from "./account.service";
