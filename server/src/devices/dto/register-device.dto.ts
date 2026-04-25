import { IsEnum, IsString, MinLength, IsOptional } from 'class-validator';
import { Platform } from '@prisma/client';

export class RegisterDeviceDto {
  @IsEnum(Platform, {
    message: 'platform must be ANDROID, IOS, or WEB',
  })
  platform: Platform;

  @IsString()
  @MinLength(1, { message: 'deviceIdentifier is required' })
  deviceIdentifier: string;

  @IsOptional()
  @IsString()
  pushToken?: string; // Expo Push Token
}
