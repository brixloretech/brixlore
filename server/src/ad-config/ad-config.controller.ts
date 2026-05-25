import { Body, Controller, Get, Patch } from '@nestjs/common';
import { AdConfigService, UpdateAdConfigInput } from './ad-config.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { User } from '@prisma/client';

@Controller('ad-config')
export class AdConfigController {
  constructor(private readonly adConfigService: AdConfigService) {}

  /**
   * Public endpoint – no auth required.
   * Returns the ad playback config the web player needs to decide whether and
   * how to display ads.  Tag URLs are withheld by the service when adsEnabled
   * is false, so there is nothing sensitive to expose.
   */
  @Public()
  @Get()
  async getPublic() {
    return this.adConfigService.getPublicAdConfig();
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
