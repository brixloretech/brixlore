import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateAdminSeasonDto {
  @IsString()
  @MinLength(1)
  contentId: string;

  @IsInt()
  @Min(1)
  seasonNumber: number;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
