import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

function IsValidInternationalPhone(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidInternationalPhone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return (
            typeof value === 'string' &&
            value.startsWith('+') &&
            parsePhoneNumberFromString(value)?.isValid() === true
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid international phone number`;
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
  @IsNotEmpty()
  @IsValidInternationalPhone({
    message: 'phone must be a valid international phone number',
  })
  phone!: string;

  @IsBoolean()
  emailConsent!: boolean;

  @IsBoolean()
  smsConsent!: boolean;
}
