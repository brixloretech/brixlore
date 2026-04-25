import { api } from "./api";

export type ContactSupportRequestDto = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactSupportResponseDto = {
  message: string;
};

export type SitePageDto = {
  id: string;
  slug: string;
  title?: string;
  content?: string | null;
  published?: boolean;
  updatedAt?: string;
};

class SiteService {
  async getPage(slug: string): Promise<SitePageDto | null> {
    try {
      const response = await api.get<SitePageDto>(`/site/pages/${slug}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async submitContact(
    body: ContactSupportRequestDto,
  ): Promise<ContactSupportResponseDto> {
    const response = await api.post<ContactSupportResponseDto>(
      "/site/contact",
      body,
    );
    return response.data;
  }
}

export const siteService = new SiteService();
