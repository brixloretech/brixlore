import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  BadRequestException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import type { OfflineAnalyticsDto } from './admin.service';
import { UsersService } from '../users/users.service';
import type { DashboardStatsDto } from './dto/dashboard-stats.dto';
import type { AdminUserDto } from './dto/admin-user.dto';
import type { AdminContentItemDto } from './dto/admin-content.dto';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { MultipartInitUploadDto } from './dto/multipart-init-upload.dto';
import { MultipartPartUrlDto } from './dto/multipart-part-url.dto';
import { MultipartCompleteUploadDto } from './dto/multipart-complete-upload.dto';
import { MultipartAbortUploadDto } from './dto/multipart-abort-upload.dto';
import { CreateAdminContentDto } from './dto/create-admin-content.dto';
import { CreateAdminSeasonDto } from './dto/create-admin-season.dto';
import { CreateAdminEpisodeDto } from './dto/create-admin-episode.dto';
import { CreateAdminTrailerDto } from './dto/create-admin-trailer.dto';
import { R2Service } from '../storage/r2.service';
import { randomUUID } from 'crypto';
import { SiteService } from '../site/site.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { SitePageDto, SitePageSummaryDto } from '../site/dto/site-page.dto';
import { UpdateSitePageDto } from '../site/dto/update-site-page.dto';
import type { AdminCategoryDto } from './dto/admin-category.dto';
import { CreateAdminCategoryDto } from './dto/create-admin-category.dto';
import { UpdateAdminCategoryDto } from './dto/update-admin-category.dto';
import { UpdateAdminContentDto } from './dto/update-admin-content.dto';
import { PublishAdminContentDto } from './dto/publish-admin-content.dto';
import { UpdateAdminSeasonDto } from './dto/update-admin-season.dto';
import { UpdateAdminEpisodeDto } from './dto/update-admin-episode.dto';
import type { AdminSubscriptionsResponseDto } from './dto/admin-subscription.dto';
import type { AdminPlanDto } from './dto/admin-plan.dto';
import { CreateAdminPlanDto } from './dto/create-admin-plan.dto';
import { UpdateAdminPlanDto } from './dto/update-admin-plan.dto';
import { InviteAdminUserDto } from './dto/invite-admin-user.dto';
import { UpdateAdminUserRoleDto } from './dto/update-admin-user-role.dto';
import type { SupportRequestDto } from './dto/admin-support.dto';
import { UpdateSupportRequestDto } from './dto/update-support-request.dto';
import { ReplySupportRequestDto } from './dto/reply-support-request.dto';
import type {
  AdminUsersAnalyticsDto,
  AdminContentAnalyticsDto,
  AdminRevenueAnalyticsDto,
} from './dto/admin-analytics.dto';
import type { AdminSystemHealthDto, AdminSystemLogDto } from './dto/admin-system.dto';
import { TranscodeEpisodeDto } from './dto/transcode-episode.dto';
import { TranscodeService } from '../streaming/transcode.service';

const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/mkv']);
const THUMBNAIL_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_VIDEO_BYTES = 20 * 1024 * 1024 * 1024;
const MULTIPART_PART_SIZE_BYTES = 64 * 1024 * 1024;

function getExtensionFromName(fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const parts = safe.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
}

function getExtensionForType(contentType: string): string {
  switch (contentType) {
    case 'video/mp4':
      return 'mp4';
    case 'video/webm':
      return 'webm';
    case 'video/mkv':
      return 'mkv';
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return '';
  }
}

function ensureAdmin(user: User): void {
  const allowed = new Set(['admin', 'SUPER_ADMIN', 'CONTENT_MANAGER', 'CUSTOMER_SUPPORT']);
  if (!allowed.has(user.role)) {
    throw new ForbiddenException('Admin access required');
  }
}

function ensureSuperAdmin(user: User): void {
  if (user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenException('Super admin access required');
  }
}

