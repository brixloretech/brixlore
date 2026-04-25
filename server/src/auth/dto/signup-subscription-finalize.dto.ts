import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupSubscriptionFinalizeDto {
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
  @MinLength(1, { message: 'subscriptionId is required' })
  subscriptionId: string;

  @IsString()
  @MinLength(1, { message: 'customerId is required' })
  customerId: string;
}
