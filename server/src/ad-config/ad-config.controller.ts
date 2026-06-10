import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { AdConfigService, UpdateAdConfigInput } from './ad-config.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../auth/auth.service';
import type { Request } from 'express';
import type { User } from '@prisma/client';

@Controller('ad-config')
export class AdConfigController {
  constructor(
    private readonly adConfigService: AdConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Public endpoint – no auth required.
   * Returns the ad playback config the web player needs to decide whether and
   * how to display ads.  Tag URLs are withheld by the service when adsEnabled
   * is false, so there is nothing sensitive to expose.
   * If a valid JWT token is sent, we verify it and pass the user's ID to check subscription.
   */
  @Public()
  @Get()
  async getPublic(@Req() req: Request) {
    let userId: string | undefined = undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const secret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? 'dev-secret';
        const payload = this.jwtService.verify<JwtPayload>(token, { secret });
        if (payload && payload.type === 'access') {
          userId = payload.sub;
        }
      } catch (err) {
        // Ignore token errors - fallback to guest/free user
      }
    }
    return this.adConfigService.getPublicAdConfig(userId);
  }

  /**
   * Admin endpoint – JWT required.
   * Returns the full config for the admin settings panel.
   */
  @Get('admin')
  async getAdmin(@CurrentUser() _user: User) {
    return this.adConfigService.getAdConfig();
  }

  /**
   * Admin endpoint – JWT required.
   * Updates one or more fields in the singleton ad config row.
   * Role check is enforced inside the service.
   */
  @Patch('admin')
  async updateAdmin(
    @Body() body: UpdateAdConfigInput,
    @CurrentUser() user: User,
  ) {
    return this.adConfigService.updateAdConfig(body, user.role);
  }
}
