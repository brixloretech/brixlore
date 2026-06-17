import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateAdminSeasonDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  seasonNumber?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
