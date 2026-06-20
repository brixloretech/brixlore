export interface AdminPlanDto {
  id: string;
  name: string;
  /** Monthly price as string, e.g. "9.99" */
  price: string;
  /** Yearly price as string (optional) */
  yearlyPrice?: string;
  deviceLimit: number;
  offlineAllowed: boolean;
  maxOfflineDownloads: number;
  isPopular: boolean;
  perks: string[];
  /** Monthly Stripe price ID */
  stripePriceId?: string;
  /** Yearly Stripe price ID */
  yearlyStripePriceId?: string;
  activeSubscribers: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDto {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

export interface InviteAdminUserRequestDto {
  email: string;
  name?: string;
  role: "SUPER_ADMIN" | "CONTENT_MANAGER" | "CUSTOMER_SUPPORT";
}

export interface UpdateAdminUserRoleRequestDto {
  role: "SUPER_ADMIN" | "CONTENT_MANAGER" | "CUSTOMER_SUPPORT";
}

export interface CreateAdminPlanRequestDto {
  name: string;
  price: string;
  yearlyPrice?: string;
  deviceLimit: number;
  offlineAllowed: boolean;
  maxOfflineDownloads: number;
  isPopular?: boolean;
  perks?: string[];
  stripePriceId?: string;
  yearlyStripePriceId?: string;
}

export interface UpdateAdminPlanRequestDto {
  name?: string;
  price?: string;
  yearlyPrice?: string;
  deviceLimit?: number;
  offlineAllowed?: boolean;
  maxOfflineDownloads?: number;
  isPopular?: boolean;
  perks?: string[];
  stripePriceId?: string;
  yearlyStripePriceId?: string;
}

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

export interface CategoryCountDto {
  label: string;
  value: number;
}

export interface TopEpisodeDto {
  episodeId: string;
  title: string;
  views: number;
}

export interface AdminContentAnalyticsDto {
  totalContent: number;
  publishedContent: number;
  unpublishedContent: number;
  totalEpisodes: number;
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

export interface AdminSystemHealthDto {
  ok: boolean;
  database: boolean;
  checkedAt: string;
  counts: {
    users: number;
    content: number;
    episodes: number;
    subscriptions: number;
    downloads: number;
  };
  error?: string;
}

export interface AdminSystemLogDto {
  id: string;
  type: "user" | "content" | "subscription";
  message: string;
  createdAt: string;
}

export type SupportPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type SupportStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface SupportReplyDto {
  id: string;
  message: string;
  adminUserId?: string | null;
  adminName?: string | null;
  createdAt: string;
}

export interface SupportRequestDto {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: SupportStatus;
  priority: SupportPriority;
  createdAt: string;
  updatedAt: string;
  replies: SupportReplyDto[];
}

export interface SupportRequestsResponseDto {
  requests: SupportRequestDto[];
  total: number;
}

export interface UpdateSupportRequestDto {
  priority?: SupportPriority;
  status?: SupportStatus;
}

export interface ReplySupportRequestDto {
  message: string;
  status?: SupportStatus;
}
