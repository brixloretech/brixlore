import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class StartFreePreviewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  episodeId!: string;
}
