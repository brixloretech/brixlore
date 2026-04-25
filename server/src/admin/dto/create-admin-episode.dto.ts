import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateAdminEpisodeDto {
  @IsString()
  @MinLength(1)
  contentId: string;

  @IsOptional()
  @IsString()
  seasonId?: string;

  @IsInt()
  @Min(1)
  episodeNumber: number;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(1)
  duration: string;

  @IsString()
  @MinLength(1)
  videoKey: string;

  @IsOptional()
  @IsString()
  hlsKey?: string;

  @IsOptional()
  @IsString()
  thumbnailKey?: string;
}
