import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { SiteService } from './site.service';
import { MailService } from '../mail/mail.service';
import type { SitePageDto } from './dto/site-page.dto';
import { ContactRequestDto } from './dto/contact-request.dto';

@Controller('site')
export class SiteController {
  constructor(
    private readonly siteService: SiteService,
    private readonly mailService: MailService,  // ← ADD THIS
  ) {}

  @Public()
  @Get('pages/:slug')
  async getPage(@Param('slug') slug: string): Promise<SitePageDto> {
    const page = await this.siteService.getPage(slug);
    if (slug !== 'branding') return page;

    try {
      const data = JSON.parse(page.content) as Record<string, unknown>;
      delete data.bannerVideoUrl;
      delete data.mobileWelcomeVideoUrl;
      return { ...page, content: JSON.stringify(data) };
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

  @Public()  // ← ADD THIS so it works without login
  @Post('distribute/submit')
  async submitDistribute(@Body() body: {
    fullName: string;
    email: string;
    filmTitle: string;
    trailerLink: string;
    productionStatus: string;
    synopsis: string;
  }): Promise<{ success: boolean }> {
    await this.mailService.sendMail({
      // to: ['content@brixlore.tv', 'sarah@brixlore.tv'],
      to: 'rubabhashmi4709@gmail.com',
      replyTo: body.email,
      subject: `New Film Submission: ${body.filmTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#111">New Distribution Submission</h2>
          <hr/>
          <p><strong>Name:</strong> ${body.fullName}</p>
          <p><strong>Email:</strong> ${body.email}</p>
          <p><strong>Film Title:</strong> ${body.filmTitle}</p>
          <p><strong>Trailer:</strong> <a href="${body.trailerLink}">${body.trailerLink}</a></p>
          <p><strong>Production Status:</strong> ${body.productionStatus}</p>
          <p><strong>Synopsis:</strong><br/>${body.synopsis}</p>
        </div>
      `,
    });
    return { success: true };
  }
}