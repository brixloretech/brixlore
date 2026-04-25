import { IsIn, IsNumber, IsString, Min } from 'class-validator';

export class MultipartInitUploadDto {
  @IsIn(['video', 'thumbnail'])
  kind!: 'video' | 'thumbnail';

  @IsString()
  fileName!: string;

  @IsString()
  contentType!: string;

  @IsNumber()
  @Min(1)
  sizeBytes!: number;
}
