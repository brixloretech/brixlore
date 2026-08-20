import { IsBoolean, IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class CreateWaitlistEntryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'phone must be a valid E.164 phone number',
  })
  phone!: string;

  @IsBoolean()
  emailConsent!: boolean;

  @IsBoolean()
  smsConsent!: boolean;
}
