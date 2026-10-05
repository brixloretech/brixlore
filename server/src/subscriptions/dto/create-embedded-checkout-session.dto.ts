import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEmbeddedCheckoutSessionDto {
  @IsString()
  @MinLength(1)
  planId: string;

  @IsOptional()
  @IsIn(['MONTHLY', 'YEARLY'])
  billingCycle?: 'MONTHLY' | 'YEARLY';
}
