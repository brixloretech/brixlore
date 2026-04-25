import { IsInt, IsString, Max, Min } from 'class-validator';

export class MultipartPartUrlDto {
  @IsString()
  key!: string;

  @IsString()
  uploadId!: string;

  @IsInt()
  @Min(1)
  @Max(10000)
  partNumber!: number;
}
