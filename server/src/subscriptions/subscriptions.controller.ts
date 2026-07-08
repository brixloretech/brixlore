import { Body, Controller, Get, Param, Post, Req, BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlanResponseDto } from './dto/plan-response.dto';
import { BillingSummaryDto } from './dto/billing-summary.dto';
import { SubscriptionMeResponseDto } from './dto/subscription-me-response.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Public: list all subscription plans (includes offlineAllowed, maxOfflineDownloads).
   */
  @Public()
  @Get('plans')
  async listPlans(): Promise<PlanResponseDto[]> {
    return this.subscriptionsService.findAllPlans();
  }

  /**
   * Public: get a single plan by id.
   */
  @Public()
  @Get('plans/:id')
  async getPlan(@Param('id') id: string): Promise<PlanResponseDto> {
    return this.subscriptionsService.findPlanById(id);
  }

  /**
   * Authenticated: get current user's active subscription (with plan).
   */
  @Get('me')
  async getMySubscription(@CurrentUser() user: User): Promise<SubscriptionMeResponseDto> {
    let sub = await this.subscriptionsService.getCurrentSubscription(user.id);
    if (!sub) {
      await this.stripeService.syncActiveSubscriptionsForUser(user.id);
      sub = await this.subscriptionsService.getCurrentSubscription(user.id);
    }
    if (!sub) {
      return { isSubscribed: false };
    }

    let billingCycle = 'MONTHLY';
    if (sub.stripeSubscriptionId) {
      try {
        const stripeSub = await this.stripeService.retrieveStripeSubscription(sub.stripeSubscriptionId);
        const priceId = stripeSub.items.data[0]?.price?.id;
        if (priceId && priceId === sub.plan.yearlyStripePriceId) {
          billingCycle = 'YEARLY';
        }
      } catch (e) {
        // Fallback to monthly if retrieve fails
      }
    }

    const isPaid = Number(sub.plan.price) > 0;
    return {
      isSubscribed: isPaid,
      planId: sub.plan.id,
      status: sub.status,
      billingCycle,
      currentPeriodEnd: sub.endDate.toISOString(),
      createdAt: sub.createdAt.toISOString(),
    };
  }

  /**
   * Debug: get all subscriptions (active/inactive) for current user.
   */
  @Get('me/debug')
  async getDebugSubscriptions(@CurrentUser() user: User): Promise<any> {
    const all = await this.prisma.subscription.findMany({
      where: { userId: user.id },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    return {
      userId: user.id,
      now: now.toISOString(),
      all: all.map((s: any) => ({
        id: s.id,
        status: s.status,
        startDate: s.startDate?.toISOString(),
        endDate: s.endDate?.toISOString(),
        isExpired: s.endDate < now,
        planId: s.planId,
        planName: s.plan?.name,
        stripeSubscriptionId: s.stripeSubscriptionId,
      })),
    };
  }

  /**
   * Authenticated: create Stripe Checkout Session for a plan. Returns { url } to redirect.
   */
  @Post('checkout-session')
  async createCheckoutSession(@CurrentUser() user: User, @Body() dto: CreateCheckoutSessionDto) {
    const baseUrl = process.env.APP_URL ?? 'http://localhost:5000';
    const successUrl = dto.successUrl ?? `${baseUrl}/subscription/success`;
    const cancelUrl = dto.cancelUrl ?? `${baseUrl}/subscription`;
    return this.stripeService.createCheckoutSession(
      user.id,
      dto.planId,
      successUrl,
      cancelUrl,
      user.email,
      user.name,
      dto.billingCycle ?? 'MONTHLY',
    );
  }

  /**
   * Authenticated: create Stripe Customer Portal session. Returns { url } to manage subscription.
   */
  @Post('portal-session')
  async createPortalSession(@CurrentUser() user: User, @Body('returnUrl') returnUrl?: string) {
    const baseUrl = process.env.APP_URL ?? 'http://localhost:5000';
    const url = returnUrl ?? `${baseUrl}/subscription`;
    return this.stripeService.createPortalSession(user.id, url);
  }

  /**
   * Authenticated: manually sync Stripe subscriptions to DB.
   * Useful when webhooks are not reachable (e.g. localhost dev).
   */
  @Post('sync')
  async syncSubscription(@CurrentUser() user: User): Promise<{ synced: number }> {
    return this.stripeService.syncActiveSubscriptionsForUser(user.id);
  }

  /**
   * Authenticated: get billing summary (default card + recent invoices).
   */
  @Get('billing-summary')
  async getBillingSummary(@CurrentUser() user: User): Promise<BillingSummaryDto> {
    return this.stripeService.getBillingSummary(user.id);
  }

  /**
   * Public: Stripe webhook. Uses rawBody (enable rawBody: true in main.ts).
   */
  @Public()
  @Post('webhook')
  async stripeWebhook(@Req() req: RawBodyRequest<Request>) {
    const rawBody = req.rawBody;
    if (!Buffer.isBuffer(rawBody)) {
      throw new BadRequestException(
        'Webhook requires raw body. Set rawBody: true when creating the Nest app.',
      );
    }
    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string') {
      throw new BadRequestException('Missing stripe-signature header');
    }
    await this.stripeService.handleWebhookEvent(rawBody, signature);
  }

  /**
   * Authenticated: cancel active subscription at the end of current period.
   */
  @Post('cancel')
  async cancelSubscription(@CurrentUser() user: User) {
    return this.stripeService.cancelSubscriptionAtPeriodEnd(user.id);
  }

  /**
   * Authenticated: upgrade/downgrade subscription plan.
   */
  @Post('update-plan')
  async updateSubscription(
    @CurrentUser() user: User,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.stripeService.updateSubscriptionPlan(
      user.id,
      dto.planId,
      dto.billingCycle,
    );
  }
}
