import { IsBoolean, IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateWaitlistEntryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  phone!: string;

  @IsBoolean()
  smsConsent!: boolean;
}
