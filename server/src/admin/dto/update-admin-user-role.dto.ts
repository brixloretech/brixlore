import { IsIn } from 'class-validator';

const ADMIN_ROLES = ['SUPER_ADMIN', 'CONTENT_MANAGER', 'CUSTOMER_SUPPORT'] as const;

type AdminRole = (typeof ADMIN_ROLES)[number];

export class UpdateAdminUserRoleDto {
  @IsIn(ADMIN_ROLES)
  role: AdminRole;
}
