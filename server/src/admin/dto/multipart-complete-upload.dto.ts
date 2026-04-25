import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsString, Max, Min, ValidateNested } from 'class-validator';

class MultipartCompletedPartDto {
  @IsInt()
  @Min(1)
  @Max(10000)
  partNumber!: number;

  @IsString()
  etag!: string;
}

export class MultipartCompleteUploadDto {
  @IsString()
  key!: string;

  @IsString()
  uploadId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MultipartCompletedPartDto)
  parts!: MultipartCompletedPartDto[];
}
