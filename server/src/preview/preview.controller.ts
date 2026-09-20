import { Body, Controller, Headers, Ip, Patch, Param, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CreatePreviewSessionDto } from './dto/create-preview-session.dto';
import { CompletePreviewSessionDto } from './dto/complete-preview-session.dto';
import { PreviewService } from './preview.service';
import { CreatePreviewSignupDto } from './dto/create-preview-signup.dto';
import { StartFreePreviewDto } from './dto/start-free-preview.dto';
import { ConsumeFreePreviewDto } from './dto/consume-free-preview.dto';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('preview')
export class PreviewController {
  constructor(
    private readonly previewService: PreviewService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('signup')
  signUp(@Body() dto: CreatePreviewSignupDto) {
    return this.authService.signUpForPreview(dto.email, dto.password, dto.name);
  }

  @Public()
  @Post('sessions')
  start(
    @Body() dto: CreatePreviewSessionDto,
    @Ip() ip: string,
  ) {
    return this.previewService.startGuestPreview(dto.episodeId.trim(), ip, dto.deviceFingerprint);
  }

  @Public()
  @Patch('sessions/:id')
  complete(
    @Param('id') id: string,
    @Body() dto: CompletePreviewSessionDto,
    @Headers('x-device-fingerprint') deviceFingerprint?: string,
    @Ip() ip?: string,
  ) {
    return this.previewService.completeGuestPreview(
      id.trim(),
      ip || '',
      deviceFingerprint?.trim() || '',
      dto.watchedSeconds,
    );
  }

  @Post('free-sessions')
  startFree(@CurrentUser() user: User, @Body() dto: StartFreePreviewDto) {
    return this.previewService.startFreePreview(user.id, dto.episodeId.trim());
  }

  @Patch('free-allowance')
  consumeFree(@CurrentUser() user: User, @Body() dto: ConsumeFreePreviewDto) {
    return this.previewService.consumeFreePreview(user.id, dto.seconds);
  }
}
