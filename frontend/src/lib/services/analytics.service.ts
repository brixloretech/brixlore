import {
  getMockDashboardStats,
  getMockVideosByCategory,
} from "@/lib/mock-analytics";
import type { MockDashboardStats } from "@/lib/mock-analytics";
import { adminService } from "./admin.service";
import { USE_MOCK_API } from "./config";

export type CategoryCountDto = { label: string; value: number };

/**
 * Analytics service (admin). Uses GET /admin/stats when USE_MOCK_API is false.
 */
export const analyticsService = {
  async getDashboardStats(): Promise<MockDashboardStats> {
    if (!USE_MOCK_API) {
      const stats = await adminService.getStats();
      return {
        totalUsers: stats.totalUsers,
        totalVideos: stats.totalContent ?? stats.totalVideos ?? 0,
        totalSubscribers: stats.totalSubscribers,
        usersTrend: stats.usersTrend,
        videosTrend: stats.contentTrend ?? stats.videosTrend,
        subscribersTrend: stats.subscribersTrend,
      };
    }
    return getMockDashboardStats();
  },

  async getVideosByCategory(): Promise<CategoryCountDto[]> {
    if (!USE_MOCK_API) {
      const stats = await adminService.getStats();
      return stats.contentByCategory ?? stats.videosByCategory ?? [];
    }
    return getMockVideosByCategory().map((d) => ({
      label: d.category,
      value: d.count,
    }));
  },
};
