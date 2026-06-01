import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Query,
  Param,
  Body,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { StreamingService } from './streaming.service';
import { PlayUrlResponseDto } from './dto/play-url-response.dto';
import type { ContinueWatchingItemDto } from './dto/continue-watching-item.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import type { CloudflareDirectUploadResponseDto } from './dto/cloudflare-direct-upload-response.dto';

function ensureAdminUploadAccess(user: User): void {
  const allowed = new Set(['admin', 'SUPER_ADMIN', 'CONTENT_MANAGER']);
  if (!allowed.has(user.role)) {
    throw new ForbiddenException('Admin upload access required');
  }
}

@Controller('streaming')
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  /** Public: verify Cloudflare Stream backend configuration (token never returned). */
  @Public()
  @Get('cloudflare/status')
  getCloudflareStatus(): {
    configured: boolean;
    accountId: string | null;
    customerSubdomain: string | null;
  } {
    return this.streamingService.getCloudflareStreamStatus();
  }

  /** Authenticated: create a Cloudflare Stream direct-upload URL. */
  @Post('cloudflare/direct-upload')
  async createCloudflareDirectUpload(
    @CurrentUser() user: User,
  ): Promise<CloudflareDirectUploadResponseDto> {
    ensureAdminUploadAccess(user);
    return this.streamingService.createCloudflareDirectUploadUrl(user.id);
  }

  /** Authenticated (admin): check Cloudflare Stream processing status for a UID. */
  @Get('cloudflare/video-status/:uid')
  async getCloudflareVideoStatus(
    @CurrentUser() user: User,
    @Param('uid') uid: string,
  ): Promise<{ uid: string; status: string; readyToStream: boolean }> {
    ensureAdminUploadAccess(user);
    const trimmed = uid?.trim();
    if (!trimmed) throw new BadRequestException('uid is required');
    return this.streamingService.getCloudflareVideoStatus(trimmed);
  }

  /** Authenticated: get playback metadata. */
  @Get('play-url')
  async getPlayUrl(
    @CurrentUser() user: User,
    @Query('episodeId') episodeId: string,
    @Query('videoId') legacyVideoId?: string,
  ): Promise<PlayUrlResponseDto> {
    const resolvedId = episodeId?.trim() || legacyVideoId?.trim();
    if (!resolvedId) {
      throw new UnauthorizedException('episodeId is required');
    }
    return this.streamingService.getPlaybackMetadata(resolvedId, user.id);
  }

  /** Authenticated: list in-progress titles for continue watching (max 5). */
  @Get('continue-watching')
  async getContinueWatching(@CurrentUser() user: User): Promise<ContinueWatchingItemDto[]> {
    return this.streamingService.getContinueWatching(user.id);
  }

  /** Authenticated: report watch progress (seconds). Call on pause or periodically. */
  @Patch('continue-watching/:episodeId')
  async updateProgress(
    @CurrentUser() user: User,
    @Param('episodeId') episodeId: string,
    @Body() dto: UpdateProgressDto,
    @Query('duration') durationSeconds?: string,
  ): Promise<{ ok: boolean }> {
    const id = episodeId?.trim();
    if (!id) throw new BadRequestException('episodeId is required');
    let durationSec: number | undefined;
    if (durationSeconds != null) {
      const parsed = parseInt(durationSeconds, 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        throw new BadRequestException('duration must be a non-negative number');
      }
      durationSec = parsed;
    }
    await this.streamingService.updateViewProgress(user.id, id, dto.progress, durationSec);
    return { ok: true };
  }

  /** Authenticated: remove an episode from continue watching. */
  @Delete('continue-watching/:episodeId')
  async removeFromContinueWatching(
    @CurrentUser() user: User,
    @Param('episodeId') episodeId: string,
  ): Promise<{ ok: boolean }> {
    const id = episodeId?.trim();
    if (!id) throw new BadRequestException('episodeId is required');
    await this.streamingService.removeFromContinueWatching(user.id, id);
    return { ok: true };
  }
}
