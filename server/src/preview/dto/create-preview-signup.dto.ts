import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePreviewSignupDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
