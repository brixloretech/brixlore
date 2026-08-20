export interface CreateWaitlistEntryRequestDto {
  name: string;
  email: string;
  phone: string;
  emailConsent: boolean;
  smsConsent: boolean;
}

export interface AdminWaitlistEntryDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailConsent: boolean;
  smsConsent: boolean;
  createdAt: string;
}

export interface AdminWaitlistResponseDto {
  entries: AdminWaitlistEntryDto[];
  total: number;
}
