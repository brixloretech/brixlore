import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanResponseDto } from './dto/plan-response.dto';
import type { Plan } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all subscription plans (public API).
   */
  async findAllPlans(): Promise<PlanResponseDto[]> {
    const plans = await this.prisma.plan.findMany({
      orderBy: { price: 'asc' },
    });
    return plans.map((p) => PlanResponseDto.fromPlan(p));
  }

  /**
   * Get a single plan by id (public API).
   */
  async findPlanById(id: string): Promise<PlanResponseDto> {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return PlanResponseDto.fromPlan(plan);
  }

  /**
   * Get the current user's active subscription with plan details.
   */
  async getCurrentSubscription(userId: string) {
    const now = new Date();
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: now },
      },
      include: { plan: true },
      orderBy: { endDate: 'desc' },
    });
  }
}
