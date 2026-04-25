import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class SignUpWithSubscriptionDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString()
  @MinLength(1, { message: 'Name is required' })
  name: string;

  @IsString()
  @MinLength(1, { message: 'planId is required' })
  planId: string;

  @IsString()
  @MinLength(1, { message: 'paymentMethodId is required' })
  paymentMethodId: string;

  @IsOptional()
  @IsIn(['MONTHLY', 'YEARLY'], { message: 'billingCycle must be MONTHLY or YEARLY' })
  billingCycle?: 'MONTHLY' | 'YEARLY';
}
