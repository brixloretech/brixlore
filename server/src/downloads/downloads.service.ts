import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from '../storage/r2.service';

const DEFAULT_DOWNLOAD_EXPIRES_DAYS = 30;
const DEFAULT_DOWNLOAD_TOKEN_EXPIRES_SEC = 60 * 60; // 1 hour – token to initiate fetch

export interface DownloadTokenPayload {
  userId: string;
  deviceId: string;
  episodeId: string;
  exp: number;
}

@Injectable()
export class DownloadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2Service: R2Service,
  ) {}

  private getDownloadTokenSecret(): string {
    const secret =
      process.env.DOWNLOAD_TOKEN_SECRET ??
      process.env.STREAMING_SIGNATURE_SECRET ??
      process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new BadRequestException(
        'Download token signing not configured (DOWNLOAD_TOKEN_SECRET or JWT_ACCESS_SECRET)',
      );
    }
    return secret;
  }

  private base64UrlEncode(buf: Buffer): string {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private base64UrlDecode(str: string): Buffer {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    return Buffer.from(padded, 'base64');
  }

  /**
   * Get user's active subscription with plan (for offline checks).
   */
  private async getActiveSubscriptionWithPlan(userId: string) {
    const now = new Date();
    return (this.prisma as any).subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: now },
      },
      include: { plan: true },
      orderBy: { endDate: 'desc' },
    });
  }

  /**
   * Authorize an offline download. Validates:
   * - active subscription
   * - plan.offlineAllowed
   * - device belongs to user (device limit enforced at registration)
   * - user's active offline downloads count < plan.maxOfflineDownloads
   * Creates a Download record with status AUTHORIZED and expiry date.
   */
  async authorizeDownload(userId: string, episodeId: string, deviceId: string) {
    const subscription = await this.getActiveSubscriptionWithPlan(userId);
    if (!subscription?.plan) {
      throw new ForbiddenException('Active subscription required to authorize offline downloads.');
    }

    const plan = subscription.plan;
    if (!plan.offlineAllowed) {
      throw new ForbiddenException(
        'Your plan does not allow offline downloads. Upgrade to a plan with offline access.',
      );
    }

    const device = await (this.prisma as any).device.findFirst({
      where: { id: deviceId, userId },
    });
    if (!device) {
      throw new NotFoundException(
        'Device not found or does not belong to you. Register the device first.',
      );
    }

    const deviceCount = await (this.prisma as any).device.count({
      where: { userId },
    });
    if (deviceCount > plan.deviceLimit) {
      throw new ForbiddenException(
        `Device limit (${plan.deviceLimit}) exceeded. Remove a device to authorize downloads.`,
      );
    }

    const activeDownloadCount = await (this.prisma as any).download.count({
      where: {
        userId,
        status: { in: ['AUTHORIZED', 'DOWNLOADED'] },
        expiresAt: { gt: new Date() },
      },
    });
    if (activeDownloadCount >= plan.maxOfflineDownloads) {
      throw new ForbiddenException(
        `Offline download limit (${plan.maxOfflineDownloads}) reached. Remove an existing download to authorize a new one.`,
      );
    }

    const episode = await (this.prisma as any).episode.findUnique({
      where: { id: episodeId },
      select: { id: true, content: { select: { isPublished: true } } },
    });
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }
    if (!episode.content.isPublished) {
      throw new ForbiddenException('Content is not yet available for download');
    }

    const existing = await (this.prisma as any).download.findFirst({
      where: {
        userId,
        episodeId,
        deviceId,
        status: { in: ['AUTHORIZED', 'DOWNLOADED'] },
        expiresAt: { gt: new Date() },
      },
    });
    if (existing) {
      return existing;
    }

    const expiresDays = Number(process.env.DOWNLOAD_EXPIRES_DAYS) || DEFAULT_DOWNLOAD_EXPIRES_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    const download = await (this.prisma as any).download.create({
      data: {
        userId,
        episodeId,
        deviceId,
        status: 'AUTHORIZED',
        expiresAt,
      },
    });

    return download;
  }

  /**
   * Create a time-limited signed download token tied to user, device, and episode.
   * Caller must ensure the Download is already authorized (e.g. via authorizeDownload).
   */
  createDownloadToken(
    userId: string,
    deviceId: string,
    episodeId: string,
    expiresInSeconds: number = DEFAULT_DOWNLOAD_TOKEN_EXPIRES_SEC,
  ): { token: string; expiresAt: Date } {
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload: DownloadTokenPayload = { userId, deviceId, episodeId, exp };
    const payloadJson = JSON.stringify(payload);
    const payloadB64 = this.base64UrlEncode(Buffer.from(payloadJson, 'utf8'));
    const secret = this.getDownloadTokenSecret();
    const signature = createHmac('sha256', secret).update(payloadJson).digest();
    const sigB64 = this.base64UrlEncode(signature);
    const token = `${payloadB64}.${sigB64}`;
    return { token, expiresAt: new Date(exp * 1000) };
  }

  /**
   * Verify download token; returns payload if valid and not expired, else null.
   */
  verifyDownloadToken(token: string): DownloadTokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;
      const [payloadB64, sigB64] = parts;
      const payloadJson = this.base64UrlDecode(payloadB64).toString('utf8');
      const payload = JSON.parse(payloadJson) as DownloadTokenPayload;
      if (payload.exp < Math.floor(Date.now() / 1000)) return null;
      const secret = this.getDownloadTokenSecret();
      const expectedSig = createHmac('sha256', secret).update(payloadJson).digest();
      const actualSig = this.base64UrlDecode(sigB64);
      if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Verify download token and ensure it is bound to the given device.
   * Returns payload only if token is valid and payload.deviceId matches; otherwise null.
   * Use this when redeeming a token so tokens cannot be reused on a different device.
   */
  verifyDownloadTokenForDevice(token: string, deviceId: string): DownloadTokenPayload | null {
    const payload = this.verifyDownloadToken(token);
    if (!payload) return null;
    if (payload.deviceId !== deviceId) return null;
    return payload;
  }

  /**
   * Ensure an active Download exists for user+episode+device; return it or null.
   */
  async getActiveDownload(
    userId: string,
    episodeId: string,
    deviceId: string,
  ): Promise<{ id: string; expiresAt: Date } | null> {
    const download = await (this.prisma as any).download.findFirst({
      where: {
        userId,
        episodeId,
        deviceId,
        status: { in: ['AUTHORIZED', 'DOWNLOADED'] },
        expiresAt: { gt: new Date() },
      },
      select: { id: true, expiresAt: true },
    });
    return download ?? null;
  }

  /**
   * Generate a secure download token for an offline episode. Ensures authorization
   * (creates Download if needed), then returns a time-limited token and expiry metadata.
   */
  async getDownloadToken(
    userId: string,
    episodeId: string,
    deviceId: string,
  ): Promise<{ token: string; expiresAt: Date; downloadExpiresAt: Date }> {
    const downloadRecord = await this.authorizeDownload(userId, episodeId, deviceId);

    const expiresInSec =
      typeof process.env.DOWNLOAD_TOKEN_EXPIRES === 'string'
        ? this.parseTokenExpiresToSeconds(process.env.DOWNLOAD_TOKEN_EXPIRES)
        : Number(process.env.DOWNLOAD_TOKEN_EXPIRES) || DEFAULT_DOWNLOAD_TOKEN_EXPIRES_SEC;

    const { token, expiresAt } = this.createDownloadToken(
      userId,
      deviceId,
      episodeId,
      expiresInSec,
    );

    return {
      token,
      expiresAt,
      downloadExpiresAt: downloadRecord.expiresAt,
    };
  }

  private parseTokenExpiresToSeconds(exp: string): number {
    const match = exp.match(/^(\d+)([smhd])?$/);
    if (!match) return DEFAULT_DOWNLOAD_TOKEN_EXPIRES_SEC;
    const n = parseInt(match[1], 10);
    const unit = match[2] ?? 's';
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };
    return n * (multipliers[unit] ?? 1);
  }

  /**
   * Sync download status: return all downloads for the user (optionally filtered by device).
   * Includes episode and device so the app can sync local state.
   */
  async listDownloadsForSync(userId: string, deviceId?: string) {
    const where: Record<string, unknown> = { userId };
    if (deviceId?.trim()) where.deviceId = deviceId.trim();

    const rows = await (this.prisma as any).download.findMany({
      where,
      include: {
        episode: {
          select: {
            id: true,
            title: true,
            duration: true,
            content: { select: { thumbnailUrl: true } },
          },
        },
        device: { select: { id: true, platform: true, deviceIdentifier: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.attachSignedThumbnails(rows);
  }

  /**
   * Fetch active offline downloads: AUTHORIZED or DOWNLOADED with expiresAt > now.
   * Optionally filter by deviceId.
   */
  async listActiveDownloads(userId: string, deviceId?: string) {
    const now = new Date();
    const where: Record<string, unknown> = {
      userId,
      status: { in: ['AUTHORIZED', 'DOWNLOADED'] },
      expiresAt: { gt: now },
    };
    if (deviceId?.trim()) where.deviceId = deviceId.trim();

    const rows = await (this.prisma as any).download.findMany({
      where,
      include: {
        episode: {
          select: {
            id: true,
            title: true,
            duration: true,
            content: { select: { thumbnailUrl: true } },
          },
        },
        device: { select: { id: true, platform: true, deviceIdentifier: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.attachSignedThumbnails(rows);
  }

  /**
   * Redeem a download token to get the episode stream URL. Enforces device-binding:
   * token must be valid and payload.deviceId must match the provided deviceId;
   * device must belong to the user; an active Download must exist.
   * Ensures tokens cannot be reused on a different device.
   */
  async redeemDownloadToken(
    userId: string,
    token: string,
    deviceId: string,
  ): Promise<{ downloadUrl: string }> {
    const payload = this.verifyDownloadTokenForDevice(token, deviceId);
    if (!payload) {
      throw new ForbiddenException(
        'Invalid or expired download token, or token is not valid for this device.',
      );
    }
    if (payload.userId !== userId) {
      throw new ForbiddenException('Download token does not belong to this user.');
    }

    const device = await (this.prisma as any).device.findFirst({
      where: { id: deviceId, userId },
    });
    if (!device) {
      throw new ForbiddenException('Device not found or does not belong to you.');
    }

    const download = await (this.prisma as any).download.findFirst({
      where: {
        userId,
        episodeId: payload.episodeId,
        deviceId,
        status: { in: ['AUTHORIZED', 'DOWNLOADED'] },
        expiresAt: { gt: new Date() },
      },
    });
    if (!download) {
      throw new ForbiddenException(
        'No active download authorization for this episode on this device.',
      );
    }

    const episode = await (this.prisma as any).episode.findUnique({
      where: { id: payload.episodeId },
      select: { videoUrl: true, content: { select: { isPublished: true } } },
    });
    if (!episode?.videoUrl) {
      throw new NotFoundException('Episode not found or not available for download');
    }
    if (!episode.content.isPublished) {
      throw new ForbiddenException('Content is not yet available');
    }

    if (/^https?:\/\//i.test(episode.videoUrl)) {
      return { downloadUrl: episode.videoUrl };
    }
    const signed = await this.r2Service.getSignedGetUrl(episode.videoUrl);
    return { downloadUrl: signed };
  }

  private async attachSignedThumbnails(rows: any[]) {
    return Promise.all(
      rows.map(async (row) => {
        const thumb = row?.episode?.content?.thumbnailUrl;
        if (!thumb || /^https?:\/\//i.test(thumb)) return row;
        const publicUrl = this.r2Service.getPublicUrl(thumb);
        const signedUrl = publicUrl ?? (await this.r2Service.getSignedGetUrl(thumb));
        return {
          ...row,
          episode: {
            ...row.episode,
            content: {
              ...row.episode.content,
              thumbnailUrl: signedUrl,
            },
          },
        };
      }),
    );
  }

  /**
   * Notify backend that download has completed. Updates status from AUTHORIZED to DOWNLOADED.
   * Only the owning user can complete; download must be AUTHORIZED and not expired.
   */
  async markDownloadComplete(userId: string, downloadId: string) {
    const download = await (this.prisma as any).download.findFirst({
      where: { id: downloadId, userId },
    });
    if (!download) {
      throw new NotFoundException('Download not found');
    }
    if (download.status !== 'AUTHORIZED') {
      throw new ForbiddenException(
        `Download cannot be marked complete (current status: ${download.status})`,
      );
    }
    if (download.expiresAt < new Date()) {
      throw new ForbiddenException('Download has expired');
    }

    return (this.prisma as any).download.update({
      where: { id: downloadId },
      data: { status: 'DOWNLOADED' },
      include: {
        episode: { select: { id: true, title: true } },
        device: { select: { id: true, platform: true } },
      },
    });
  }
}
