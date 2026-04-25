import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateSitePageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
