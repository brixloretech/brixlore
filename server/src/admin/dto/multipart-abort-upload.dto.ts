import { IsString } from 'class-validator';

export class MultipartAbortUploadDto {
  @IsString()
  key!: string;

  @IsString()
  uploadId!: string;
}
