import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateAdminCategoryDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  name?: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
