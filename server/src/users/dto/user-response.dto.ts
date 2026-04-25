/**
 * Current user as returned by GET /users/me (excludes sensitive fields).
 */
export class UserResponseDto {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
}
