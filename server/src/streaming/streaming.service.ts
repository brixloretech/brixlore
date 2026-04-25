import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from '../storage/r2.service';
import type { ContinueWatchingItemDto } from './dto/continue-watching-item.dto';

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
  ): Promise<{ streamKey: string; type?: 'hls' | 'mp4' }> {
    const { streamKey, type } = await this.resolvePlaybackSource(episodeId);
    await this.recordEpisodeView(userId, episodeId);

    return { streamKey, type };
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

    const streamKey = episode.hlsUrl?.trim() || episode.videoUrl?.trim();
    if (!streamKey) {
      throw new NotFoundException('Episode is not available for streaming');
    }
    const type = inferPlaybackType(episode.hlsUrl, episode.videoUrl);
    return { streamKey, type };
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
