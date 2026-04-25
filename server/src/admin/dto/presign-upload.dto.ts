import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PresignUploadDto {
  @IsIn(['video', 'thumbnail'])
  kind: 'video' | 'thumbnail';

  @IsString()
  fileName: string;

  @IsString()
  contentType: string;

  @IsNumber()
  @Min(1)
  sizeBytes: number;

  @IsOptional()
  @IsString()
  uploadId?: string;
}
