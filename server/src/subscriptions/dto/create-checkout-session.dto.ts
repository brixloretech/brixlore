import { IsIn, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  @MinLength(1, { message: 'planId is required' })
  planId: string;

  /** Which billing cycle to use. Defaults to 'MONTHLY'. */
  @IsOptional()
  @IsString()
  @IsIn(['MONTHLY', 'YEARLY'])
  billingCycle?: 'MONTHLY' | 'YEARLY';

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  successUrl?: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  cancelUrl?: string;
}
