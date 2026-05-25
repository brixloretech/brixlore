import { del, get, patch, post, ApiError } from "@/lib/api-client";
import { getStoredAuth } from "@/lib/auth-storage";
import { authService } from "@/lib/services/auth.service";
import type {
  PresignUploadRequestDto,
  PresignUploadResponseDto,
  MultipartInitUploadRequestDto,
  MultipartInitUploadResponseDto,
  MultipartPartUrlRequestDto,
  MultipartPartUrlResponseDto,
  MultipartCompleteUploadRequestDto,
  MultipartAbortUploadRequestDto,
  CreateAdminContentRequestDto,
  UpdateAdminContentRequestDto,
  CreateAdminSeasonRequestDto,
  CreateAdminEpisodeRequestDto,
  CreateAdminTrailerRequestDto,
  PublishAdminContentRequestDto,
  SeasonResponseDto,
  EpisodeResponseDto,
  AdminCategoryDto,
  CreateAdminCategoryRequestDto,
  SitePageDto,
  SitePageSummaryDto,
  UpdateSitePageRequestDto,
  AdminSubscriptionsResponseDto,
  AdminPlanDto,
  AdminUserDto,
  InviteAdminUserRequestDto,
  UpdateAdminUserRoleRequestDto,
  CreateAdminPlanRequestDto,
  UpdateAdminPlanRequestDto,
  AdminUsersAnalyticsDto,
  AdminContentAnalyticsDto,
  AdminRevenueAnalyticsDto,
  AdminSystemHealthDto,
  AdminSystemLogDto,
  ReplySupportRequestDto,
  SupportRequestDto,
  SupportRequestsResponseDto,
  UpdateSupportRequestDto,
} from "@/types/api";
import type { AccountExportDto } from "@/types/api";

/** Dashboard stats from GET /admin/stats */
export interface DashboardStatsDto {
  totalUsers: number;
  totalContent: number;
  totalVideos?: number;
  totalSubscribers: number;
  usersTrend?: string;
  contentTrend?: string;
  videosTrend?: string;
  subscribersTrend?: string;
  contentByCategory: { label: string; value: number }[];
  videosByCategory?: { label: string; value: number }[];
}

/** Content item from GET /admin/content */
export interface AdminContentItemDto {
  id: string;
  title: string;
  description?: string;
  type: string;
  thumbnailUrl: string;
  posterUrl?: string;
  releaseYear: number;
  ageRating: string;
  duration?: string;
  trailerId?: string;
  category?: string;
  isPublished: boolean;
  hlsStatus: "ready" | "processing" | "missing";
  hlsReadyCount: number;
  hlsTotalCount: number;
  createdAt: string;
  updatedAt?: string;
  seasons?: {
    id: string;
    seasonNumber: number;
    title: string;
    episodeCount: number;
  }[];
  episodes?: {
    id: string;
    seasonId?: string;
    episodeNumber: number;
    title: string;
    duration: string;
    hlsReady: boolean;
  }[];
}

export type {
  AdminUserDto,
  AdminPlanDto,
  AdminUsersAnalyticsDto,
  AdminContentAnalyticsDto,
  AdminRevenueAnalyticsDto,
  AdminSystemHealthDto,
  AdminSystemLogDto,
};

export interface CloudflareStreamStatusDto {
  configured: boolean;
  accountId: string | null;
  customerSubdomain: string | null;
}

export interface CloudflareDirectUploadResponseDto {
  uploadUrl: string;
  uid: string;
}

function authHeaders(): Record<string, string> {
  const auth = getStoredAuth();
  if (!auth?.accessToken) return {};
  return { Authorization: `Bearer ${auth.accessToken}` };
}

async function withAuthRetry<T>(
  request: (headers: Record<string, string>) => Promise<T>,
): Promise<T> {
  const headers = authHeaders();
  if (!headers.Authorization) throw new ApiError("Not authenticated", 401);
  try {
    return await request(headers);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      await authService.getSession();
      const refreshed = authHeaders();
      if (!refreshed.Authorization)
        throw new ApiError("Not authenticated", 401);
      return request(refreshed);
    }
    throw err;
  }
}

/**
 * Admin API service. All endpoints require admin role and valid JWT.
 * Use from admin dashboard only (user must be logged in as admin).
 */
