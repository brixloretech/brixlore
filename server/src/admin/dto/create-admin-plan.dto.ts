import {
  IsBoolean,
  IsInt,
  IsNumberString,
  IsOptional,
  IsArray,
  IsString,
  Min,
  MinLength,
  ArrayMaxSize,
} from 'class-validator';

export class CreateAdminPlanDto {
  @IsString()
  @MinLength(1)
  name: string;

  /** Monthly price */
  @IsNumberString()
  price: string;

  /** Yearly price (optional) */
  @IsOptional()
  @IsNumberString()
  yearlyPrice?: string;

  @IsInt()
  @Min(0)
  deviceLimit: number;

  @IsBoolean()
  offlineAllowed: boolean;

  @IsInt()
  @Min(0)
  maxOfflineDownloads: number;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  perks?: string[];

  /** Monthly Stripe price ID */
  @IsOptional()
  @IsString()
  stripePriceId?: string;

  /** Yearly Stripe price ID */
  @IsOptional()
  @IsString()
  yearlyStripePriceId?: string;
}
