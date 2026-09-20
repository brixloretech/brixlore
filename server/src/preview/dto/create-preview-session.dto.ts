import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePreviewSessionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  episodeId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  deviceFingerprint!: string;
}