export const adminService = {
  async getStats(): Promise<DashboardStatsDto> {
    return withAuthRetry((headers) =>
      get<DashboardStatsDto>("admin/stats", { headers }),
    );
  },

  async getUsers(
    page = 1,
    limit = 20,
  ): Promise<{ users: AdminUserDto[]; total: number }> {
    return withAuthRetry((headers) =>
      get<{ users: AdminUserDto[]; total: number }>("admin/users", {
        params: { page: String(page), limit: String(limit) },
        headers,
      }),
    );
  },

  async inviteAdminUser(
    body: InviteAdminUserRequestDto,
  ): Promise<{ message: string }> {
    return withAuthRetry((headers) =>
      post<{ message: string }>("admin/users/invite", body, { headers }),
    );
  },

  async updateAdminUserRole(
    id: string,
    body: UpdateAdminUserRoleRequestDto,
  ): Promise<AdminUserDto> {
    return withAuthRetry((headers) =>
      patch<AdminUserDto>(`admin/users/${id}/role`, body, { headers }),
    );
  },

  /**
   * Revoke a user's admin access (sets role to "user"). Cannot revoke yourself.
   */
  async revokeAdminAccess(id: string): Promise<AdminUserDto> {
    return withAuthRetry((headers) =>
      del<AdminUserDto>(`admin/users/${id}/access`, { headers }),
    );
  },

  /**
   * Export a user's account data (profile, devices, subscriptions) for admin download.
   * Same shape as the customer "Download data" in settings.
   */
  async exportUserAccountData(userId: string): Promise<AccountExportDto> {
    return withAuthRetry((headers) =>
      get<AccountExportDto>(`admin/users/${userId}/export`, { headers }),
    );
  },

  async getSupportRequests(
    page = 1,
    limit = 20,
  ): Promise<SupportRequestsResponseDto> {
    return withAuthRetry((headers) =>
      get<SupportRequestsResponseDto>("admin/support/requests", {
        params: { page: String(page), limit: String(limit) },
        headers,
      }),
    );
  },

  async updateSupportRequest(
    id: string,
    body: UpdateSupportRequestDto,
  ): Promise<SupportRequestDto> {
    return withAuthRetry((headers) =>
      patch<SupportRequestDto>(`admin/support/requests/${id}`, body, {
        headers,
      }),
    );
  },

  async replySupportRequest(
    id: string,
    body: ReplySupportRequestDto,
  ): Promise<SupportRequestDto> {
    return withAuthRetry((headers) =>
      post<SupportRequestDto>(`admin/support/requests/${id}/reply`, body, {
        headers,
      }),
    );
  },

  async getSubscriptions(
    page = 1,
    limit = 20,
  ): Promise<AdminSubscriptionsResponseDto> {
    return withAuthRetry((headers) =>
      get<AdminSubscriptionsResponseDto>("admin/subscriptions", {
        params: { page: String(page), limit: String(limit) },
        headers,
      }),
    );
  },

  async getPlans(): Promise<AdminPlanDto[]> {
    return withAuthRetry((headers) =>
      get<AdminPlanDto[]>("admin/plans", { headers }),
    );
  },

  async createPlan(body: CreateAdminPlanRequestDto): Promise<AdminPlanDto> {
    return withAuthRetry((headers) =>
      post<AdminPlanDto>("admin/plans", body, { headers }),
    );
  },

  async updatePlan(
    id: string,
    body: UpdateAdminPlanRequestDto,
  ): Promise<AdminPlanDto> {
    return withAuthRetry((headers) =>
      patch<AdminPlanDto>(`admin/plans/${id}`, body, { headers }),
    );
  },

  async deletePlan(id: string): Promise<{ message: string }> {
    return withAuthRetry((headers) =>
      del<{ message: string }>(`admin/plans/${id}`, { headers }),
    );
  },

  async getContent(): Promise<AdminContentItemDto[]> {
    return withAuthRetry((headers) =>
      get<AdminContentItemDto[]>("admin/content", { headers }),
    );
  },

  async getContentItem(id: string): Promise<AdminContentItemDto | null> {
    try {
      return await withAuthRetry((headers) =>
        get<AdminContentItemDto>(`admin/content/${id}`, { headers }),
      );
    } catch {
      return null;
    }
  },

  async publishContent(
    id: string,
    body: PublishAdminContentRequestDto,
  ): Promise<AdminContentItemDto | null> {
    try {
      return await withAuthRetry((headers) =>
        patch<AdminContentItemDto>(`admin/content/${id}/publish`, body, {
          headers,
        }),
      );
    } catch {
      return null;
    }
  },

  async updateContent(
    id: string,
    body: UpdateAdminContentRequestDto,
  ): Promise<AdminContentItemDto | null> {
    try {
      return await withAuthRetry((headers) =>
        patch<AdminContentItemDto>(`admin/content/${id}`, body, { headers }),
      );
    } catch {
      return null;
    }
  },

  async deleteContent(id: string): Promise<{ success: boolean }> {
    return withAuthRetry((headers) =>
      del<{ success: boolean }>(`admin/content/${id}`, { headers }),
    );
  },

  async presignUpload(
    body: PresignUploadRequestDto,
  ): Promise<PresignUploadResponseDto> {
    return withAuthRetry((headers) =>
      post<PresignUploadResponseDto>("admin/uploads/presign", body, {
        headers,
      }),
    );
  },

  async initMultipartUpload(
    body: MultipartInitUploadRequestDto,
  ): Promise<MultipartInitUploadResponseDto> {
    return withAuthRetry((headers) =>
      post<MultipartInitUploadResponseDto>(
        "admin/uploads/multipart/init",
        body,
        {
          headers,
        },
      ),
    );
  },

  async getMultipartPartUrl(
    body: MultipartPartUrlRequestDto,
  ): Promise<MultipartPartUrlResponseDto> {
    return withAuthRetry((headers) =>
      post<MultipartPartUrlResponseDto>(
        "admin/uploads/multipart/part-url",
        body,
        {
          headers,
        },
      ),
    );
  },

  async completeMultipartUpload(
    body: MultipartCompleteUploadRequestDto,
  ): Promise<{ key: string; publicUrl?: string }> {
    return withAuthRetry((headers) =>
      post<{ key: string; publicUrl?: string }>(
        "admin/uploads/multipart/complete",
        body,
        {
          headers,
        },
      ),
    );
  },

  async abortMultipartUpload(
    body: MultipartAbortUploadRequestDto,
  ): Promise<{ success: true }> {
    return withAuthRetry((headers) =>
      post<{ success: true }>("admin/uploads/multipart/abort", body, {
        headers,
      }),
    );
  },

  async getCloudflareStreamStatus(): Promise<CloudflareStreamStatusDto> {
    return withAuthRetry((headers) =>
      get<CloudflareStreamStatusDto>("streaming/cloudflare/status", { headers }),
    );
  },

  async createCloudflareDirectUpload(): Promise<CloudflareDirectUploadResponseDto> {
    return withAuthRetry((headers) =>
      post<CloudflareDirectUploadResponseDto>(
        "streaming/cloudflare/direct-upload",
        {},
        { headers },
      ),
    );
  },

  async createContent(
    body: CreateAdminContentRequestDto,
  ): Promise<AdminContentItemDto> {
    return withAuthRetry((headers) =>
      post<AdminContentItemDto>("admin/content", body, { headers }),
    );
  },

  async createTrailer(
    contentId: string,
    body: CreateAdminTrailerRequestDto,
  ): Promise<AdminContentItemDto> {
    return withAuthRetry((headers) =>
      post<AdminContentItemDto>(`admin/content/${contentId}/trailer`, body, {
        headers,
      }),
    );
  },

  async createSeason(body: CreateAdminSeasonRequestDto) {
    return withAuthRetry((headers) =>
      post<SeasonResponseDto>("admin/season", body, { headers }),
    );
  },

  async createEpisode(body: CreateAdminEpisodeRequestDto) {
    return withAuthRetry((headers) =>
      post<EpisodeResponseDto>("admin/episode", body, { headers }),
    );
  },

  async getCategories(): Promise<AdminCategoryDto[]> {
    return withAuthRetry((headers) =>
      get<AdminCategoryDto[]>("admin/categories", { headers }),
    );
  },

  async createCategory(
    body: CreateAdminCategoryRequestDto,
  ): Promise<AdminCategoryDto> {
    return withAuthRetry((headers) =>
      post<AdminCategoryDto>("admin/categories", body, { headers }),
    );
  },

  async deleteCategory(id: string): Promise<void> {
    return withAuthRetry((headers) =>
      del<void>(`admin/categories/${id}`, { headers }),
    );
  },

  async getSitePages(): Promise<SitePageSummaryDto[]> {
    return withAuthRetry((headers) =>
      get<SitePageSummaryDto[]>("admin/pages", { headers }),
    );
  },

  async getSitePage(slug: string): Promise<SitePageDto> {
    return withAuthRetry((headers) =>
      get<SitePageDto>(`admin/pages/${slug}`, { headers }),
    );
  },

  async updateSitePage(
    slug: string,
    body: UpdateSitePageRequestDto,
  ): Promise<SitePageDto> {
    return withAuthRetry((headers) =>
      patch<SitePageDto>(`admin/pages/${slug}`, body, { headers }),
    );
  },

  async getUsersAnalytics(): Promise<AdminUsersAnalyticsDto> {
    return withAuthRetry((headers) =>
      get<AdminUsersAnalyticsDto>("admin/analytics/users", { headers }),
    );
  },

  async getContentAnalytics(): Promise<AdminContentAnalyticsDto> {
    return withAuthRetry((headers) =>
      get<AdminContentAnalyticsDto>("admin/analytics/content", { headers }),
    );
  },

  async getRevenueAnalytics(): Promise<AdminRevenueAnalyticsDto> {
    return withAuthRetry((headers) =>
      get<AdminRevenueAnalyticsDto>("admin/analytics/revenue", { headers }),
    );
  },

  async getSystemHealth(): Promise<AdminSystemHealthDto> {
    return withAuthRetry((headers) =>
      get<AdminSystemHealthDto>("admin/system/health", { headers }),
    );
  },

  async getSystemLogs(): Promise<AdminSystemLogDto[]> {
    return withAuthRetry((headers) =>
      get<AdminSystemLogDto[]>("admin/system/logs", { headers }),
    );
  },
};
