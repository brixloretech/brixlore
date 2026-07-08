import { IsIn, IsString, MinLength } from 'class-validator';

export class UpdateSubscriptionPlanDto {
  @IsString()
  @MinLength(1, { message: 'planId is required' })
  planId: string;

  @IsString()
  @IsIn(['MONTHLY', 'YEARLY'])
  billingCycle: 'MONTHLY' | 'YEARLY';
}
