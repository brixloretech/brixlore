import { get, post } from "@/lib/api-client";
import type {
  ContactSupportRequestDto,
  ContactSupportResponseDto,
  PublicMediaUrlResponseDto,
  SitePageDto,
} from "@/types/api";

export const siteService = {
  async getPage(
    slug: string,
    options?: { cache?: RequestCache },
  ): Promise<SitePageDto | null> {
    try {
      return await get<SitePageDto>(`site/pages/${slug}`, {
        ...(options?.cache ? { cache: options.cache } : {}),
      });
    } catch {
      return null;
    }
  },
  async submitContact(
    body: ContactSupportRequestDto,
  ): Promise<ContactSupportResponseDto> {
    return post<ContactSupportResponseDto>("site/contact", body);
  },
  async getBrandingBannerVideoUrl(): Promise<string | null> {
    const response = await get<PublicMediaUrlResponseDto>(
      "site/branding/banner-video",
    );
    return response?.url ?? null;
  },
};
