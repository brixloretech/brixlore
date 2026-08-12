export interface CreateWaitlistEntryRequestDto {
  name: string;
  email: string;
  phone: string;
  smsConsent: boolean;
}

export interface AdminWaitlistEntryDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  smsConsent: boolean;
  createdAt: string;
}

export interface AdminWaitlistResponseDto {
  entries: AdminWaitlistEntryDto[];
  total: number;
}
