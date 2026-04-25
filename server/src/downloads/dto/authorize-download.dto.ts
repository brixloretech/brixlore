import { IsString, MinLength } from 'class-validator';

export class AuthorizeDownloadDto {
  @IsString()
  @MinLength(1, { message: 'episodeId is required' })
  episodeId: string;

  @IsString()
  @MinLength(1, { message: 'deviceId is required' })
  deviceId: string;
}
