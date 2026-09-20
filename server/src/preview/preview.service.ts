import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StreamingService } from '../streaming/streaming.service';
import { NotFoundException } from '@nestjs/common';

export const GUEST_PREVIEW_LIMIT = 3;
export const GUEST_PREVIEW_SECONDS = 45;

@Injectable()
export class PreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly streamingService: StreamingService,
  ) {}

  private identityHash(ip: string, deviceFingerprint: string): string {
    const secret = process.env.PREVIEW_IDENTITY_SECRET || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-preview-secret';
    return createHmac('sha256', secret)
      .update(`${ip.trim()}|${deviceFingerprint.trim()}`)
      .digest('hex');
  }

  async startGuestPreview(episodeId: string, ip: string, deviceFingerprint: string) {
    const identityHash = this.identityHash(ip, deviceFingerprint);
    const viewer = await this.prisma.previewViewer.upsert({
      where: { identityHash },
      create: { identityHash },
      update: {},
    });

    const used = await this.prisma.previewSession.count({
      where: { viewerId: viewer.id },
    });
    if (used >= GUEST_PREVIEW_LIMIT) {
      return {
        allowed: false,
        previewsUsed: used,
        previewsRemaining: 0,
      };
    }

    const playback = await this.streamingService.getGuestPlaybackMetadata(episodeId);
    const session = await this.prisma.previewSession.create({
      data: {
        viewerId: viewer.id,
        episodeId,
        previewNumber: used + 1,
      },
    });
    return {
      allowed: true,
      sessionId: session.id,
      previewsUsed: used + 1,
      previewsRemaining: GUEST_PREVIEW_LIMIT - used - 1,
      maxSeconds: GUEST_PREVIEW_SECONDS,
      ...playback,
    };
  }

  async completeGuestPreview(
    sessionId: string,
    ip: string,
    deviceFingerprint: string,
    watchedSeconds: number,
  ) {
    const identityHash = this.identityHash(ip, deviceFingerprint);
    const session = await this.prisma.previewSession.findFirst({
      where: { id: sessionId, viewer: { identityHash } },
    });
    if (!session) return { ok: false };

    await this.prisma.previewSession.update({
      where: { id: session.id },
      data: {
        watchedSeconds: Math.min(GUEST_PREVIEW_SECONDS, Math.max(session.watchedSeconds, watchedSeconds)),
        completedAt: new Date(),
      },
    });
    return { ok: true };
  }

  async startFreePreview(userId: string, episodeId: string) {
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      select: { content: { select: { isPublished: true, isFreeCatalog: true } } },
    });
    if (!episode?.content?.isPublished) throw new NotFoundException('Episode not found');
    if (episode.content.isFreeCatalog) {
      return {
        allowed: true,
        freeCatalog: true,
        remainingSeconds: 180,
        ...(await this.streamingService.getGuestPlaybackMetadata(episodeId)),
      };
    }
    const allowance = await this.prisma.previewAllowance.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    const remainingSeconds = Math.max(0, allowance.totalSeconds - allowance.consumedSeconds);
    return {
      allowed: remainingSeconds > 0,
      freeCatalog: false,
      remainingSeconds,
      ...(remainingSeconds > 0
        ? await this.streamingService.getGuestPlaybackMetadata(episodeId)
        : {}),
    };
  }

  async consumeFreePreview(userId: string, seconds: number) {
    const allowance = await this.prisma.previewAllowance.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    const next = Math.min(allowance.totalSeconds, allowance.consumedSeconds + seconds);
    const updated = await this.prisma.previewAllowance.update({
      where: { userId },
      data: { consumedSeconds: next },
    });
    return { remainingSeconds: Math.max(0, updated.totalSeconds - updated.consumedSeconds) };
  }
}
