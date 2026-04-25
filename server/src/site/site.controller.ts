import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { SiteService } from './site.service';
import type { SitePageDto } from './dto/site-page.dto';
import { ContactRequestDto } from './dto/contact-request.dto';

@Controller('site')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Public()
  @Get('pages/:slug')
  async getPage(@Param('slug') slug: string): Promise<SitePageDto> {
    const page = await this.siteService.getPage(slug);
    if (slug !== 'branding') return page;

    try {
      const data = JSON.parse(page.content) as Record<string, unknown>;
      delete data.bannerVideoUrl;
      delete data.mobileWelcomeVideoUrl;
      return {
        ...page,
        content: JSON.stringify(data),
      };
    } catch {
      return page;
    }
  }

  @Public()
  @Get('branding/banner-video')
  async getBrandingBannerVideo(): Promise<{ url: string | null }> {
    return { url: await this.siteService.getBrandingBannerVideoUrl() };
  }

  @Public()
  @Post('contact')
  async submitContact(@Body() dto: ContactRequestDto): Promise<{ message: string }> {
    return this.siteService.createSupportRequest(dto);
  }
}
