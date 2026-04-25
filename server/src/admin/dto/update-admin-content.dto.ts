import { IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

const CONTENT_TYPES = ['MOVIE', 'DOCUMENTARY', 'SERIES', 'ANIMATION', 'TRAILER', 'SHORT'] as const;

type ContentType = (typeof CONTENT_TYPES)[number];

export class UpdateAdminContentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(CONTENT_TYPES)
  type?: ContentType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  thumbnailKey?: string;

  @IsOptional()
  @IsString()
  posterKey?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  releaseYear?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  ageRating?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
