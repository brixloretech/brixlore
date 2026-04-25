export interface DailyCountDto {
  date: string;
  count: number;
}

export interface AdminUsersAnalyticsDto {
  totalUsers: number;
  newUsersLast30Days: number;
  activeUsersLast30Days: number;
  dailyNewUsers: DailyCountDto[];
}

export interface TopEpisodeDto {
  episodeId: string;
  title: string;
  views: number;
}

export interface CategoryCountDto {
  label: string;
  value: number;
}

export interface AdminContentAnalyticsDto {
  totalContent: number;
  publishedContent: number;
  unpublishedContent: number;
  totalViews: number;
  viewsLast30Days: number;
  topEpisodes: TopEpisodeDto[];
  contentByCategory: CategoryCountDto[];
}

export interface RevenueByPlanDto {
  planId: string;
  planName: string;
  activeCount: number;
  revenue: string;
}

export interface AdminRevenueAnalyticsDto {
  activeRevenue: string;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  expiredSubscriptions: number;
  revenueByPlan: RevenueByPlanDto[];
}
