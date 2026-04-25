import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';

export class SendPushNotificationDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  data?: {
    videoId?: string;
    contentType?: string;
    url?: string;
    [key: string]: any;
  };

  @IsOptional()
  @IsEnum(['info', 'video', 'system'])
  type?: 'info' | 'video' | 'system';

  @IsOptional()
  @IsString()
  sound?: string;

  @IsOptional()
  @IsString()
  badge?: string;
}
