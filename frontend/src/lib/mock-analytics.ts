/**
 * Mock analytics for the admin dashboard.
 * Replace with real API or analytics service when available.
 */

export type MockDashboardStats = {
  totalUsers: number;
  totalVideos: number;
  totalSubscribers: number;
  /** Optional: change vs previous period (e.g. "+12%") for display. */
  usersTrend?: string;
  videosTrend?: string;
  subscribersTrend?: string;
};

/** Fixed mock stats for the dashboard. */
export function getMockDashboardStats(): MockDashboardStats {
  return {
    totalUsers: 1247,
    totalVideos: 89,
    totalSubscribers: 342,
    usersTrend: "+8%",
    videosTrend: "+3",
    subscribersTrend: "+15%",
  };
}

/** Mock category breakdown for a simple chart (videos per category). */
export type MockCategoryCount = { category: string; count: number };

export function getMockVideosByCategory(): MockCategoryCount[] {
  return [
    { category: "Tutorial", count: 18 },
    { category: "Technical", count: 22 },
    { category: "Best Practices", count: 14 },
    { category: "Architecture", count: 12 },
    { category: "Infrastructure", count: 10 },
    { category: "Analytics", count: 8 },
    { category: "Security", count: 5 },
  ];
}
