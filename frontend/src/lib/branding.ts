import { siteService } from "@/lib/services";

export type BrandingSettings = {
  logoUrl?: string;
  bannerUrl?: string;
  bannerVideoUrl?: string;
  mobileWelcomeVideoUrl?: string;
};

export function parseBranding(content?: string | null): BrandingSettings {
  if (!content) return {};
  try {
    const data = JSON.parse(content) as BrandingSettings;
    return {
      logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : undefined,
      bannerUrl:
        typeof data.bannerUrl === "string" ? data.bannerUrl : undefined,
      bannerVideoUrl:
        typeof data.bannerVideoUrl === "string"
          ? data.bannerVideoUrl
          : undefined,
      mobileWelcomeVideoUrl:
        typeof data.mobileWelcomeVideoUrl === "string"
          ? data.mobileWelcomeVideoUrl
          : undefined,
    };
  } catch {
    return {};
  }
}

export async function fetchBranding(): Promise<BrandingSettings> {
  const page = await siteService.getPage("branding");
  return parseBranding(page?.content ?? "");
}
