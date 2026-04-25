/** API contract types for editable site pages. */

export interface SitePageDto {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface SitePageSummaryDto {
  slug: string;
  title: string;
  updatedAt: string;
}

export interface UpdateSitePageRequestDto {
  title?: string;
  content?: string;
}

export interface ContactSupportRequestDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactSupportResponseDto {
  message: string;
}

export interface PublicMediaUrlResponseDto {
  url: string | null;
}
