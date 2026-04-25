import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  root() {
    return {
      ok: true,
      message: 'Streaming API',
      endpoints: {
        auth: '/auth',
        content: '/content',
        streaming: '/streaming',
        subscriptions: '/subscriptions',
      },
    };
  }

  /**
   * Health check endpoint for Railway/Docker health checks.
   */
  @Public()
  @Get('health')
  health() {
    return { ok: true, status: 'healthy', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('api/health')
  apiHealth() {
    return { ok: true, status: 'healthy', timestamp: new Date().toISOString() };
  }

  /**
   * Health check for SitePage table availability.
   */
  @Public()
  @Get('health/site-pages')
  async sitePagesHealth() {
    const model = (this.prisma as any).sitePage;
    if (!model) {
      return { ok: false, sitePages: false, reason: 'SitePage model not found' };
    }
    try {
      await model.findFirst({ select: { slug: true } });
      return { ok: true, sitePages: true };
    } catch (error) {
      return {
        ok: false,
        sitePages: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
