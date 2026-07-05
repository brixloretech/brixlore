import { IsInt, Min, IsString, IsOptional } from 'class-validator';

export class CreateCloudflareDirectUploadDto {
  @IsInt()
  @Min(1)
  uploadLength: number;

  @IsString()
  @IsOptional()
  filename?: string;
}
