export class DashboardStatsDto {
  totalUsers: number;
  totalContent: number;
  totalSubscribers: number;
  usersTrend?: string;
  contentTrend?: string;
  subscribersTrend?: string;
  contentByCategory: { label: string; value: number }[];
}
