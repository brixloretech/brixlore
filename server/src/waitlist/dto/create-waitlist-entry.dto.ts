import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
function IsValidPhone(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidPhone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null || value === '') return true;
          if (typeof value !== 'string') return false;
          const digits = value.replace(/\D/g, '');
          return digits.length >= 7 && digits.length <= 15;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain between 7 and 15 digits`;
        },
      },
    });
  };
}

export class CreateWaitlistEntryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  @IsValidPhone({
    message: 'phone must contain between 7 and 15 digits',
  })
  phone?: string;

  @IsBoolean()
  emailConsent!: boolean;

  @IsBoolean()
  smsConsent!: boolean;
}
