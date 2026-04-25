import { IsOptional, IsString, MinLength } from 'class-validator';

export class TranscodeEpisodeDto {
  @IsString()
  @MinLength(1)
  episodeId: string;

  @IsOptional()
  @IsString()
  outputPrefix?: string;

  @IsOptional()
  @IsString()
  tempDir?: string;
}
