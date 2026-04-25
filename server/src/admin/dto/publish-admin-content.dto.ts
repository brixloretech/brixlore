import { IsBoolean } from 'class-validator';

export class PublishAdminContentDto {
  @IsBoolean()
  isPublished: boolean;
}
