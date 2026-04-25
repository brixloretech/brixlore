import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

const CONTENT_TYPES = ['MOVIE', 'DOCUMENTARY', 'SERIES', 'ANIMATION', 'TRAILER', 'SHORT'] as const;

type ContentType = (typeof CONTENT_TYPES)[number];

export class CreateAdminContentDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(CONTENT_TYPES)
  type: ContentType;

  @IsString()
  @MinLength(1)
  thumbnailKey: string;

  @IsOptional()
  @IsString()
  posterKey?: string;

  @IsInt()
  @Min(1900)
  releaseYear: number;

  @IsString()
  @MinLength(1)
  ageRating: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  videoKey?: string;

  @IsOptional()
  @IsString()
  hlsKey?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
