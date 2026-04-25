export class UserProfileDto {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  bio?: string | null;
  createdAt: Date;
}
