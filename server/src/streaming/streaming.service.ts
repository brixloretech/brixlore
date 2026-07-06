import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from '../storage/r2.service';
import type { ContinueWatchingItemDto } from './dto/continue-watching-item.dto';

type CloudflareStreamConfig = {
  accountId: string;
  customerSubdomain: string;
  apiToken: string;
};

type CloudflareDirectUploadResult = {
  uploadURL: string;
  uid: string;
};

function inferPlaybackType(
  hlsUrl: string | null | undefined,
  videoUrl: string | null | undefined,
): 'hls' | 'mp4' | undefined {
  const candidate = hlsUrl?.trim() || videoUrl?.trim();
  if (!candidate) return undefined;
  const normalized = candidate.toLowerCase();
  if (/\.m3u8(\?|$)/.test(normalized)) return 'hls';
  if (/\.mp4(\?|$)/.test(normalized)) return 'mp4';
  return undefined;
}

@Injectable()
export class StreamingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2Service: R2Service,
  ) {}

  getCloudflareStreamStatus(): {
    configured: boolean;
    accountId: string | null;
    customerSubdomain: string | null;
  } {
    const accountId = process.env.CLOUDFLARE_STREAM_ACCOUNT_ID?.trim() || null;
    const customerSubdomain =
      process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN?.trim() || null;
    const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN?.trim() || null;

    return {
      configured: Boolean(accountId && customerSubdomain && apiToken),
      accountId,
      customerSubdomain,
    };
  }

  async createCloudflareDirectUploadUrl(
    createdByUserId: string | undefined,
    uploadLength: number,
    filename?: string,
  ): Promise<{
    uploadUrl: string;
    uid: string;
  }> {
    const config = this.getCloudflareStreamConfig();

    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/stream?direct_user=true`;

    const meta: string[] = [];
    meta.push(`maxDurationSeconds ${Buffer.from('36000').toString('base64')}`);
    meta.push(`source ${Buffer.from('brixlore').toString('base64')}`);
    if (createdByUserId) {
      meta.push(`createdByUserId ${Buffer.from(createdByUserId).toString('base64')}`);
    }
    if (filename) {
      meta.push(`name ${Buffer.from(filename).toString('base64')}`);
    }
    const uploadMetadata = meta.join(',');

    try {
      const response = await axios.post(endpoint, null, {
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          'Tus-Resumable': '1.0.0',
          'Upload-Length': uploadLength.toString(),
          'Upload-Metadata': uploadMetadata,
        },
        timeout: 15_000,
      });

      const uploadUrl = response.headers['location'];
      const uid = response.headers['stream-media-id'];

      if (!uploadUrl || !uid) {
        throw new InternalServerErrorException(
          'Cloudflare Stream direct upload response is missing required headers (Location or stream-media-id)',
        );
      }

      return {
        uploadUrl,
        uid,
      };
    } catch (error: any) {
      if (error.response) {
        console.error('Cloudflare Stream direct-upload init failed:', {
          status: error.response.status,
          data: error.response.data,
        });
        throw new InternalServerErrorException(
          `Cloudflare Stream direct-upload init failed: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }

  /** Create or refresh view history when user starts an episode (upsert by user+episode). */
  async recordEpisodeView(userId: string, episodeId: string): Promise<void> {
    const existing = await (this.prisma as any).viewHistory.findFirst({
      where: { userId, episodeId },
    });
    if (existing) {
      await (this.prisma as any).viewHistory.update({
        where: { id: existing.id },
        data: { watchedAt: new Date() },
      });
    } else {
      await (this.prisma as any).viewHistory.create({
        data: {
          userId,
          episodeId,
          progress: 0,
          completed: false,
        },
      });
    }
  }

  /** Return playback metadata for an authenticated user.
   * Access limits (free/guest/paid) are enforced by client flow and related APIs,
   * while this endpoint only validates content availability and records view history.
   */
  async getPlaybackMetadata(
    episodeId: string,
    userId: string,
  ): Promise<{ streamKey: string; type?: 'hls' | 'mp4'; progress?: number }> {
    const { streamKey, type } = await this.resolvePlaybackSource(episodeId);
    const existing = await (this.prisma as any).viewHistory.findFirst({
      where: { userId, episodeId },
    });
    await this.recordEpisodeView(userId, episodeId);

    return {
      streamKey,
      type,
      progress: existing ? existing.progress : 0,
    };
  }

  /** Return playback metadata for a guest user (no auth/subscription checks). */
  async getGuestPlaybackMetadata(
    episodeId: string,
  ): Promise<{ streamKey: string; type?: 'hls' | 'mp4' }> {
    const { streamKey, type } = await this.resolvePlaybackSource(episodeId);
    return { streamKey, type };
  }

  private async resolvePlaybackSource(
    episodeId: string,
  ): Promise<{ streamKey: string; type?: 'hls' | 'mp4' }> {
    const episode = await (this.prisma as any).episode.findUnique({
      where: { id: episodeId },
      select: {
        videoUrl: true,
        hlsUrl: true,
        content: { select: { isPublished: true } },
      },
    });
    if (!episode) throw new NotFoundException('Episode not found');
    if (!episode.videoUrl && !episode.hlsUrl) {
      throw new NotFoundException('Episode is not available for streaming');
    }
    if (!episode.content.isPublished) {
      throw new ForbiddenException('Content is not yet published');
    }

    const rawStreamKey = episode.hlsUrl?.trim() || episode.videoUrl?.trim();
    const streamKey = this.resolveStreamPlaybackUrl(rawStreamKey);
    if (!streamKey) {
      throw new NotFoundException('Episode is not available for streaming');
    }
    const type = inferPlaybackType(episode.hlsUrl, episode.videoUrl);
    const normalizedType = type ?? (this.isUrl(rawStreamKey) ? undefined : 'hls');
    return { streamKey, type: normalizedType };
  }

  private resolveStreamPlaybackUrl(streamKey: string | null | undefined): string | null {
    if (!streamKey) return null;
    if (this.isUrl(streamKey)) return streamKey;

    const status = this.getCloudflareStreamStatus();
    if (!status.customerSubdomain) {
      throw new InternalServerErrorException(
        'Cloudflare Stream customer subdomain is not configured. Set CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN.',
      );
    }

    const uid = streamKey.trim();
    if (!uid) return null;
    return `https://${status.customerSubdomain}/${uid}/manifest/video.m3u8`;
  }

  /** Check Cloudflare Stream processing status for a given UID. */
  async getCloudflareVideoStatus(
    uid: string,
  ): Promise<{ uid: string; status: string; readyToStream: boolean }> {
    const config = this.getCloudflareStreamConfig();
    const trimmedUid = uid.trim();
    if (!trimmedUid) {
      throw new InternalServerErrorException('UID is required');
    }

    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/stream/${trimmedUid}`,
      {
        headers: { Authorization: `Bearer ${config.apiToken}` },
        timeout: 10_000,
      },
    );

    const result = response.data?.result;
    return {
      uid: trimmedUid,
      status: result?.status?.state ?? 'unknown',
      readyToStream: result?.readyToStream === true,
    };
  }

  private isUrl(value: string | null | undefined): boolean {
    if (!value) return false;
    return /^https?:\/\//i.test(value.trim());
  }

  private getCloudflareStreamConfig(): CloudflareStreamConfig {
    const accountId = process.env.CLOUDFLARE_STREAM_ACCOUNT_ID?.trim();
    const customerSubdomain = process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN?.trim();
    const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN?.trim();

    if (!accountId || !customerSubdomain || !apiToken) {
      throw new InternalServerErrorException(
        'Cloudflare Stream is not configured. Set CLOUDFLARE_STREAM_ACCOUNT_ID, CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN, and CLOUDFLARE_STREAM_API_TOKEN.',
      );
    }

    return { accountId, customerSubdomain, apiToken };
  }

  /** Update watch progress for an episode (called by client on pause/interval). */
  async updateViewProgress(
    userId: string,
    episodeId: string,
    progressSeconds: number,
    episodeDurationSeconds?: number,
  ): Promise<void> {
    const existing = await (this.prisma as any).viewHistory.findFirst({
      where: { userId, episodeId },
    });
    const completed =
      episodeDurationSeconds != null &&
      episodeDurationSeconds > 0 &&
      progressSeconds >= Math.floor(episodeDurationSeconds * 0.9);
    if (existing) {
      await (this.prisma as any).viewHistory.update({
        where: { id: existing.id },
        data: {
          progress: Math.max(0, Math.floor(progressSeconds)),
          watchedAt: new Date(),
          completed: existing.completed || completed,
        },
      });
    } else {
      await (this.prisma as any).viewHistory.create({
        data: {
          userId,
          episodeId,
          progress: Math.max(0, Math.floor(progressSeconds)),
          completed,
        },
      });
    }
  }

  /** Remove an episode from the user's continue-watching list. */
  async removeFromContinueWatching(userId: string, episodeId: string): Promise<void> {
    await (this.prisma as any).viewHistory.deleteMany({
      where: { userId, episodeId },
    });
  }

  /** Return in-progress view history for continue watching (completed = false, ordered by watchedAt desc). */
  async getContinueWatching(userId: string): Promise<ContinueWatchingItemDto[]> {
    const limit = 5;
    const rows = await (this.prisma as any).viewHistory.findMany({
      where: { userId, completed: false },
      orderBy: { watchedAt: 'desc' },
      take: limit,
      select: {
        progress: true,
        watchedAt: true,
        episode: {
          select: {
            id: true,
            title: true,
            duration: true,
            content: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                type: true,
              },
            },
          },
        },
      },
    });

    const dtos: ContinueWatchingItemDto[] = [];
    for (const row of rows) {
      const ep = row.episode;
      if (!ep?.content) continue;
      const content = ep.content;
      const thumbnailUrl = await this.resolveThumbnailUrl(content.thumbnailUrl);
      dtos.push({
        contentId: content.id,
        episodeId: ep.id,
        contentTitle: content.title,
        episodeTitle: ep.title,
        progress: Number(row.progress ?? 0),
        duration: Number(ep.duration ?? 0),
        thumbnailUrl,
        type: content.type,
        watchedAt: row.watchedAt?.toISOString?.() ?? new Date().toISOString(),
      });
    }
    return dtos;
  }

  /** Return all view history for the user (both completed and in-progress, ordered by watchedAt desc). */
  async getWatchHistory(userId: string): Promise<any[]> {
    const rows = await (this.prisma as any).viewHistory.findMany({
      where: { userId },
      orderBy: { watchedAt: 'desc' },
      select: {
        progress: true,
        watchedAt: true,
        completed: true,
        episode: {
          select: {
            id: true,
            title: true,
            duration: true,
            content: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                type: true,
              },
            },
          },
        },
      },
    });

    const dtos: any[] = [];
    for (const row of rows) {
      const ep = row.episode;
      if (!ep?.content) continue;
      const content = ep.content;
      const thumbnailUrl = await this.resolveThumbnailUrl(content.thumbnailUrl);
      dtos.push({
        contentId: content.id,
        episodeId: ep.id,
        contentTitle: content.title,
        episodeTitle: ep.title,
        progress: Number(row.progress ?? 0),
        duration: Number(ep.duration ?? 0),
        thumbnailUrl,
        type: content.type,
        completed: Boolean(row.completed),
        watchedAt: row.watchedAt?.toISOString?.() ?? new Date().toISOString(),
      });
    }
    return dtos;
  }

  private async resolveThumbnailUrl(value: string | null): Promise<string | null> {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    const publicUrl = this.r2Service.getPublicUrl(value);
    if (publicUrl) return publicUrl;
    try {
      return await this.r2Service.getSignedGetUrl(value);
    } catch {
      return null;
    }
  }
}
