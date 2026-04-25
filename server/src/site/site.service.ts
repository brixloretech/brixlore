import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SitePageDto, SitePageSummaryDto } from './dto/site-page.dto';
import type { ContactRequestDto } from './dto/contact-request.dto';
import { R2Service } from '../storage/r2.service';

const DEFAULT_PAGES: { slug: string; title: string }[] = [
  { slug: 'privacy-policy', title: 'Privacy Policy' },
  { slug: 'terms-of-use', title: 'Terms of Use' },
  { slug: 'cookie-consent', title: 'Cookie Consent' },
  { slug: 'do-not-sell', title: 'Do Not Sell or Share My Personal Information' },
];

@Injectable()
export class SiteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2Service: R2Service,
  ) {}

  private getSitePageModel() {
    const model = (this.prisma as any).sitePage;
    if (!model) {
      throw new BadRequestException(
        'Site pages are not available. Run prisma generate and migrate to add SitePage.',
      );
    }
    return model as {
      findMany: Function;
      findUnique: Function;
      upsert: Function;
    };
  }

  async listPages(): Promise<SitePageSummaryDto[]> {
    await this.ensureDefaults();
    const pages = await this.getSitePageModel().findMany({
      orderBy: { title: 'asc' },
      select: { slug: true, title: true, updatedAt: true },
    });
    return pages.map((p: { slug: string; title: string; updatedAt: Date }) => ({
      slug: p.slug,
      title: p.title,
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  async getPage(slug: string): Promise<SitePageDto> {
    const page = await this.getSitePageModel().findUnique({ where: { slug } });
    if (!page) throw new NotFoundException('Page not found');
    return {
      slug: page.slug,
      title: page.title,
      content: page.content,
      updatedAt: page.updatedAt.toISOString(),
    };
  }

  async getBrandingBannerVideoUrl(): Promise<string | null> {
    const page = await this.getSitePageModel().findUnique({ where: { slug: 'branding' } });
    if (!page?.content) return null;

    try {
      const data = JSON.parse(page.content) as { bannerVideoUrl?: string };
      return await this.resolveMediaUrl(data.bannerVideoUrl ?? null);
    } catch {
      return null;
    }
  }

  async upsertPage(slug: string, title?: string, content?: string): Promise<SitePageDto> {
    const existing = await this.getSitePageModel().findUnique({ where: { slug } });
    const nextTitle = title?.trim() || existing?.title || this.titleFromSlug(slug);
    const nextContent = content ?? existing?.content ?? '';

    const page = await this.getSitePageModel().upsert({
      where: { slug },
      update: { title: nextTitle, content: nextContent },
      create: { slug, title: nextTitle, content: nextContent },
    });

    return {
      slug: page.slug,
      title: page.title,
      content: page.content,
      updatedAt: page.updatedAt.toISOString(),
    };
  }

  private async ensureDefaults(): Promise<void> {
    const model = this.getSitePageModel();
    await Promise.all(
      DEFAULT_PAGES.map((page) =>
        model.upsert({
          where: { slug: page.slug },
          update: {},
          create: {
            slug: page.slug,
            title: page.title,
            content: '',
          },
        }),
      ),
    );
  }

  private titleFromSlug(slug: string): string {
    return slug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  async createSupportRequest(dto: ContactRequestDto): Promise<{ message: string }> {
    const model = this.getSupportRequestModel();
    const subject = dto.subject.trim();
    const message = dto.message.trim();
    const combined = `${subject} ${message}`;
    const isAccountDeletionRequest = /account\s*deletion|delete\s*account/i.test(combined);

    await model.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        subject,
        message,
        priority: isAccountDeletionRequest ? 'HIGH' : 'MEDIUM',
      },
    });
    return { message: 'Thanks for reaching out. Our support team will reply shortly.' };
  }

  private getSupportRequestModel() {
    const model = (this.prisma as any).supportRequest;
    if (!model) {
      throw new BadRequestException(
        'Support requests are not available. Run prisma generate and migrate to add SupportRequest.',
      );
    }
    return model as {
      create: Function;
    };
  }

  private async resolveMediaUrl(value: string | null | undefined): Promise<string | null> {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    const publicBaseUrl = this.r2Service.getPublicBaseUrl();
    if (/^https?:\/\//i.test(trimmed)) {
      if (publicBaseUrl && trimmed.startsWith(`${publicBaseUrl}/`)) {
        const key = trimmed.slice(publicBaseUrl.length + 1);
        return this.r2Service.getSignedGetUrl(key);
      }
      return trimmed;
    }

    return this.r2Service.getSignedGetUrl(trimmed);
  }
}
