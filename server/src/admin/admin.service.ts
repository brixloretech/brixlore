import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from '../storage/r2.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import type { DashboardStatsDto } from './dto/dashboard-stats.dto';
import type { AdminUserDto } from './dto/admin-user.dto';
import type { InviteAdminUserDto } from './dto/invite-admin-user.dto';
import type { AdminContentItemDto } from './dto/admin-content.dto';
import type { CreateAdminContentDto } from './dto/create-admin-content.dto';
import type { CreateAdminSeasonDto } from './dto/create-admin-season.dto';
import type { CreateAdminEpisodeDto } from './dto/create-admin-episode.dto';
import type { CreateAdminTrailerDto } from './dto/create-admin-trailer.dto';
import type { AdminCategoryDto } from './dto/admin-category.dto';
import type { CreateAdminCategoryDto } from './dto/create-admin-category.dto';
import type { UpdateAdminCategoryDto } from './dto/update-admin-category.dto';
import type { UpdateAdminContentDto } from './dto/update-admin-content.dto';
import type {
  AdminSubscriptionDto,
  AdminSubscriptionsResponseDto,
} from './dto/admin-subscription.dto';
import type { AdminPlanDto } from './dto/admin-plan.dto';
import type { CreateAdminPlanDto } from './dto/create-admin-plan.dto';
import type { UpdateAdminPlanDto } from './dto/update-admin-plan.dto';
import type {
  AdminUsersAnalyticsDto,
  AdminContentAnalyticsDto,
  AdminRevenueAnalyticsDto,
  CategoryCountDto,
  TopEpisodeDto,
} from './dto/admin-analytics.dto';
import type { AdminSystemHealthDto, AdminSystemLogDto } from './dto/admin-system.dto';
import type { SupportRequestDto, SupportReplyDto } from './dto/admin-support.dto';
import type { UpdateSupportRequestDto } from './dto/update-support-request.dto';
import type { ReplySupportRequestDto } from './dto/reply-support-request.dto';
import { UpdateAdminSeasonDto } from './dto/update-admin-season.dto';
import { UpdateAdminEpisodeDto } from './dto/update-admin-episode.dto';

const ContentType = {
  MOVIE: 'MOVIE',
  DOCUMENTARY: 'DOCUMENTARY',
  SERIES: 'SERIES',
  ANIMATION: 'ANIMATION',
  TRAILER: 'TRAILER',
  SHORT: 'SHORT',
} as const;

type ContentType = (typeof ContentType)[keyof typeof ContentType];

const SUPPORT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const SUPPORT_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export interface DownloadsPerPlanDto {
  planId: string;
  planName: string;
  downloadCount: number;
  activeSubscriptionCount: number;
}

export interface OfflineAnalyticsDto {
  totalOfflineDownloads: number;
  activeOfflineDownloads: number;
  activeOfflineUsers: number;
  downloadsPerPlan: DownloadsPerPlanDto[];
}

export interface AdminWaitlistEntryDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailConsent: boolean;
  smsConsent: boolean;
  createdAt: string;
}

function formatDurationSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function resolveR2Url(value: string | null | undefined, r2Service: R2Service): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return r2Service.getPublicUrl(value) ?? value;
}

function toAdminContentItemDto(content: any, r2Service: R2Service): AdminContentItemDto {
  const duration =
    typeof content.duration === 'number' ? formatDurationSeconds(content.duration) : undefined;
  const episodes = Array.isArray(content.episodes) ? content.episodes : [];
  const trailerEpisodes = Array.isArray(content.trailer?.episodes) ? content.trailer.episodes : [];
  const playbackEpisodes = episodes.length > 0 ? episodes : trailerEpisodes;
  const hlsReadyCount = playbackEpisodes.filter(
    (episode: any) => typeof episode.hlsUrl === 'string' && episode.hlsUrl.trim().length > 0,
  ).length;
  const hlsTotalCount = playbackEpisodes.length;
  const hlsStatus: 'ready' | 'processing' | 'missing' =
    hlsTotalCount === 0 ? 'missing' : hlsReadyCount === hlsTotalCount ? 'ready' : 'processing';

  return {
    id: content.id,
    title: content.title,
    description: content.description ?? undefined,
    type: content.type,
    thumbnailUrl: resolveR2Url(content.thumbnailUrl, r2Service) ?? '',
    posterUrl: resolveR2Url(content.posterUrl, r2Service),
    bannerUrl: resolveR2Url(content.bannerUrl, r2Service),
    releaseYear: content.releaseYear,
    ageRating: content.ageRating,
    duration,
    trailerId: content.trailerId ?? undefined,
    category: content.category?.name ?? undefined,
    isPublished: content.isPublished,
    hlsStatus,
    hlsReadyCount,
    hlsTotalCount,
    createdAt: content.createdAt.toISOString(),
    updatedAt: content.updatedAt?.toISOString(),
    seasons: content.seasons
      ? content.seasons.map((season: any) => ({
        id: season.id,
        seasonNumber: season.seasonNumber,
        title: season.title,
        episodeCount: season._count?.episodes ?? 0,
      }))
      : undefined,
    episodes: content.episodes
      ? content.episodes.map((episode: any) => ({
        id: episode.id,
        seasonId: episode.seasonId ?? undefined,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        duration: formatDurationSeconds(episode.duration),
        hlsReady: typeof episode.hlsUrl === 'string' && episode.hlsUrl.trim().length > 0,
        thumbnailUrl: resolveR2Url(episode.thumbnailUrl, r2Service),
      }))
      : undefined,
    trailer: content.trailer
      ? {
        id: content.trailer.id,
        title: content.trailer.title,
        duration:
          typeof content.trailer.duration === 'number'
            ? formatDurationSeconds(content.trailer.duration)
            : '',
        thumbnailUrl: resolveR2Url(content.trailer.thumbnailUrl, r2Service),
        posterUrl: resolveR2Url(content.trailer.posterUrl, r2Service),
        bannerUrl: resolveR2Url(content.trailer.bannerUrl, r2Service),
        episodeId: content.trailer.episodes?.[0]?.id,
        videoUrl: content.trailer.episodes?.[0]?.videoUrl,
        hlsUrl: content.trailer.episodes?.[0]?.hlsUrl ?? undefined,
      }
      : undefined,
  };
}

