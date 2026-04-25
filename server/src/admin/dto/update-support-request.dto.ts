import { IsIn, IsOptional } from 'class-validator';

const SUPPORT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const SUPPORT_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export class UpdateSupportRequestDto {
  @IsOptional()
  @IsIn(SUPPORT_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsIn(SUPPORT_STATUSES)
  status?: string;
}
