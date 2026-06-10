import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { StripeService } from '../subscriptions/stripe.service';
import { DevicesService } from '../devices/devices.service';
import { Platform } from '@prisma/client';
import type { User } from '@prisma/client';

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRES_SEC = 900; // 15 min
const REFRESH_TOKEN_EXPIRES_SEC = 7 * 24 * 60 * 60; // 7 days
const PASSWORD_RESET_EXPIRES_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_VERIFICATION_EXPIRES_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
  deviceIdentifier?: string;
  jti?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly stripeService: StripeService,
    private readonly devicesService: DevicesService,
  ) {}

  async signUp(email: string, password: string, name?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: normalizedEmail, passwordHash, name },
    });
    
    try {
      await this.sendVerificationEmail(user);
    } catch (err) {
      this.logger.error(`[Auth] Failed to send verification email to ${user.email}:`, err);
      // Don't fail signup if email sending fails - user account is created successfully
    }
    
    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async signUpWithSubscription(
    email: string,
    password: string,
    name: string,
    planId: string,
    paymentMethodId: string,
    billingCycle?: 'MONTHLY' | 'YEARLY',
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const { customerId, subscription } = await this.stripeService.createSubscriptionForSignup({
      planId,
      customerEmail: normalizedEmail,
      customerName: name,
      paymentMethodId,
      billingCycle,
    });

    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    if (!isActive) {
      throw new BadRequestException('Payment was not successful. Please try again.');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    let user: User | null = null;
    try {
      user = await this.prisma.user.create({
        data: { email: normalizedEmail, passwordHash, name, stripeCustomerId: customerId },
      });

      const startDate = new Date(subscription.current_period_start * 1000);
      const endDate = new Date(subscription.current_period_end * 1000);

      await this.prisma.subscription.create({
        data: {
          userId: user.id,
          planId,
          stripeSubscriptionId: subscription.id,
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      });
    } catch (err) {
      // Best-effort cleanup if user creation fails after payment.
      try {
        await this.stripeService.cancelSubscription(subscription.id);
      } catch {
        // ignore cleanup errors
      }
      throw err;
    }

    try {
      await this.sendVerificationEmail(user);
    } catch (err) {
      this.logger.error(`[Auth] Failed to send verification email to ${user.email}:`, err);
      // Don't fail signup if email sending fails - user account is created successfully
    }

    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async createSignupSubscriptionIntent(
    email: string,
    name: string,
    planId: string,
    paymentMethodId: string,
    trialPeriodDays?: number,
    billingCycle?: 'MONTHLY' | 'YEARLY',
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    return this.stripeService.createSubscriptionIntentForSignup({
      planId,
      customerEmail: normalizedEmail,
      customerName: name,
      paymentMethodId,
      trialPeriodDays,
      billingCycle,
    });
  }

  async finalizeSignupWithSubscription(
    email: string,
    password: string,
    name: string,
    planId: string,
    subscriptionId: string,
    customerId: string,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const { isActive, startDate, endDate } = await this.stripeService.verifySubscriptionPayment({
      subscriptionId,
      customerId,
      planId,
    });

    if (!isActive) {
      throw new BadRequestException('Subscription is not active.');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    let user: User | null = null;
    try {
      user = await this.prisma.user.create({
        data: { email: normalizedEmail, passwordHash, name, stripeCustomerId: customerId },
      });

      await this.prisma.subscription.create({
        data: {
          userId: user.id,
          planId,
          stripeSubscriptionId: subscriptionId,
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      });
    } catch (err) {
      try {
        await this.stripeService.cancelSubscription(subscriptionId);
      } catch {
        // ignore cleanup errors
      }
      throw err;
    }

    try {
      await this.sendVerificationEmail(user);
    } catch (err) {
      this.logger.error(`[Auth] Failed to send verification email to ${user.email}:`, err);
      // Don't fail signup if email sending fails - user account is created successfully
    }

    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async login(email: string, password: string, platform?: Platform, deviceIdentifier?: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email address before signing in.');
    }

    const hasPlatform = platform !== undefined;
    const hasDeviceIdentifier =
      typeof deviceIdentifier === 'string' && deviceIdentifier.trim().length > 0;

    if (hasPlatform !== hasDeviceIdentifier) {
      throw new BadRequestException(
        'platform and deviceIdentifier must both be provided for device-aware login',
      );
    }

    if (hasPlatform && hasDeviceIdentifier) {
      // Enforce plan device limit at login time for new devices.
      // Existing devices are simply updated and allowed.
      await this.devicesService.registerDevice(
        user.id,
        platform as Platform,
        deviceIdentifier!.trim(),
      );
    }

    return this.issueTokens(user, hasDeviceIdentifier ? deviceIdentifier!.trim() : undefined);
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (payload.type !== 'refresh' || !payload.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const tokenHash = this.hashToken(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (
      !record ||
      record.revokedAt ||
      record.expiresAt < new Date() ||
      record.userId !== payload.sub
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (payload.deviceIdentifier) {
      const deviceExists = await this.validateDevice(payload.sub, payload.deviceIdentifier);
      if (!deviceExists) {
        throw new UnauthorizedException('Session expired: device logged out from another session');
      }
    }

    await this.revokeRefreshToken(record.id);
    return this.issueTokens(record.user, payload.deviceIdentifier);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user?.passwordHash) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    return ok ? user : null;
  }

  async validateUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async validateDevice(userId: string, deviceIdentifier: string): Promise<boolean> {
    const device = await this.prisma.device.findUnique({
      where: {
        userId_deviceIdentifier: { userId, deviceIdentifier },
      },
    });
    return !!device;
  }

  /** Request password reset: create token, store hash, send email. Always returns same message for security. */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    const message = 'If an account exists for this email, you will receive a reset link shortly.';
    if (!user) return { message };

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRES_MS);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const baseUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
    const resetLink = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
    await this.mailService.sendPasswordResetEmail(user.email, resetLink);
    return { message };
  }

  /** Admin invite: create activation token and email link. */
  async sendAdminInvite(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRES_MS);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const baseUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
    const inviteLink = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}&admin=1`;
    await this.mailService.sendAdminInviteEmail(user.email, inviteLink);
    return { message: 'Invitation sent.' };
  }

  /** Reset password using token from email link. */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = this.hashToken(token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset link. Please request a new one.');
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    return { message: 'Your password has been reset. You can sign in with your new password.' };
  }

  /** Verify email using token from verification link. */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenHash = this.hashToken(token);
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification link.');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerificationToken.delete({
        where: { id: record.id },
      }),
    ]);
    return { message: 'Your email has been verified. You can now sign in.' };
  }

  private async sendVerificationEmail(user: User) {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRES_MS);

    await this.prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const baseUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
    const verificationLink = `${baseUrl.replace(/\/$/, '')}/verify-email?token=${rawToken}`;
    await this.mailService.sendVerificationEmail(user.email, verificationLink);
  }

  /** Change password for authenticated user. */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      throw new BadRequestException('Password is not set for this account.');
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect.');
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { message: 'Password updated successfully.' };
  }

  /** Revoke all refresh tokens for the current user. */
  async revokeSessions(userId: string): Promise<{ message: string }> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'All sessions have been reset.' };
  }

  private async issueTokens(user: User, deviceIdentifier?: string) {
    const accessSecret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? 'dev-secret';
    const refreshSecret =
      process.env.JWT_REFRESH_SECRET ??
      process.env.JWT_ACCESS_SECRET ??
      process.env.JWT_SECRET ??
      'dev-refresh-secret';

    const accessExpiresSec =
      typeof process.env.JWT_ACCESS_EXPIRES === 'string'
        ? this.parseExpiresToSeconds(process.env.JWT_ACCESS_EXPIRES)
        : (Number(process.env.JWT_ACCESS_EXPIRES) as number) || ACCESS_TOKEN_EXPIRES_SEC;

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'access',
        deviceIdentifier,
      } satisfies JwtPayload,
      {
        secret: accessSecret,
        expiresIn: accessExpiresSec,
      },
    );

    const refreshExpiresSec =
      typeof process.env.JWT_REFRESH_EXPIRES === 'string'
        ? this.parseExpiresToSeconds(process.env.JWT_REFRESH_EXPIRES)
        : (Number(process.env.JWT_REFRESH_EXPIRES) as number) || REFRESH_TOKEN_EXPIRES_SEC;

    const jti = randomUUID();
    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'refresh',
        deviceIdentifier,
        jti,
      } satisfies JwtPayload,
      {
        secret: refreshSecret,
        expiresIn: refreshExpiresSec,
      },
    );

    const expiresInMs = accessExpiresSec * 1000;
    const expiresAt = new Date(Date.now() + expiresInMs);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: Math.floor(expiresInMs / 1000),
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiresToSeconds(exp: string): number {
    const match = exp.match(/^(\d+)([smhd])?$/);
    if (!match) return ACCESS_TOKEN_EXPIRES_SEC;
    const n = parseInt(match[1], 10);
    const unit = match[2] ?? 's';
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };
    return n * (multipliers[unit] ?? 1);
  }

  private async revokeRefreshToken(id: string) {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
