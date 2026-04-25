import { IsString, MinLength } from 'class-validator';

export class CreateAdminCategoryDto {
  @IsString()
  @MinLength(1)
  name: string;
}
