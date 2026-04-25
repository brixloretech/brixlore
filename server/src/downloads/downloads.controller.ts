import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { DownloadsService } from './downloads.service';
import { AuthorizeDownloadDto } from './dto/authorize-download.dto';
import { DownloadTokenResponseDto } from './dto/download-token-response.dto';
import { RedeemDownloadDto } from './dto/redeem-download.dto';
import { RedeemDownloadResponseDto } from './dto/redeem-download-response.dto';

/** Stricter rate limit for download authorization endpoints (per user/IP). */
const DOWNLOAD_AUTH_LIMIT = { default: { limit: 30, ttl: 60_000 } }; // 30 requests per minute

@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  /**
   * Authorize an offline download for the given episode on the given device.
   * Validates: active subscription, plan offlineAllowed, device limit, maxOfflineDownloads.
   * Returns the created (or existing) Download record with status AUTHORIZED.
   */
  @Post('authorize')
  @Throttle(DOWNLOAD_AUTH_LIMIT)
  async authorize(@CurrentUser() user: User, @Body() dto: AuthorizeDownloadDto) {
    return this.downloadsService.authorizeDownload(
      user.id,
      dto.episodeId.trim(),
      dto.deviceId.trim(),
    );
  }

  /**
   * Generate a secure, time-limited download token for an offline episode.
   * Token is tied to user, device, and episode. Ensures authorization (creates Download if needed).
   * Returns token and expiry metadata. Token is device-bound and cannot be used on another device.
   */
  @Post('token')
  @Throttle(DOWNLOAD_AUTH_LIMIT)
  async getToken(
    @CurrentUser() user: User,
    @Body() dto: AuthorizeDownloadDto,
  ): Promise<DownloadTokenResponseDto> {
    return this.downloadsService.getDownloadToken(
      user.id,
      dto.episodeId.trim(),
      dto.deviceId.trim(),
    );
  }

  /**
   * Redeem a download token to get the episode stream URL. Device-bound: the token is only valid
   * when deviceId in the request matches the device the token was issued for. Tokens cannot be
   * reused on a different device.
   */
  @Post('redeem')
  @Throttle(DOWNLOAD_AUTH_LIMIT)
  async redeem(
    @CurrentUser() user: User,
    @Body() dto: RedeemDownloadDto,
  ): Promise<RedeemDownloadResponseDto> {
    return this.downloadsService.redeemDownloadToken(
      user.id,
      dto.token.trim(),
      dto.deviceId.trim(),
    );
  }

  /**
   * Sync download status: return all downloads for the user (optionally filtered by device).
   * Use this to sync local state with backend (status, expiresAt, episode, device).
   */
  @Get('sync')
  async sync(@CurrentUser() user: User, @Query('deviceId') deviceId?: string) {
    return this.downloadsService.listDownloadsForSync(user.id, deviceId);
  }

  /**
   * Fetch active offline downloads: AUTHORIZED or DOWNLOADED with expiresAt in the future.
   * Optionally filter by deviceId.
   */
  @Get('active')
  async active(@CurrentUser() user: User, @Query('deviceId') deviceId?: string) {
    return this.downloadsService.listActiveDownloads(user.id, deviceId);
  }

  /**
   * Notify backend when download completes. Updates status from AUTHORIZED to DOWNLOADED.
   * Call after the client has finished saving the file locally.
   */
  @Post(':id/complete')
  async complete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.downloadsService.markDownloadComplete(user.id, id);
  }
}
