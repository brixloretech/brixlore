import { IsBoolean, IsIn, IsOptional } from 'class-validator';

const QUALITY_OPTIONS = ['Auto', '1080p', '720p'] as const;

export class UpdatePreferencesDto {
  @IsOptional()
  @IsIn(QUALITY_OPTIONS)
  playbackQuality?: (typeof QUALITY_OPTIONS)[number];

  @IsOptional()
  @IsBoolean()
  autoplayNext?: boolean;

  @IsOptional()
  @IsBoolean()
  skipRecaps?: boolean;

  @IsOptional()
  @IsBoolean()
  subtitlesDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyNewReleases?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyAccountAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyProductTips?: boolean;

  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;
}
