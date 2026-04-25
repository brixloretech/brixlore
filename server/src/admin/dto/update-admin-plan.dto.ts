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

export class UpdateAdminPlanDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  /** Monthly price */
  @IsOptional()
  @IsNumberString()
  price?: string;

  /** Yearly price */
  @IsOptional()
  @IsNumberString()
  yearlyPrice?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  deviceLimit?: number;

  @IsOptional()
  @IsBoolean()
  offlineAllowed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxOfflineDownloads?: number;

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
