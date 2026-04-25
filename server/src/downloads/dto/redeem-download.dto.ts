import { IsString, MinLength } from 'class-validator';

export class RedeemDownloadDto {
  @IsString()
  @MinLength(1, { message: 'token is required' })
  token: string;

  @IsString()
  @MinLength(1, { message: 'deviceId is required' })
  deviceId: string;
}