/** Allow SUPER_ADMIN or legacy "admin" role (e.g. production admin users). */
function ensureCanDeleteContent(user: User): void {
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'admin') {
    throw new ForbiddenException('Super admin access required');
  }
}

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly r2Service: R2Service,
    private readonly siteService: SiteService,
    private readonly transcodeService: TranscodeService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Dashboard stats: total users, content, subscribers, content by category.
   */
  @Get('stats')
  async getStats(@CurrentUser() user: User): Promise<DashboardStatsDto> {
    ensureAdmin(user);
    return this.adminService.getDashboardStats();
  }

  /**
   * Admin: transcode an episode to HLS and update hlsUrl.
   */
  @Post('transcode')
  async transcodeEpisode(
    @CurrentUser() user: User,
    @Body() dto: TranscodeEpisodeDto,
  ): Promise<{ episodeId: string; hlsKey: string; files: number }> {
    ensureAdmin(user);
    return this.transcodeService.transcodeEpisodeToHls(dto.episodeId, {
      outputPrefix: dto.outputPrefix,
      tempDir: dto.tempDir,
    });
  }

  /**
   * List users (paginated).
   */
  @Get('users')
  async getUsers(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ users: AdminUserDto[]; total: number }> {
    ensureAdmin(user);
    const pageNum = Math.max(1, parseInt(String(page || '1'), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || '20'), 10) || 20));
    return this.adminService.getUsers(pageNum, limitNum);
  }

  /**
   * List support requests (paginated).
   */
  @Get('support/requests')
  async getSupportRequests(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ requests: SupportRequestDto[]; total: number }> {
    ensureAdmin(user);
    const pageNum = Math.max(1, parseInt(String(page || '1'), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || '20'), 10) || 20));
    return this.adminService.getSupportRequests(pageNum, limitNum);
  }

  /**
   * Update support request status/priority.
   */
  @Patch('support/requests/:id')
  async updateSupportRequest(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: UpdateSupportRequestDto,
  ): Promise<SupportRequestDto> {
    ensureAdmin(user);
    return this.adminService.updateSupportRequest(id, body);
  }

  /**
   * Reply to a support request.
   */
  @Post('support/requests/:id/reply')
  async replySupportRequest(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: ReplySupportRequestDto,
  ): Promise<SupportRequestDto> {
    ensureAdmin(user);
    return this.adminService.replySupportRequest(id, user.id, body);
  }

  /**
   * Invite a new admin user by email.
   */
  @Post('users/invite')
  async inviteAdminUser(
    @CurrentUser() user: User,
    @Body() body: InviteAdminUserDto,
  ): Promise<{ message: string }> {
    ensureAdmin(user);
    return this.adminService.inviteAdminUser(body);
  }

  /**
   * Update an admin user's role.
   */
  @Patch('users/:id/role')
  async updateAdminUserRole(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: UpdateAdminUserRoleDto,
  ): Promise<AdminUserDto> {
    ensureAdmin(user);
    return this.adminService.updateAdminUserRole(id, body.role);
  }

  /**
   * Revoke a user's admin access (set role to "user"). Caller cannot revoke themselves.
   */
  @Delete('users/:id/access')
  async revokeAdminAccess(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<AdminUserDto> {
    ensureAdmin(user);
    return this.adminService.revokeAdminAccess(id, user.id);
  }

  /**
   * Export a user's account data (profile, devices, subscriptions) for admin download.
   * Same shape as GET /users/export but for the specified user.
   */
  @Get('users/:id/export')
  async exportUserAccountData(@CurrentUser() user: User, @Param('id') id: string) {
    ensureAdmin(user);
    return this.usersService.exportAccountData(id);
  }

  /**
   * List subscriptions and revenue summary.
   */
  @Get('subscriptions')
  async getSubscriptions(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<AdminSubscriptionsResponseDto> {
    ensureAdmin(user);
    const pageNum = Math.max(1, parseInt(String(page || '1'), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || '20'), 10) || 20));
    return this.adminService.getSubscriptions(pageNum, limitNum);
  }

  /**
   * List subscription plans with active subscriber counts.
   */
  @Get('plans')
  async getPlans(@CurrentUser() user: User): Promise<AdminPlanDto[]> {
    ensureAdmin(user);
    return this.adminService.getPlans();
  }

  /**
   * Create a new subscription plan.
   */
  @Post('plans')
  async createPlan(
    @CurrentUser() user: User,
    @Body() body: CreateAdminPlanDto,
  ): Promise<AdminPlanDto> {
    ensureAdmin(user);
    return this.adminService.createPlan(body);
  }

  /**
   * Update a subscription plan.
   */
  @Patch('plans/:id')
  async updatePlan(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: UpdateAdminPlanDto,
  ): Promise<AdminPlanDto> {
    ensureAdmin(user);
    return this.adminService.updatePlan(id, body);
  }

  /**
   * Delete a subscription plan.
   */
  @Delete('plans/:id')
  async deletePlan(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    ensureAdmin(user);
    return this.adminService.deletePlan(id);
  }

  /**
   * List all content for admin.
   */
  @Get('content')
  async getContent(@CurrentUser() user: User): Promise<AdminContentItemDto[]> {
    ensureAdmin(user);
    return this.adminService.getContentList();
  }

  /**
   * Get a single content item for editing.
   */
  @Get('content/:id')
  async getContentById(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<AdminContentItemDto | null> {
    ensureAdmin(user);
    return this.adminService.getContentById(id);
  }

  /**
   * List all categories (admin view).
   */
  @Get('categories')
  async getCategories(@CurrentUser() user: User): Promise<AdminCategoryDto[]> {
    ensureAdmin(user);
    return this.adminService.getCategories();
  }

  /**
   * Create a new category.
   */
  @Post('categories')
  async createCategory(
    @CurrentUser() user: User,
    @Body() body: CreateAdminCategoryDto,
  ): Promise<AdminCategoryDto> {
    ensureAdmin(user);
    return this.adminService.createCategory(body);
  }

  /**
   * Delete an empty category.
   */
  @Delete('categories/:id')
  async deleteCategory(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    ensureAdmin(user);
    await this.adminService.deleteCategory(id);
    return { success: true };
  }

  /**
   * Update a category name or parent mapping.
   */
  @Patch('categories/:id')
  async updateCategory(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: UpdateAdminCategoryDto,
  ): Promise<AdminCategoryDto> {
    ensureAdmin(user);
    return this.adminService.updateCategory(id, body);
  }

  /**
   * Update content metadata.
   */
  @Patch('content/:id')
  async updateContent(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: UpdateAdminContentDto,
  ): Promise<AdminContentItemDto | null> {
    ensureAdmin(user);
    return this.adminService.updateContent(id, body);
  }

  /**
   * Publish or unpublish content.
   */
  @Patch('content/:id/publish')
  async publishContent(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: PublishAdminContentDto,
  ): Promise<AdminContentItemDto | null> {
    ensureAdmin(user);

    // Get current state before update
    const currentContent = await this.adminService.getContentById(id);
    const updated = await this.adminService.publishContent(id, body.isPublished);

    // Send notification when transitioning from unpublished to published
    if (updated && body.isPublished && currentContent && !currentContent.isPublished) {
      console.log(`🔔 Content published: "${updated.title}" - Triggering notifications...`);
      setImmediate(() => {
        this.notificationsService
          .sendToAllUsers({
            title: `NEW DROP 🔥 ${updated.title}`,
            body: `✨ Just added: ${updated.title}. Tap to watch now on Brixlore!`,
            data: {
              videoId: updated.id,
              contentType: updated.type,
              contentTitle: updated.title,
            },
            type: 'video',
          })
          .catch((err) => console.error('[Notifications] Failed to send:', err));
      });
    } else if (updated && !body.isPublished && currentContent && currentContent.isPublished) {
      console.log(`📝 Content unpublished: "${updated.title}"`);
    }

    return updated;
  }

  /**
   * Delete content. Super admin or admin role. Cascades to seasons and episodes.
   */
  @Delete('content/:id')
  async deleteContent(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    ensureCanDeleteContent(user);
    await this.adminService.deleteContent(id);
    return { success: true };
  }

  /**
   * Create a presigned upload URL for video or thumbnail.
   */
  @Post('uploads/presign')
  async presignUpload(
    @CurrentUser() user: User,
    @Body() body: PresignUploadDto,
  ): Promise<{
    uploadId: string;
    key: string;
    url: string;
    expiresAt: string;
    publicUrl?: string;
  }> {
    ensureAdmin(user);

    const { kind, fileName, contentType, sizeBytes, uploadId } = body;
    const isVideo = kind === 'video';
    const allowedTypes = isVideo ? VIDEO_TYPES : THUMBNAIL_TYPES;
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : null;

    if (!allowedTypes.has(contentType)) {
      throw new BadRequestException('File type is not allowed');
    }
    if (maxBytes !== null && sizeBytes > maxBytes) {
      throw new BadRequestException('File is too large');
    }

    const extFromName = getExtensionFromName(fileName);
    const extFromType = getExtensionForType(contentType);
    const ext = extFromName || extFromType;
    if (!ext) {
      throw new BadRequestException('File extension is missing or invalid');
    }

    const resolvedUploadId = uploadId?.trim() || randomUUID();
    const objectId = randomUUID();
    const key = `uploads/${resolvedUploadId}/${kind}-${objectId}.${ext}`;
    const url = await this.r2Service.getSignedPutUrl(key, contentType);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const publicUrl = this.r2Service.getPublicUrl(key) ?? undefined;

    return { uploadId: resolvedUploadId, key, url, expiresAt, publicUrl };
  }

  /**
   * Initialize multipart upload for large files.
   */
  @Post('uploads/multipart/init')
  async initMultipartUpload(
    @CurrentUser() user: User,
    @Body() body: MultipartInitUploadDto,
  ): Promise<{
    uploadId: string;
    key: string;
    partSizeBytes: number;
    expiresAt: string;
    publicUrl?: string;
  }> {
    ensureAdmin(user);

    const { kind, fileName, contentType, sizeBytes } = body;
    const isVideo = kind === 'video';
    const allowedTypes = isVideo ? VIDEO_TYPES : THUMBNAIL_TYPES;
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : null;

    if (!allowedTypes.has(contentType)) {
      throw new BadRequestException('File type is not allowed');
    }
    if (maxBytes !== null && sizeBytes > maxBytes) {
      throw new BadRequestException('File is too large');
    }

    const extFromName = getExtensionFromName(fileName);
    const extFromType = getExtensionForType(contentType);
    const ext = extFromName || extFromType;
    if (!ext) {
      throw new BadRequestException('File extension is missing or invalid');
    }

    const objectId = randomUUID();
    const key = `uploads/${randomUUID()}/${kind}-${objectId}.${ext}`;
    const uploadId = await this.r2Service.createMultipartUpload(key, contentType);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const publicUrl = this.r2Service.getPublicUrl(key) ?? undefined;

    return {
      uploadId,
      key,
      partSizeBytes: MULTIPART_PART_SIZE_BYTES,
      expiresAt,
      publicUrl,
    };
  }

  /**
   * Presign a single multipart part upload URL.
   */
  @Post('uploads/multipart/part-url')
  async presignMultipartPartUpload(
    @CurrentUser() user: User,
    @Body() body: MultipartPartUrlDto,
  ): Promise<{ partNumber: number; url: string; expiresAt: string }> {
    ensureAdmin(user);

    const url = await this.r2Service.getSignedUploadPartUrl(
      body.key,
      body.uploadId,
      body.partNumber,
    );
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    return {
      partNumber: body.partNumber,
      url,
      expiresAt,
    };
  }

  /**
   * Complete multipart upload after all parts are uploaded.
   */
  @Post('uploads/multipart/complete')
  async completeMultipartUpload(
    @CurrentUser() user: User,
    @Body() body: MultipartCompleteUploadDto,
  ): Promise<{ key: string; publicUrl?: string }> {
    ensureAdmin(user);

    await this.r2Service.completeMultipartUpload(body.key, body.uploadId, body.parts);
    const publicUrl = this.r2Service.getPublicUrl(body.key) ?? undefined;
    return { key: body.key, publicUrl };
  }

  /**
   * Abort multipart upload and clean up unfinished parts.
   */
  @Post('uploads/multipart/abort')
  async abortMultipartUpload(
    @CurrentUser() user: User,
    @Body() body: MultipartAbortUploadDto,
  ): Promise<{ success: true }> {
    ensureAdmin(user);

    await this.r2Service.abortMultipartUpload(body.key, body.uploadId);
    return { success: true };
  }

  /**
   * Create a content record after uploads are completed.
   */
  @Post('content')
  async createContent(
    @CurrentUser() user: User,
    @Body() body: CreateAdminContentDto,
  ): Promise<AdminContentItemDto> {
    ensureAdmin(user);
    const created = await this.adminService.createContent(body);
    if (body.videoKey && !body.hlsKey) {
      const episodeId = created.episodes?.[0]?.id;
      if (episodeId) {
        setImmediate(() => {
          this.transcodeService
            .transcodeEpisodeToHls(episodeId)
            .catch((err) => console.error('[HLS] Transcode failed', err));
        });
      }
    }

    // Send push notification to all users if content is published
    if (created.isPublished) {
      console.log(`🔔 Content published: "${created.title}" - Triggering notifications...`);
      setImmediate(() => {
        this.notificationsService
          .sendToAllUsers({
            title: `NEW DROP 🔥 ${created.title}`,
            body: `✨ Just added: ${created.title}. Tap to watch now on Brixlore!`,
            data: {
              videoId: created.id,
              contentType: created.type,
              contentTitle: created.title,
            },
            type: 'video',
          })
          .catch((err) => console.error('[Notifications] Failed to send:', err));
      });
    } else {
      console.log(`📝 Content created as draft: "${created.title}" - No notifications sent`);
    }

    return created;
  }

  /**
   * Create and attach a trailer for a content item.
   */
  @Post('content/:id/trailer')
  async createTrailer(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: CreateAdminTrailerDto,
  ): Promise<AdminContentItemDto | null> {
    ensureAdmin(user);
    const created = await this.adminService.createTrailer(id, body);
    if (created && body.videoKey && !body.hlsKey) {
      const episodeId = created.episodes?.[0]?.id;
      if (episodeId) {
        setImmediate(() => {
          this.transcodeService
            .transcodeEpisodeToHls(episodeId)
            .catch((err) => console.error('[HLS] Transcode failed', err));
        });
      }
    }
    return created;
  }

  /**
   * Create a season for a series/episodic content item.
   */
  @Post('season')
  async createSeason(@CurrentUser() user: User, @Body() body: CreateAdminSeasonDto) {
    ensureAdmin(user);
    return this.adminService.createSeason(body);
  }

  /**
   * Create an episode for a content item (optionally tied to a season).
   */
  @Post('episode')
  async createEpisode(@CurrentUser() user: User, @Body() body: CreateAdminEpisodeDto) {
    ensureAdmin(user);
    const episode = await this.adminService.createEpisode(body);
    if (body.videoKey && !body.hlsKey) {
      setImmediate(() => {
        this.transcodeService
          .transcodeEpisodeToHls(episode.id)
          .catch((err) => console.error('[HLS] Transcode failed', err));
      });
    }

    // Get content info for notification
    setImmediate(async () => {
      try {
        const content = await this.adminService.getContentById(body.contentId);
        if (content?.isPublished) {
          console.log(
            `🔔 New episode for published content: "${content.title}" - Triggering notifications...`,
          );
          await this.notificationsService.sendToAllUsers({
            title: `NEW EPISODE 🚀 ${content.title}`,
            body: `🎉 ${episode.title} just dropped. Tap to watch now!`,
            data: {
              videoId: body.contentId,
              episodeId: episode.id,
              contentType: content.type,
              contentTitle: content.title,
            },
            type: 'video',
          });
        } else {
          console.log(`📝 Episode added to unpublished content - No notifications sent`);
        }
      } catch (err) {
        console.error('[Notifications] Failed to send episode notification:', err);
      }
    });

    return episode;
  }

  /**
   * Update a season.
   */
  @Patch('seasons/:id')
  async updateSeason(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: UpdateAdminSeasonDto,
  ) {
    ensureAdmin(user);
    return this.adminService.updateSeason(id, body);
  }

  /**
   * Delete a season.
   */
  @Delete('seasons/:id')
  async deleteSeason(@CurrentUser() user: User, @Param('id') id: string) {
    ensureAdmin(user);
    return this.adminService.deleteSeason(id);
  }

  /**
   * Update an episode.
   */
  @Patch('episodes/:id')
  async updateEpisode(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: UpdateAdminEpisodeDto,
  ) {
    ensureAdmin(user);
    const episode = await this.adminService.updateEpisode(id, body);
    if (body.videoKey && !body.hlsKey) {
      setImmediate(() => {
        this.transcodeService
          .transcodeEpisodeToHls(episode.id)
          .catch((err) => console.error('[HLS] Transcode failed', err));
      });
    }
    return episode;
  }

  /**
   * Delete an episode.
   */
  @Delete('episodes/:id')
  async deleteEpisode(@CurrentUser() user: User, @Param('id') id: string) {
    ensureAdmin(user);
    return this.adminService.deleteEpisode(id);
  }

  /**
   * List editable site pages (privacy, terms, etc.).
   */
  @Get('pages')
  async getPages(@CurrentUser() user: User): Promise<SitePageSummaryDto[]> {
    ensureAdmin(user);
    return this.siteService.listPages();
  }

  /**
   * Get a single site page by slug.
   */
  @Get('pages/:slug')
  async getPage(@CurrentUser() user: User, @Param('slug') slug: string): Promise<SitePageDto> {
    ensureAdmin(user);
    return this.siteService.getPage(slug);
  }

  /**
   * Update a site page.
   */
  @Patch('pages/:slug')
  async updatePage(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body() body: UpdateSitePageDto,
  ): Promise<SitePageDto> {
    ensureAdmin(user);
    return this.siteService.upsertPage(slug, body.title, body.content);
  }

  /**
   * Offline download analytics: total downloads, active offline users, downloads per plan.
   */
  @Get('analytics/offline')
  async getOfflineAnalytics(@CurrentUser() user: User): Promise<OfflineAnalyticsDto> {
    ensureAdmin(user);
    return this.adminService.getOfflineAnalytics();
  }

  /**
   * User analytics: new users, active users, sign-up trend.
   */
  @Get('analytics/users')
  async getUsersAnalytics(@CurrentUser() user: User): Promise<AdminUsersAnalyticsDto> {
    ensureAdmin(user);
    return this.adminService.getUsersAnalytics();
  }

  /**
   * Content analytics: views and publishing stats.
   */
  @Get('analytics/content')
  async getContentAnalytics(@CurrentUser() user: User): Promise<AdminContentAnalyticsDto> {
    ensureAdmin(user);
    return this.adminService.getContentAnalytics();
  }

  /**
   * Revenue analytics: active revenue and plan breakdown.
   */
  @Get('analytics/revenue')
  async getRevenueAnalytics(@CurrentUser() user: User): Promise<AdminRevenueAnalyticsDto> {
    ensureAdmin(user);
    return this.adminService.getRevenueAnalytics();
  }

  /**
   * System health snapshot.
   */
  @Get('system/health')
  async getSystemHealth(@CurrentUser() user: User): Promise<AdminSystemHealthDto> {
    ensureAdmin(user);
    return this.adminService.getSystemHealth();
  }

  /**
   * System activity logs.
   */
  @Get('system/logs')
  async getSystemLogs(@CurrentUser() user: User): Promise<AdminSystemLogDto[]> {
    ensureAdmin(user);
    return this.adminService.getSystemLogs();
  }
}