function parseDurationToSeconds(duration: string): number {
  const parts = duration
    .trim()
    .split(':')
    .map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n) || n < 0)) return -1;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  return -1;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toAdminCategoryDto(category: {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}): AdminCategoryDto {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function formatMoney(value: unknown): string {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '0.00';
  return num.toFixed(2);
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
    private readonly r2Service: R2Service,
  ) { }

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();

    const trailerLinkedRows = await (this.prisma as any).content.findMany({
      where: { trailerId: { not: null } },
      select: { trailerId: true },
    });
    const linkedTrailerIds = trailerLinkedRows
      .map((row: any) => row.trailerId)
      .filter((id: any): id is string => typeof id === 'string' && id.length > 0);

    const contentWhere = {
      type: { not: 'TRAILER' },
      ...(linkedTrailerIds.length > 0 ? { id: { notIn: linkedTrailerIds } } : {}),
    };

    const [totalUsers, totalContent, totalSubscribers, contentRows, categories] = await Promise.all([
      this.prisma.user.count(),
      (this.prisma as any).content.count({ where: contentWhere }),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE', endDate: { gte: now } },
      }),
      (this.prisma as any).content.findMany({
        where: contentWhere,
        select: { categoryId: true },
      }),
      this.prisma.category.findMany({
        select: { id: true, name: true, parentId: true },
      }),
    ]);

    const categoryMap = new Map<string, { id: string; name: string; parentId: string | null }>();
    for (const cat of categories) {
      categoryMap.set(cat.id, cat);
    }

    const getRootCategory = (catId: string | null): { id: string; name: string } | null => {
      if (!catId) return null;
      let current = categoryMap.get(catId);
      if (!current) return null;
      let depth = 0;
      while (current.parentId && depth < 10) {
        const parent = categoryMap.get(current.parentId);
        if (!parent) break;
        current = parent;
        depth++;
      }
      return current;
    };

    const categoryCounts = new Map<string, number>();
    for (const row of contentRows) {
      const rootCat = row.categoryId ? getRootCategory(row.categoryId) : null;
      const name = rootCat?.name ?? 'Uncategorized';
      categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
    }

    const contentByCategory = Array.from(categoryCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const mainCategoriesCount = categories.filter((c) => c.parentId === null).length;

    // Build Focus Queue
    const focusQueue: string[] = [];

    // Rule 1: Support Requests (High)
    const openSupportCount = await (this.prisma as any).supportRequest.count({
      where: { status: 'OPEN' },
    });
    if (openSupportCount > 0) {
      focusQueue.push(
        `You have ${openSupportCount} open support request${openSupportCount > 1 ? 's' : ''}. Reply to customers.`,
      );
    }

    // Rule 2: Missing HLS Transcode (High)
    const missingHlsCount = await this.prisma.episode.count({
      where: {
        AND: [
          { videoUrl: { not: '' } },
          { OR: [{ hlsUrl: null }, { hlsUrl: '' }, { hlsUrl: 'null' }] },
        ],
      },
    });
    if (missingHlsCount > 0) {
      focusQueue.push(
        `There ${missingHlsCount > 1 ? 'are' : 'is'} ${missingHlsCount} episode${missingHlsCount > 1 ? 's' : ''} missing HLS video transcoding. Start transcoding.`,
      );
    }

    // Rule 3: Unpublished content drafts (Medium)
    const unpublishedCount = await (this.prisma as any).content.count({
      where: { ...contentWhere, isPublished: false },
    });
    if (unpublishedCount > 0) {
      focusQueue.push(
        `You have ${unpublishedCount} unpublished content draft${unpublishedCount > 1 ? 's' : ''}. Review and publish them.`,
      );
    }

    // Rule 4: Empty categories (Low)
    const mainCats = categories.filter((c) => c.parentId === null);
    const emptyCats = mainCats.filter(
      (cat) => !categoryCounts.has(cat.name) || categoryCounts.get(cat.name) === 0,
    );
    if (emptyCats.length > 0) {
      if (emptyCats.length === 1) {
        focusQueue.push(`Category "${emptyCats[0].name}" is empty. Add content to enable discovery.`);
      } else {
        focusQueue.push(
          `${emptyCats.length} categories (e.g. ${emptyCats.slice(0, 2).map((c) => c.name).join(', ')}) are empty. Add content.`,
        );
      }
    }

    // Rule 5: Low-content categories (Low)
    const lowContentCats = mainCats.filter((cat) => categoryCounts.get(cat.name) === 1);
    if (lowContentCats.length > 0) {
      if (lowContentCats.length === 1) {
        focusQueue.push(
          `Category "${lowContentCats[0].name}" has only 1 title. Add more content to balance discovery.`,
        );
      } else {
        focusQueue.push(
          `${lowContentCats.length} categories (e.g. ${lowContentCats.slice(0, 2).map((c) => c.name).join(', ')}) have only 1 title. Add content.`,
        );
      }
    }

    // Rule 6: Plans with 0 active subscribers (Low)
    const plans = await this.prisma.plan.findMany({
      select: {
        id: true,
        name: true,
        subscriptions: {
          where: { status: 'ACTIVE', endDate: { gte: now } },
          select: { id: true },
        },
      },
    });
    const emptyPlans = plans.filter((p) => p.subscriptions.length === 0);
    if (emptyPlans.length > 0) {
      focusQueue.push(
        `Subscription plan "${emptyPlans[0].name}" has no active subscribers. Review pricing or promotions.`,
      );
    }

    // Default Fallbacks if queue is empty
    if (focusQueue.length === 0) {
      focusQueue.push('Check subscriber trends and update promotions.');
      focusQueue.push('Review user sign-up analytics for the past 30 days.');
      focusQueue.push('Audit content views to identify top-performing titles.');
    }

    return {
      totalUsers,
      totalContent,
      totalSubscribers,
      contentByCategory,
      mainCategoriesCount,
      focusQueue: focusQueue.slice(0, 4),
    };
  }

  async getUsers(page = 1, limit = 20): Promise<{ users: AdminUserDto[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      }),
      this.prisma.user.count(),
    ]);
    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
    };
  }

  async getWaitlist(page = 1, limit = 20): Promise<{ entries: AdminWaitlistEntryDto[]; total: number }> {
    const skip = (page - 1) * limit;
    const model = (this.prisma as any).waitlistEntry;
    const [entries, total] = await Promise.all([
      model.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      model.count(),
    ]);
    return {
      total,
      entries: entries.map((entry: any) => ({
        id: entry.id,
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        emailConsent: entry.emailConsent,
        smsConsent: entry.smsConsent,
        createdAt: entry.createdAt.toISOString(),
      })),
    };
  }

  async getSupportRequests(
    page = 1,
    limit = 20,
  ): Promise<{ requests: SupportRequestDto[]; total: number }> {
    const model = this.getSupportRequestModel();
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      model.count(),
      model.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          replies: {
            orderBy: { createdAt: 'desc' },
            include: { adminUser: true },
          },
        },
      }),
    ]);

    return {
      total,
      requests: items.map((item: any) => this.toSupportRequestDto(item)),
    };
  }

  async updateSupportRequest(
    id: string,
    body: UpdateSupportRequestDto,
  ): Promise<SupportRequestDto> {
    if (!body.priority && !body.status) {
      throw new BadRequestException('No updates provided.');
    }
    if (body.priority && !SUPPORT_PRIORITIES.includes(body.priority as any)) {
      throw new BadRequestException('Invalid priority.');
    }
    if (body.status && !SUPPORT_STATUSES.includes(body.status as any)) {
      throw new BadRequestException('Invalid status.');
    }

    const model = this.getSupportRequestModel();
    const updated = await model.update({
      where: { id },
      data: {
        priority: body.priority,
        status: body.status,
      },
      include: {
        replies: {
          orderBy: { createdAt: 'desc' },
          include: { adminUser: true },
        },
      },
    });

    return this.toSupportRequestDto(updated);
  }

  async replySupportRequest(
    id: string,
    adminUserId: string,
    body: ReplySupportRequestDto,
  ): Promise<SupportRequestDto> {
    if (!body.message?.trim()) {
      throw new BadRequestException('Reply message is required.');
    }
    if (body.status && !SUPPORT_STATUSES.includes(body.status as any)) {
      throw new BadRequestException('Invalid status.');
    }

    const model = this.getSupportRequestModel();
    const request = await model.findUnique({ where: { id } });
    if (!request) {
      throw new BadRequestException('Support request not found.');
    }

    const nextStatus = body.status ?? (request.status === 'OPEN' ? 'IN_PROGRESS' : request.status);

    const updated = await this.prisma.$transaction(async (tx) => {
      const replyModel = (tx as any).supportReply;
      const requestModel = (tx as any).supportRequest;
      if (!replyModel || !requestModel) {
        throw new BadRequestException(
          'Support requests are not available. Run prisma generate and migrate to add SupportRequest.',
        );
      }
      await replyModel.create({
        data: {
          supportRequestId: id,
          adminUserId,
          message: body.message.trim(),
        },
      });

      return requestModel.update({
        where: { id },
        data: { status: nextStatus },
        include: {
          replies: {
            orderBy: { createdAt: 'desc' },
            include: { adminUser: true },
          },
        },
      });
    });

    try {
      await this.mailService.sendSupportReplyEmail(
        request.email,
        request.subject,
        body.message.trim(),
        request.message,
      );
    } catch (err) {
      console.error('[Support] Failed to send reply email:', err);
    }

    return this.toSupportRequestDto(updated);
  }

  async inviteAdminUser(dto: InviteAdminUserDto): Promise<{ message: string }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const name = dto.name?.trim();

    const allowedRoles = new Set(['SUPER_ADMIN', 'CONTENT_MANAGER', 'CUSTOMER_SUPPORT']);
    if (!allowedRoles.has(dto.role)) {
      throw new BadRequestException('Invalid role');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing?.passwordHash) {
      throw new BadRequestException('User already exists with a password.');
    }

    let userId = existing?.id;
    if (!existing) {
      const created = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name ?? null,
          role: dto.role,
        },
      });
      userId = created.id;
    } else {
      await this.prisma.user.update({
        where: { id: existing.id },
        data: { role: dto.role, name: name ?? existing.name },
      });
      userId = existing.id;
    }

    if (!userId) {
      throw new BadRequestException('Unable to invite user');
    }

    await this.authService.sendAdminInvite(normalizedEmail);
    return { message: 'Invitation sent successfully.' };
  }

  async updateAdminUserRole(id: string, role: string): Promise<AdminUserDto> {
    const allowedRoles = new Set(['SUPER_ADMIN', 'CONTENT_MANAGER', 'CUSTOMER_SUPPORT']);
    if (!allowedRoles.has(role)) {
      throw new BadRequestException('Invalid role');
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
    });
    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Revoke admin access: set user role to "user" so they lose admin portal access.
   * Caller cannot revoke their own access.
   */
  async revokeAdminAccess(userId: string, currentUserId: string): Promise<AdminUserDto> {
    if (userId === currentUserId) {
      throw new BadRequestException('You cannot remove your own admin access');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'user' },
    });
    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async getContentList(): Promise<AdminContentItemDto[]> {
    const contentItems = await (this.prisma as any).content.findMany({
      include: {
        category: true,
        seasons: { include: { _count: { select: { episodes: true } } } },
        episodes: true,
        trailer: { include: { episodes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const linkedTrailerIds = new Set(
      contentItems
        .map((content: any) => content.trailerId)
        .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0),
    );
    const visibleContentItems = contentItems.filter(
      (content: any) => content.type !== ContentType.TRAILER && !linkedTrailerIds.has(content.id),
    );
    return visibleContentItems.map((content: any) => toAdminContentItemDto(content, this.r2Service));
  }

  async getSubscriptions(page = 1, limit = 20): Promise<AdminSubscriptionsResponseDto> {
    const skip = (page - 1) * limit;
    const now = new Date();

    const [subscriptions, total, activeCount, cancelledCount, expiredCount, activeRevenueRows] =
      await Promise.all([
        this.prisma.subscription.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, email: true, name: true } },
            plan: { select: { id: true, name: true, price: true } },
          },
        }),
        this.prisma.subscription.count(),
        this.prisma.subscription.count({
          where: { status: 'ACTIVE', endDate: { gte: now } },
        }),
        this.prisma.subscription.count({ where: { status: 'CANCELLED' } }),
        this.prisma.subscription.count({ where: { status: 'EXPIRED' } }),
        this.prisma.subscription.findMany({
          where: { status: 'ACTIVE', endDate: { gte: now } },
          select: { plan: { select: { price: true } } },
        }),
      ]);

    const activeRevenue = activeRevenueRows.reduce((sum, row) => {
      const value = Number(row.plan.price);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    const items: AdminSubscriptionDto[] = subscriptions.map((sub) => ({
      id: sub.id,
      userId: sub.userId,
      userEmail: sub.user.email,
      userName: sub.user.name ?? undefined,
      planId: sub.plan.id,
      planName: sub.plan.name,
      planPrice: formatMoney(sub.plan.price),
      status: sub.status,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate.toISOString(),
      createdAt: sub.createdAt.toISOString(),
      stripeSubscriptionId: sub.stripeSubscriptionId ?? undefined,
    }));

    return {
      total,
      subscriptions: items,
      summary: {
        totalCount: total,
        activeCount,
        cancelledCount,
        expiredCount,
        activeRevenue: formatMoney(activeRevenue),
      },
    };
  }

  async getContentById(id: string): Promise<AdminContentItemDto | null> {
    const content = await (this.prisma as any).content.findUnique({
      where: { id },
      include: {
        category: true,
        seasons: { include: { _count: { select: { episodes: true } } } },
        episodes: true,
        trailer: { include: { episodes: true } },
      },
    });
    if (!content) return null;
    return toAdminContentItemDto(content, this.r2Service);
  }

  async getCategories(): Promise<AdminCategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return categories.map(toAdminCategoryDto);
  }

  private async resolveCategoryId(
    categoryId?: string,
    categoryName?: string,
  ): Promise<string | null> {
    const trimmedId = categoryId?.trim();
    if (trimmedId) return trimmedId;
    const name = categoryName?.trim();
    if (!name) return null;
    const slug = slugify(name) || 'uncategorized';
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) return existing.id;
    const created = await this.prisma.category.create({
      data: { name, slug },
    });
    return created.id;
  }

  async createCategory(dto: CreateAdminCategoryDto): Promise<AdminCategoryDto> {
    const name = dto.name.trim();
    const parentId = dto.parentId?.trim() || null;
    const slug = slugify(name);
    if (!slug) {
      throw new BadRequestException('Category name is required');
    }

    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) return toAdminCategoryDto(existing);

    const created = await this.prisma.category.create({
      data: { name, slug, parentId },
    });
    return toAdminCategoryDto(created);
  }

  async deleteCategory(id: string): Promise<void> {
    const usedCount = await (this.prisma as any).content.count({ where: { categoryId: id } });
    if (usedCount > 0) {
      throw new BadRequestException('Category has content and cannot be deleted');
    }
    const childCount = await this.prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new BadRequestException('Category has sub-categories and cannot be deleted');
    }
    await this.prisma.category.delete({ where: { id } });
  }

  async updateCategory(id: string, dto: UpdateAdminCategoryDto): Promise<AdminCategoryDto> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const data: { name?: string; slug?: string; parentId?: string | null } = {};

    if (typeof dto.name === 'string') {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('Category name cannot be empty');
      data.name = name;
      data.slug = slugify(name);
    }

    if (dto.parentId !== undefined) {
      const parentId = dto.parentId?.trim() || null;
      if (parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      if (parentId) {
        const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
        if (!parent) {
          throw new BadRequestException('Parent category not found');
        }
      }
      data.parentId = parentId;
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data,
    });
    return toAdminCategoryDto(updated);
  }
  async publishContent(id: string, isPublished: boolean): Promise<AdminContentItemDto | null> {
    const content = await (this.prisma as any).content.findUnique({
      where: { id },
      include: {
        category: true,
        seasons: { include: { _count: { select: { episodes: true } } } },
        episodes: true,
        trailer: { include: { episodes: true } },
      },
    });
    if (!content) return null;

    if (
      isPublished &&
      [ContentType.DOCUMENTARY, ContentType.SERIES].includes(content.type) &&
      !content.trailerId
    ) {
      throw new BadRequestException('Series and Documentary require a trailer before publishing');
    }

    const updated = await this.prisma.$transaction(async (tx: any) => {
      const next = await tx.content.update({
        where: { id },
        data: { isPublished },
        include: {
          category: true,
          seasons: { include: { _count: { select: { episodes: true } } } },
          episodes: true,
          trailer: { include: { episodes: true } },
        },
      });

      if (content.trailerId) {
        await tx.content.update({
          where: { id: content.trailerId },
          data: { isPublished },
        });
      }

      return next;
    });
    return toAdminContentItemDto(updated, this.r2Service);
  }

  async deleteContent(id: string): Promise<void> {
    const content = await (this.prisma as any).content.findUnique({
      where: { id },
      select: { id: true, trailerId: true },
    });
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    await this.prisma.$transaction(async (tx: any) => {
      await tx.content.delete({
        where: { id },
      });

      if (content.trailerId) {
        await tx.content.delete({
          where: { id: content.trailerId },
        });
      }
    });
  }

  async updateContent(id: string, dto: UpdateAdminContentDto): Promise<AdminContentItemDto | null> {
    const content = await (this.prisma as any).content.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!content) return null;

    const data: {
      title?: string;
      description?: string | null;
      type?: ContentType;
      thumbnailUrl?: string;
      posterUrl?: string | null;
      bannerUrl?: string | null;
      releaseYear?: number;
      ageRating?: string;
      duration?: number | null;
      categoryId?: string | null;
    } = {};

    if (typeof dto.title === 'string') {
      const title = dto.title.trim();
      if (!title) throw new BadRequestException('Title is required');
      data.title = title;
    }

    if (typeof dto.description === 'string') {
      const desc = dto.description.trim();
      data.description = desc ? desc : null;
    }

    if (typeof dto.type === 'string') {
      data.type = dto.type as ContentType;
    }

    const incomingThumbnailKey =
      typeof dto.thumbnailKey === 'string' ? dto.thumbnailKey.trim() : undefined;
    const incomingPosterKey = typeof dto.posterKey === 'string' ? dto.posterKey.trim() : undefined;
    const incomingBannerKey = typeof dto.bannerKey === 'string' ? dto.bannerKey.trim() : undefined;

    if (incomingThumbnailKey !== undefined) {
      data.thumbnailUrl = incomingThumbnailKey;
    }

    if (incomingPosterKey !== undefined) {
      data.posterUrl = incomingPosterKey || null;
    }

    if (incomingBannerKey !== undefined) {
      data.bannerUrl = incomingBannerKey || null;
    }

    const nextThumbnailKey = incomingThumbnailKey ?? content.thumbnailUrl;
    const nextPosterKey =
      incomingPosterKey !== undefined ? incomingPosterKey || null : (content.posterUrl ?? null);
    if (nextPosterKey && nextPosterKey === nextThumbnailKey) {
      throw new BadRequestException('Poster image must be different from thumbnail image');
    }

    if (typeof dto.releaseYear === 'number') {
      data.releaseYear = dto.releaseYear;
    }

    if (typeof dto.ageRating === 'string') {
      const rating = dto.ageRating.trim();
      if (!rating) throw new BadRequestException('Age rating is required');
      data.ageRating = rating;
    }

    if (typeof dto.duration === 'string') {
      const seconds = parseDurationToSeconds(dto.duration);
      if (seconds <= 0) {
        throw new BadRequestException('Invalid duration format');
      }
      data.duration = seconds;
    }

    if (typeof dto.categoryId === 'string' || typeof dto.category === 'string') {
      data.categoryId = await this.resolveCategoryId(dto.categoryId, dto.category);
    }

    const updated = await this.prisma.$transaction(async (tx: any) => {
      const mainUpdated = await tx.content.update({
        where: { id },
        data,
        include: {
          category: true,
          seasons: { include: { _count: { select: { episodes: true } } } },
          episodes: true,
          trailer: { include: { episodes: true } },
        },
      });

      if (content.trailerId) {
        const trailerData: any = {};
        if (data.thumbnailUrl) trailerData.thumbnailUrl = data.thumbnailUrl;
        if (data.posterUrl !== undefined) trailerData.posterUrl = data.posterUrl;
        if (data.bannerUrl !== undefined) trailerData.bannerUrl = data.bannerUrl;
        if (data.releaseYear !== undefined) trailerData.releaseYear = data.releaseYear;
        if (data.ageRating !== undefined) trailerData.ageRating = data.ageRating;

        if (Object.keys(trailerData).length > 0) {
          await tx.content.update({
            where: { id: content.trailerId },
            data: trailerData,
          });
        }
      }

      return mainUpdated;
    });

    return toAdminContentItemDto(updated, this.r2Service);
  }

  async createContent(dto: CreateAdminContentDto): Promise<AdminContentItemDto> {
    const title = dto.title.trim();
    if (!title) throw new BadRequestException('Title is required');

    const thumbnailUrl = dto.thumbnailKey.trim();
    if (!thumbnailUrl) throw new BadRequestException('Thumbnail is required');

    const posterKey = dto.posterKey?.trim() || null;
    if (posterKey && posterKey === thumbnailUrl) {
      throw new BadRequestException('Poster image must be different from thumbnail image');
    }

    const wantsEpisode = typeof dto.videoKey === 'string' && dto.videoKey.trim().length > 0;
    const shouldCreateEpisode = wantsEpisode;

    if (dto.type === ContentType.SERIES && wantsEpisode) {
      throw new BadRequestException('Episodes must be created separately for series content');
    }

    const seconds = dto.duration ? parseDurationToSeconds(dto.duration) : null;
    if (dto.duration && (!seconds || seconds <= 0)) {
      throw new BadRequestException('Invalid duration format');
    }
    if (shouldCreateEpisode && (!seconds || seconds <= 0)) {
      throw new BadRequestException('Duration is required when a video is uploaded');
    }

    const resolvedCategoryId = await this.resolveCategoryId(dto.categoryId, dto.category);

    const created = await this.prisma.$transaction(async (tx: any) => {
      const content = await tx.content.create({
        data: {
          title,
          description: dto.description?.trim() || null,
          type: dto.type,
          thumbnailUrl,
          posterUrl: posterKey,
          bannerUrl: dto.bannerKey?.trim() || null,
          releaseYear: dto.releaseYear,
          ageRating: dto.ageRating.trim(),
          duration: seconds ?? null,
          categoryId: resolvedCategoryId,
          isPublished: dto.isPublished ?? false,
        },
      });

      if (shouldCreateEpisode) {
        await tx.episode.create({
          data: {
            contentId: content.id,
            seasonId: null,
            episodeNumber: 1,
            title,
            description: dto.description?.trim() || null,
            duration: seconds ?? 0,
            videoUrl: dto.videoKey!.trim(),
            hlsUrl: dto.hlsKey?.trim() || null,
          },
        });
      }

      return content;
    });

    const full = await (this.prisma as any).content.findUnique({
      where: { id: created.id },
      include: { category: true, seasons: true, episodes: true },
    });
    if (!full) throw new BadRequestException('Failed to load created content');
    return toAdminContentItemDto(full, this.r2Service);
  }

  async createTrailer(
    parentContentId: string,
    dto: CreateAdminTrailerDto,
  ): Promise<AdminContentItemDto | null> {
    const parent = await (this.prisma as any).content.findUnique({
      where: { id: parentContentId },
      select: { id: true, categoryId: true, isPublished: true },
    });
    if (!parent) return null;

    const seconds = parseDurationToSeconds(dto.duration);
    if (seconds <= 0) {
      throw new BadRequestException('Invalid duration format');
    }

    const created = await this.prisma.$transaction(async (tx: any) => {
      const trailer = await tx.content.create({
        data: {
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          type: ContentType.TRAILER,
          thumbnailUrl: dto.thumbnailKey.trim(),
          posterUrl: dto.posterKey?.trim() || null,
          bannerUrl: dto.bannerKey?.trim() || null,
          releaseYear: dto.releaseYear,
          ageRating: dto.ageRating.trim(),
          duration: seconds,
          categoryId: parent.categoryId ?? null,
          isPublished: dto.isPublished ?? parent.isPublished,
        },
      });

      await tx.episode.create({
        data: {
          contentId: trailer.id,
          seasonId: null,
          episodeNumber: 1,
          title: trailer.title,
          description: trailer.description,
          duration: seconds,
          videoUrl: dto.videoKey.trim(),
          hlsUrl: dto.hlsKey?.trim() || null,
        },
      });

      await tx.content.update({
        where: { id: parentContentId },
        data: { trailerId: trailer.id },
      });

      return trailer;
    });

    const full = await (this.prisma as any).content.findUnique({
      where: { id: created.id },
      include: { category: true, seasons: true, episodes: true },
    });
    return full ? toAdminContentItemDto(full, this.r2Service) : null;
  }

  async createSeason(dto: CreateAdminSeasonDto) {
    const content = await (this.prisma as any).content.findUnique({
      where: { id: dto.contentId },
      select: { id: true, type: true },
    });
    if (!content) {
      throw new BadRequestException('Content not found');
    }
    if (
      ![ContentType.SERIES, ContentType.ANIMATION, ContentType.DOCUMENTARY].includes(content.type)
    ) {
      throw new BadRequestException(
        'Seasons are only supported for series, episodic animation, and documentary',
      );
    }

    const existing = await (this.prisma as any).season.findFirst({
      where: { contentId: dto.contentId, seasonNumber: dto.seasonNumber },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Season number already exists for this content');
    }
    return (this.prisma as any).season.create({
      data: {
        contentId: dto.contentId,
        seasonNumber: dto.seasonNumber,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
      },
    });
  }

  async createEpisode(dto: CreateAdminEpisodeDto) {
    const content = await (this.prisma as any).content.findUnique({
      where: { id: dto.contentId },
      select: { id: true, type: true },
    });
    if (!content) {
      throw new BadRequestException('Content not found');
    }

    const seasonId = dto.seasonId?.trim() || null;
    if (content.type === ContentType.SERIES && !seasonId) {
      throw new BadRequestException('Season is required for series episodes');
    }

    if (seasonId) {
      const season = await (this.prisma as any).season.findUnique({
        where: { id: seasonId },
        select: { id: true, contentId: true },
      });
      if (!season || season.contentId !== content.id) {
        throw new BadRequestException('Season does not belong to the content item');
      }
    }

    const strictSingleTypes = [ContentType.MOVIE, ContentType.SHORT];
    if (strictSingleTypes.includes(content.type) && seasonId) {
      throw new BadRequestException('Single-video content cannot be assigned to a season');
    }

    if (
      (strictSingleTypes.includes(content.type) ||
        content.type === ContentType.ANIMATION ||
        content.type === ContentType.DOCUMENTARY) &&
      !seasonId
    ) {
      if (dto.episodeNumber !== 1) {
        throw new BadRequestException('Single-video content must use episode number 1');
      }
      const existing = await (this.prisma as any).episode.findFirst({
        where: { contentId: dto.contentId },
        select: { id: true },
      });
      if (existing) {
        throw new BadRequestException('Single-video content already has an episode');
      }
    }

    const seconds = parseDurationToSeconds(dto.duration);
    if (seconds <= 0) {
      throw new BadRequestException('Invalid duration format');
    }

    const existing = await (this.prisma as any).episode.findFirst({
      where: {
        contentId: dto.contentId,
        seasonId,
        episodeNumber: dto.episodeNumber,
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Episode number already exists in this season');
    }

    return (this.prisma as any).episode.create({
      data: {
        contentId: dto.contentId,
        seasonId,
        episodeNumber: dto.episodeNumber,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        duration: seconds,
        videoUrl: dto.videoKey.trim(),
        hlsUrl: dto.hlsKey?.trim() || null,
        thumbnailUrl: dto.thumbnailKey?.trim() || null,
      },
    });
  }

  async updateSeason(id: string, dto: UpdateAdminSeasonDto) {
    const season = await (this.prisma as any).season.findUnique({
      where: { id },
    });
    if (!season) {
      throw new NotFoundException('Season not found');
    }

    const data: any = {};

    let nextSeasonNumber = season.seasonNumber;
    if (dto.seasonNumber !== undefined) {
      nextSeasonNumber = dto.seasonNumber;
      data.seasonNumber = nextSeasonNumber;
    }

    if (dto.seasonNumber !== undefined && nextSeasonNumber !== season.seasonNumber) {
      const existing = await (this.prisma as any).season.findFirst({
        where: { contentId: season.contentId, seasonNumber: nextSeasonNumber },
        select: { id: true },
      });
      if (existing) {
        throw new BadRequestException('Season number already exists for this content');
      }
    }

    if (typeof dto.title === 'string') {
      const title = dto.title.trim();
      if (!title) throw new BadRequestException('Title is required');
      data.title = title;
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    return (this.prisma as any).season.update({
      where: { id },
      data,
    });
  }

  async deleteSeason(id: string): Promise<{ success: boolean }> {
    const season = await (this.prisma as any).season.findUnique({
      where: { id },
    });
    if (!season) {
      throw new NotFoundException('Season not found');
    }

    await this.prisma.$transaction(async (tx: any) => {
      // Cascade-delete episodes of this season
      await tx.episode.deleteMany({
        where: { seasonId: id },
      });
      // Delete the season
      await tx.season.delete({
        where: { id },
      });
    });
    return { success: true };
  }

  async updateEpisode(id: string, dto: UpdateAdminEpisodeDto) {
    const episode = await (this.prisma as any).episode.findUnique({
      where: { id },
    });
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    const data: any = {};

    let resolvedSeasonId = episode.seasonId;
    if (dto.seasonId !== undefined) {
      if (dto.seasonId === null) {
        resolvedSeasonId = null;
      } else {
        const season = await (this.prisma as any).season.findUnique({
          where: { id: dto.seasonId },
        });
        if (!season || season.contentId !== episode.contentId) {
          throw new BadRequestException('Season does not belong to the content item');
        }
        resolvedSeasonId = dto.seasonId;
      }
      data.seasonId = resolvedSeasonId;
    }

    let nextEpisodeNumber = episode.episodeNumber;
    if (dto.episodeNumber !== undefined) {
      nextEpisodeNumber = dto.episodeNumber;
      data.episodeNumber = nextEpisodeNumber;
    }

    if (
      (dto.seasonId !== undefined || dto.episodeNumber !== undefined) &&
      (resolvedSeasonId !== episode.seasonId || nextEpisodeNumber !== episode.episodeNumber)
    ) {
      const existing = await (this.prisma as any).episode.findFirst({
        where: {
          contentId: episode.contentId,
          seasonId: resolvedSeasonId,
          episodeNumber: nextEpisodeNumber,
        },
        select: { id: true },
      });
      if (existing) {
        throw new BadRequestException('Episode number already exists in this season');
      }
    }

    if (typeof dto.title === 'string') {
      const title = dto.title.trim();
      if (!title) throw new BadRequestException('Title is required');
      data.title = title;
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    if (typeof dto.duration === 'string') {
      const seconds = parseDurationToSeconds(dto.duration);
      if (seconds <= 0) {
        throw new BadRequestException('Invalid duration format');
      }
      data.duration = seconds;
    }

    if (typeof dto.videoKey === 'string') {
      data.videoUrl = dto.videoKey.trim();
      // Reset HLS URL so transcoding starts fresh unless an hlsKey is explicitly supplied
      data.hlsUrl = dto.hlsKey !== undefined ? dto.hlsKey?.trim() || null : null;
    } else if (dto.hlsKey !== undefined) {
      data.hlsUrl = dto.hlsKey?.trim() || null;
    }

    if (dto.thumbnailKey !== undefined) {
      data.thumbnailUrl = dto.thumbnailKey?.trim() || null;
    }

    return (this.prisma as any).episode.update({
      where: { id },
      data,
    });
  }

  async deleteEpisode(id: string): Promise<{ success: boolean }> {
    const episode = await (this.prisma as any).episode.findUnique({
      where: { id },
    });
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    await (this.prisma as any).episode.delete({
      where: { id },
    });
    return { success: true };
  }

  async getPlans(): Promise<AdminPlanDto[]> {
    const now = new Date();
    const [plans, activeCounts] = await Promise.all([
      (this.prisma as any).plan.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.subscription.groupBy({
        by: ['planId'],
        where: { status: 'ACTIVE', endDate: { gte: now } },
        _count: { _all: true },
      }),
    ]);

    const activeCountMap = new Map<string, number>();
    for (const row of activeCounts) {
      activeCountMap.set(row.planId, row._count._all);
    }

    return plans.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      price: formatMoney(plan.price),
      yearlyPrice: plan.yearlyPrice != null ? formatMoney(plan.yearlyPrice) : undefined,
      deviceLimit: plan.deviceLimit,
      offlineAllowed: plan.offlineAllowed,
      maxOfflineDownloads: plan.maxOfflineDownloads,
      isPopular: plan.isPopular,
      perks: plan.perks ?? [],
      stripePriceId: plan.stripePriceId ?? undefined,
      yearlyStripePriceId: plan.yearlyStripePriceId ?? undefined,
      activeSubscribers: activeCountMap.get(plan.id) ?? 0,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    }));
  }

  async createPlan(dto: CreateAdminPlanDto): Promise<AdminPlanDto> {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Plan name is required');

    const parsedPrice = Number(dto.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      throw new BadRequestException('Monthly price must be a valid non-negative number');
    }

    let parsedYearlyPrice: number | null = null;
    if (dto.yearlyPrice !== undefined && dto.yearlyPrice.trim() !== '') {
      parsedYearlyPrice = Number(dto.yearlyPrice);
      if (!Number.isFinite(parsedYearlyPrice) || parsedYearlyPrice < 0) {
        throw new BadRequestException('Yearly price must be a valid non-negative number');
      }
    }

    const stripePriceId = dto.stripePriceId?.trim() || null;
    const yearlyStripePriceId = dto.yearlyStripePriceId?.trim() || null;
    const perks = this.normalizePerks(dto.perks);
    const isPopular = dto.isPopular === true;
    const plan = await this.prisma.$transaction(async (tx) => {
      if (isPopular) {
        await (tx as any).plan.updateMany({
          data: { isPopular: false },
          where: { isPopular: true },
        });
      }
      return (tx as any).plan.create({
        data: {
          name,
          price: parsedPrice,
          yearlyPrice: parsedYearlyPrice,
          duration: 'MONTHLY',
          deviceLimit: dto.deviceLimit,
          offlineAllowed: dto.offlineAllowed,
          maxOfflineDownloads: dto.maxOfflineDownloads,
          isPopular,
          perks,
          stripePriceId,
          yearlyStripePriceId,
        },
      });
    });

    return {
      id: plan.id,
      name: plan.name,
      price: formatMoney(plan.price),
      yearlyPrice: plan.yearlyPrice != null ? formatMoney(plan.yearlyPrice) : undefined,
      deviceLimit: plan.deviceLimit,
      offlineAllowed: plan.offlineAllowed,
      maxOfflineDownloads: plan.maxOfflineDownloads,
      isPopular: plan.isPopular,
      perks: plan.perks ?? [],
      stripePriceId: plan.stripePriceId ?? undefined,
      yearlyStripePriceId: plan.yearlyStripePriceId ?? undefined,
      activeSubscribers: 0,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }

  async updatePlan(planId: string, dto: UpdateAdminPlanDto): Promise<AdminPlanDto> {
    const data: Record<string, unknown> = {};

    if (typeof dto.name === 'string') {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('Plan name is required');
      data.name = name;
    }

    if (dto.price !== undefined) {
      const parsedPrice = Number(dto.price);
      if (!Number.isFinite(parsedPrice)) {
        throw new BadRequestException('Price must be a valid number');
      }
      data.price = parsedPrice;
    }

    if (dto.yearlyPrice !== undefined) {
      const val = dto.yearlyPrice.trim();
      if (val === '' || val === '0') {
        data.yearlyPrice = null;
      } else {
        const parsed = Number(val);
        if (!Number.isFinite(parsed) || parsed < 0) {
          throw new BadRequestException('Yearly price must be a valid non-negative number');
        }
        data.yearlyPrice = parsed;
      }
    }

    if (dto.deviceLimit !== undefined) {
      data.deviceLimit = dto.deviceLimit;
    }

    if (dto.offlineAllowed !== undefined) {
      data.offlineAllowed = dto.offlineAllowed;
    }

    if (dto.maxOfflineDownloads !== undefined) {
      data.maxOfflineDownloads = dto.maxOfflineDownloads;
    }

    if (dto.isPopular !== undefined) {
      data.isPopular = dto.isPopular;
    }

    if (dto.perks !== undefined) {
      data.perks = this.normalizePerks(dto.perks);
    }

    if (dto.stripePriceId !== undefined) {
      const value = dto.stripePriceId.trim();
      data.stripePriceId = value ? value : null;
    }

    if (dto.yearlyStripePriceId !== undefined) {
      const value = dto.yearlyStripePriceId.trim();
      data.yearlyStripePriceId = value ? value : null;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No plan fields provided');
    }

    const makePopular = dto.isPopular === true;
    const plan = makePopular
      ? await this.prisma.$transaction(async (tx) => {
        await (tx as any).plan.updateMany({
          data: { isPopular: false },
          where: { isPopular: true, id: { not: planId } },
        });
        return (tx as any).plan.update({
          where: { id: planId },
          data,
        });
      })
      : await (this.prisma as any).plan.update({
        where: { id: planId },
        data,
      });

    const now = new Date();
    const activeSubscribers = await this.prisma.subscription.count({
      where: { planId, status: 'ACTIVE', endDate: { gte: now } },
    });

    return {
      id: plan.id,
      name: plan.name,
      price: formatMoney(plan.price),
      yearlyPrice: plan.yearlyPrice != null ? formatMoney(plan.yearlyPrice) : undefined,
      deviceLimit: plan.deviceLimit,
      offlineAllowed: plan.offlineAllowed,
      maxOfflineDownloads: plan.maxOfflineDownloads,
      isPopular: plan.isPopular,
      perks: plan.perks ?? [],
      stripePriceId: plan.stripePriceId ?? undefined,
      yearlyStripePriceId: plan.yearlyStripePriceId ?? undefined,
      activeSubscribers,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }

  async deletePlan(planId: string): Promise<{ message: string }> {
    const activeCount = await this.prisma.subscription.count({
      where: { planId, status: 'ACTIVE', endDate: { gte: new Date() } },
    });
    if (activeCount > 0) {
      throw new BadRequestException('Cannot delete a plan with active subscribers.');
    }
    await (this.prisma as any).plan.delete({ where: { id: planId } });
    return { message: 'Plan deleted.' };
  }

  private normalizePerks(perks?: string[]): string[] {
    if (!perks) return [];
    const cleaned = perks.map((perk) => perk.trim()).filter((perk) => perk.length > 0);
    return Array.from(new Set(cleaned)).slice(0, 12);
  }

  async getUsersAnalytics(): Promise<AdminUsersAnalyticsDto> {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [totalUsers, newUsersLast30, recentUsers, activeUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: last7Days } },
        select: { createdAt: true },
      }),
      this.prisma.viewHistory
        .findMany({
          where: { watchedAt: { gte: last30Days } },
          select: { userId: true },
          distinct: ['userId'],
        })
        .then((rows) => rows.length),
    ]);

    const dayBuckets = new Map<string, number>();
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().slice(0, 10);
      dayBuckets.set(key, 0);
    }

    for (const user of recentUsers) {
      const key = user.createdAt.toISOString().slice(0, 10);
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
    }

    const dailyNewUsers = Array.from(dayBuckets.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      totalUsers,
      newUsersLast30Days: newUsersLast30,
      activeUsersLast30Days: activeUsers,
      dailyNewUsers,
    };
  }

  async getContentAnalytics(): Promise<AdminContentAnalyticsDto> {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const trailerLinkedRows = await (this.prisma as any).content.findMany({
      where: { trailerId: { not: null } },
      select: { trailerId: true },
    });
    const linkedTrailerIds = trailerLinkedRows
      .map((row: any) => row.trailerId)
      .filter((id: any): id is string => typeof id === 'string' && id.length > 0);

    const contentWhere = {
      type: { not: 'TRAILER' },
      ...(linkedTrailerIds.length > 0 ? { id: { notIn: linkedTrailerIds } } : {}),
    };

    const publishedWhere = {
      ...contentWhere,
      isPublished: true,
    };

    const [
      totalContent,
      publishedContent,
      totalEpisodes,
      totalViews,
      viewsLast30Days,
      contentRows,
      topViews,
      categories,
    ] = await Promise.all([
      (this.prisma as any).content.count({ where: contentWhere }),
      (this.prisma as any).content.count({ where: publishedWhere }),
      (this.prisma as any).episode.count({ where: { content: contentWhere } }),
      this.prisma.viewHistory.count(),
      this.prisma.viewHistory.count({ where: { watchedAt: { gte: last30Days } } }),
      (this.prisma as any).content.findMany({
        where: contentWhere,
        select: { categoryId: true },
      }),
      (this.prisma as any).viewHistory.groupBy({
        by: ['episodeId'],
        _count: { episodeId: true },
        orderBy: { _count: { episodeId: 'desc' } },
        take: 5,
      }),
      this.prisma.category.findMany({
        select: { id: true, name: true, parentId: true },
      }),
    ]);

    const categoryMap = new Map<string, { id: string; name: string; parentId: string | null }>();
    for (const cat of categories) {
      categoryMap.set(cat.id, cat);
    }

    const getRootCategory = (catId: string | null): { id: string; name: string } | null => {
      if (!catId) return null;
      let current = categoryMap.get(catId);
      if (!current) return null;
      let depth = 0;
      while (current.parentId && depth < 10) {
        const parent = categoryMap.get(current.parentId);
        if (!parent) break;
        current = parent;
        depth++;
      }
      return current;
    };

    const categoryCounts = new Map<string, number>();
    for (const row of contentRows) {
      const rootCat = row.categoryId ? getRootCategory(row.categoryId) : null;
      const name = rootCat?.name ?? 'Uncategorized';
      categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
    }
    const contentByCategory: CategoryCountDto[] = Array.from(categoryCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const topEpisodeIds = topViews.map((row: { episodeId: string }) => row.episodeId);
    const episodeTitles = await (this.prisma as any).episode.findMany({
      where: { id: { in: topEpisodeIds } },
      select: { id: true, title: true },
    });
    const titleMap = new Map(
      episodeTitles.map((episode: { id: string; title: string }) => [episode.id, episode.title]),
    );

    const topEpisodes: TopEpisodeDto[] = topViews.map(
      (row: { episodeId: string; _count?: { episodeId?: number } }) => ({
        episodeId: row.episodeId,
        title: titleMap.get(row.episodeId) ?? 'Untitled',
        views: row._count?.episodeId ?? 0,
      }),
    );

    return {
      totalContent,
      publishedContent,
      unpublishedContent: Math.max(0, totalContent - publishedContent),
      totalEpisodes,
      totalViews,
      viewsLast30Days,
      topEpisodes,
      contentByCategory,
    };
  }

  async getRevenueAnalytics(): Promise<AdminRevenueAnalyticsDto> {
    const now = new Date();
    const [activeSubs, cancelledCount, expiredCount] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { status: 'ACTIVE', endDate: { gte: now } },
        include: { plan: true },
      }),
      this.prisma.subscription.count({ where: { status: 'CANCELLED' } }),
      this.prisma.subscription.count({ where: { status: 'EXPIRED' } }),
    ]);

    const revenueByPlanMap = new Map<
      string,
      { planId: string; planName: string; activeCount: number; revenue: number }
    >();

    let activeRevenue = 0;
    for (const sub of activeSubs) {
      const price = Number(sub.plan.price);
      const numericPrice = Number.isFinite(price) ? price : 0;
      activeRevenue += numericPrice;
      const current = revenueByPlanMap.get(sub.planId) ?? {
        planId: sub.planId,
        planName: sub.plan.name,
        activeCount: 0,
        revenue: 0,
      };
      current.activeCount += 1;
      current.revenue += numericPrice;
      revenueByPlanMap.set(sub.planId, current);
    }

    return {
      activeRevenue: formatMoney(activeRevenue),
      activeSubscriptions: activeSubs.length,
      cancelledSubscriptions: cancelledCount,
      expiredSubscriptions: expiredCount,
      revenueByPlan: Array.from(revenueByPlanMap.values()).map((row) => ({
        planId: row.planId,
        planName: row.planName,
        activeCount: row.activeCount,
        revenue: formatMoney(row.revenue),
      })),
    };
  }

  async getSystemHealth(): Promise<AdminSystemHealthDto> {
    const checkedAt = new Date().toISOString();
    try {
      const trailerLinkedRows = await (this.prisma as any).content.findMany({
        where: { trailerId: { not: null } },
        select: { trailerId: true },
      });
      const linkedTrailerIds = trailerLinkedRows
        .map((row: any) => row.trailerId)
        .filter((id: any): id is string => typeof id === 'string' && id.length > 0);

      const contentWhere = {
        type: { not: 'TRAILER' },
        ...(linkedTrailerIds.length > 0 ? { id: { notIn: linkedTrailerIds } } : {}),
      };

      const [users, content, episodes, subscriptions, downloads] = await Promise.all([
        this.prisma.user.count(),
        (this.prisma as any).content.count({ where: contentWhere }),
        (this.prisma as any).episode.count({ where: { content: contentWhere } }),
        this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        this.prisma.download.count(),
      ]);
      return {
        ok: true,
        database: true,
        checkedAt,
        counts: { users, content, episodes, subscriptions, downloads },
      };
    } catch (error) {
      return {
        ok: false,
        database: false,
        checkedAt,
        counts: { users: 0, content: 0, episodes: 0, subscriptions: 0, downloads: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getSystemLogs(): Promise<AdminSystemLogDto[]> {
    const [users, contentItems, subscriptions] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, email: true, createdAt: true },
      }),
      (this.prisma as any).content.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, title: true, createdAt: true },
      }),
      this.prisma.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          user: { select: { email: true } },
          plan: { select: { name: true } },
        },
      }),
    ]);

    const logs: AdminSystemLogDto[] = [
      ...users.map((user: { id: string; email: string; createdAt: Date }) => ({
        id: `user-${user.id}`,
        type: 'user' as const,
        message: `User ${user.email} signed up.`,
        createdAt: user.createdAt.toISOString(),
      })),
      ...contentItems.map((content: { id: string; title: string; createdAt: Date }) => ({
        id: `content-${content.id}`,
        type: 'content' as const,
        message: `Content "${content.title}" created.`,
        createdAt: content.createdAt.toISOString(),
      })),
      ...subscriptions.map(
        (sub: {
          id: string;
          status: string;
          user: { email: string };
          plan: { name: string };
          createdAt: Date;
        }) => ({
          id: `subscription-${sub.id}`,
          type: 'subscription' as const,
          message: `Subscription ${sub.status} for ${sub.user.email} (${sub.plan.name}).`,
          createdAt: sub.createdAt.toISOString(),
        }),
      ),
    ];

    return logs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 20);
  }

  /**
   * Analytics for offline downloads: total downloads, active offline users, downloads per plan.
   */
  async getOfflineAnalytics(): Promise<OfflineAnalyticsDto> {
    const now = new Date();
    const db = this.prisma as any;

    const [totalOfflineDownloads, activeOfflineDownloads, activeOfflineUserIds, plansWithSubs] =
      await Promise.all([
        db.download.count(),
        db.download.count({
          where: {
            status: { in: ['AUTHORIZED', 'DOWNLOADED'] },
            expiresAt: { gt: now },
          },
        }),
        db.download
          .findMany({
            where: {
              status: { in: ['AUTHORIZED', 'DOWNLOADED'] },
              expiresAt: { gt: now },
            },
            select: { userId: true },
            distinct: ['userId'],
          })
          .then((rows: { userId: string }[]) => rows.map((r) => r.userId)),
        db.plan.findMany({
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
      ]);

    const activeOfflineUsers = activeOfflineUserIds.length;

    const downloadsPerPlan: DownloadsPerPlanDto[] = await Promise.all(
      plansWithSubs.map(async (plan: { id: string; name: string }) => {
        const userIdsWithThisPlan = await db.subscription
          .findMany({
            where: {
              planId: plan.id,
              status: 'ACTIVE',
              endDate: { gte: now },
            },
            select: { userId: true },
            distinct: ['userId'],
          })
          .then((rows: { userId: string }[]) => rows.map((r) => r.userId));

        const activeSubscriptionCount = userIdsWithThisPlan.length;

        const downloadCount =
          userIdsWithThisPlan.length === 0
            ? 0
            : await db.download.count({
              where: {
                userId: { in: userIdsWithThisPlan },
                status: { in: ['AUTHORIZED', 'DOWNLOADED'] },
                expiresAt: { gt: now },
              },
            });

        return {
          planId: plan.id,
          planName: plan.name,
          downloadCount,
          activeSubscriptionCount,
        };
      }),
    );

    return {
      totalOfflineDownloads,
      activeOfflineDownloads,
      activeOfflineUsers,
      downloadsPerPlan,
    };
  }

  private toSupportRequestDto(request: any): SupportRequestDto {
    return {
      id: request.id,
      name: request.name,
      email: request.email,
      subject: request.subject,
      message: request.message,
      status: request.status,
      priority: request.priority,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
      replies: (request.replies ?? []).map(
        (reply: any): SupportReplyDto => ({
          id: reply.id,
          message: reply.message,
          adminUserId: reply.adminUserId ?? null,
          adminName: reply.adminUser?.name ?? null,
          createdAt: reply.createdAt.toISOString(),
        }),
      ),
    };
  }

  private getSupportRequestModel(): {
    count: Function;
    findMany: Function;
    update: Function;
    findUnique: Function;
  } {
    const model = (this.prisma as any).supportRequest;
    if (!model) {
      throw new BadRequestException(
        'Support requests are not available. Run prisma generate and migrate to add SupportRequest.',
      );
    }
    return model;
  }
}
