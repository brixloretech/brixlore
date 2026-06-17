import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateAdminEpisodeDto {
  @IsOptional()
  @IsString()
  seasonId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  episodeNumber?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  videoKey?: string;

  @IsOptional()
  @IsString()
  hlsKey?: string;

  @IsOptional()
  @IsString()
  thumbnailKey?: string;
}
