import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateAdminTrailerDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

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
  @IsBoolean()
  isPublished?: boolean;
}
