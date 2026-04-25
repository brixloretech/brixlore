import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { SignUpWithSubscriptionDto } from './dto/sign-up-with-subscription.dto';
import { SignupSubscriptionIntentDto } from './dto/signup-subscription-intent.dto';
import { SignupSubscriptionFinalizeDto } from './dto/signup-subscription-finalize.dto';
import { TokensResponseDto } from './dto/tokens-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signUp(@Body() dto: SignUpDto): Promise<TokensResponseDto> {
    return this.authService.signUp(dto.email, dto.password, dto.name);
  }

  @Public()
  @Post('signup-with-subscription')
  async signUpWithSubscription(@Body() dto: SignUpWithSubscriptionDto): Promise<TokensResponseDto> {
    return this.authService.signUpWithSubscription(
      dto.email,
      dto.password,
      dto.name,
      dto.planId,
      dto.paymentMethodId,
      dto.billingCycle,
    );
  }

  @Public()
  @Post('signup-subscription-intent')
  async signupSubscriptionIntent(@Body() dto: SignupSubscriptionIntentDto) {
    return this.authService.createSignupSubscriptionIntent(
      dto.email,
      dto.name,
      dto.planId,
      dto.paymentMethodId,
      dto.trialPeriodDays,
      dto.billingCycle,
    );
  }

  @Public()
  @Post('signup-subscription-finalize')
  async signupSubscriptionFinalize(
    @Body() dto: SignupSubscriptionFinalizeDto,
  ): Promise<TokensResponseDto> {
    return this.authService.finalizeSignupWithSubscription(
      dto.email,
      dto.password,
      dto.name,
      dto.planId,
      dto.subscriptionId,
      dto.customerId,
    );
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<TokensResponseDto> {
    return this.authService.login(dto.email, dto.password, dto.platform, dto.deviceIdentifier);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokensResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  @Post('revoke-sessions')
  @HttpCode(HttpStatus.OK)
  async revokeSessions(@CurrentUser() user: User): Promise<{ message: string }> {
    return this.authService.revokeSessions(user.id);
  }
}
