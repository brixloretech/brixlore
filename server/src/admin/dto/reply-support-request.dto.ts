import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const SUPPORT_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export class ReplySupportRequestDto {
  @IsString()
  @MinLength(2)
  message: string;

  @IsOptional()
  @IsIn(SUPPORT_STATUSES)
  status?: string;
}
