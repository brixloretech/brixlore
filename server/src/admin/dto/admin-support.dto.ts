export class SupportReplyDto {
  id: string;
  message: string;
  adminUserId?: string | null;
  adminName?: string | null;
  createdAt: string;
}

export class SupportRequestDto {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  replies: SupportReplyDto[];
}
