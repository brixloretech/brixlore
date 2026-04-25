import { Platform } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;

  @IsOptional()
  @IsEnum(Platform, {
    message: 'platform must be ANDROID, IOS, or WEB',
  })
  platform?: Platform;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'deviceIdentifier must not be empty' })
  deviceIdentifier?: string;
}
