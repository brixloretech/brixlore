import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const ADMIN_ROLES = ['SUPER_ADMIN', 'CONTENT_MANAGER', 'CUSTOMER_SUPPORT'] as const;

type AdminRole = (typeof ADMIN_ROLES)[number];

export class InviteAdminUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsIn(ADMIN_ROLES)
  role: AdminRole;
}
