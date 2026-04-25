import { IsEmail, IsInt, IsOptional, IsString, Max, Min, MinLength, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class SignupSubscriptionIntentDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1, { message: 'Name is required' })
  name: string;

  @IsString()
  @MinLength(1, { message: 'planId is required' })
  planId: string;

  @IsString()
  @MinLength(1, { message: 'paymentMethodId is required' })
  paymentMethodId: string;

  /** Optional free trial length in days (e.g. 7 or 14). When set, Stripe creates subscription in trialing state. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  trialPeriodDays?: number;

  @IsOptional()
  @IsIn(['MONTHLY', 'YEARLY'], { message: 'billingCycle must be MONTHLY or YEARLY' })
  billingCycle?: 'MONTHLY' | 'YEARLY';
}
